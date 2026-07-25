import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  let token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Restrict a route to specific roles, e.g. requireRole('doctor', 'admin')
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Append-only audit trail. Fire-and-forget so it never blocks the response.
export function audit(req, action, entityType, entityId) {
  query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.id || null, action, entityType, entityId || null, req.ip]
  ).catch((e) => console.error('audit failed:', e.message));
}
