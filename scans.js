import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';
import { enqueueInference } from '../services/inference.js';

const router = Router();
router.use(requireAuth);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// Upload a scan. THE GATE: consult latest consent, then route.
router.post('/', upload.single('image'), async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
  if (!req.file) return res.status(400).json({ error: 'image file required' });

  // Confirm the patient belongs to this doctor.
  const { rows: [patient] } = await query(
    `SELECT id FROM patients WHERE id = $1 AND doctor_id = $2`,
    [patient_id, req.user.id]
  );
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Latest active consent.
  const { rows: [consent] } = await query(
    `SELECT type FROM consents
     WHERE patient_id = $1 AND withdrawn_at IS NULL
     ORDER BY signed_at DESC LIMIT 1`,
    [patient_id]
  );

  const declined = !consent || consent.type === 'declined';
  const status = declined ? 'declined_ai' : 'queued';

  const { rows: [scan] } = await query(
    `INSERT INTO scans (patient_id, uploaded_by, image_path, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [patient_id, req.user.id, req.file.path, status]
  );

  audit(req, 'upload_scan', 'scan', scan.id);

  // Only consented scans ever touch the model.
  if (!declined) enqueueInference(scan.id);

  res.status(201).json({ ...scan, ai_path: !declined });
});

// A worklist scan with its patient + AI result (if any).
router.get('/:id', async (req, res) => {
  const { rows: [scan] } = await query(
    `SELECT s.*, p.name AS patient_name, p.mrn, p.dob,
            a.predictions, a.model_version, a.heatmap_path
     FROM scans s
     JOIN patients p ON p.id = s.patient_id
     LEFT JOIN ai_results a ON a.scan_id = s.id
     WHERE s.id = $1 AND p.doctor_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!scan) return res.status(404).json({ error: 'Not found' });
  res.json(scan);
});

// Worklist: everything awaiting the doctor.
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT s.id, s.status, s.created_at, p.name AS patient_name, p.mrn
     FROM scans s
     JOIN patients p ON p.id = s.patient_id
     WHERE p.doctor_id = $1
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export default router;
