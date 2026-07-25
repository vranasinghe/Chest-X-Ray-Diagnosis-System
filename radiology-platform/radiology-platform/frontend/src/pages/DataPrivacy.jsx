import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../api/auth.jsx';
import Layout from '../components/Layout.jsx';

export default function DataPrivacy() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    // Only load patients list if user is doctor or admin (technicians do not access this tab anyway)
    api.patients()
      .then(setPatients)
      .catch((err) => setError(err.message));

    const isAdmin = user?.role === 'admin';
    api.getAudit(isAdmin)
      .then(setAuditLogs)
      .catch((err) => setError(err.message));

    api.getDeletionRequests()
      .then(setDeletionRequests)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [user]);

  async function handleFileRequest(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!patientId || !reason) {
      setError('Please select a patient and provide a reason.');
      return;
    }

    try {
      await api.createDeletionRequest({
        patient_id: patientId,
        reason,
      });
      setMsg('Deletion request submitted.');
      setPatientId('');
      setReason('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolveRequest(id) {
    setError('');
    setMsg('');
    try {
      await api.resolveDeletionRequest(id);
      setMsg('Deletion request marked as resolved.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="h1">Data & Privacy Control</div>

      {error && <div className="card" style={{ color: 'var(--red)', background: 'var(--red-bg)' }}>{error}</div>}
      {msg && <div className="card" style={{ color: 'var(--green)', background: 'var(--green-bg)' }}>{msg}</div>}

      <div className="grid">
        {/* Deletion Request Form - Left Column */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3>Request Patient Data Deletion</h3>
          <form onSubmit={handleFileRequest}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              >
                <option value="" disabled>Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.mrn ? `(${p.mrn})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>Reason for Deletion</label>
              <textarea
                placeholder="Explain why this patient's data must be deleted..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <button className="btn primary" type="submit" style={{ width: '100%' }}>Submit Request</button>
          </form>
        </div>

        {/* Deletion Requests Queue - Right Column */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Deletion Request Queue</h3>
          {deletionRequests.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No deletion requests in queue.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Reason</th>
                  <th>Filed By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deletionRequests.map((dr) => (
                  <tr key={dr.id}>
                    <td>{dr.patient_name}</td>
                    <td>{dr.reason}</td>
                    <td>{dr.requester_name || 'System'}</td>
                    <td>
                      {dr.status === 'resolved' ? (
                        <span className="badge green">Resolved</span>
                      ) : (
                        <span className="badge amber">Pending</span>
                      )}
                    </td>
                    <td>
                      {dr.status === 'pending' ? (
                        <button className="btn" onClick={() => handleResolveRequest(dr.id)}>
                          Mark resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {dr.resolved_at ? new Date(dr.resolved_at).toLocaleDateString() : 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Audit Log ({user?.role === 'admin' ? 'Global Admin View' : 'Your Actions'})</h3>
        {auditLogs.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No audit logs recorded.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_name || 'System / Guest'}</td>
                  <td><code style={{ background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: 4 }}>{log.action}</code></td>
                  <td>{log.entity_type}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{log.entity_id || 'N/A'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.ip || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
