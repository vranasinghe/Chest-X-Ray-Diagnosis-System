import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../api/auth.jsx';
import Layout from '../components/Layout.jsx';

// Avatar color palette for patient initials
const AVATAR_COLORS = [
  { bg: '#e8edf7', color: '#4a6fa5' },
  { bg: '#e6f8f5', color: '#0e8c7a' },
  { bg: '#f0ebf8', color: '#7c52b8' },
  { bg: '#fef3e2', color: '#c17c2a' },
  { bg: '#fdecea', color: '#c0392b' },
  { bg: '#e3f7e9', color: '#2e7d52' },
];

function getAvatarStyle(name) {
  const idx = (name || 'U').charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function PatientCard({ patient }) {
  const navigate = useNavigate();
  const style = getAvatarStyle(patient.name);
  const initials = getInitials(patient.name);
  const isAuthorized = patient.authorized;

  return (
    <div className="patient-portfolio-card">
      <div className="pcard-header">
        <div className="pcard-avatar" style={{ background: style.bg, color: style.color }}>
          {initials}
        </div>
        <div className="pcard-info">
          <div className="pcard-name">{patient.name}</div>
          <div className="pcard-email">{patient.email || '—'}</div>
        </div>
      </div>
      <div className="pcard-divider" />
      <div className="pcard-row" onClick={() => navigate(`/patients/${patient.id}`)}>
        <div className="pcard-row-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </div>
        <svg className="pcard-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div className="pcard-row">
        <div className="pcard-row-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Status</span>
        </div>
        <span className={`pcard-status ${isAuthorized ? 'authorized' : 'unauthorized'}`}>
          {isAuthorized ? 'Authorized' : 'Unauthorized'}
        </span>
      </div>
    </div>
  );
}

export default function Patients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [addName, setAddName] = useState('');
  const [addMrn, setAddMrn] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  function load() {
    api.patients().then(setPatients).catch(() => {});
  }
  useEffect(load, []);

  async function handleAdd() {
    if (!addName.trim()) return;
    setAdding(true);
    setMsg('');
    setError('');
    try {
      await api.addPatient({ name: addName, mrn: addMrn, email: addEmail });
      setAddName('');
      setAddMrn('');
      setAddEmail('');
      setMsg('Patient added successfully.');
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSendAuth(patientId) {
    setMsg('');
    setError('');
    try {
      await api.sendAuthorization(patientId);
      setMsg('Authorization link emailed to patient.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleViewProfile(patient) {
    setSelectedPatient(patient);
    setShowProfileModal(true);
  }

  const userName = user?.name || 'Doctor';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  // Filter
  const filtered = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const authorizedCount = patients.filter((p) => p.authorized).length;

  // Split into most recent (first 3) and the rest
  const mostRecent = filtered.slice(0, 3);
  const otherPatients = filtered.slice(3);

  return (
    <Layout>
      <style>{`
        .patients-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
        }

        /* Top Bar */
        .patients-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          background: #ffffff;
          border-radius: 20px;
          padding: 10px 24px;
          border: 1.5px solid #edf2f7;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }
        .patients-search-wrap {
          position: relative;
          flex: 1;
          max-width: 320px;
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border-radius: 30px;
        }
        .patients-search-wrap svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .patients-search-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid transparent;
          border-radius: 30px;
          font-size: 13.5px;
          font-family: inherit;
          background: transparent;
          outline: none;
          color: #334155;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .patients-search-input::placeholder {
          color: #94a3b8;
        }
        .patients-search-input:focus {
          border-color: #1abfb2;
          background: #ffffff;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .topbar-bell {
          position: relative;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .topbar-bell .bell-dot {
          width: 7px;
          height: 7px;
          background: #1abfb2;
          border-radius: 50%;
          border: 1.5px solid #ffffff;
          position: absolute;
          top: -1px;
          right: -1px;
        }
        .topbar-profile {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.25;
          text-align: right;
        }
        .topbar-profile-lbl {
          font-size: 9px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .topbar-profile-name {
          font-size: 13px;
          font-weight: 700;
          color: #111c44;
        }
        .topbar-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #111c44;
          color: #1abfb2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        /* Page Header */
        .patients-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .patients-page-title {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #111c44;
          line-height: 1.2;
        }
        .patients-page-subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }
        .btn-add-patient {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 24px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .btn-add-patient:hover {
          opacity: 0.88;
        }

        /* Sections */
        .patients-section-label {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        /* Patient Card Grid */
        .patients-card-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .patients-card-grid-all {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .patients-card-grid-4, .patients-card-grid-all { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .patients-card-grid-4, .patients-card-grid-all { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .patients-card-grid-4, .patients-card-grid-all { grid-template-columns: 1fr; }
        }

        /* Individual Patient Card */
        .patient-portfolio-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e8edf5;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(17, 28, 68, 0.05);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .patient-portfolio-card:hover {
          box-shadow: 0 6px 20px rgba(17, 28, 68, 0.10);
          transform: translateY(-2px);
        }
        .pcard-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .pcard-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .pcard-info {
          min-width: 0;
        }
        .pcard-name {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pcard-email {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pcard-divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 12px;
        }
        .pcard-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 0;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .pcard-row:hover {
          background: #f8fafc;
        }
        .pcard-row-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 500;
        }
        .pcard-row-left svg { color: #94a3b8; }
        .pcard-chevron { color: #cbd5e1; }
        .pcard-status {
          font-size: 12px;
          font-weight: 700;
        }
        .pcard-status.authorized { color: #1abfb2; }
        .pcard-status.unauthorized { color: #ef4444; }

        /* Add Patient Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 28, 68, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .modal-box {
          background: #ffffff;
          border-radius: 18px;
          padding: 32px;
          width: 480px;
          max-width: 95vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
        }
        .modal-box h3 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
          color: #111c44;
        }
        .modal-box p {
          margin: 0 0 24px;
          font-size: 13px;
          color: #94a3b8;
        }
        .modal-field {
          margin-bottom: 16px;
        }
        .modal-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .modal-field input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .modal-field input:focus {
          border-color: #1abfb2;
          background: #ffffff;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-modal-cancel {
          padding: 10px 20px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-modal-cancel:hover { background: #f8fafc; }
        .btn-modal-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          background: #1abfb2;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-modal-submit:hover { opacity: 0.88; }
        .btn-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Profile Modal */
        .profile-modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .profile-modal-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
        }
        .profile-modal-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13.5px;
        }
        .profile-modal-detail-row:last-child { border-bottom: none; }
        .profile-modal-detail-row .key { color: #94a3b8; font-weight: 500; }
        .profile-modal-detail-row .val { color: #1e293b; font-weight: 600; }
        .btn-send-auth {
          display: block;
          width: 100%;
          margin-top: 20px;
          padding: 11px;
          background: #e0f8f6;
          color: #1abfb2;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-send-auth:hover { opacity: 0.88; }

        /* Toast alerts */
        .patients-toast {
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .patients-toast.success { background: #e0f8f6; color: #0e8c7a; }
        .patients-toast.error { background: #fee2e2; color: #c0392b; }

        /* Empty state */
        .patients-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>

      <div className="patients-page">
        {/* Top Bar */}
        <div className="patients-topbar">
          <div className="patients-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="patients-search-input"
              placeholder="Search patients by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="topbar-right">
            <div className="topbar-bell">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="bell-dot" />
            </div>
            <div className="topbar-profile">
              <div className="topbar-profile-lbl">Logged In</div>
              <div className="topbar-profile-name">{userName}</div>
            </div>
            <div className="topbar-avatar">{userInitials}</div>
          </div>
        </div>

        {/* Toast messages */}
        {msg && <div className="patients-toast success">{msg}</div>}
        {error && <div className="patients-toast error">{error}</div>}

        {/* Page Header */}
        <div className="patients-page-header">
          <div>
            <h1 className="patients-page-title">Manage Portfolios</h1>
            <p className="patients-page-subtitle">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} · {authorizedCount} authorized
            </p>
          </div>
          <button className="btn-add-patient" onClick={() => navigate('/patients/add')}>
            Add patient
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Most Recent Section */}
        {mostRecent.length > 0 && (
          <>
            <div className="patients-section-label">Most Recent</div>
            <div className="patients-card-grid-4">
              {mostRecent.map((p) => (
                <PatientCard key={p.id} patient={p} />
              ))}
            </div>
          </>
        )}

        {/* Other Patients Section */}
        {otherPatients.length > 0 && (
          <>
            <div className="patients-section-label">Other Patients</div>
            <div className="patients-card-grid-all">
              {otherPatients.map((p) => (
                <PatientCard key={p.id} patient={p} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && !search && (
          <div className="patients-empty">
            No patients yet. Click "Add patient" to get started.
          </div>
        )}
        {filtered.length === 0 && search && (
          <div className="patients-empty">
            No patients match "{search}".
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-box">
            <h3>Add New Patient</h3>
            <p>Fill in the details to register a new patient in the system.</p>
            <div className="modal-field">
              <label>Full Name *</label>
              <input
                placeholder="e.g. John Doe"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-field">
              <label>MRN (Medical Record Number)</label>
              <input
                placeholder="e.g. 40221"
                value={addMrn}
                onChange={(e) => setAddMrn(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="e.g. patient@email.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
            {error && <div className="patients-toast error" style={{ marginTop: 0, marginBottom: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-modal-submit" onClick={handleAdd} disabled={adding || !addName.trim()}>
                {adding ? 'Adding…' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {showProfileModal && selectedPatient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}>
          <div className="modal-box">
            <div className="profile-modal-header">
              {(() => {
                const style = getAvatarStyle(selectedPatient.name);
                return (
                  <div className="profile-modal-avatar" style={{ background: style.bg, color: style.color }}>
                    {getInitials(selectedPatient.name)}
                  </div>
                );
              })()}
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>{selectedPatient.name}</h3>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{selectedPatient.email || 'No email'}</div>
              </div>
            </div>
            <div className="profile-modal-detail-row">
              <span className="key">MRN</span>
              <span className="val">{selectedPatient.mrn || '—'}</span>
            </div>
            <div className="profile-modal-detail-row">
              <span className="key">Authorization Status</span>
              <span className={`pcard-status ${selectedPatient.authorized ? 'authorized' : 'unauthorized'}`} style={{ fontSize: '13px' }}>
                {selectedPatient.authorized ? '✓ Authorized' : '✗ Unauthorized'}
              </span>
            </div>
            <div className="profile-modal-detail-row">
              <span className="key">Date Added</span>
              <span className="val">{new Date(selectedPatient.created_at).toLocaleDateString()}</span>
            </div>
            {selectedPatient.dob && (
              <div className="profile-modal-detail-row">
                <span className="key">Date of Birth</span>
                <span className="val">{new Date(selectedPatient.dob).toLocaleDateString()}</span>
              </div>
            )}
            {!selectedPatient.authorized && selectedPatient.email && (
              <button
                className="btn-send-auth"
                onClick={async () => {
                  await handleSendAuth(selectedPatient.id);
                  setShowProfileModal(false);
                }}
              >
                Send Authorization Link via Email
              </button>
            )}
            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button className="btn-modal-cancel" onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
