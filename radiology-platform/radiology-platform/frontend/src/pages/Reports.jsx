import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import Layout from '../components/Layout.jsx';

// Initial form state
const initialForm = {
  patientId: '',
  patientName: '',
  gender: 'Male',
  doctorName: '',
  registrationNo: '',
  findings: '',       // Final Diagnosis
  impression: '',     // Clinical Observations
  treatmentPlan: '',
  comments: '',
};

export function Reports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  
  // Navigation states
  const [viewMode, setViewMode] = useState('list'); // list, create, edit, details
  const [selectedReport, setSelectedReport] = useState(null);

  // Form states
  const [form, setForm] = useState(initialForm);
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Utility alerts
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Actions & Distribution modal
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionReport, setActionReport] = useState(null);

  function load() {
    setLoading(true);
    setError('');
    api.patients().then((p) => {
      setPatients(p);
      const url = new URL(window.location.href);
      const patientParam = url.searchParams.get('patientId');
      if (patientParam) {
        const foundPat = p.find(pat => String(pat.id) === String(patientParam));
        if (foundPat) {
          // Initialize for creation first
          setForm(f => ({
            ...f,
            patientId: foundPat.id,
            patientName: foundPat.name,
            gender: foundPat.gender || foundPat.sex || 'Male',
          }));
          setPatientSearch(foundPat.name);
          setSelectedReport(null);
          setViewMode('create');
        }
      }
    }).catch(() => {});
    api.getMe().then((me) => {
      setForm(f => ({ ...f, doctorName: me.name || '' }));
    }).catch(() => {});

    api.getReport('') // calls router.get('/')
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
        } else {
          setError('Failed to load reports.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load reports.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function showToast(m, type = 'success') {
    if (type === 'success') setMsg(m);
    else setError(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3500);
  }

  function handlePatientSelect(p) {
    setForm(f => ({
      ...f,
      patientId: p.id,
      patientName: p.name,
      gender: p.gender || p.sex || 'Male',
    }));
    setPatientSearch(p.name);
    setShowDropdown(false);
  }

  async function handleSave(finalize = false) {
    if (!form.patientName.trim()) { showToast('Patient name is required.', 'error'); return; }
    
    setLoading(true);
    try {
      let activePatientId = form.patientId;
      
      // Auto-create patient if not selected from database
      if (!activePatientId) {
        const existingPat = patients.find(p => (p.name || '').trim().toLowerCase() === form.patientName.trim().toLowerCase());
        if (existingPat) {
          activePatientId = existingPat.id;
          setForm(f => ({ ...f, patientId: existingPat.id }));
        } else {
          const newP = await api.addPatient({
            name: form.patientName,
            sex: form.gender,
            gender: form.gender,
            mrn: String(Math.floor(10000 + Math.random() * 90000)),
            authorized: true,
          });
          activePatientId = newP.id;
        }
      }

      const body = {
        patient_id: activePatientId,
        doctor_name: form.doctorName,
        registration_no: form.registrationNo,
        findings: form.findings, // diagnosis
        impression: form.impression, // observations
        treatment_plan: form.treatmentPlan,
        comments: form.comments,
        finalize,
      };

      if (viewMode === 'edit' && selectedReport) {
        await api.updateReport(selectedReport.id, body);
        showToast(finalize ? 'Report finalized.' : 'Draft saved.');
      } else {
        await api.createReport(body);
        showToast(finalize ? 'Report created and finalized.' : 'Draft saved.');
      }

      setViewMode('list');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save report.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF(reportId) {
    try {
      const blob = await api.downloadReportPDF(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('PDF downloaded successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSendToPatient(reportId) {
    try {
      await api.sendReportToPatient(reportId);
      showToast('Report emailed to patient successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete() {
    if (!reportToDelete) return;
    try {
      await api.deleteReport(reportToDelete.id);
      showToast('Report deleted successfully.');
      setShowDeleteConfirm(false);
      setViewMode('list');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete report.', 'error');
    }
  }

  function handleStartCreate() {
    setForm({
      ...initialForm,
    });
    setPatientSearch('');
    setSelectedReport(null);
    setViewMode('create');
  }

  function handleStartEdit(rep) {
    setSelectedReport(rep);
    setForm({
      patientId: rep.patient_id,
      patientName: rep.patient_name || '',
      gender: rep.patient_gender || 'Male',
      doctorName: rep.doctor_name || '',
      registrationNo: rep.registration_no || '',
      findings: rep.findings || '',
      impression: rep.impression || '',
      treatmentPlan: rep.treatment_plan || '',
      comments: rep.comments || '',
    });
    setPatientSearch(rep.patient_name || '');
    setViewMode('edit');
  }

  function handleStartDetails(rep) {
    setSelectedReport(rep);
    setViewMode('details');
  }

  // Filter autocomplete list
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return false;
    return (p.name || '').toLowerCase().includes(patientSearch.toLowerCase());
  });

  // Filter reports lists by search input
  const filteredReports = reports.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.patient_name || '').toLowerCase().includes(q) ||
      (r.findings || '').toLowerCase().includes(q) ||
      (r.impression || '').toLowerCase().includes(q)
    );
  });

  const drafts = filteredReports.filter((r) => r.status === 'draft');
  const finalized = filteredReports.filter((r) => r.status === 'finalized');

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .reports-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #1e293b;
        }

        /* Top Header */
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

        /* Page title info */
        .page-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .page-title {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #111c44;
        }
        .page-subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }
        .btn-create-report {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 24px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-create-report:hover {
          opacity: 0.88;
        }

        /* Grids and Cards */
        .section-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .section-label {
          font-size: 14.5px;
          font-weight: 700;
          color: #1e293b;
        }
        .badge-count {
          background: #fef3c7;
          color: #d97706;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 12px;
        }
        .badge-count.green-badge {
          background: #e0f8f6;
          color: #1abfb2;
        }

        .reports-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 1500px) {
          .reports-cards-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 1200px) {
          .reports-cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .reports-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .reports-cards-grid { grid-template-columns: minmax(0, 1fr); }
        }

        /* Report Cards */
        .report-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1.5px solid #edf2f7;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          min-width: 0;
        }
        .report-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(17, 28, 68, 0.08);
        }
        .report-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .report-card-icon-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .report-icon-bg {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eefbf9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1abfb2;
          flex-shrink: 0;
        }
        .report-card-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.2;
        }
        .report-card-date {
          font-size: 10px;
          color: #8e9cb2;
          background: #f1f3f9;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
          margin-top: 3px;
          display: inline-block;
        }
        .dot-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .dot-status.draft { background: #f59e0b; }
        .dot-status.finalized { background: #1abfb2; }

        /* Info box inside card */
        .report-patient-box {
          background: #f8fafc;
          border-radius: 14px;
          padding: 10px 12px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }
        .report-patient-box-ecg {
          position: absolute;
          right: -10px;
          bottom: 0px;
          opacity: 0.12;
          pointer-events: none;
          color: #1abfb2;
        }
        .patient-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
          margin-bottom: 8px;
        }
        .patient-box-lbl {
          font-size: 9px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .patient-box-val {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .diagnosis-box-val {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 2px;
          white-space: normal;
          line-height: 1.4;
        }

        /* Card action rows */
        .card-actions-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 0;
        }
        .card-row-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          transition: color 0.2s ease;
        }
        .card-row-action:hover {
          color: #1abfb2;
        }
        .card-row-icon {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-row-icon svg {
          color: #8e9cb2;
          transition: color 0.2s ease;
        }
        .card-row-action:hover .card-row-icon svg {
          color: #1abfb2;
        }
        .card-row-action.delete-action {
          color: #ef4444;
        }
        .card-row-action.delete-action .card-row-icon svg {
          color: #ef4444;
        }
        .card-row-action.delete-action:hover {
          color: #dc2626;
        }
        .card-row-action.delete-action:hover .card-row-icon svg {
          color: #dc2626;
        }
        .card-chevron {
          color: #cbd5e1;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .card-row-action:hover .card-chevron {
          color: #1abfb2;
          transform: translateX(2px);
        }
        .card-row-action.delete-action:hover .card-chevron {
          color: #dc2626;
        }

        /* Create/Edit breadcrumb */
        .breadcrumb-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #111c44;
          background: transparent;
          border: none;
          cursor: pointer;
          margin-bottom: 24px;
        }

        /* Forms panels */
        .panel-box {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8edf5;
          padding: 32px 40px;
          box-shadow: 0 4px 20px rgba(17, 28, 68, 0.04);
          margin-bottom: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        .panel-box h3 {
          font-size: 15px;
          font-weight: 700;
          color: #111c44;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-box h3 svg { color: #1abfb2; }

        .fields-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 20px;
        }
        @media (max-width: 560px) {
          .fields-grid-2 { grid-template-columns: 1fr; }
        }

        .form-field {
          position: relative;
          margin-bottom: 14px;
        }
        .form-field label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .form-field input, .form-field select, .form-field textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          color: #1e293b;
          outline: none;
          background: #ffffff;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
          border-color: #1abfb2;
        }
        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          max-width: 800px;
          margin: 24px auto 0;
        }
        .btn-draft {
          background: #ffffff;
          color: #111c44;
          border: 1.5px solid #e2e8f0;
          border-radius: 30px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-draft:hover { background: #f8fafc; }
        .btn-finalize {
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-finalize:hover { opacity: 0.88; }

        /* Report Details View */
        .details-avatar-wrap {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
        }
        .details-avatar-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2.5px solid #1abfb2;
          color: #1abfb2;
          background: #f0fdfc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
        }
        .details-status-badge {
          margin-left: auto;
          background: #fef3c7;
          color: #d97706;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .details-status-badge.finalized {
          background: #e0f8f6;
          color: #1abfb2;
        }

        .details-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .meta-card {
          background: #f8fafc;
          border: 1px solid #e8edf5;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .meta-card-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .meta-card-value {
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
        }

        .observations-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .obs-item {
          margin-bottom: 14px;
        }
        .obs-lbl {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .obs-val {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.5;
        }

        .details-actions-row {
          display: flex;
          gap: 16px;
          max-width: 800px;
          margin: 28px auto 0;
        }
        .btn-details-edit {
          flex: 1;
          background: #ffffff;
          color: #111c44;
          border: 1.5px solid #e2e8f0;
          border-radius: 30px;
          padding: 14px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-details-edit:hover { background: #f8fafc; }
        
        .btn-details-actions {
          flex: 1.3;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 14px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-details-actions:hover { opacity: 0.88; }

        /* General Toast Banners */
        .toast-bar {
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .toast-bar.success { background: #e0f8f6; color: #0e8c7a; }
        .toast-bar.error { background: #fee2e2; color: #c0392b; }

        /* Actions & Distribution Modal */
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
          width: 440px;
          max-width: 95vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          text-align: center;
        }
        .modal-box h3 { margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #111c44; }
        .modal-box p { margin: 0 0 24px; color: #64748b; font-size: 13px; }
        .modal-btn-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .modal-action-btn {
          width: 100%;
          padding: 12px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .modal-action-btn.teal-btn {
          background: #1abfb2;
          color: #ffffff;
          border: none;
        }
        .modal-action-btn.teal-btn:hover { opacity: 0.88; }
        
        .modal-action-btn.outline-btn {
          background: #ffffff;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
        }
        .modal-action-btn.outline-btn:hover { background: #f8fafc; }
      `}</style>

      <div className="reports-page">
        {/* Top Header Bar */}
        <div className="topbar-header">
          <div className="search-pill-container">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-pill-input"
              placeholder="Search reports or patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="topbar-right">
            <div className="topbar-profile">
              <div className="topbar-profile-lbl">Logged In</div>
              <div className="topbar-profile-name">Attending Physician</div>
            </div>
            <div className="topbar-avatar">DR</div>
          </div>
        </div>

        {/* Global Toast */}
        {msg && <div className="toast-bar success">{msg}</div>}
        {error && <div className="toast-bar error">{error}</div>}

        {/* --- VIEW 1: REPORTS LIST VIEW --- */}
        {viewMode === 'list' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="page-title-row">
              <div>
                <h1 className="page-title">Medical Reports</h1>
                <p className="page-subtitle">Manage, draft, and issue official patient reports.</p>
              </div>
              <button className="btn-create-report" onClick={handleStartCreate}>
                + Create Report
              </button>
            </div>

            {/* SECTION 1: Active Drafts */}
            <div className="section-label-row">
              <span className="section-label">Active Drafts</span>
              <span className="badge-count">{drafts.length}</span>
            </div>

            <div className="reports-cards-grid">
              {drafts.map((r, idx) => (
                <div key={r.id} className="report-card">
                  {/* Card Header */}
                  <div className="report-card-header">
                    <div className="report-card-icon-wrap">
                      <div className="report-icon-bg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                      </div>
                      <div>
                        <div className="report-card-title">Report #{idx + 1}</div>
                        <div className="report-card-date">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="dot-status draft" />
                  </div>

                  {/* Info Box */}
                  <div className="report-patient-box">
                    {/* ECG watermark */}
                    <svg className="report-patient-box-ecg" width="90" height="56" viewBox="0 0 90 56" fill="none">
                      <polyline points="0,35 15,35 20,10 27,50 34,18 40,35 55,35 60,20 67,45 74,28 80,35 90,35" stroke="#e2e8f0" strokeWidth="2.5" fill="none"/>
                    </svg>
                    <div className="patient-box-lbl">PATIENT</div>
                    <div className="patient-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e9cb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <div className="patient-box-val">{r.patient_name || '—'}</div>
                    </div>
                    <div className="patient-box-lbl">DIAGNOSIS</div>
                    <div className="diagnosis-box-val">{r.findings || 'Not specified'}</div>
                  </div>

                  {/* Action Rows */}
                  <div className="card-actions-divider" />
                  <div className="card-row-action" onClick={() => handleStartDetails(r)}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
                      </svg>
                      <span>Review Report</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="card-actions-divider" />
                  <div className="card-row-action" onClick={() => handleStartEdit(r)}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <span>Edit Draft Details</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="card-actions-divider" />
                  <div className="card-row-action delete-action" onClick={() => { setReportToDelete(r); setShowDeleteConfirm(true); }}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      <span>Delete Report</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, gridColumn: '1/-1', padding: '20px 0' }}>No draft reports on file.</div>}
            </div>

            {/* SECTION 2: Finalized Reports */}
            <div className="section-label-row" style={{ marginTop: 12 }}>
              <span className="section-label">Finalized Reports</span>
              <span className="badge-count green-badge">{finalized.length}</span>
            </div>

            <div className="reports-cards-grid">
              {finalized.map((r, idx) => (
                <div key={r.id} className="report-card">
                  {/* Card Header */}
                  <div className="report-card-header">
                    <div className="report-card-icon-wrap">
                      <div className="report-icon-bg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                      </div>
                      <div>
                        <div className="report-card-title">Report #{idx + 1}</div>
                        <div className="report-card-date">{new Date(r.finalized_at || r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="dot-status finalized" />
                  </div>

                  {/* Info Box */}
                  <div className="report-patient-box">
                    {/* ECG watermark */}
                    <svg className="report-patient-box-ecg" width="90" height="56" viewBox="0 0 90 56" fill="none">
                      <polyline points="0,35 15,35 20,10 27,50 34,18 40,35 55,35 60,20 67,45 74,28 80,35 90,35" stroke="#e2e8f0" strokeWidth="2.5" fill="none"/>
                    </svg>
                    <div className="patient-box-lbl">PATIENT</div>
                    <div className="patient-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e9cb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <div className="patient-box-val">{r.patient_name || '—'}</div>
                    </div>
                    <div className="patient-box-lbl">DIAGNOSIS</div>
                    <div className="diagnosis-box-val">{r.findings || 'Not specified'}</div>
                  </div>

                  {/* Action Rows */}
                  <div className="card-actions-divider" />
                  <div className="card-row-action" onClick={() => handleStartDetails(r)}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
                      </svg>
                      <span>Review Report</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="card-actions-divider" />
                  <div className="card-row-action" onClick={() => { setActionReport(r); setShowActionsModal(true); }}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      <span>Actions &amp; Distribution</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="card-actions-divider" />
                  <div className="card-row-action delete-action" onClick={() => { setReportToDelete(r); setShowDeleteConfirm(true); }}>
                    <div className="card-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      <span>Delete Report</span>
                    </div>
                    <svg className="card-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))}
              {finalized.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, gridColumn: '1/-1', padding: '20px 0' }}>No finalized reports on file.</div>}
            </div>
          </div>
        )}

        {/* --- VIEW 2: CREATE / EDIT REPORT FORM VIEW --- */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            
            {/* Breadcrumb back */}
            <button className="breadcrumb-btn" onClick={() => setViewMode('list')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {viewMode === 'create' ? 'Create New Report' : 'Edit Report Details'}
            </button>

            {/* Panel 1: Patient & Doctor Information */}
            <div className="panel-box" ref={dropdownRef}>
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Patient &amp; Doctor Information
              </h3>
              
              <div className="fields-grid-2">
                
                {/* Autocomplete Patient Search */}
                <div className="form-field">
                  <label>Patient Full Name</label>
                  <input
                    placeholder="e.g. Tommy"
                    value={patientSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPatientSearch(val);
                      setShowDropdown(true);
                      
                      const match = patients.find(p => (p.name || '').trim().toLowerCase() === val.trim().toLowerCase());
                      if (match) {
                        handlePatientSelect(match);
                      } else {
                        setForm(f => ({ ...f, patientId: '', patientName: val }));
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

                <div className="form-field">
                  <label>Gender</label>
                  <select value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Doctor Name</label>
                  <input
                    placeholder="e.g. Nancy"
                    value={form.doctorName}
                    onChange={(e) => setForm(f => ({ ...f, doctorName: e.target.value }))}
                  />
                </div>

                <div className="form-field">
                  <label>Registration No</label>
                  <input
                    placeholder="e.g. 12185"
                    value={form.registrationNo}
                    onChange={(e) => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                  />
                </div>

              </div>
            </div>

            {/* Panel 2: Clinical Notes */}
            <div className="panel-box">
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Clinical Notes
              </h3>

              <div className="form-field">
                <label>Final Diagnosis</label>
                <textarea
                  placeholder="e.g. No disease"
                  value={form.findings}
                  onChange={(e) => setForm(f => ({ ...f, findings: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label>Clinical Observations</label>
                <textarea
                  placeholder="e.g. Patient is okay"
                  value={form.impression}
                  onChange={(e) => setForm(f => ({ ...f, impression: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label>Treatment Plan</label>
                <textarea
                  placeholder="e.g. Treatment plan will be given later"
                  value={form.treatmentPlan}
                  onChange={(e) => setForm(f => ({ ...f, treatmentPlan: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label>Additional Comments</label>
                <textarea
                  placeholder="e.g. No additional comments"
                  value={form.comments}
                  onChange={(e) => setForm(f => ({ ...f, comments: e.target.value }))}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button className="btn-draft" onClick={() => handleSave(false)} disabled={loading}>
                Save Draft
              </button>
              <button className="btn-finalize" onClick={() => handleSave(true)} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Finalize &amp; Approve
              </button>
            </div>

          </div>
        )}

        {/* --- VIEW 3: REPORT DETAILS VIEW --- */}
        {viewMode === 'details' && selectedReport && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            
            {/* Breadcrumb */}
            <button className="breadcrumb-btn" onClick={() => setViewMode('list')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Report Details
            </button>

            {/* Details Panel Card */}
            <div className="panel-box" style={{ padding: 40 }}>
              <div className="details-avatar-wrap">
                <div className="details-avatar-circle">
                  {(selectedReport.patient_name || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#111c44' }}>
                    {selectedReport.patient_name}
                  </h2>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                    Patient Profile · ID: PT-{String(selectedReport.id).substring(0, 3).toUpperCase()}
                  </div>
                </div>
                <div className={`details-status-badge ${selectedReport.status === 'finalized' ? 'finalized' : ''}`}>
                  {selectedReport.status === 'finalized' ? 'FINALIZED' : 'DRAFTING'}
                </div>
              </div>

              {/* Meta information row */}
              <div className="details-meta-grid">
                <div className="meta-card">
                  <div className="meta-card-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Date Created
                  </div>
                  <div className="meta-card-value">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Doctor
                  </div>
                  <div className="meta-card-value">
                    {selectedReport.doctor_name ? `Dr. ${selectedReport.doctor_name}` : '—'}
                  </div>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Gender
                  </div>
                  <div className="meta-card-value">
                    {selectedReport.patient_gender || 'Male'}
                  </div>
                </div>
              </div>

              {/* Medical notes section container */}
              <div style={{ background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: '14px', padding: '24px 28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
                  Medical Notes
                </div>
                
                <div className="observations-grid">
                  <div className="obs-item">
                    <div className="obs-lbl">Diagnosis</div>
                    <div className="obs-val">{selectedReport.findings || 'no'}</div>
                  </div>
                  <div className="obs-item">
                    <div className="obs-lbl">Treatment Plan</div>
                    <div className="obs-val">{selectedReport.treatment_plan || 'no'}</div>
                  </div>
                  <div className="obs-item">
                    <div className="obs-lbl">Observations</div>
                    <div className="obs-val">{selectedReport.impression || 'no'}</div>
                  </div>
                  <div className="obs-item">
                    <div className="obs-lbl">Comments</div>
                    <div className="obs-val">{selectedReport.comments || 'no'}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="details-actions-row">
              <button className="btn-details-edit" onClick={() => handleStartEdit(selectedReport)}>
                Edit Draft
              </button>
              <button
                className="btn-details-actions"
                onClick={() => { setActionReport(selectedReport); setShowActionsModal(true); }}
              >
                Actions &amp; Distribution
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Action Dialog: Actions & Distribution */}
      {showActionsModal && actionReport && (
        <div className="modal-overlay" onClick={() => setShowActionsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Actions &amp; Distribution</h3>
            <p>Distribute Report #{String(actionReport.id).substring(0, 3).toUpperCase()} to the provider or patient profile.</p>
            
            <div className="modal-btn-stack">
              <button
                className="modal-action-btn teal-btn"
                onClick={() => { handleDownloadPDF(actionReport.id); setShowActionsModal(false); }}
              >
                Download PDF Report
              </button>
              <button
                className="modal-action-btn teal-btn"
                onClick={() => { handleSendToPatient(actionReport.id); setShowActionsModal(false); }}
              >
                Send via Email to Patient
              </button>
              <button className="modal-action-btn outline-btn" onClick={() => setShowActionsModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && reportToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            <h3>Delete Report?</h3>
            <p>Are you sure you want to permanently delete the medical report for <strong>{reportToDelete.patient_name}</strong>?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="modal-action-btn outline-btn" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="modal-action-btn"
                style={{ flex: 1, background: '#ef4444', color: '#ffffff', border: 'none' }}
                onClick={handleDelete}
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
export default Reports;
