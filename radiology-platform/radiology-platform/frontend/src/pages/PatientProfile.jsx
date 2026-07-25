import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Layout from '../components/Layout.jsx';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function shortId(id) {
  if (!id) return '—';
  return 'PT-' + String(id).slice(0, 4);
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [sendingAuth, setSendingAuth] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const all = await api.patients();
      const found = all.find((p) => String(p.id) === String(id));
      if (!found) { setError('Patient not found.'); return; }
      setPatient(found);
    } catch {
      setError('Failed to load patient.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSendVerification() {
    if (!patient?.email) { showToast('No email on file for this patient.', 'error'); return; }
    setSendingAuth(true);
    try {
      await api.sendOtp(patient.id);
      navigate(`/patients/${patient.id}/verify`, { state: { email: patient.email } });
    } catch (err) {
      showToast(err.message || 'Failed to send code.', 'error');
    } finally {
      setSendingAuth(false);
    }
  }

  const isAuthorized = patient?.authorized;

  return (
    <Layout>
      <style>{`
        .profile-page {
          background: #f0f2f8;
          min-height: 100%;
          padding: 24px 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .profile-container {
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 40px;
          box-shadow: 0 4px 24px rgba(17,28,68,0.08);
        }

        /* Back button */
        .profile-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #1abfb2;
          background: #e0f8f6;
          border: none;
          border-radius: 20px;
          padding: 7px 14px;
          cursor: pointer;
          margin-bottom: 28px;
          transition: opacity 0.2s;
        }
        .profile-back-btn:hover { opacity: 0.8; }

        /* Header row */
        .profile-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
        }
        .profile-header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .profile-avatar-wrap {
          position: relative;
          width: 68px;
          height: 68px;
          flex-shrink: 0;
        }
        .profile-avatar-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 2.5px solid var(--avatar-border, #1abfb2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: var(--avatar-text, #111c44);
          background: #f0f8ff;
          background: #f4f9ff;
          letter-spacing: 0.5px;
        }
        .profile-name-block h2 {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 800;
          color: #111c44;
        }
        .profile-name-block p {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Auth badge */
        .auth-badge {
          font-size: 15px;
          font-weight: 800;
          padding: 0;
        }
        .auth-badge.authorized { color: #1abfb2; }
        .auth-badge.unauthorized { color: #ef4444; }

        /* Info sections */
        .profile-info-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }
        .profile-info-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (max-width: 600px) {
          .profile-info-grid-3 { grid-template-columns: 1fr; }
          .profile-info-grid-2 { grid-template-columns: 1fr; }
        }

        .info-card {
          background: #f8fafc;
          border: 1px solid #e8edf5;
          border-radius: 12px;
          padding: 16px 18px;
        }
        .info-card-label-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }
        .info-card-label-row span {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .info-card-label-row svg { color: #1abfb2; flex-shrink: 0; }
        .info-card-label-row svg.red { color: #ef4444; }
        .info-card-value {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Nested sub-label inside card */
        .info-card-sub {
          margin-bottom: 6px;
        }
        .info-card-sub-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .info-card-sub-label svg { color: #64748b; }

        /* Large section card (Contact, Medical Notes) */
        .profile-section-card {
          background: #f8fafc;
          border: 1px solid #e8edf5;
          border-radius: 12px;
          padding: 18px 20px;
        }
        .profile-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .profile-section-inner-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* Toast */
        .profile-toast {
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .profile-toast.success { background: #e0f8f6; color: #0e8c7a; }
        .profile-toast.error { background: #fee2e2; color: #c0392b; }

        /* Action buttons */
        .profile-actions {
          display: flex;
          gap: 14px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .btn-profile-delete {
          flex: 1;
          min-width: 140px;
          padding: 13px 16px;
          background: #ffffff;
          color: #ef4444;
          border: 1.5px solid #ef4444;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .btn-profile-delete:hover { background: #fee2e2; }
        .btn-profile-edit {
          flex: 1;
          min-width: 140px;
          padding: 13px 16px;
          background: #ffffff;
          color: #1abfb2;
          border: 1.5px solid #1abfb2;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-profile-edit:hover { background: #e0f8f6; }
        .btn-profile-xray {
          flex: 1.4;
          min-width: 160px;
          padding: 13px 16px;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
        }
        .btn-profile-xray:hover { opacity: 0.88; }
        .btn-profile-compare, .btn-profile-report {
          flex: 1.4;
          min-width: 160px;
          padding: 13px 16px;
          background: #ffffff;
          color: #1abfb2;
          border: 1.5px solid #1abfb2;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-profile-compare:hover, .btn-profile-report:hover {
          background: #e0f8f6;
        }
        .btn-profile-sendauth {
          flex: 1.4;
          min-width: 200px;
          padding: 13px 16px;
          background: #f59e0b;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
        }
        .btn-profile-sendauth:hover { opacity: 0.88; }
        .btn-profile-sendauth:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Delete Confirm Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17,28,68,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          backdrop-filter: blur(2px);
        }
        .modal-box {
          background: #fff;
          border-radius: 18px;
          padding: 32px;
          width: 400px;
          max-width: 95vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          text-align: center;
        }
        .modal-box h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111c44; }
        .modal-box p { margin: 0 0 24px; color: #64748b; font-size: 13.5px; }
        .modal-actions { display: flex; gap: 12px; }
        .btn-modal-cancel {
          flex: 1; padding: 11px; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-size: 13.5px; font-weight: 600;
          color: #64748b; background: #fff; cursor: pointer;
        }
        .btn-modal-cancel:hover { background: #f8fafc; }
        .btn-modal-delete {
          flex: 1; padding: 11px; border: none;
          border-radius: 10px; font-size: 13.5px; font-weight: 700;
          color: #fff; background: #ef4444; cursor: pointer;
        }
        .btn-modal-delete:hover { opacity: 0.88; }

        /* Loading / error */
        .profile-loading {
          text-align: center;
          color: #94a3b8;
          padding: 60px 20px;
          font-size: 15px;
        }
      `}</style>

      <div className="profile-page">
        <div className="profile-container">

          {/* Back button */}
          <button className="profile-back-btn" onClick={() => navigate('/patients')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to List
          </button>

          {loading && <div className="profile-loading">Loading patient…</div>}
          {error && <div className="profile-toast error">{error}</div>}
          {toast.msg && <div className={`profile-toast ${toast.type}`}>{toast.msg}</div>}

          {patient && (
            <>
              {/* Header */}
              <div className="profile-header-row">
                <div className="profile-header-left">
                  <div className="profile-avatar-wrap">
                    <div
                      className="profile-avatar-circle"
                      style={{
                        '--avatar-border': isAuthorized ? '#1abfb2' : '#ef4444',
                        '--avatar-text': '#111c44',
                        borderColor: isAuthorized ? '#1abfb2' : '#ef4444',
                      }}
                    >
                      {getInitials(patient.name)}
                    </div>
                  </div>
                  <div className="profile-name-block">
                    <h2>{patient.name}</h2>
                    <p>Patient Profile · ID: {shortId(patient.id)}</p>
                  </div>
                </div>
                <span className={`auth-badge ${isAuthorized ? 'authorized' : 'unauthorized'}`}>
                  {isAuthorized ? 'Authorized' : 'Unauthorized'}
                </span>
              </div>

              {/* Row 1 — DOB, Gender, Phone */}
              <div className="profile-info-grid-3">
                <div className="info-card">
                  <div className="info-card-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Date of Birth</span>
                  </div>
                  <div className="info-card-value">{patient.dob ? formatDate(patient.dob) : '—'}</div>
                </div>
                <div className="info-card">
                  <div className="info-card-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Gender</span>
                  </div>
                  <div className="info-card-value">{patient.gender || '—'}</div>
                </div>
                <div className="info-card">
                  <div className="info-card-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.91 5.91l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>Phone</span>
                  </div>
                  <div className="info-card-value">{patient.phone || '—'}</div>
                </div>
              </div>

              {/* Row 2 — Contact & Address */}
              <div className="profile-info-grid-2">
                <div className="info-card">
                  <div className="profile-section-title">Contact</div>
                  <div className="info-card-sub">
                    <div className="info-card-sub-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email
                    </div>
                    <div className="info-card-value" style={{ fontSize: 14 }}>{patient.email || '—'}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="profile-section-title">Address</div>
                  <div className="info-card-sub">
                    <div className="info-card-sub-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      Home
                    </div>
                    <div className="info-card-value" style={{ fontSize: 14 }}>{patient.address || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Row 3 — Medical Notes */}
              <div className="profile-info-grid-2" style={{ marginBottom: 0 }}>
                <div className="info-card">
                  <div className="profile-section-title">Medical Notes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="info-card-sub-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        <span>Notes Summary</span>
                      </div>
                      <div className="info-card-value" style={{ fontSize: 14 }}>{patient.notes || '—'}</div>
                    </div>
                    <div>
                      <div className="info-card-sub-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>Record Updated</span>
                      </div>
                      <div className="info-card-value" style={{ fontSize: 14 }}>
                        {patient.updated_at ? formatDate(patient.updated_at) : formatDate(patient.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unauthorized-only: Consent status card */}
                {!isAuthorized && (
                  <div className="info-card" style={{ background: '#fff9f0', border: '1px solid #fde8c0' }}>
                    <div className="profile-section-title" style={{ color: '#f59e0b' }}>Consent Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                        Patient has not granted authorization yet.
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#a16207', margin: 0, lineHeight: 1.6 }}>
                      Send a verification code to the patient's email to request consent for data access and AI analysis.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="profile-actions">
                <button className="btn-profile-delete" onClick={() => setShowDeleteConfirm(true)}>
                  Delete Patient
                </button>
                <button className="btn-profile-edit" onClick={() => navigate(`/patients/${id}/edit`)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>

                {isAuthorized ? (
                  <>
                    <button className="btn-profile-xray" onClick={() => navigate(`/analysis?patientId=${id}`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      X-ray Upload
                    </button>
                    <button className="btn-profile-compare" onClick={() => navigate(`/comparison?patientId=${id}`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                      </svg>
                      X-ray Comparison
                    </button>
                    <button className="btn-profile-report" onClick={() => navigate(`/reports?patientId=${id}`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      Create Report
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-profile-sendauth"
                    onClick={handleSendVerification}
                    disabled={sendingAuth}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.91 5.91l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {sendingAuth ? 'Sending…' : 'Send Verification Code'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
          <div className="modal-box">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            <h3>Delete Patient?</h3>
            <p>This will permanently remove <strong>{patient?.name}</strong> from the system. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                className="btn-modal-delete"
                onClick={async () => {
                  try {
                    await api.deletePatient(id);
                    setShowDeleteConfirm(false);
                    navigate('/patients');
                  } catch (err) {
                    showToast(err.message || 'Failed to delete patient.', 'error');
                    setShowDeleteConfirm(false);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
