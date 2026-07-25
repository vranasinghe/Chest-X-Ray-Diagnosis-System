import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, u.name AS user_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/audit/all (admin only)
router.get('/all', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, u.name AS user_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
