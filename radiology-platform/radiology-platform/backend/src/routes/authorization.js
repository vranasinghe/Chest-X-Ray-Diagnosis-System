import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { requireAuth, audit } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';

const router = Router();

// POST /api/patients/:id/send-authorization
router.post('/patients/:id/send-authorization', requireAuth, async (req, res) => {
  const patientId = req.params.id;
  try {
    const { rows: [patient] } = await query(
      `SELECT * FROM patients WHERE id = $1 AND doctor_id = $2`,
      [patientId, req.user.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.email) {
      return res.status(400).json({ error: 'Patient email address is missing. Please add an email for the patient first.' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await query(
      `UPDATE patients SET auth_token = $1 WHERE id = $2`,
      [token, patientId]
    );

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
    const authLink = `${appUrl}/api/authorize/${token}`;
    const emailBody = `Hello ${patient.name},

Your physician, ${req.user.name}, has requested authorization to perform an AI-powered chest X-ray analysis.

By confirming, you agree your scan may be stored, analyzed by AI, and compared to future scans by your treating physician.

Please click the link below to verify your identity and authorize the procedure:
${authLink}

Regards,
Radiology Platform`;

    await sendEmail({
      to: patient.email,
      subject: 'Action Required: Clinical Scan Authorization',
      text: emailBody,
    });

    audit(req, 'send_patient_authorization_email', 'patient', patient.id);
    res.json({ success: true, message: 'Authorization email sent.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/patients/:id/send-otp  — generate & email a 6-digit OTP
router.post('/patients/:id/send-otp', requireAuth, async (req, res) => {
  const patientId = req.params.id;
  try {
    const { rows: [patient] } = await query(
      `SELECT * FROM patients WHERE id = $1 AND doctor_id = $2`,
      [patientId, req.user.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.email) {
      return res.status(400).json({ error: 'Patient email address is missing.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await query(
      `UPDATE patients SET auth_token = $1, auth_token_expires = $2 WHERE id = $3`,
      [otp, expiresAt, patientId]
    );

    await sendEmail({
      to: patient.email,
      subject: 'Your Verification Code — Radiology Platform',
      text: `Hello ${patient.name},\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nRegards,\nRadiology Platform`,
    });

    audit(req, 'send_patient_otp', 'patient', patient.id);
    res.json({ success: true, message: 'OTP sent to ' + patient.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/patients/:id/verify-otp  — validate OTP and authorize
router.post('/patients/:id/verify-otp', requireAuth, async (req, res) => {
  const patientId = req.params.id;
  const { otp } = req.body;
  try {
    const { rows: [patient] } = await query(
      `SELECT * FROM patients WHERE id = $1 AND doctor_id = $2`,
      [patientId, req.user.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (!patient.auth_token || patient.auth_token !== otp) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Check expiry if column exists
    if (patient.auth_token_expires && new Date() > new Date(patient.auth_token_expires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please resend.' });
    }

    await query(
      `UPDATE patients SET authorized = TRUE, authorized_at = NOW(), auth_token = NULL, auth_token_expires = NULL WHERE id = $1`,
      [patientId]
    );

    audit(req, 'patient_otp_verified', 'patient', patient.id);
    res.json({ success: true, message: 'Patient successfully authorized.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/authorize/:token [PUBLIC]
router.get('/authorize/:token', async (req, res) => {
  const token = req.params.token;
  try {
    const { rows: [patient] } = await query(
      `SELECT * FROM patients WHERE auth_token = $1`,
      [token]
    );
    if (!patient) {
      return res.status(404).send('<h1>Error</h1><p>Invalid or expired authorization token.</p>');
    }

    await query(
      `UPDATE patients
       SET authorized = TRUE, authorized_at = NOW(), auth_token = NULL
       WHERE id = $1`,
      [patient.id]
    );

    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip)
       VALUES ($1, 'patient_authorize_confirm', 'patient', $2, $3)`,
      [patient.doctor_id, patient.id, req.ip]
    ).catch(e => console.error('Failed to log authorization verification to audit log:', e.message));

    res.send(`<html>
  <head>
    <title>Authorization Confirmed</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #faf9f5; margin: 0; }
      .card { background: white; border: 0.5px solid #e3e1d8; border-radius: 12px; padding: 32px 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 450px; }
      h1 { color: #0f6e56; font-size: 24px; margin-bottom: 12px; }
      p { color: #6b6a63; font-size: 15px; line-height: 1.5; margin-bottom: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>✓ Authorization Confirmed</h1>
      <p>Thank you. Your identity verification and consent for AI-powered clinical scan analysis and historical comparisons have been successfully recorded.</p>
    </div>
  </body>
</html>`);
  } catch (e) {
    res.status(500).send(`<h1>Error</h1><p>${e.message}</p>`);
  }
});

export default router;
