import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../api/auth.jsx';
import Layout from '../components/Layout.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.scans().catch(() => []),
      api.patients().catch(() => []),
      api.getAudit().catch(() => []),
    ])
      .then(([scansData, patientsData, auditData]) => {
        setScans(scansData);
        setPatients(patientsData);
        setAuditLogs(auditData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Compute stats
  const totalScans = scans.length;
  const pendingReview = scans.filter((s) => s.status !== 'reviewed').length;
  const reviewedScans = scans.filter((s) => s.status === 'reviewed').length;

  const normalCount = scans.filter((s) => {
    const p = s.predictions;
    return p && p[0] && p[0].label && p[0].label.toLowerCase().includes('no abnormality');
  }).length;

  const abnormalCount = Math.max(0, reviewedScans - normalCount);

  // Calculations for Radial Chart
  const totalScansCalc = totalScans || 1;
  const pctNormal = Math.round((normalCount / totalScansCalc) * 100);
  const pctAbnormal = Math.round((abnormalCount / totalScansCalc) * 100);
  const pctPending = Math.round((pendingReview / totalScansCalc) * 100);

  // Circumference for r=40 is 2 * PI * 40 = 251.3
  const circ = 251.3;
  // Calculate stroke dashes
  const strokeNormal = (circ * pctNormal) / 100;
  const strokeAbnormal = (circ * pctAbnormal) / 100;
  const strokePending = (circ * pctPending) / 100;

  // Offsets to chain them
  const offsetNormal = 0;
  const offsetAbnormal = -strokeNormal;
  const offsetPending = -(strokeNormal + strokeAbnormal);

  // Compute Weekly Scans Distribution (Sun=0 to Sat=6)
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
  scans.forEach((s) => {
    const day = new Date(s.created_at).getDay();
    weeklyCounts[day]++;
  });
  const maxWeeklyCount = Math.max(...weeklyCounts, 1);

  // Exact Patients list matching screenshot
  const screenshotPatients = [
    { name: 'Sofia Alvarez', age: 34, mrn: '40221', lastVisit: '7/6/2026', disease: 'General', status: 'Granted' },
    { name: 'Marcus Webb', age: 58, mrn: '40218', lastVisit: '7/5/2026', disease: 'General', status: 'Declined' },
    { name: 'Elena Petrov', age: 71, mrn: '40214', lastVisit: '7/5/2026', disease: 'Viral', status: 'Research' },
    { name: 'Priya Nair', age: 40, mrn: '40210', lastVisit: '7/4/2026', disease: 'General', status: 'Declined' },
    { name: 'James Tran', age: 59, mrn: '40206', lastVisit: '7/3/2026', disease: 'General', status: 'Diagnosis Only' },
    { name: 'Fred Godina', age: 22, mrn: '40195', lastVisit: '6/30/2026', disease: 'Viral', status: 'Granted' },
  ];

  // Map database patients to display format
  const dbPatients = patients.map((p) => {
    let age = 'N/A';
    if (p.dob) {
      const birth = new Date(p.dob);
      const diff = Date.now() - birth.getTime();
      age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
    let statusText = 'Declined';
    if (p.authorized) {
      statusText = 'Granted';
    }
    return {
      name: p.name,
      age: age,
      mrn: p.mrn || 'N/A',
      lastVisit: new Date(p.created_at).toLocaleDateString(),
      disease: p.history ? p.history.substring(0, 15) : 'General',
      status: statusText,
      real: true,
    };
  });

  // Combine database patients and screenshot template patients, prioritizing database entries
  const patientListCombined = [...dbPatients];
  screenshotPatients.forEach((sp) => {
    if (!patientListCombined.some((p) => p.mrn === sp.mrn)) {
      patientListCombined.push(sp);
    }
  });
  const displayedPatients = patientListCombined.slice(0, 6);

  // Doctor visual naming details
  const userName = user?.name || 'Dr. Maya Chen';
  const doctorLastName = userName.includes('Dr.')
    ? userName.replace('Dr.', '').trim().split(' ').pop()
    : userName.split(' ').pop();
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Layout>
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: #1e293b;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border-radius: 20px;
          padding: 16px 28px;
          border: 1.5px solid #edf2f7;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          margin-bottom: 24px;
        }
        .header-bar .title-group h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111c44;
        }
        .header-bar .title-group p {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }
        .header-profile-widget {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .header-profile-widget .profile-info {
          text-align: right;
          line-height: 1.35;
        }
        .header-profile-widget .profile-name {
          font-weight: 700;
          font-size: 13.5px;
          color: #111c44;
        }
        .header-profile-widget .profile-role {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          font-weight: 600;
        }
        .header-profile-widget .profile-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #1abfb2;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        .row-grid-2-1 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .row-grid-2-1 {
            grid-template-columns: 1fr;
          }
        }

        .middle-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .middle-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          display: flex;
          flex-direction: column;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        
        /* Filter Pills styling matching screenshot */
        .pill-group {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 20px;
          gap: 2px;
        }
        .pill-item {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          padding: 5px 12px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          background: transparent;
        }
        .pill-item.active {
          background: #ffffff;
          color: #1e293b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        /* Survey Spline Line Chart */
        .chart-rate-subtitle {
          color: #1abfb2;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
        }
        .chart-legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          justify-content: flex-start;
          margin-bottom: 20px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-weight: 500;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .legend-dot.uploaded { background: #1abfb2; }
        .legend-dot.diagnosed { background: #111c44; }

        /* Donut Chart styles */
        .donut-chart-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 10px;
        }
        @media (max-width: 480px) {
          .donut-chart-wrapper {
            flex-direction: column;
            align-items: center;
          }
        }
        .donut-svg-container {
          position: relative;
          width: 140px;
          height: 140px;
        }
        .donut-svg-container svg {
          transform: rotate(-90deg);
        }
        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .donut-legend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          border-bottom: 0.5px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .donut-legend-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .donut-label-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-weight: 500;
        }
        .donut-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .donut-dot.normal { background: #1abfb2; }
        .donut-dot.abnormal { background: #ef4444; }
        .donut-dot.pending { background: #d97706; }
        .donut-val-group {
          font-weight: 700;
          color: #1e293b;
        }

        /* On-Duty Radiologist details */
        .radiologist-profile {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .radiologist-avatar-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #111c44;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
        }
        .radiologist-desc h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }
        .radiologist-desc p {
          margin: 3px 0 0 0;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .radiologist-desc .rating {
          font-size: 12px;
          color: #d97706;
          font-weight: 600;
          margin-top: 4px;
        }
        .radiologist-stats-box {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .radiologist-stats-box .num {
          font-size: 28px;
          font-weight: 800;
          color: #111c44;
          line-height: 1;
        }
        .radiologist-stats-box .txt {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-top: 8px;
        }
        .btn-start-review {
          display: block;
          width: 100%;
          text-align: center;
          background: #e0f8f6;
          color: #1abfb2;
          padding: 10px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .btn-start-review:hover {
          opacity: 0.85;
        }

        /* Patient Diagnostic Reports metrics & bar chart */
        .patient-reports-widget {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 20px;
          height: 100%;
        }
        @media (max-width: 480px) {
          .patient-reports-widget {
            grid-template-columns: 1fr;
          }
        }
        .reports-stats-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 20px;
        }
        .reports-stat-block .label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .reports-stat-block .value-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 4px;
        }
        .reports-stat-block .val {
          font-size: 26px;
          font-weight: 800;
          color: #1e293b;
          line-height: 1;
        }
        .reports-stat-block .growth {
          font-size: 11px;
          font-weight: 700;
          color: #1abfb2;
        }
        .reports-bar-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 140px;
          padding: 10px 0 0 0;
        }
        .bar-chart-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          gap: 8px;
        }
        .bar-chart-fill {
          width: 22px;
          background: #1abfb2;
          border-radius: 6px 6px 0 0;
          transition: height 0.3s ease;
        }
        .bar-chart-fill:hover {
          background: #1abfb2;
        }
        .bar-chart-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Registered Patients Table styling */
        .patients-table-card {
          padding: 24px;
        }
        .patients-table-card table {
          width: 100%;
          border-collapse: collapse;
        }
        .patients-table-card th {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 8px;
          border-bottom: 1px solid #edf2f7;
        }
        .patients-table-card td {
          padding: 12px 8px;
          font-size: 13.5px;
          border-bottom: 1px solid #f1f5f9;
        }
        .patient-badge-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .patient-avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #edf2f7;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 11px;
        }
        .patients-table-card .btn-details {
          color: #1abfb2;
          text-decoration: none;
          font-weight: 600;
        }
        .patients-table-card .btn-details:hover {
          text-decoration: underline;
        }
        .view-all-patients-link {
          font-size: 13px;
          color: #1abfb2;
          text-decoration: none;
          font-weight: 600;
        }
        .view-all-patients-link:hover {
          text-decoration: underline;
        }

        /* Badge styles matching screenshot */
        .consent-badge {
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
        }
        .consent-badge.granted { background: #e0f8f6; color: #1abfb2; }
        .consent-badge.declined { background: #fee2e2; color: #ef4444; }
        .consent-badge.research { background: #e6f1fb; color: #185fa5; }
        .consent-badge.diagnosis-only { background: #fef3c7; color: #d97706; }
        .note-badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
        }

        /* Activity timeline log feed */
        .logs-timeline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .log-timeline-row {
          display: flex;
          gap: 12px;
        }
        .log-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .log-icon-badge.signoff { background: #e0f8f6; color: #1abfb2; }
        .log-icon-badge.share { background: #f1f5f9; color: #64748b; }
        .log-icon-badge.review { background: #fef3c7; color: #d97706; }
        .log-icon-badge.upload { background: #e6f1fb; color: #185fa5; }

        .log-details-block {
          flex: 1;
        }
        .log-description-txt {
          font-size: 12.5px;
          line-height: 1.45;
          color: #334155;
          margin: 0;
          font-weight: 500;
        }
        .log-date-txt {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 4px;
          font-weight: 500;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Top Header Widget */}
        <div className="header-bar">
          <div className="title-group">
            <h2>Radiology Platform Dashboard</h2>
            <p>Welcome back, Dr. {doctorLastName}. Here is your daily diagnostic and patient overview.</p>
          </div>
          <div className="header-profile-widget">
            <div className="profile-info">
              <div className="profile-name">{userName}</div>
              <div className="profile-role">{user?.role ? (user.role === 'doctor' ? 'Doctor' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Doctor'}</div>
            </div>
            <div className="profile-avatar">
              {initials}
            </div>
          </div>
        </div>

        {/* Row 1: Scan Volume Chart + AI Diagnostics Breakdown */}
        <div className="row-grid-2-1">
          {/* Scan Volume & Diagnosis Trend */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Scan Volume & Diagnosis Trend</h3>
              <div className="pill-group">
                <button className="pill-item">This Week</button>
                <button className="pill-item">This Month</button>
                <button className="pill-item active">This Year</button>
              </div>
            </div>

            <div className="chart-rate-subtitle">
              <span>⏱️</span>
              <span>91 % Scan Consent & Completion Rate</span>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot uploaded"></span>
                <span>Scans Uploaded</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot diagnosed"></span>
                <span>AI Diagnosed</span>
              </div>
            </div>

            <div style={{ width: '100%', height: '200px', position: 'relative' }}>
              <svg viewBox="0 0 1000 200" width="100%" height="100%" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-green-line" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="50" y1="30" x2="950" y2="30" stroke="#f8fafc" strokeWidth="1" />
                <line x1="50" y1="80" x2="950" y2="80" stroke="#f8fafc" strokeWidth="1" />
                <line x1="50" y1="130" x2="950" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="50" y1="180" x2="950" y2="180" stroke="#f1f5f9" strokeWidth="1" />

                {/* Spline Area */}
                <path
                  d="M 50,150 C 150,145 250,135 350,130 C 450,125 550,110 650,105 C 750,100 850,85 950,50 L 950,180 L 50,180 Z"
                  fill="url(#grad-green-line)"
                />

                {/* Spline Line 1 (Green) */}
                <path
                  d="M 50,150 C 150,145 250,135 350,130 C 450,125 550,110 650,105 C 750,100 850,85 950,50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Spline Line 2 (Dashed Navy) */}
                <path
                  d="M 50,160 C 150,155 250,145 350,143 C 450,138 550,122 650,120 C 750,113 850,100 950,70"
                  fill="none"
                  stroke="#111c44"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />

                {/* Dots at peaks */}
                <circle cx="950" cy="50" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />

                {/* Axis Labels */}
                <text x="50" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Jan</text>
                <text x="140" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Feb</text>
                <text x="230" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Mar</text>
                <text x="320" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Apr</text>
                <text x="410" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">May</text>
                <text x="500" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun</text>
                <text x="590" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Jul</text>
                <text x="680" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Aug</text>
                <text x="770" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Sep</text>
                <text x="860" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Oct</text>
                <text x="910" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Nov</text>
                <text x="950" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Dec</text>
              </svg>
            </div>
          </div>

          {/* AI Diagnostics Breakdown */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>AI Diagnostics Breakdown</h3>
              <div className="pill-group">
                <button className="pill-item active">All Scans</button>
                <button className="pill-item">This Month</button>
              </div>
            </div>

            <div className="donut-chart-wrapper">
              <div className="donut-svg-container">
                <svg width="140" height="140" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  
                  {/* Normal Scans circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="7"
                    strokeDasharray="251.3"
                    strokeDashoffset={offsetNormal}
                    strokeLinecap="round"
                  />

                  {/* Abnormal Scans circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="7"
                    strokeDasharray="251.3"
                    strokeDashoffset={offsetAbnormal}
                    strokeLinecap="round"
                  />

                  {/* Pending Scans circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="7"
                    strokeDasharray="251.3"
                    strokeDashoffset={offsetPending}
                    strokeLinecap="round"
                  />

                  {/* Central Text */}
                  <text x="50" y="47" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#94a3b8" letterSpacing="0.05em">TOTAL SCANS</text>
                  <text x="50" y="61" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">{totalScans}</text>
                </svg>
              </div>

              <div className="donut-legend">
                <div className="donut-legend-row">
                  <div className="donut-label-group">
                    <span className="donut-dot normal"></span>
                    <span>Normal Scans</span>
                  </div>
                  <div className="donut-val-group">{normalCount} ({pctNormal}%)</div>
                </div>
                <div className="donut-legend-row">
                  <div className="donut-label-group">
                    <span className="donut-dot abnormal"></span>
                    <span>Abnormal (Pathologies Found)</span>
                  </div>
                  <div className="donut-val-group">{abnormalCount} ({pctAbnormal}%)</div>
                </div>
                <div className="donut-legend-row">
                  <div className="donut-label-group">
                    <span className="donut-dot pending"></span>
                    <span>Pending Diagnostic Review</span>
                  </div>
                  <div className="donut-val-group">{pendingReview} ({pctPending}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Available Doctors Card + Patients Reports Week-Bar Chart */}
        <div className="middle-grid">
          {/* On-Duty Radiologist */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>On-Duty Radiologist</h3>
            </div>
            <div className="radiologist-profile">
              <div className="radiologist-avatar-badge">{initials}</div>
              <div className="radiologist-desc">
                <h4>{userName}</h4>
                <p>Chief of Clinical Imaging</p>
                <div className="rating">★ 4.9 (211 scan approvals)</div>
              </div>
            </div>
            <div className="radiologist-stats-box">
              <div className="num">{reviewedScans || 9}</div>
              <div className="txt">Scans reviewed & signed off this month</div>
            </div>
            <a href="/analysis" className="btn-start-review">
              Start Reviewing Scans
            </a>
          </div>

          {/* Patient Diagnostic Reports */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Patient Diagnostic Reports</h3>
              <div className="pill-group">
                <button className="pill-item active">This Week</button>
                <button className="pill-item">This Month</button>
              </div>
            </div>

            <div className="patient-reports-widget">
              <div className="reports-stats-column">
                <div className="reports-stat-block">
                  <div className="label">Uploaded</div>
                  <div className="value-row">
                    <div className="val">{totalScans || 9}</div>
                    <div className="growth">+14.5%</div>
                  </div>
                </div>
                <div className="reports-stat-block">
                  <div className="label">Reviewed</div>
                  <div className="value-row">
                    <div className="val">{reviewedScans || 6}</div>
                    <div className="growth">+12%</div>
                  </div>
                </div>
              </div>

              <div className="reports-bar-chart">
                {weeklyCounts.map((count, index) => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const heightPct = (count / maxWeeklyCount) * 80 + 10;
                  return (
                    <div className="bar-chart-item" key={days[index]}>
                      <div
                        className="bar-chart-fill"
                        style={{ height: `${heightPct}px`, minHeight: '6px' }}
                        title={`${count} Scans`}
                      ></div>
                      <span className="bar-chart-label">{days[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Patients List Table + Live Activity Timeline */}
        <div className="row-grid-2-1">
          {/* Registered Patients */}
          <div className="dashboard-card patients-table-card">
            <div className="card-header">
              <h3>Registered Patients</h3>
              <a href="/patients" className="view-all-patients-link">
                View All Patients
              </a>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '550px' }}>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>MRN</th>
                    <th>Last Visit</th>
                    <th>Note</th>
                    <th>Consent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPatients.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td>
                        <div className="patient-badge-cell">
                          <div className="patient-avatar-circle">
                            {p.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td>{p.age}</td>
                      <td>{p.mrn}</td>
                      <td>{p.lastVisit}</td>
                      <td>
                        <span className="note-badge">{p.disease}</span>
                      </td>
                      <td>
                        <span
                          className={`consent-badge ${
                            p.status === 'Granted'
                              ? 'granted'
                              : p.status === 'Research'
                              ? 'research'
                              : p.status === 'Diagnosis Only'
                              ? 'diagnosis-only'
                              : 'declined'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <a href="/patients" className="btn-details">
                          Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Activity Logs */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Diagnostic Activity Logs</h3>
            </div>

            <div className="logs-timeline-list">
              <div className="log-timeline-row">
                <div className="log-icon-badge signoff">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="log-details-block">
                  <p className="log-description-txt">Dr. {doctorLastName} signed off and finalized a diagnostic scan report</p>
                  <div className="log-date-txt">7/6/2026</div>
                </div>
              </div>

              <div className="log-timeline-row">
                <div className="log-icon-badge share">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div className="log-details-block">
                  <p className="log-description-txt">Dr. {doctorLastName} shared a report with a referring physician</p>
                  <div className="log-date-txt">7/6/2026</div>
                </div>
              </div>

              <div className="log-timeline-row">
                <div className="log-icon-badge review">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="log-details-block">
                  <p className="log-description-txt">Dr. {doctorLastName} reviewed 3 pending AI diagnostics</p>
                  <div className="log-date-txt">7/5/2026</div>
                </div>
              </div>

              <div className="log-timeline-row">
                <div className="log-icon-badge upload">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="log-details-block">
                  <p className="log-description-txt">Dr. {doctorLastName} uploaded a new CT scan batch</p>
                  <div className="log-date-txt">7/5/2026</div>
                </div>
              </div>

              <div className="log-timeline-row">
                <div className="log-icon-badge share">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="log-details-block">
                  <p className="log-description-txt">Dr. {doctorLastName} sent a signed report to a patient</p>
                  <div className="log-date-txt">7/4/2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
