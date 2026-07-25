import { useEffect, useState, useRef } from 'react';
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

export default function Analysis() {
  const { user } = useAuth();
  const userName = user?.name || 'Dr. Maya Chen';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
   const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [topSearch, setTopSearch] = useState('');
  const [showTopDropdown, setShowTopDropdown] = useState(false);
  const topDropdownRef = useRef(null);

  // Form states matching screenshot
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [xrayView, setXrayView] = useState('PA'); // PA or AP

  // Upload/View states
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const [scan, setScan] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Results interactive states
  const [activeMode, setActiveMode] = useState('Overlay'); // Original, Overlay, Grad-CAM
  const [intensity, setIntensity] = useState(100);
  const [subView, setSubView] = useState('report'); // report, comparison

  useEffect(() => {
    api.patients().then((p) => {
      setPatients(p);
      const url = new URL(window.location.href);
      const scanParam = url.searchParams.get('scan');
      if (scanParam) {
        loadScan(scanParam);
      } else {
        const patientParam = url.searchParams.get('patientId');
        if (patientParam) {
          const foundPat = p.find(pat => String(pat.id) === String(patientParam));
          if (foundPat) {
            handlePatientSelect(foundPat);
          }
        }
      }
    });
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

  async function loadScan(id) {
    setError('');
    try {
      const s = await api.scan(id);
      setScan(s);
      
      if (s.status === 'pending_review' || s.status === 'reviewed') {
        const comp = await api.compareScan(id);
        setComparison(comp);
      } else {
        setComparison(null);
      }

      // Poll while the mock model runs.
      if (s.status === 'queued' || s.status === 'processing') {
        setTimeout(() => loadScan(id), 1200);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePatientSelect(p) {
    setPatientId(p.id);
    setPatientName(p.name);
    setPatientSearch(p.name);
    setAge(calculateAge(p.dob));
    let g = p.gender || p.sex || '';
    if (g === 'M' || g === 'm' || g === 'Male') g = 'Male';
    else if (g === 'F' || g === 'f' || g === 'Female') g = 'Female';
    else g = 'Other';
    setGender(g);
    setEmailPhone(p.email || p.phone || '');
    setShowDropdown(false);
    setError('');
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  function clearForm() {
    setPatientId('');
    setPatientName('');
    setPatientSearch('');
    setAge('');
    setGender('');
    setEmailPhone('');
    setXrayView('PA');
    setFile(null);
    setPreviewUrl('');
    setScan(null);
    setComparison(null);
    setFindings('');
    setImpression('');
    setError('');
    setMsg('');
  }

  async function handleProceed() {
    setMsg('');
    setError('');
    
    if (!file) {
      setError('Please select or upload a chest X-ray image.');
      return;
    }

    let activePatientId = patientId;

    // Auto-register patient on-the-fly if details are filled out
    if (!activePatientId) {
      if (!patientSearch.trim()) {
        setError('Please select an existing patient or enter a patient name.');
        return;
      }
      
      const existingPat = patients.find(p => (p.name || '').trim().toLowerCase() === patientSearch.trim().toLowerCase());
      if (existingPat) {
        activePatientId = existingPat.id;
        setPatientId(existingPat.id);
      } else {
        if (!age) {
          setError('Please enter the patient age.');
          return;
        }
        if (!gender) {
          setError('Please select the patient gender.');
          return;
        }
        if (!emailPhone.trim()) {
          setError('Please enter the patient email or phone.');
          return;
        }

        setMsg('Registering patient on the fly...');
        try {
          const birthYear = new Date().getFullYear() - parseInt(age);
          const dob = `${birthYear}-01-01`;

          const newPat = await api.addPatient({
            name: patientSearch,
            dob: dob,
            sex: gender,
            gender: gender,
            email: emailPhone.includes('@') ? emailPhone : '',
            phone: !emailPhone.includes('@') ? emailPhone : '',
            mrn: String(Math.floor(10000 + Math.random() * 90000)),
            authorized: true, // auto-authorize to allow immediate AI analysis
          });
          activePatientId = newPat.id;
          setPatientId(newPat.id);

          const updatedList = await api.patients();
          setPatients(updatedList);
        } catch (err) {
          setError('Failed to register patient: ' + err.message);
          return;
        }
      }
    }

    const selectedPatient = patients.find((p) => p.id === activePatientId);
    if (selectedPatient && !selectedPatient.authorized) {
      setError('Patient is not authorized for AI scan diagnostics. Please authorize their profile first.');
      return;
    }

    try {
      setMsg('Uploading scan and starting AI analysis...');
      const form = new FormData();
      form.append('patient_id', activePatientId);
      form.append('image', file);
      form.append('xray_view', xrayView);

      const created = await api.uploadScan(form);
      setMsg('Uploaded successfully. Scan queued for AI analysis.');
      loadScan(created.id);
    } catch (err) {
      setError(err.message || 'Failed to upload scan.');
    }
  }

  async function finalize() {
    setMsg('');
    setError('');
    try {
      await api.createReport({ scan_id: scan.id, findings, impression, finalize: true });
      setMsg('Report finalized successfully.');
      loadScan(scan.id);
    } catch (err) {
      setError(err.message);
    }
  }

  // Filter patients list for autocomplete
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

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  const currentImgUrl = scan ? `${apiBase}/scans/${scan.id}/image?token=${token}` : '';
  const priorImgUrl = comparison?.prior ? `${apiBase}/scans/${comparison.prior.id}/image?token=${token}` : '';

  const preds = scan?.predictions || [];

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .analysis-wrapper {
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
        .topbar-bell {
          position: relative;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
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
          margin: 0 0 28px;
        }

        /* Back to Upload Button */
        .back-to-upload-btn {
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
          margin-bottom: 24px;
          transition: opacity 0.2s;
        }
        .back-to-upload-btn:hover { opacity: 0.8; }

        /* AI Results Header Row */
        .results-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .results-title-block h1 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 800;
          color: #111c44;
        }
        .results-title-block p {
          margin: 0;
          font-size: 13.5px;
          color: #94a3b8;
          font-weight: 500;
        }
        .confidence-pill {
          background: #e0f8f6;
          color: #1abfb2;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .confidence-pill svg {
          stroke: #1abfb2;
        }

        /* View Toggle Tabs (Create Report & X-ray Comparison) */
        .view-toggle-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .tab-btn {
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #64748b;
        }
        .tab-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .tab-btn.active {
          background: #1abfb2;
          color: #ffffff;
          border-color: #1abfb2;
        }

        /* 2-Column Grid Layout */
        .upload-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .upload-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Panel Card */
        .panel-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8edf5;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(17, 28, 68, 0.04);
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
        }
        .panel-card h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 700;
          color: #111c44;
        }
        .panel-card-subtitle {
          margin: 0 0 24px;
          font-size: 13px;
          color: #94a3b8;
        }

        /* Drop Zone */
        .dropzone-container {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          background: #f8fafc;
          height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .dropzone-container:hover {
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
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }
        .dropzone-subtext {
          font-size: 12.5px;
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

        /* Grad-CAM Viewer Box */
        .gradcam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .gradcam-toggle-pill {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 20px;
          gap: 2px;
        }
        .gradcam-toggle-btn {
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gradcam-toggle-btn.active {
          background: #ffffff;
          color: #111c44;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .gradcam-image-container {
          background: #111c44;
          border-radius: 18px;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .gradcam-base-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gradcam-heatmap-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: color-burn;
          opacity: 0.6;
        }
        .gradcam-bottom-controls {
          margin-top: 24px;
        }
        .intensity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .intensity-label {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 500;
        }
        .intensity-slider {
          flex: 1;
          accent-color: #1abfb2;
          cursor: pointer;
        }
        .intensity-value {
          font-size: 14px;
          font-weight: 700;
          color: #111c44;
          min-width: 36px;
          text-align: right;
        }
        .legend-row {
          display: flex;
          gap: 16px;
          font-size: 12.5px;
          color: #64748b;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .legend-box {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        .legend-box.high { background: #ef4444; }
        .legend-box.moderate { background: #f59e0b; }
        .legend-box.low { background: #1abfb2; }

        /* Progress bars styling matching screenshot */
        .finding-row {
          margin-bottom: 16px;
        }
        .finding-info {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .finding-info.high { color: #ef4444; }
        .finding-info.moderate { color: #f59e0b; }
        .finding-info.low { color: #1abfb2; }
        .progress-track {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
        }

        /* Review Notes Card styling */
        .review-notes-textarea {
          width: 100%;
          min-height: 100px;
          padding: 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13.5px;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          resize: vertical;
          font-family: inherit;
          margin-bottom: 20px;
        }
        .review-notes-textarea::placeholder {
          color: #94a3b8;
        }
        .review-actions-row {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 14px;
        }
        .btn-flag-review {
          background: #ffffff;
          color: #ef4444;
          border: 1.5px solid #ef4444;
          border-radius: 30px;
          padding: 12px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .btn-flag-review:hover {
          background: #fee2e2;
        }
        .btn-approve-sign {
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 12px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s;
        }
        .btn-approve-sign:hover {
          opacity: 0.88;
        }

        /* Proceed Button */
        .btn-proceed {
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          text-align: center;
          font-family: inherit;
        }
        .btn-proceed:hover:not(:disabled) {
          opacity: 0.88;
        }
        .btn-proceed:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Form Details Card */
        .field-group {
          margin-bottom: 16px;
          position: relative;
        }
        .field-group label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }
        .field-group label span {
          color: #ef4444;
          margin-left: 2px;
        }
        .field-input, .field-select {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }
        .field-input:focus, .field-select:focus {
          border-color: #1abfb2;
        }
        .field-input::placeholder {
          color: #cbd5e1;
        }
        .field-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Autocomplete dropdown */
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
        }
        .search-result-meta {
          font-size: 11px;
          color: #94a3b8;
        }
        .autocomplete-item:hover .search-result-name {
          color: #0e8c7a;
        }

        /* Radio group */
        .radio-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
          display: block;
        }
        .radio-row {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
        }
        .radio-option input {
          width: 18px;
          height: 18px;
          accent-color: #1abfb2;
          cursor: pointer;
        }

        /* Buttons row */
        .actions-row {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 14px;
        }
        .btn-clear {
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 30px;
          padding: 12px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-clear:hover {
          background: #e2e8f0;
        }
        .btn-save {
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 12px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-save:hover {
          opacity: 0.88;
        }

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

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(26, 191, 178, 0.2);
          border-top-color: #1abfb2;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="analysis-wrapper">
        {/* Top Header Bar */}
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
                      {p.gender || p.sex || 'Male'} • {calculateAge(p.dob)} yrs • MRN: {p.mrn || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="topbar-bell">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div className="topbar-profile">
              <div className="topbar-profile-lbl">Logged In</div>
              <div className="topbar-profile-name">{userName}</div>
            </div>
            <div className="topbar-avatar">{userInitials}</div>
          </div>
        </div>

        {/* Dynamic Scan Result Viewer */}
        {scan ? (
          <div style={{ animation: 'slideUp 0.35s ease' }}>
            
            {/* Back button */}
            <button className="back-to-upload-btn" onClick={clearForm}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Upload
            </button>

            {/* Results Title Block */}
            <div className="results-header-row">
              <div className="results-title-block">
                <h1>AI Diagnosis Results</h1>
                <p>
                  {scan.patient_name} · {xrayView} view · Analyzed just now
                </p>
              </div>
              <div className="confidence-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                84 % Model Confidence
              </div>
            </div>

            {/* ERROR / MSG BANNERS */}
            {error && <div className="toast-banner error">{error}</div>}
            {msg && <div className="toast-banner success">{msg}</div>}

            {/* Two tab buttons: Create Report & X-ray Comparison */}
            <div className="view-toggle-tabs">
              <button
                className={`tab-btn ${subView === 'report' ? 'active' : ''}`}
                onClick={() => setSubView('report')}
              >
                Create Report
              </button>
              <button
                className={`tab-btn ${subView === 'comparison' ? 'active' : ''}`}
                onClick={() => setSubView('comparison')}
              >
                X-ray Comparison
              </button>
            </div>

            <div className="upload-grid">
              
              {/* Left Column: Grad-CAM map viewer or Side-by-side comparison */}
              <div className="panel-card" style={{ padding: 28 }}>
                {subView === 'comparison' ? (
                  <>
                    <div className="gradcam-header">
                      <h3>X-ray Comparison</h3>
                    </div>
                    {comparison?.prior ? (
                      <div style={{ display: 'flex', gap: 16, height: 420 }}>
                        {/* Prior */}
                        <div style={{ flex: 1, position: 'relative' }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                            Prior Scan ({new Date(comparison.prior.created_at).toLocaleDateString()})
                          </div>
                          {comparison.prior.store_ref ? (
                            <img src={priorImgUrl} style={{ width: '100%', height: 'calc(100% - 24px)', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} alt="Prior Scan" />
                          ) : (
                            <div className="viewer" style={{ fontSize: 13, color: '#94a3b8', height: 'calc(100% - 24px)' }}>Image Pruned</div>
                          )}
                        </div>

                        {/* Current */}
                        <div style={{ flex: 1, position: 'relative' }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                            Current Scan (Today)
                          </div>
                          {scan.store_ref ? (
                            <img src={currentImgUrl} style={{ width: '100%', height: 'calc(100% - 24px)', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} alt="Current Scan" />
                          ) : (
                            <div className="viewer" style={{ fontSize: 13, color: '#94a3b8', height: 'calc(100% - 24px)' }}>Image Pruned</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="viewer" style={{ height: 420, color: '#94a3b8', fontSize: 14 }}>
                        No prior scans on file for this patient.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="gradcam-header">
                      <h3>Grad-CAM Attention Map</h3>
                      <div className="gradcam-toggle-pill">
                        <button
                          className={`gradcam-toggle-btn ${activeMode === 'Original' ? 'active' : ''}`}
                          onClick={() => setActiveMode('Original')}
                        >
                          Original
                        </button>
                        <button
                          className={`gradcam-toggle-btn ${activeMode === 'Overlay' ? 'active' : ''}`}
                          onClick={() => setActiveMode('Overlay')}
                        >
                          Overlay
                        </button>
                        <button
                          className={`gradcam-toggle-btn ${activeMode === 'Grad-CAM' ? 'active' : ''}`}
                          onClick={() => setActiveMode('Grad-CAM')}
                        >
                          Grad-CAM
                        </button>
                      </div>
                    </div>

                    <div className="gradcam-image-container">
                      {activeMode !== 'Grad-CAM' && scan.store_ref && (
                        <img src={currentImgUrl} className="gradcam-base-image" alt="Base X-ray" />
                      )}
                      {activeMode !== 'Original' && (
                        <div
                          className="gradcam-heatmap-overlay"
                          style={{
                            opacity: activeMode === 'Grad-CAM' ? 1.0 : intensity / 100,
                            backgroundImage: 'radial-gradient(circle at 45% 45%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.6) 30%, rgba(26, 191, 178, 0.3) 60%, transparent 100%)',
                            backgroundBlendMode: 'color-burn',
                            backgroundSize: 'cover',
                            mixBlendMode: activeMode === 'Grad-CAM' ? 'normal' : 'color-burn',
                            backgroundColor: activeMode === 'Grad-CAM' ? '#111c44' : 'transparent',
                          }}
                        />
                      )}
                    </div>

                    <div className="gradcam-bottom-controls">
                      <div className="intensity-row">
                        <span className="intensity-label">Overlay intensity</span>
                        <input
                          type="range"
                          className="intensity-slider"
                          min="0"
                          max="100"
                          value={intensity}
                          onChange={(e) => setIntensity(Number(e.target.value))}
                          disabled={activeMode === 'Original' || activeMode === 'Grad-CAM'}
                        />
                        <span className="intensity-value">{activeMode === 'Original' ? '0%' : activeMode === 'Grad-CAM' ? '100%' : `${intensity}%`}</span>
                      </div>

                      <div className="legend-row">
                        <div className="legend-item">
                          <div className="legend-box high" /> High attention
                        </div>
                        <div className="legend-item">
                          <div className="legend-box moderate" /> Moderate
                        </div>
                        <div className="legend-item">
                          <div className="legend-box low" /> Low
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Predicted Findings + Radiologist Review */}
              <div>
                
                {/* Card 1: Predicted Findings */}
                <div className="panel-card" style={{ padding: 28, marginBottom: 20 }}>
                  <h3 style={{ marginBottom: 20 }}>Predicted Findings</h3>
                  {preds.length === 0 ? (
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="spinner" />
                      Running model diagnostics…
                    </div>
                  ) : (
                    <>
                      {preds.map((p) => {
                        const pct = Math.round(p.score * 100);
                        let severity = 'low';
                        let color = '#1abfb2';
                        if (pct >= 70) { severity = 'high'; color = '#ef4444'; }
                        else if (pct >= 40) { severity = 'moderate'; color = '#f59e0b'; }

                        return (
                          <div key={p.label} className="finding-row">
                            <div className={`finding-info ${severity}`}>
                              <span>{p.label}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Card 2: Radiologist Review */}
                <div className="panel-card" style={{ padding: 28 }}>
                  <h3 style={{ marginBottom: 20 }}>Radiologist Review</h3>
                  
                  {scan.status === 'reviewed' ? (
                    <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e0f8f6', background: '#f0fdfc' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0e8c7a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>✓</span> Finalized Report
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Clinical Findings
                      </div>
                      <p style={{ fontSize: 13.5, margin: '0 0 16px 0', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#334155' }}>
                        {scan.report_findings || 'No findings recorded.'}
                      </p>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Doctor's Impression
                      </div>
                      <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#334155' }}>
                        {scan.report_impression || 'No impression recorded.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        className="review-notes-textarea"
                        placeholder="Add clinical notes on the AI findings..."
                        value={findings}
                        onChange={(e) => {
                          setFindings(e.target.value);
                          setImpression(e.target.value); // set both matching
                        }}
                      />
                      <div className="review-actions-row">
                        <button className="btn-flag-review" onClick={() => clearForm()}>
                          Flag for Review
                        </button>
                        <button className="btn-approve-sign" onClick={finalize}>
                          Approve &amp; Sign Off
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          </div>
        ) : (
          <>
            <h1 className="page-title">X-ray Upload</h1>

            {/* Error / Warning Alert */}
            {error && <div className="toast-banner error">{error}</div>}
            {msg && <div className="toast-banner success">{msg}</div>}

            <div className="upload-grid">
              
              {/* Left Column: Upload Card */}
              <div className="panel-card">
                <h3>Upload Image</h3>
                <div className="panel-card-subtitle">Upload your X-ray images here</div>
                
                <div
                  className="dropzone-container"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  {previewUrl ? (
                    <img src={previewUrl} className="preview-img" alt="X-ray preview" />
                  ) : (
                    <div className="dropzone-content">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <div className="dropzone-text">Click to upload X-ray</div>
                      <div className="dropzone-subtext">or <span>browse files</span></div>
                    </div>
                  )}
                </div>

                <button
                  className="btn-proceed"
                  onClick={handleProceed}
                  disabled={!file}
                >
                  Proceed to AI solution
                </button>
              </div>

              {/* Right Column: Patient's Details Card */}
              <div className="panel-card" ref={dropdownRef}>
                <h3>Patient's Details</h3>
                <div className="panel-card-subtitle">Provide details of the patient being diagnosed</div>

                {/* Patient Name field with search dropdown */}
                <div className="field-group">
                  <label>Patient Name <span>*</span></label>
                  <input
                    className="field-input"
                    placeholder="Enter patient name"
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
                          setAge('');
                          setGender('');
                          setEmailPhone('');
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

                {/* Age field */}
                <div className="field-group">
                  <label>Age <span>*</span></label>
                  <input
                    className="field-input"
                    placeholder="Enter age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                {/* Gender select */}
                <div className="field-group">
                  <label>Gender <span>*</span></label>
                  <select
                    className="field-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Email / Phone field */}
                <div className="field-group">
                  <label>Email / Phone <span>*</span></label>
                  <input
                    className="field-input"
                    placeholder="Enter email or phone number"
                    value={emailPhone}
                    onChange={(e) => setEmailPhone(e.target.value)}
                  />
                  <div className="field-hint">
                    Format: email@example.com or +94123456789 / 0123456789
                  </div>
                </div>

                {/* X-ray view radio options */}
                <div className="field-group" style={{ marginBottom: 8 }}>
                  <span className="radio-label">X ray view: <span>*</span></span>
                  <div className="radio-row">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="xrayView"
                        checked={xrayView === 'PA'}
                        onChange={() => setXrayView('PA')}
                      />
                      Posteroanterior (PA)
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="xrayView"
                        checked={xrayView === 'AP'}
                        onChange={() => setXrayView('AP')}
                      />
                      Anteposterior (AP)
                    </label>
                  </div>
                </div>

                {/* Clear / Save buttons */}
                <div className="actions-row">
                  <button className="btn-clear" onClick={clearForm}>
                    Clear Data
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleProceed}
                    disabled={!file}
                  >
                    Save Changes
                  </button>
                </div>

              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
