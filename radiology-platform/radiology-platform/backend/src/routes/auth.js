import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'doctor' } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email, password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows: [u] } = await query(
      `INSERT INTO users (role, name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, role, name, email`,
      [role, name, email, hash]
    );
    const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, JWT_SECRET, {
      expiresIn: '12h',
    });
    res.status(201).json({ token, user: u });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email in use' });
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows: [u] } = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, JWT_SECRET, {
    expiresIn: '12h',
  });
  res.json({ token, user: { id: u.id, role: u.role, name: u.name, email: u.email } });
});

export default router;
