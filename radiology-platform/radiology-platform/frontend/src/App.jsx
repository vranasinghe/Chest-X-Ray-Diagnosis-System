import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/auth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Analysis from './pages/Analysis.jsx';
import { Reports } from './pages/Reports.jsx';
import Appointments from './pages/Appointments.jsx';
import DataPrivacy from './pages/DataPrivacy.jsx';
import Settings from './pages/Settings.jsx';
import AddPatient from './pages/AddPatient.jsx';
import PatientProfile from './pages/PatientProfile.jsx';
import VerifyPatient from './pages/VerifyPatient.jsx';
import EditPatient from './pages/EditPatient.jsx';
import Comparison from './pages/Comparison.jsx';
import Landing from './pages/Landing.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function HomeRoute() {
  const { user } = useAuth();
  return user ? <Protected><Dashboard /></Protected> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/patients" element={<Protected><Patients /></Protected>} />
          <Route path="/analysis" element={<Protected><Analysis /></Protected>} />
          <Route path="/comparison" element={<Protected><Comparison /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/appointments" element={<Protected><Appointments /></Protected>} />
          <Route path="/data-privacy" element={<Protected><DataPrivacy /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/patients/add" element={<Protected><AddPatient /></Protected>} />
          <Route path="/patients/:id" element={<Protected><PatientProfile /></Protected>} />
          <Route path="/patients/:id/verify" element={<Protected><VerifyPatient /></Protected>} />
          <Route path="/patients/:id/edit" element={<Protected><EditPatient /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
