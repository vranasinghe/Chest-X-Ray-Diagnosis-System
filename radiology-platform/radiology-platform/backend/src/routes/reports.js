import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { query } from '../db/pool.js';
import { requireAuth, requireRole, audit } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('doctor'));

// Auto-migrate reports table
query(`
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_name TEXT;
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS registration_no TEXT;
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS comments TEXT;
`).catch(e => console.error('Error adding reports columns:', e.message));

async function generateReportPDF(report, patient, doctor, password = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(password ? { userPassword: password } : {});
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    doc.fontSize(20).text('Radiology Report', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).text(`Patient Name: ${patient.name}`);
    doc.text(`MRN: ${patient.mrn || 'N/A'}`);
    doc.text(`Date of Birth: ${patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();
    doc.text(`Ordering Doctor: ${doctor.name}`);
    doc.text(`Date Finalized: ${report.finalized_at ? new Date(report.finalized_at).toLocaleDateString() : new Date().toLocaleDateString()}`);
    doc.moveDown(2);
    doc.fontSize(14).text('Clinical Findings:', { underline: true });
    doc.fontSize(11).text(report.findings || 'No findings recorded.');
    doc.moveDown(1.5);
    doc.fontSize(14).text('Clinical Impression:', { underline: true });
    doc.fontSize(11).text(report.impression || 'No impression recorded.');

    doc.end();
  });
}

// Doctor confirms/edits findings -> report. Marks the scan reviewed.
router.post('/', async (req, res) => {
  const { scan_id, patient_id, findings, impression, doctor_name, registration_no, treatment_plan, comments, finalize } = req.body;

  try {
    let finalPatientId = patient_id;
    let finalScanId = scan_id;

    // If scan_id not provided but patient_id is, we can find/create a dummy scan to link
    if (!finalScanId && finalPatientId) {
      const { rows: [existingScan] } = await query(
        `SELECT id FROM scans WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [finalPatientId]
      );
      if (existingScan) {
        finalScanId = existingScan.id;
      } else {
        // Create dummy scan
        const { rows: [newScan] } = await query(
          `INSERT INTO scans (patient_id, uploaded_by, modality, status)
           VALUES ($1, $2, 'chest_xray', 'reviewed') RETURNING id`,
          [finalPatientId, req.user.id]
        );
        finalScanId = newScan.id;
      }
    }

    if (!finalScanId) return res.status(400).json({ error: 'scan_id or patient_id required' });

    // Lookup patient_id if not present
    if (!finalPatientId) {
      const { rows: [scan] } = await query(`SELECT patient_id FROM scans WHERE id = $1`, [finalScanId]);
      if (scan) finalPatientId = scan.patient_id;
    }

    const status = finalize ? 'finalized' : 'draft';
    const finalizedAt = finalize ? new Date() : null;

    const { rows: [existing] } = await query(
      `SELECT id FROM reports WHERE scan_id = $1`,
      [finalScanId]
    );

    let report;
    if (existing) {
      const { rows: [updated] } = await query(
        `UPDATE reports 
         SET findings = $1, impression = $2, doctor_name = $3, registration_no = $4, treatment_plan = $5, comments = $6, status = $7, finalized_at = $8
         WHERE id = $9 RETURNING *`,
        [findings || null, impression || null, doctor_name || null, registration_no || null, treatment_plan || null, comments || null, status, finalizedAt, existing.id]
      );
      report = updated;
    } else {
      const { rows: [inserted] } = await query(
        `INSERT INTO reports (scan_id, patient_id, doctor_id, findings, impression, doctor_name, registration_no, treatment_plan, comments, status, finalized_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [finalScanId, finalPatientId, req.user.id, findings || null, impression || null, doctor_name || null, registration_no || null, treatment_plan || null, comments || null, status, finalizedAt]
      );
      report = inserted;
    }

    if (finalize && finalScanId) {
      await query(`UPDATE scans SET status = 'reviewed' WHERE id = $1`, [finalScanId]);
    }
    audit(req, finalize ? 'finalize_report' : 'draft_report', 'report', report.id);
    res.status(201).json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT r.*, p.name AS patient_name, p.dob AS patient_dob, p.sex AS patient_gender, p.mrn AS patient_mrn
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       WHERE p.doctor_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/:id — retrieve single report details
router.get('/:id', async (req, res) => {
  try {
    const { rows: [r] } = await query(
      `SELECT r.*, p.name AS patient_name, p.dob AS patient_dob, p.sex AS patient_gender, p.mrn AS patient_mrn
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       WHERE r.id = $1 AND p.doctor_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!r) return res.status(404).json({ error: 'Report not found' });
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/reports/:id — update report details
router.patch('/:id', async (req, res) => {
  const { findings, impression, doctor_name, registration_no, treatment_plan, comments, finalize } = req.body;
  try {
    const { rows: [existing] } = await query(
      `SELECT r.* FROM reports r
       JOIN patients p ON p.id = r.patient_id
       WHERE r.id = $1 AND p.doctor_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Report not found' });

    const status = finalize ? 'finalized' : existing.status;
    const finalizedAt = finalize ? new Date() : existing.finalized_at;

    const { rows: [updated] } = await query(
      `UPDATE reports
       SET findings = COALESCE($1, findings),
           impression = COALESCE($2, impression),
           doctor_name = COALESCE($3, doctor_name),
           registration_no = COALESCE($4, registration_no),
           treatment_plan = COALESCE($5, treatment_plan),
           comments = COALESCE($6, comments),
           status = $7,
           finalized_at = $8
       WHERE id = $9 RETURNING *`,
      [findings, impression, doctor_name, registration_no, treatment_plan, comments, status, finalizedAt, req.params.id]
    );

    if (finalize && updated.scan_id) {
      await query(`UPDATE scans SET status = 'reviewed' WHERE id = $1`, [updated.scan_id]);
    }

    audit(req, finalize ? 'finalize_report' : 'update_report', 'report', updated.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/reports/:id — delete a report
router.delete('/:id', async (req, res) => {
  try {
    const { rows: [deleted] } = await query(
      `DELETE FROM reports r
       USING patients p
       WHERE r.patient_id = p.id AND r.id = $1 AND p.doctor_id = $2 RETURNING r.*`,
      [req.params.id, req.user.id]
    );
    if (!deleted) return res.status(404).json({ error: 'Report not found' });
    audit(req, 'delete_report', 'report', deleted.id);
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reports/:id/download (Doctor Only)
router.post('/:id/download', async (req, res) => {
  try {
    const { rows: [report] } = await query(
      `SELECT r.*, p.name AS patient_name, p.mrn, p.dob, u.name AS doctor_name
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       JOIN users u ON u.id = r.doctor_id
       WHERE r.id = $1 AND (r.doctor_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!report) return res.status(404).json({ error: 'Report not found or unauthorized' });

    const pdfBuffer = await generateReportPDF(
      report,
      { name: report.patient_name, mrn: report.mrn, dob: report.dob },
      { name: report.doctor_name }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reports/:id/send-to-patient (Doctor Only)
router.post('/:id/send-to-patient', async (req, res) => {
  try {
    const { rows: [report] } = await query(
      `SELECT r.*, p.name AS patient_name, p.mrn, p.dob, p.email AS patient_email, u.name AS doctor_name
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       JOIN users u ON u.id = r.doctor_id
       WHERE r.id = $1 AND (r.doctor_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!report) return res.status(404).json({ error: 'Report not found or unauthorized' });
    if (!report.patient_email) {
      return res.status(400).json({ error: 'Patient email address is missing. Cannot send report.' });
    }

    let password = null;
    if (report.dob) {
      password = new Date(report.dob).toISOString().split('T')[0];
    } else {
      password = report.mrn || '123456';
    }

    const pdfBuffer = await generateReportPDF(
      report,
      { name: report.patient_name, mrn: report.mrn, dob: report.dob },
      { name: report.doctor_name },
      password
    );

    const emailBody = `Hello ${report.patient_name},

Your physician, ${report.doctor_name}, has sent you a password-protected copy of your radiology report.

Please find the attached PDF report.
The PDF is password-protected. Your password is your Date of Birth (in YYYY-MM-DD format, e.g., 1985-11-23).

Regards,
Radiology Platform`;

    await sendEmail({
      to: report.patient_email,
      subject: 'Your Radiology Report',
      text: emailBody,
      attachments: [
        {
          filename: `radiology_report_${report.id}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    audit(req, 'send_report_to_patient', 'report', report.id);
    res.json({ success: true, message: 'Report PDF emailed to patient.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
