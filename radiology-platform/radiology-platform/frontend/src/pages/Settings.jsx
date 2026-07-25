import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../api/auth.jsx';
import Layout from '../components/Layout.jsx';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [scanFinishedEmail, setScanFinishedEmail] = useState(false);
  const [criticalFindingsEmail, setCriticalFindingsEmail] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        setName(data.name || '');
        setEmail(data.email || '');
        
        // Parse preferences
        let prefs = data.preferences;
        if (typeof prefs === 'string') {
          try {
            prefs = JSON.parse(prefs);
          } catch {
            prefs = {};
          }
        }
        prefs = prefs || {};
        
        setScanFinishedEmail(!!prefs.scan_finished_email);
        setCriticalFindingsEmail(!!prefs.critical_findings_email);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      const preferences = {
        scan_finished_email: scanFinishedEmail,
        critical_findings_email: criticalFindingsEmail,
      };

      const updatedUser = await api.updateMe({
        name,
        preferences,
      });

      setMsg('Settings updated successfully.');
      
      // Update local storage and context state
      const newAuthUser = { ...user, name: updatedUser.name };
      localStorage.setItem('user', JSON.stringify(newAuthUser));
      setUser(newAuthUser);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="h1">Settings</div>
        <div className="card">Loading settings...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h1">Settings</div>

      {error && <div className="card" style={{ color: 'var(--red)', background: 'var(--red-bg)' }}>{error}</div>}
      {msg && <div className="card" style={{ color: 'var(--green)', background: 'var(--green-bg)' }}>{msg}</div>}

      <div className="card" style={{ maxWidth: 500 }}>
        <h3>Profile Settings</h3>
        <form onSubmit={save}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>Email Address (Read-only)</label>
            <input
              type="email"
              value={email}
              disabled
              style={{ background: 'var(--surface-alt)', color: 'var(--muted)', cursor: 'not-allowed' }}
            />
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Notification Preferences</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input
              type="checkbox"
              id="scanFinishedEmail"
              checked={scanFinishedEmail}
              onChange={(e) => setScanFinishedEmail(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="scanFinishedEmail" style={{ fontSize: 14, cursor: 'pointer' }}>
              Email me when a scan finishes analysis
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <input
              type="checkbox"
              id="criticalFindingsEmail"
              checked={criticalFindingsEmail}
              onChange={(e) => setCriticalFindingsEmail(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="criticalFindingsEmail" style={{ fontSize: 14, cursor: 'pointer' }}>
              Email me for critical findings
            </label>
          </div>

          <button className="btn primary" type="submit" style={{ width: '100%' }}>Save Changes</button>
        </form>
      </div>
    </Layout>
  );
}
