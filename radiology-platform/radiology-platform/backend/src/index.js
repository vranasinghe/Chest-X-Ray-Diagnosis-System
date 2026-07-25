import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import scanRoutes from './routes/scans.js';
import reportRoutes from './routes/reports.js';
import appointmentRoutes from './routes/appointments.js';
import deletionRoutes from './routes/deletion.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import authorizationRoutes from './routes/authorization.js';
import { startRetentionScheduler } from './services/retention.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/deletion-requests', deletionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', authorizationRoutes);

// Start the daily scan retention policy job
startRetentionScheduler();

// Fallback error handler.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
