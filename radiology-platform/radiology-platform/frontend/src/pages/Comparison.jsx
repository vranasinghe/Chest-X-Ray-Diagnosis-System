import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../api/auth.jsx';
import Layout from '../components/Layout.jsx';

// Helper to calculate age from DOB
function calculateAge(dobString) {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob)) return '';
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function Comparison() {
  const { user } = useAuth();
  const userName = user?.name || 'Dr. Maya Chen';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const navigate = useNavigate();

  // Patients autocomplete search
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [topSearch, setTopSearch] = useState('');
  const [showTopDropdown, setShowTopDropdown] = useState(false);
  const topDropdownRef = useRef(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [address, setAddress] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [outcome, setOutcome] = useState('Improved');
  const [observations, setObservations] = useState('');

  // Files
  const [baselineFile, setBaselineFile] = useState(null);
  const [baselinePreview, setBaselinePreview] = useState('');
  const [followupFile, setFollowupFile] = useState(null);
  const [followupPreview, setFollowupPreview] = useState('');

  const baselineInputRef = useRef(null);
  const followupInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.patients().then((p) => {
      setPatients(p);
      const url = new URL(window.location.href);
      const patientParam = url.searchParams.get('patientId');
      if (patientParam) {
        const foundPat = p.find(pat => String(pat.id) === String(patientParam));
        if (foundPat) {
          handlePatientSelect(foundPat);
        }
      }
    }).catch(() => {});
  }, []);

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (topDropdownRef.current && !topDropdownRef.current.contains(event.target)) {
        setShowTopDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handlePatientSelect(p) {
    setPatientId(p.id);
    setPatientSearch(p.name);
    setAddress(p.address || '');
    setPrimaryDiagnosis(p.notes || p.history || '');
    setShowDropdown(false);
  }

  function handleFileChange(e, type) {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'baseline') {
        setBaselineFile(file);
        setBaselinePreview(url);
      } else {
        setFollowupFile(file);
        setFollowupPreview(url);
      }
    }
  }

  async function handleFinalize() {
    setError('');
    setSuccess('');
    if (!patientSearch.trim()) { setError('Patient name is required.'); return; }
    if (!baselineFile || !followupFile) { setError('Please upload both baseline and follow-up X-rays.'); return; }

    setSubmitting(true);
    try {
      // 1. If patient doesn't exist, create them
      let activePatId = patientId;
      if (!activePatId) {
        const existingPat = patients.find(p => (p.name || '').trim().toLowerCase() === patientSearch.trim().toLowerCase());
        if (existingPat) {
          activePatId = existingPat.id;
          setPatientId(existingPat.id);
        } else {
          const newPat = await api.addPatient({
            name: patientSearch,
            address: address,
            notes: primaryDiagnosis,
            mrn: String(Math.floor(10000 + Math.random() * 90000)),
            authorized: true,
          });
          activePatId = newPat.id;
        }
      }

      // 2. Upload baseline scan
      const baseForm = new FormData();
      baseForm.append('patient_id', activePatId);
      baseForm.append('image', baselineFile);
      const baseScan = await api.uploadScan(baseForm);

      // 3. Upload follow-up scan
      const followForm = new FormData();
      followForm.append('patient_id', activePatId);
      followForm.append('image', followupFile);
      const followScan = await api.uploadScan(followForm);

      // 4. Create comparison report
      await api.createReport({
        scan_id: followScan.id,
        findings: `Comparison Outcome: ${outcome}. ${observations}`,
        impression: `Primary Diagnosis: ${primaryDiagnosis}`,
        finalize: true,
      });

      setSuccess('X-ray Comparison report saved successfully.');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to save comparison.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return false;
    const q = patientSearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const filteredTopPatients = patients.filter((p) => {
    if (!topSearch.trim()) return false;
    const q = topSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.mrn || '').toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .comp-page-wrapper {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #1e293b;
        }

        /* Top Header Bar */
        .topbar-header {
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
        .search-pill-container {
          position: relative;
          flex: 1;
          max-width: 320px;
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border-radius: 30px;
        }
        .search-pill-container svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .search-pill-input {
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
        .search-pill-input:focus {
          border-color: #1abfb2;
          background: #ffffff;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
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

        /* Title */
        .page-title {
          font-size: 26px;
          font-weight: 800;
          color: #111c44;
          text-align: center;
          margin: 10px 0 28px;
        }

        /* Twin Dropzones Grid */
        .dropzone-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }
        @media (max-width: 768px) {
          .dropzone-grid { grid-template-columns: 1fr; }
        }

        .dropzone-box {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8edf5;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(17, 28, 68, 0.04);
        }
        .dropzone-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #111c44;
          margin-bottom: 14px;
        }
        .dropzone-area {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          background: #f8fafc;
          height: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          padding: 20px;
          overflow: hidden;
          position: relative;
        }
        .dropzone-area:hover {
          border-color: #1abfb2;
          background: #f0fdfc;
        }
        .dropzone-content {
          text-align: center;
          color: #64748b;
        }
        .dropzone-content svg {
          color: #cbd5e1;
          margin-bottom: 16px;
        }
        .dropzone-text {
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }
        .dropzone-subtext {
          font-size: 12px;
          color: #94a3b8;
        }
        .dropzone-subtext span {
          color: #1abfb2;
          text-decoration: underline;
        }
        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 12px;
        }

        /* Diagnostic Info Panel */
        .info-panel {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8edf5;
          padding: 32px 40px;
          box-shadow: 0 4px 20px rgba(17, 28, 68, 0.04);
          margin-bottom: 28px;
        }
        .info-panel-title {
          font-size: 16px;
          font-weight: 800;
          color: #111c44;
          margin-bottom: 24px;
        }
        .info-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 24px;
          margin-bottom: 20px;
        }
        @media (max-width: 600px) {
          .info-fields-grid { grid-template-columns: 1fr; }
        }

        .field-group {
          position: relative;
        }
        .field-group label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #111c44;
          margin-bottom: 8px;
        }
        .field-input, .field-select, .field-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          color: #1e293b;
          background: #f1f5f9;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }
        .field-input:focus, .field-select:focus, .field-textarea:focus {
          border-color: #1abfb2;
          background: #ffffff;
        }

        /* Autocomplete */
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(17,28,68,0.06);
        }
        .autocomplete-item {
          padding: 10px 14px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
        }
        .autocomplete-item:hover {
          background: #f0fdfc;
          color: #0e8c7a;
        }
        .top-header-dropdown {
          box-shadow: 0 10px 25px rgba(17, 28, 68, 0.08);
          max-height: 250px;
          margin-top: 6px;
        }
        .search-result-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px 14px;
          border-bottom: 1px solid #edf2f7;
        }
        .search-result-item:last-child {
          border-bottom: none;
        }
        .search-result-name {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
          text-align: left;
        }
        .search-result-meta {
          font-size: 11px;
          color: #94a3b8;
          text-align: left;
        }
        .autocomplete-item:hover .search-result-name {
          color: #0e8c7a;
        }

        /* Action buttons row */
        .actions-row {
          display: flex;
          gap: 16px;
        }
        .btn-finalize {
          flex: 1;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 15px;
          font-size: 15.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s;
          text-align: center;
        }
        .btn-finalize:hover:not(:disabled) { opacity: 0.88; }
        .btn-finalize:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .btn-exit {
          flex: 1;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 15px;
          font-size: 15.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s;
          text-align: center;
        }
        .btn-exit:hover { opacity: 0.88; }

        /* Toast banner */
        .toast-banner {
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .toast-banner.success { background: #e0f8f6; color: #0e8c7a; }
        .toast-banner.error { background: #fee2e2; color: #c0392b; }
      `}</style>

      <div className="comp-page-wrapper">
        
        {/* Top bar */}
        <div className="topbar-header">
          <div className="search-pill-container" ref={topDropdownRef}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-pill-input"
              placeholder="Search patients by name or phone"
              value={topSearch}
              onChange={(e) => {
                setTopSearch(e.target.value);
                setShowTopDropdown(true);
              }}
              onFocus={() => setShowTopDropdown(true)}
            />
            {showTopDropdown && filteredTopPatients.length > 0 && (
              <div className="autocomplete-dropdown top-header-dropdown">
                {filteredTopPatients.map((p) => (
                  <div
                    key={p.id}
                    className="autocomplete-item search-result-item"
                    onClick={() => {
                      handlePatientSelect(p);
                      setTopSearch('');
                      setShowTopDropdown(false);
                    }}
                  >
                    <span className="search-result-name">{p.name}</span>
                    <span className="search-result-meta">
                      {p.gender || p.sex || 'Male'} • {calculateAge(p.dob) ? `${calculateAge(p.dob)} yrs` : 'N/A'} • MRN: {p.mrn || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="topbar-profile">
              <div className="topbar-profile-lbl">Logged In</div>
              <div className="topbar-profile-name">{userName}</div>
            </div>
            <div className="topbar-avatar">{userInitials}</div>
          </div>
        </div>

        <h1 className="page-title">X-Ray Comparison</h1>

        {error && <div className="toast-banner error">{error}</div>}
        {success && <div className="toast-banner success">{success}</div>}

        {/* Dropzones */}
        <div className="dropzone-grid">
          
          {/* Baseline Dropzone */}
          <div className="dropzone-box">
            <div className="dropzone-title">Baseline X-Ray (Before)</div>
            <div
              className="dropzone-area"
              onClick={() => baselineInputRef.current?.click()}
            >
              <input
                type="file"
                ref={baselineInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'baseline')}
                accept="image/*"
              />
              {baselinePreview ? (
                <img src={baselinePreview} className="preview-img" alt="Baseline Preview" />
              ) : (
                <div className="dropzone-content">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div className="dropzone-text">Drop baseline X-ray</div>
                  <div className="dropzone-subtext">or <span>browse files</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Follow up Dropzone */}
          <div className="dropzone-box">
            <div className="dropzone-title">Follow up X-Ray (After)</div>
            <div
              className="dropzone-area"
              onClick={() => followupInputRef.current?.click()}
            >
              <input
                type="file"
                ref={followupInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'followup')}
                accept="image/*"
              />
              {followupPreview ? (
                <img src={followupPreview} className="preview-img" alt="Follow-up Preview" />
              ) : (
                <div className="dropzone-content">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div className="dropzone-text">Drop follow-up X-ray</div>
                  <div className="dropzone-subtext">or <span>browse files</span></div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Patient Diagnostic Info Panel */}
        <div className="info-panel" ref={dropdownRef}>
          <div className="info-panel-title">Patient Diagnostic Information</div>

          <div className="info-fields-grid">
            {/* Patient Name Search */}
            <div className="field-group">
              <label>Patient Name</label>
              <input
                className="field-input"
                placeholder="Select or enter patient name"
                value={patientSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setPatientSearch(val);
                  setShowDropdown(true);
                  
                  const match = patients.find(p => (p.name || '').trim().toLowerCase() === val.trim().toLowerCase());
                  if (match) {
                    handlePatientSelect(match);
                  } else {
                    if (patientId) {
                      setPatientId('');
                      setAddress('');
                      setPrimaryDiagnosis('');
                    }
                  }
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filteredPatients.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      className="autocomplete-item"
                      onClick={() => handlePatientSelect(p)}
                    >
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>MRN: {p.mrn || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="field-group">
              <label>Residential Address</label>
              <input
                className="field-input"
                placeholder="e.g. Kandy"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Diagnosis */}
            <div className="field-group">
              <label>Primary Diagnosis</label>
              <input
                className="field-input"
                placeholder="e.g. Pneumonia"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              />
            </div>

            {/* Outcome select */}
            <div className="field-group">
              <label>Comparison Outcome</label>
              <select
                className="field-select"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              >
                <option value="Improved">Improved</option>
                <option value="Deteriorated">Deteriorated</option>
                <option value="Stable">Stable</option>
                <option value="Unchanged">Unchanged</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div className="field-group" style={{ marginBottom: 8 }}>
            <label>Clinical Observations</label>
            <textarea
              className="field-textarea"
              rows="4"
              placeholder="patient condition good"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

        </div>

        {/* Action Buttons Row */}
        <div className="actions-row">
          <button
            className="btn-finalize"
            onClick={handleFinalize}
            disabled={submitting}
          >
            {submitting ? 'Finalizing & Saving...' : 'Finalize and Save'}
          </button>
          <button className="btn-exit" onClick={() => navigate('/')}>
            Exit to Dashboard
          </button>
        </div>

      </div>
    </Layout>
  );
}
