import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const { rows: [u] } = await query(
      `SELECT id, role, name, email, preferences FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/users/me
router.patch('/me', async (req, res) => {
  const { name, preferences } = req.body;
  try {
    const { rows: [currentUser] } = await query(
      `SELECT name, preferences FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const newName = name !== undefined ? name : currentUser.name;
    const newPreferences = preferences !== undefined ? preferences : currentUser.preferences;

    const { rows: [u] } = await query(
      `UPDATE users
       SET name = $1, preferences = $2
       WHERE id = $3
       RETURNING id, role, name, email, preferences`,
      [newName, typeof newPreferences === 'object' ? JSON.stringify(newPreferences) : newPreferences, req.user.id]
    );

    audit(req, 'update_settings', 'user', req.user.id);
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
