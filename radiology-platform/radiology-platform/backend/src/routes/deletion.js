import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';
import { deleteImage } from '../services/imageStore.js';

const router = Router();
router.use(requireAuth);

// GET /api/deletion-requests
router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await query(
        `SELECT dr.*, p.name AS patient_name, u.name AS requester_name
         FROM deletion_requests dr
         JOIN patients p ON p.id = dr.patient_id
         LEFT JOIN users u ON u.id = dr.requested_by
         ORDER BY dr.created_at DESC`
      );
    } else {
      result = await query(
        `SELECT dr.*, p.name AS patient_name, u.name AS requester_name
         FROM deletion_requests dr
         JOIN patients p ON p.id = dr.patient_id
         LEFT JOIN users u ON u.id = dr.requested_by
         WHERE p.doctor_id = $1 OR dr.requested_by = $1
         ORDER BY dr.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/deletion-requests
router.post('/', async (req, res) => {
  const { patient_id, reason } = req.body;
  if (!patient_id || !reason) {
    return res.status(400).json({ error: 'patient_id and reason required' });
  }

  try {
    if (req.user.role !== 'admin') {
      const { rows: [patient] } = await query(
        `SELECT id FROM patients WHERE id = $1 AND doctor_id = $2`,
        [patient_id, req.user.id]
      );
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
    }

    const { rows: [dr] } = await query(
      `INSERT INTO deletion_requests (patient_id, requested_by, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [patient_id, req.user.id, reason]
    );

    audit(req, 'create_deletion_request', 'deletion_request', dr.id);
    res.status(201).json(dr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/deletion-requests/:id
router.patch('/:id', async (req, res) => {
  const { status } = req.body;
  if (status !== 'resolved') {
    return res.status(400).json({ error: 'status must be resolved' });
  }

  try {
    // 1. Find request and check permissions
    const { rows: [dr] } = await query(
      `SELECT dr.*, p.doctor_id
       FROM deletion_requests dr
       JOIN patients p ON p.id = dr.patient_id
       WHERE dr.id = $1`,
      [req.params.id]
    );

    if (!dr) return res.status(404).json({ error: 'Deletion request not found' });

    if (req.user.role !== 'admin' && dr.doctor_id !== req.user.id && dr.requested_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 2. Delete patient scans from Orthanc
    const { rows: scans } = await query(
      `SELECT id, store_ref FROM scans WHERE patient_id = $1 AND store_ref IS NOT NULL`,
      [dr.patient_id]
    );

    for (const scan of scans) {
      await deleteImage(scan.store_ref);
      await query(
        `UPDATE scans SET store_ref = NULL WHERE id = $1`,
        [scan.id]
      );
    }

    // 3. Mark deletion request resolved
    const { rows: [updated] } = await query(
      `UPDATE deletion_requests
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    audit(req, 'resolve_deletion_request', 'deletion_request', updated.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
