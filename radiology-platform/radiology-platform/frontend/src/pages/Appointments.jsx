import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Layout from '../components/Layout.jsx';

export default function Appointments() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    api.patients()
      .then(setPatients)
      .catch((err) => setError(err.message));
    api.getAppointments()
      .then(setAppointments)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function schedule(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!patientId || !scheduledAt) {
      setError('Please select a patient and scheduled date/time.');
      return;
    }

    try {
      await api.createAppointment({
        patient_id: patientId,
        scheduled_at: scheduledAt,
        type,
      });
      setMsg('Appointment scheduled successfully.');
      setPatientId('');
      setScheduledAt('');
      setType('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    setError('');
    setMsg('');
    try {
      await api.updateAppointmentStatus(id, status);
      setMsg('Appointment status updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderStatusBadge(status) {
    if (status === 'completed') return <span className="badge green">Completed</span>;
    if (status === 'cancelled') return <span className="badge red">Cancelled</span>;
    return <span className="badge accent">Scheduled</span>;
  }

  return (
    <Layout>
      <div className="h1">Appointments</div>

      {error && <div className="card" style={{ color: 'var(--red)', background: 'var(--red-bg)' }}>{error}</div>}
      {msg && <div className="card" style={{ color: 'var(--green)', background: 'var(--green-bg)' }}>{msg}</div>}

      <div className="card">
        <h3>Schedule New Appointment</h3>
        <form onSubmit={schedule} className="row">
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{ flex: 2, minWidth: 200 }}
            required
          >
            <option value="" disabled>Select Patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.mrn ? `(${p.mrn})` : ''}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            style={{ flex: 1.5, minWidth: 180 }}
            required
          />

          <input
            type="text"
            placeholder="Appointment Type (e.g. Follow-up)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ flex: 2, minWidth: 200 }}
          />

          <button className="btn primary" type="submit">Schedule</button>
        </form>
      </div>

      <div className="card">
        <h3>Upcoming & Past Appointments</h3>
        {appointments.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No appointments scheduled.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Scheduled At</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.patient_name}</td>
                  <td>{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td>{a.type || 'Standard'}</td>
                  <td>{renderStatusBadge(a.status)}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
                      style={{ width: 140 }}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
