let rawBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim();
if (rawBase.endsWith('/')) rawBase = rawBase.slice(0, -1);
if (!rawBase.endsWith('/api')) rawBase = `${rawBase}/api`;
const BASE = rawBase;

function token() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, isForm } = {}) {
  const headers = {};
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: data }),
  patients: () => request('/patients'),
  addPatient: (p) => request('/patients', { method: 'POST', body: p }),
  updatePatient: (id, p) => request(`/patients/${id}`, { method: 'PATCH', body: p }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),
  scans: () => request('/scans'),
  scan: (id) => request(`/scans/${id}`),
  uploadScan: (form) => request('/scans', { method: 'POST', body: form, isForm: true }),
  createReport: (r) => request('/reports', { method: 'POST', body: r }),
  getReport: (id) => request(`/reports/${id}`),
  updateReport: (id, r) => request(`/reports/${id}`, { method: 'PATCH', body: r }),
  deleteReport: (id) => request(`/reports/${id}`, { method: 'DELETE' }),

  // New/modified methods
  sendAuthorization: (id) => request(`/patients/${id}/send-authorization`, { method: 'POST' }),
  sendOtp: (id) => request(`/patients/${id}/send-otp`, { method: 'POST' }),
  verifyOtp: (id, otp) => request(`/patients/${id}/verify-otp`, { method: 'POST', body: { otp } }),
  compareScan: (id) => request(`/scans/${id}/compare`),
  downloadReportPDF: async (id) => {
    const res = await fetch(`${BASE}/reports/${id}/download`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to download PDF');
    }
    return res.blob();
  },
  sendReportToPatient: (id) => request(`/reports/${id}/send-to-patient`, { method: 'POST' }),

  getAppointments: () => request('/appointments'),
  createAppointment: (app) => request('/appointments', { method: 'POST', body: app }),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}`, { method: 'PATCH', body: { status } }),
  getAudit: (all) => request(all ? '/audit/all' : '/audit'),
  getDeletionRequests: () => request('/deletion-requests'),
  createDeletionRequest: (req) => request('/deletion-requests', { method: 'POST', body: req }),
  resolveDeletionRequest: (id) => request(`/deletion-requests/${id}`, { method: 'PATCH', body: { status: 'resolved' } }),
  getMe: () => request('/users/me'),
  updateMe: (user) => request('/users/me', { method: 'PATCH', body: user }),
};
