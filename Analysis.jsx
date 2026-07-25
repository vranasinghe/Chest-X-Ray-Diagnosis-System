import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Layout, { consentBadge } from '../components/Layout.jsx';

export default function Analysis() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [file, setFile] = useState(null);
  const [scan, setScan] = useState(null);
  const [impression, setImpression] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.patients().then((p) => {
      setPatients(p);
      const url = new URL(window.location.href);
      const scanParam = url.searchParams.get('scan');
      if (scanParam) loadScan(scanParam);
    });
  }, []);

  async function loadScan(id) {
    const s = await api.scan(id);
    setScan(s);
    // Poll while the mock model runs.
    if (s.status === 'queued' || s.status === 'processing') {
      setTimeout(() => loadScan(id), 1200);
    }
  }

  async function upload() {
    setMsg('');
    if (!patientId || !file) {
      setMsg('Pick a patient and a file.');
      return;
    }
    const form = new FormData();
    form.append('patient_id', patientId);
    form.append('image', file);
    const created = await api.uploadScan(form);
    setMsg(created.ai_path ? 'Consented — routed to AI queue.' : 'Declined — manual review only.');
    loadScan(created.id);
  }

  async function finalize() {
    await api.createReport({ scan_id: scan.id, impression, finalize: true });
    setMsg('Report finalized.');
    loadScan(scan.id);
  }

  const preds = scan?.predictions || [];
  const selectedConsent = patients.find((p) => p.id === patientId)?.consent_type;

  return (
    <Layout>
      <div className="h1">X-ray analysis</div>

      <div className="card">
        <div className="row">
          <select style={{ flex: 2 }} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
            ))}
          </select>
          <input style={{ flex: 2 }} type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn primary" onClick={upload}>Upload & analyze</button>
        </div>
        {patientId && <div style={{ marginTop: 10 }}>Consent on file: {consentBadge(selectedConsent)}</div>}
        {msg && <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 14 }}>{msg}</div>}
      </div>

      {scan && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 500 }}>{scan.patient_name} · MRN {scan.mrn}</div>
            <span className="badge amber">{scan.status.replace('_', ' ')}</span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="viewer">
                <span style={{ fontSize: 64 }}>🫁</span>
                {scan.status === 'pending_review' && (
                  <div style={{ position: 'absolute', top: 60, left: 70, width: 70, height: 60, borderRadius: '50%', background: 'rgba(226,75,74,0.5)' }} />
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              {scan.status === 'declined_ai' ? (
                <div className="badge red" style={{ padding: 12 }}>
                  AI declined by patient — manual review only.
                </div>
              ) : preds.length === 0 ? (
                <div style={{ color: 'var(--muted)' }}>Running model…</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                    AI findings · {scan.model_version}
                  </div>
                  {preds.map((p) => (
                    <div key={p.label} style={{ marginBottom: 10 }}>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                        <span>{p.label}</span><span>{Math.round(p.score * 100)}%</span>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(p.score * 100)}%` }} /></div>
                    </div>
                  ))}
                </>
              )}

              {(scan.status === 'pending_review' || scan.status === 'declined_ai') && (
                <>
                  <textarea
                    style={{ marginTop: 12 }}
                    rows="2"
                    placeholder="Doctor's impression…"
                    value={impression}
                    onChange={(e) => setImpression(e.target.value)}
                  />
                  <button className="btn primary" style={{ marginTop: 10 }} onClick={finalize}>
                    Confirm & finalize report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
