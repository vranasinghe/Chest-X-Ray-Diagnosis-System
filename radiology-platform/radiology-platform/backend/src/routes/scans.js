import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';
import { enqueueInference } from '../services/inference.js';
import { uploadImage, getImage } from '../services/imageStore.js';

const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage() });

// Upload a scan. THE GATE: check patient authorization.
router.post('/', upload.single('image'), async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
  if (!req.file) return res.status(400).json({ error: 'image file required' });

  try {
    // Confirm patient belongs to this doctor and is authorized
    const { rows: [patient] } = await query(
      `SELECT id, authorized FROM patients WHERE id = $1 AND doctor_id = $2`,
      [patient_id, req.user.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.authorized) {
      return res.status(403).json({ error: 'Patient is not authorized for AI scan diagnostics. Please trigger and complete authorization first.' });
    }

    // Upload to Orthanc Image Store
    const storeRef = await uploadImage(patient_id, req.file.buffer);

    const { rows: [scan] } = await query(
      `INSERT INTO scans (patient_id, uploaded_by, store_ref, status)
       VALUES ($1, $2, $3, 'queued') RETURNING *`,
      [patient_id, req.user.id, storeRef]
    );

    audit(req, 'upload_scan', 'scan', scan.id);

    enqueueInference(scan.id);

    res.status(201).json(scan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stream image bytes directly (in-app display only, no attachment header)
router.get('/:id/image', async (req, res) => {
  try {
    const { rows: [scan] } = await query(
      `SELECT s.store_ref FROM scans s
       JOIN patients p ON p.id = s.patient_id
       WHERE s.id = $1 AND (p.doctor_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    if (!scan.store_ref) return res.status(404).json({ error: 'Image has been auto-deleted by retention policy.' });

    const imageBytes = await getImage(scan.store_ref);
    
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBytes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Compare endpoint: returns current scan and the prior scan for the patient
router.get('/:id/compare', async (req, res) => {
  try {
    const { rows: [current] } = await query(
      `SELECT s.id, s.patient_id, s.store_ref, s.status, s.created_at,
              p.name AS patient_name, p.mrn,
              a.predictions, a.model_version, a.heatmap_path
       FROM scans s
       JOIN patients p ON p.id = s.patient_id
       LEFT JOIN ai_results a ON a.scan_id = s.id
       WHERE s.id = $1 AND (p.doctor_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!current) return res.status(404).json({ error: 'Scan not found' });

    const { rows: [prior] } = await query(
      `SELECT s.id, s.patient_id, s.store_ref, s.status, s.created_at,
              a.predictions, a.model_version, a.heatmap_path
       FROM scans s
       LEFT JOIN ai_results a ON a.scan_id = s.id
       WHERE s.patient_id = $1 AND s.created_at < $2
       ORDER BY s.created_at DESC LIMIT 1`,
      [current.patient_id, current.created_at]
    );

    res.json({ current, prior: prior || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get detailed scan info
router.get('/:id', async (req, res) => {
  try {
    const { rows: [scan] } = await query(
      `SELECT s.*, p.name AS patient_name, p.mrn, p.dob,
              a.predictions, a.model_version, a.heatmap_path,
              r.findings AS report_findings, r.impression AS report_impression, r.id AS report_id
       FROM scans s
       JOIN patients p ON p.id = s.patient_id
       LEFT JOIN ai_results a ON a.scan_id = s.id
       LEFT JOIN reports r ON r.scan_id = s.id
       WHERE s.id = $1 AND (p.doctor_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!scan) return res.status(404).json({ error: 'Not found' });
    res.json(scan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List scans for doctor
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.id, s.status, s.created_at, p.name AS patient_name, p.mrn
       FROM scans s
       JOIN patients p ON p.id = s.patient_id
       WHERE p.doctor_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
