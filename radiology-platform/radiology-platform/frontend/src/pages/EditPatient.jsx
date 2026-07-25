import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Layout from '../components/Layout.jsx';

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    notes: '',
    consent: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const patients = await api.patients();
        const found = patients.find((p) => String(p.id) === String(id));
        if (!found) {
          setError('Patient not found.');
          setLoading(false);
          return;
        }
        
        // Format date to YYYY-MM-DD for date input
        let formattedDob = '';
        if (found.dob) {
          const d = new Date(found.dob);
          if (!isNaN(d)) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            formattedDob = `${yyyy}-${mm}-${dd}`;
          }
        }

        setForm({
          name: found.name || '',
          dob: formattedDob,
          gender: found.gender || found.sex || 'Male',
          phone: found.phone || '',
          email: found.email || '',
          address: found.address || '',
          notes: found.notes || '',
          consent: !!found.authorized,
        });
      } catch (err) {
        setError('Failed to load patient data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (!form.dob)         { setError('Date of birth is required.'); return; }
    if (!form.phone.trim()){ setError('Phone number is required.'); return; }
    if (!form.email.trim()){ setError('Email address is required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.updatePatient(id, {
        name: form.name,
        dob: form.dob,
        gender: form.gender,
        sex: form.gender, // set both to be safe
        phone: form.phone,
        email: form.email,
        address: form.address,
        notes: form.notes,
        authorized: form.consent,
      });
      navigate(`/patients/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update patient profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <style>{`
        .reg-page {
          min-height: 100%;
          background: #f0f2f8;
          padding: 24px 0;
        }
        .reg-container {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 40px;
          box-shadow: 0 4px 24px rgba(17,28,68,0.08);
        }

        /* Back button */
        .reg-back-btn {
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
          text-decoration: none;
        }
        .reg-back-btn:hover { opacity: 0.8; }

        /* Title */
        .reg-title {
          font-size: 24px;
          font-weight: 800;
          color: #111c44;
          margin: 0 0 6px;
        }
        .reg-subtitle {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0 0 28px;
        }

        /* Section cards */
        .reg-section {
          background: #f8fafc;
          border: 1px solid #e8edf5;
          border-radius: 12px;
          padding: 22px 24px;
          margin-bottom: 18px;
        }
        .reg-section-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        /* Field grid */
        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .reg-sections-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }
        .reg-sections-row .reg-section {
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          .reg-grid-2, .reg-sections-row { grid-template-columns: 1fr; }
        }

        /* Form fields */
        .reg-field { display: flex; flex-direction: column; gap: 6px; }
        .reg-field label {
          font-size: 12.5px;
          color: #64748b;
          font-weight: 500;
        }
        .reg-field label span { color: #ef4444; margin-left: 2px; }
        .reg-field input,
        .reg-field select,
        .reg-field textarea {
          padding: 10px 13px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          font-family: inherit;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .reg-field input::placeholder,
        .reg-field textarea::placeholder { color: #c0cdd9; }
        .reg-field input:focus,
        .reg-field select:focus,
        .reg-field textarea:focus {
          border-color: #1abfb2;
        }
        .reg-field textarea {
          resize: vertical;
          min-height: 72px;
        }
        .reg-field select {
          appearance: auto;
          cursor: pointer;
        }

        /* Consent toggle section */
        .reg-consent-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .reg-consent-desc {
          font-size: 13px;
          color: #64748b;
        }
        .reg-consent-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .reg-consent-label {
          font-size: 13px;
          font-weight: 700;
        }
        .reg-consent-label.pending-lbl { color: #ef4444; }
        .reg-consent-label.granted-lbl { color: #1abfb2; }

        /* Toggle switch */
        .toggle-switch {
          position: relative;
          width: 46px;
          height: 26px;
          cursor: pointer;
        }
        .toggle-switch input { display: none; }
        .toggle-track {
          position: absolute;
          inset: 0;
          background: #e2e8f0;
          border-radius: 13px;
          transition: background 0.25s;
        }
        .toggle-switch input:checked + .toggle-track { background: #1abfb2; }
        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          transition: left 0.25s;
        }
        .toggle-switch input:checked ~ .toggle-thumb { left: 23px; }

        /* Error message */
        .reg-error {
          background: #fee2e2;
          color: #c0392b;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 18px;
        }

        /* Action buttons */
        .reg-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 28px;
        }
        .btn-reg-clear {
          padding: 14px;
          background: #111c44;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-reg-clear:hover { opacity: 0.85; }
        .btn-reg-submit {
          padding: 14px;
          background: #1abfb2;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
        }
        .btn-reg-submit:hover { opacity: 0.88; }
        .btn-reg-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="reg-page">
        <div className="reg-container">

          {/* Back button */}
          <button className="reg-back-btn" onClick={() => navigate(`/patients/${id}`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Profile
          </button>

          {/* Header */}
          <h1 className="reg-title">Edit Patient Profile</h1>
          <p className="reg-subtitle">Update patient information and consent status.</p>

          {/* Error */}
          {error && <div className="reg-error">{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading profile details…</div>
          ) : (
            <>
              {/* BASIC INFORMATION */}
              <div className="reg-section">
                <div className="reg-section-label">Basic Information</div>
                <div className="reg-grid-2" style={{ marginBottom: 18 }}>
                  <div className="reg-field">
                    <label>Full name <span>*</span></label>
                    <input
                      placeholder="e.g. Nadeesha Fernando"
                      value={form.name}
                      onChange={set('name')}
                    />
                  </div>
                  <div className="reg-field">
                    <label>Date of birth <span>*</span></label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={set('dob')}
                    />
                  </div>
                </div>
                <div className="reg-grid-2">
                  <div className="reg-field">
                    <label>Gender</label>
                    <select value={form.gender} onChange={set('gender')}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="reg-field">
                    <label>Phone <span>*</span></label>
                    <input
                      placeholder="e.g. 0771234567"
                      value={form.phone}
                      onChange={set('phone')}
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT + ADDRESS side by side */}
              <div className="reg-sections-row">
                <div className="reg-section">
                  <div className="reg-section-label">Contact</div>
                  <div className="reg-field">
                    <label>Email <span>*</span></label>
                    <input
                      type="email"
                      placeholder="name@email.com"
                      value={form.email}
                      onChange={set('email')}
                    />
                  </div>
                </div>
                <div className="reg-section">
                  <div className="reg-section-label">Address</div>
                  <div className="reg-field">
                    <label>Home</label>
                    <input
                      placeholder="e.g. Homagama"
                      value={form.address}
                      onChange={set('address')}
                    />
                  </div>
                </div>
              </div>

              {/* MEDICAL NOTES */}
              <div className="reg-section">
                <div className="reg-section-label">Medical Notes</div>
                <div className="reg-field">
                  <textarea
                    placeholder="Brief intake summary"
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </div>
              </div>

              {/* CONSENT STATUS */}
              <div className="reg-section">
                <div className="reg-section-label">Consent Status</div>
                <div className="reg-consent-row">
                  <div className="reg-consent-desc">
                    Grant authorization now, or leave pending for later review.
                  </div>
                  <div className="reg-consent-right">
                    <span className={`reg-consent-label ${form.consent ? 'granted-lbl' : 'pending-lbl'}`}>
                      {form.consent ? 'Granted' : 'Pending'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                      />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="reg-actions">
                <button className="btn-reg-clear" onClick={() => navigate(`/patients/${id}`)}>Cancel</button>
                <button className="btn-reg-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Saving changes…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
