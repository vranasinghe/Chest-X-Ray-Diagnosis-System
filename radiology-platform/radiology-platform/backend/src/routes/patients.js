import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Ensure patient table has the new fields
query(`
  ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE patients ADD COLUMN IF NOT EXISTS auth_token_expires TIMESTAMPTZ;
`).catch(e => console.error('Error adding patient columns:', e.message));

// List patients for the logged-in doctor.
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM patients
       WHERE doctor_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `SELECT * FROM patients WHERE id = $1 AND doctor_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!p) return res.status(404).json({ error: 'Not found' });
    audit(req, 'view', 'patient', p.id);
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { name, dob, sex, mrn, history, email, phone, address, notes, authorized } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows: duplicateCheck } = await query(
      `SELECT id FROM patients WHERE doctor_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))`,
      [req.user.id, name]
    );
    if (duplicateCheck.length > 0) {
      return res.status(400).json({ error: 'A patient with this name already exists.' });
    }

    const { rows: [p] } = await query(
      `INSERT INTO patients (doctor_id, name, dob, sex, mrn, history, email, phone, address, notes, authorized, authorized_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        req.user.id,
        name,
        dob || null,
        sex || null,
        mrn || null,
        history || null,
        email || null,
        phone || null,
        address || null,
        notes || null,
        authorized || false,
        authorized ? new Date() : null
      ]
    );
    audit(req, 'create', 'patient', p.id);
    res.status(201).json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/patients/:id — update a patient profile
router.patch('/:id', async (req, res) => {
  const { name, dob, sex, mrn, history, email, phone, address, notes, authorized } = req.body;
  try {
    // Check ownership
    const { rows: [existing] } = await query(
      `SELECT * FROM patients WHERE id = $1 AND doctor_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Patient not found' });

    if (name) {
      const { rows: duplicateCheck } = await query(
        `SELECT id FROM patients WHERE doctor_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) AND id != $3`,
        [req.user.id, name, req.params.id]
      );
      if (duplicateCheck.length > 0) {
        return res.status(400).json({ error: 'A patient with this name already exists.' });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    };

    addField('name', name);
    addField('dob', dob);
    addField('sex', sex);
    addField('mrn', mrn);
    addField('history', history);
    addField('email', email);
    addField('phone', phone);
    addField('address', address);
    addField('notes', notes);
    addField('authorized', authorized);

    if (authorized === true && !existing.authorized) {
      addField('authorized_at', new Date());
    } else if (authorized === false) {
      addField('authorized_at', null);
    }

    if (fields.length === 0) {
      return res.json(existing);
    }

    values.push(req.params.id);
    values.push(req.user.id);
    const qStr = `UPDATE patients SET ${fields.join(', ')} WHERE id = $${idx++} AND doctor_id = $${idx++} RETURNING *`;
    const { rows: [updated] } = await query(qStr, values);

    audit(req, 'update', 'patient', updated.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/patients/:id — delete a patient profile
router.delete('/:id', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `DELETE FROM patients WHERE id = $1 AND doctor_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    audit(req, 'delete', 'patient', p.id);
    res.json({ success: true, message: 'Patient deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
