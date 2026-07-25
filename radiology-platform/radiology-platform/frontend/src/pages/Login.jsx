import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../api/auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (e) {
      setErr(e.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          position: relative;
          width: 42%;
          min-width: 380px;
          background: #0d1b4b;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
          overflow: hidden;
        }

        /* Decorative circles */
        .auth-left::before {
          content: '';
          position: absolute;
          top: -90px;
          right: -80px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(11, 90, 111, 0.55);
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -70px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(16, 196, 162, 0.18);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 52px;
          position: relative;
          z-index: 1;
        }

        .auth-logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #10c4a2, #0d9e83);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .auth-logo-icon svg {
          width: 22px;
          height: 22px;
          fill: white;
        }

        .auth-logo-name {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .auth-headline {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.18;
          letter-spacing: -0.8px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }

        .auth-subtext {
          font-size: 14.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
          margin-bottom: 44px;
          position: relative;
          z-index: 1;
          max-width: 340px;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .auth-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(16, 196, 162, 0.18);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .auth-feature-icon svg {
          width: 16px;
          height: 16px;
          stroke: #10c4a2;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .auth-feature-text {
          font-size: 14px;
          color: rgba(255,255,255,0.78);
          font-weight: 500;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1;
          background: #f4f6fb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
        }

        .auth-form-box {
          width: 100%;
          max-width: 440px;
        }

        .auth-form-title {
          font-size: 26px;
          font-weight: 800;
          color: #0d1b4b;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .auth-form-subtitle {
          font-size: 14px;
          color: #7a8499;
          margin-bottom: 32px;
        }

        .auth-field {
          margin-bottom: 20px;
        }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #0d1b4b;
          margin-bottom: 7px;
          letter-spacing: 0.1px;
        }

        .auth-input-wrap {
          position: relative;
        }

        .auth-input {
          width: 100%;
          height: 48px;
          border: 1.5px solid #e1e6ef;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #1a2340;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .auth-input::placeholder {
          color: #bbc4d6;
        }

        .auth-input:focus {
          border-color: #10c4a2;
          box-shadow: 0 0 0 3px rgba(16,196,162,0.13);
        }

        .auth-input.with-icon {
          padding-right: 48px;
        }

        .auth-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #9aa3b8;
          line-height: 0;
          transition: color 0.2s;
        }

        .auth-eye-btn:hover { color: #10c4a2; }

        .auth-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .auth-forgot {
          font-size: 13px;
          font-weight: 600;
          color: #10c4a2;
          text-decoration: none;
        }

        .auth-forgot:hover { text-decoration: underline; }

        .auth-error {
          background: #fff0f0;
          border: 1px solid #ffc8c8;
          color: #c0392b;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 18px;
        }

        .auth-submit-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(90deg, #10c4a2, #0aab8c);
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          letter-spacing: 0.2px;
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.1s;
          font-family: 'Inter', sans-serif;
        }

        .auth-submit-btn:hover { opacity: 0.92; }
        .auth-submit-btn:active { transform: scale(0.99); }
        .auth-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .auth-bottom-link {
          text-align: center;
          margin-top: 22px;
          font-size: 13.5px;
          color: #7a8499;
        }

        .auth-bottom-link a {
          color: #10c4a2;
          font-weight: 700;
          text-decoration: none;
        }

        .auth-bottom-link a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 32px 20px; }
        }
      `}</style>

      <div className="auth-root">
        {/* ── LEFT PANEL ── */}
        <div className="auth-left">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L19 8.5v7L12 19.32 5 15.5v-7L12 4.18z"/>
              </svg>
            </div>
            <span className="auth-logo-name">ProMed</span>
          </div>

          <h1 className="auth-headline">Clinical diagnostics,<br />organized and secure.</h1>
          <p className="auth-subtext">Sign in to review patient scans, manage reports, and collaborate with your care team.</p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span className="auth-feature-text">HIPAA-aligned patient data protection</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <span className="auth-feature-text">AI-assisted diagnostic review</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          <div className="auth-form-box">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to your clinical workspace.</p>

            <form onSubmit={submit}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="doctor@promed.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="login-password"
                    className="auth-input with-icon"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password visibility">
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="auth-forgot-row">
                  <a href="#" className="auth-forgot">Forgot password?</a>
                </div>
              </div>

              {err && <div className="auth-error">{err}</div>}

              <button id="login-submit" className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="auth-bottom-link">
              New here? <Link to="/register">Register as a Doctor</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
