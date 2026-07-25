import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import Layout from '../components/Layout.jsx';

export default function VerifyPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // email passed via navigation state
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Auto-focus first box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(idx, val) {
    // Accept only digits
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError('');
    if (d && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleVerify() {
    const otp = digits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setVerifying(true);
    setError('');
    try {
      await api.verifyOtp(id, otp);
      setSuccess('Patient successfully authorized! Redirecting…');
      setTimeout(() => navigate(`/patients/${id}`, { replace: true }), 1800);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await api.sendOtp(id);
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  const allFilled = digits.every((d) => d !== '');

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .verify-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          min-height: 100%;
          background: #f0f2f8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .verify-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 52px 48px 44px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 8px 40px rgba(17, 28, 68, 0.10);
          text-align: center;
          animation: slideUp 0.35s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Icon */
        .verify-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #e0f8f6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
        }
        .verify-icon-wrap svg { color: #1abfb2; }

        /* Title */
        .verify-title {
          font-size: 26px;
          font-weight: 800;
          color: #111c44;
          margin: 0 0 12px;
          letter-spacing: -0.3px;
        }
        .verify-subtitle {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 6px;
        }
        .verify-subtitle strong {
          color: #111c44;
          font-weight: 700;
        }
        .verify-hint {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 36px;
        }

        /* OTP boxes */
        .otp-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }
        .otp-box {
          width: 62px;
          height: 70px;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          text-align: center;
          font-size: 26px;
          font-weight: 700;
          color: #111c44;
          background: #f8fafc;
          outline: none;
          caret-color: #1abfb2;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: inherit;
        }
        .otp-box:focus {
          border-color: #1abfb2;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(26, 191, 178, 0.14);
        }
        .otp-box.filled {
          border-color: #1abfb2;
          background: #f0fdfc;
          color: #0e9f95;
        }
        .otp-box.error {
          border-color: #ef4444;
          background: #fff5f5;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-6px); }
          75%       { transform: translateX(6px); }
        }
        @media (max-width: 480px) {
          .otp-box { width: 46px; height: 56px; font-size: 20px; border-radius: 10px; }
          .otp-row { gap: 8px; }
        }

        /* Error / Success banners */
        .verify-error {
          background: #fee2e2;
          color: #c0392b;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .verify-success {
          background: #e0f8f6;
          color: #0e8c7a;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Verify button */
        .btn-verify {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          margin-bottom: 14px;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.1px;
        }
        .btn-verify:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-verify:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Do this later */
        .btn-later {
          display: block;
          width: 100%;
          padding: 15px;
          background: #ffffff;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          margin-bottom: 24px;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-later:hover { background: #f8fafc; border-color: #cbd5e1; }

        /* Resend */
        .resend-row {
          font-size: 13.5px;
          color: #94a3b8;
        }
        .resend-link {
          color: #1abfb2;
          font-weight: 700;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
          font-size: inherit;
          padding: 0;
          transition: opacity 0.2s;
        }
        .resend-link:hover:not(:disabled) { opacity: 0.75; }
        .resend-link:disabled { color: #94a3b8; cursor: default; }

        /* Loading spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="verify-page">
        <div className="verify-card">

          {/* Icon */}
          <div className="verify-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          {/* Title */}
          <h1 className="verify-title">Verify Patient Email</h1>
          {email ? (
            <p className="verify-subtitle">
              We sent a 6-digit verification code to <strong>{email}</strong>.
            </p>
          ) : (
            <p className="verify-subtitle">
              We sent a 6-digit verification code to the patient's email address.
            </p>
          )}
          <p className="verify-hint">Please enter the code below to activate the patient profile.</p>

          {/* Error / Success */}
          {error && (
            <div className="verify-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="verify-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="otp-row" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className={`otp-box ${d ? 'filled' : ''} ${error ? 'error' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoComplete="one-time-code"
                disabled={verifying || !!success}
              />
            ))}
          </div>

          {/* Verify & Activate */}
          <button
            className="btn-verify"
            onClick={handleVerify}
            disabled={verifying || !allFilled || !!success}
          >
            {verifying ? (
              <><div className="spinner" /> Verifying…</>
            ) : (
              <>
                Verify &amp; Activate
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>

          {/* Do this later */}
          <button
            className="btn-later"
            onClick={() => navigate(`/patients/${id}`)}
            disabled={verifying || !!success}
          >
            Do this later
          </button>

          {/* Resend */}
          <div className="resend-row">
            Didn't get a code?{' '}
            <button
              className="resend-link"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending || !!success}
            >
              {resending
                ? 'Sending…'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend'}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
