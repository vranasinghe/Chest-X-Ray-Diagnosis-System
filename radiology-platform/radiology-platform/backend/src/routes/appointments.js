import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole, audit } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('doctor'));

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, p.name AS patient_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = $1
       ORDER BY a.scheduled_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  const { patient_id, scheduled_at, type } = req.body;
  if (!patient_id || !scheduled_at) {
    return res.status(400).json({ error: 'patient_id and scheduled_at required' });
  }

  try {
    // Confirm patient belongs to doctor
    const { rows: [patient] } = await query(
      `SELECT id FROM patients WHERE id = $1 AND doctor_id = $2`,
      [patient_id, req.user.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { rows: [appointment] } = await query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, type, status)
       VALUES ($1, $2, $3, $4, 'scheduled')
       RETURNING *`,
      [patient_id, req.user.id, scheduled_at, type || null]
    );

    audit(req, 'schedule_appointment', 'appointment', appointment.id);
    res.status(201).json(appointment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', async (req, res) => {
  const { status } = req.body;
  const valid = ['scheduled', 'completed', 'cancelled'];
  if (!status || !valid.includes(status)) {
    return res.status(400).json({ error: 'valid status required' });
  }

  try {
    const { rows: [appointment] } = await query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2 AND doctor_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found or unauthorized' });

    audit(req, 'update_appointment_status', 'appointment', appointment.id);
    res.json(appointment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
