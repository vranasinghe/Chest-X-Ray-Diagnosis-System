import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/auth.jsx';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    department: '',
    doctor: '',
    name: '',
    date: '',
    phone: '',
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [activeCategory, setActiveCategory] = useState('All');

  // Trigger Toast Helper
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.department || !bookingForm.doctor || !bookingForm.name || !bookingForm.date || !bookingForm.phone) {
      showToast('Please fill in all booking fields.', 'error');
      return;
    }
    showToast(`Appointment requested successfully for ${bookingForm.name}! We will call you shortly.`, 'success');
    setBookingForm({ department: '', doctor: '', name: '', date: '', phone: '' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast(`Successfully subscribed ${newsletterEmail} to our newsletter!`, 'success');
    setNewsletterEmail('');
  };

  const categories = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'];

  return (
    <div className="landing-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`landing-toast ${toast.type}`}>
          <div className="toast-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {toast.type === 'success' ? (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
              {toast.type === 'success' ? <polyline points="22 4 12 14.01 9 11.01" /> : <line x1="12" y1="8" x2="12" y2="12" />}
              {toast.type === 'error' && <line x1="12" y1="16" x2="12.01" y2="16" />}
            </svg>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* Theme Variables */
        :root {
          --teal-primary: #1abfb2;
          --teal-hover: #17a89d;
          --blue-dark: #111c44;
          --blue-hover: #0d1637;
          --gray-bg: #f8fafc;
          --text-main: #334155;
          --text-dark: #0f172a;
          --font-outfit: 'Outfit', sans-serif;
          --font-jakarta: 'Plus Jakarta Sans', sans-serif;
          --shadow-premium: 0 12px 40px rgba(17, 28, 68, 0.05);
          --transition-smooth: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .landing-container {
          font-family: var(--font-jakarta);
          color: var(--text-main);
          background: #ffffff;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        /* Toast Styles */
        .landing-toast {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 9999;
          animation: slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .landing-toast.success { border-left: 6px solid #1abfb2; }
        .landing-toast.error { border-left: 6px solid #ef4444; }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          font-weight: 600;
          font-size: 15px;
        }
        .landing-toast.success .toast-content svg { color: #1abfb2; }
        .landing-toast.error .toast-content svg { color: #ef4444; }

        @keyframes slideInRight {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }

        /* --- Header & Navbar --- */
        .landing-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1.5px solid #edf2f7;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.01);
          transition: var(--transition-smooth);
        }
        .navbar-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-outfit);
          font-size: 24px;
          font-weight: 800;
          color: var(--blue-dark);
          text-decoration: none;
        }
        .nav-logo-pulse {
          width: 32px;
          height: 32px;
          background: var(--teal-primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        }
        .nav-logo-pulse::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--teal-primary);
          border-radius: 8px;
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-links a {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          text-decoration: none;
          position: relative;
          padding: 8px 0;
          transition: var(--transition-smooth);
        }
        .nav-links a:hover {
          color: var(--teal-primary);
        }
        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2.5px;
          background: var(--teal-primary);
          transition: var(--transition-smooth);
        }
        .nav-links a:hover::after {
          width: 100%;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-portal {
          padding: 10px 20px;
          background: #ffffff;
          color: var(--teal-primary);
          border: 1.5px solid var(--teal-primary);
          border-radius: 30px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-portal:hover {
          background: #e0f8f6;
          transform: translateY(-2px);
        }
        .btn-book-nav {
          padding: 10px 22px;
          background: var(--teal-primary);
          color: #ffffff;
          border: none;
          border-radius: 30px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
          box-shadow: 0 4px 14px rgba(26, 191, 178, 0.2);
        }
        .btn-book-nav:hover {
          background: var(--teal-hover);
          transform: translateY(-2px);
        }

        /* --- Hero Section --- */
        .hero-section {
          position: relative;
          padding: 80px 0 160px;
          background: radial-gradient(circle at 80% 20%, #e0f8f6 0%, #ffffff 60%);
        }
        .hero-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .hero-left h1 {
          font-family: var(--font-outfit);
          font-size: 56px;
          font-weight: 800;
          line-height: 1.15;
          color: var(--blue-dark);
          margin-bottom: 20px;
        }
        .hero-left h1 span {
          color: var(--teal-primary);
        }
        .hero-left p {
          font-size: 18px;
          line-height: 1.6;
          color: #64748b;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 40px;
        }
        .category-pill {
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          background: #ffffff;
          color: var(--text-main);
          border: 1.5px solid #e2e8f0;
          transition: var(--transition-smooth);
        }
        .category-pill:hover {
          border-color: var(--teal-primary);
          color: var(--teal-primary);
        }
        .category-pill.active {
          background: var(--teal-primary);
          color: #ffffff;
          border-color: var(--teal-primary);
          box-shadow: 0 4px 14px rgba(26, 191, 178, 0.2);
        }
        .hero-right {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .hero-image-container {
          position: relative;
          width: 100%;
          max-width: 460px;
          height: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(17, 28, 68, 0.1);
          background: linear-gradient(135deg, #e0f8f6 0%, #dbeafe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-image-fallback {
          text-align: center;
          padding: 40px;
        }
        .hero-image-fallback svg {
          color: var(--teal-primary);
          margin-bottom: 16px;
          animation: floatAnimation 3s ease-in-out infinite;
        }
        .hero-right-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
        }
        .floating-badge {
          position: absolute;
          bottom: 30px;
          left: -20px;
          background: #ffffff;
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 12px;
          animation: floatAnimation 4s ease-in-out infinite;
        }
        .floating-badge-icon {
          width: 40px;
          height: 40px;
          background: #e0f8f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--teal-primary);
        }
        .floating-badge-text div:first-child {
          font-weight: 800;
          color: var(--blue-dark);
        }
        .floating-badge-text div:last-child {
          font-size: 12px;
          color: #64748b;
        }

        @keyframes floatAnimation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* --- Hero Info Overlay Cards --- */
        .hero-cards-overlay {
          max-width: 1280px;
          margin: -100px auto 0;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .overlay-card {
          border-radius: 20px;
          padding: 36px;
          color: #ffffff;
          box-shadow: 0 12px 40px rgba(17, 28, 68, 0.08);
          transition: var(--transition-smooth);
        }
        .overlay-card:hover {
          transform: translateY(-8px);
        }
        .overlay-card.teal { background: linear-gradient(135deg, #1abfb2 0%, #159c91 100%); }
        .overlay-card.blue { background: linear-gradient(135deg, #2b6cb0 0%, #22548a 100%); }
        .overlay-card.dark { background: linear-gradient(135deg, #111c44 0%, #0d1637 100%); }

        .overlay-card h3 {
          font-family: var(--font-outfit);
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 12px;
        }
        .overlay-card p {
          font-size: 14.5px;
          opacity: 0.9;
          line-height: 1.5;
          margin: 0 0 24px;
        }
        .overlay-phone {
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .overlay-phone-pulse {
          width: 10px;
          height: 10px;
          background: #ffffff;
          border-radius: 50%;
          animation: pulseScale 1.5s infinite;
        }
        @keyframes pulseScale {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .overlay-hours-table {
          width: 100%;
          font-size: 13.5px;
        }
        .overlay-hours-table td {
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .overlay-hours-table tr:last-child td { border-bottom: none; }
        .overlay-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-weight: 700;
          text-decoration: none;
          font-size: 14px;
          border-bottom: 2px solid white;
          padding-bottom: 2px;
          transition: var(--transition-smooth);
        }
        .overlay-link-btn:hover {
          gap: 12px;
          opacity: 0.9;
        }

        /* --- About Section --- */
        .about-section {
          padding: 120px 0;
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .about-left-image {
          position: relative;
        }
        .about-img-box {
          border-radius: 24px;
          overflow: hidden;
          height: 480px;
          box-shadow: var(--shadow-premium);
          background: linear-gradient(135deg, #e0f8f6 0%, #eff6ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .about-experience-badge {
          position: absolute;
          top: -24px;
          right: -24px;
          background: var(--blue-dark);
          color: white;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(17, 28, 68, 0.15);
        }
        .about-experience-badge div:first-child {
          font-family: var(--font-outfit);
          font-size: 32px;
          font-weight: 800;
          color: var(--teal-primary);
        }
        .about-experience-badge div:last-child {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .about-right h2 {
          font-family: var(--font-outfit);
          font-size: 40px;
          font-weight: 800;
          color: var(--blue-dark);
          margin-bottom: 20px;
        }
        .about-divider {
          width: 60px;
          height: 4px;
          background: var(--teal-primary);
          margin-bottom: 28px;
        }
        .about-right p {
          font-size: 16px;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: 32px;
        }
        .about-bullets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 36px;
        }
        .about-bullet-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .about-bullet-item svg {
          color: var(--teal-primary);
        }
        .btn-about-more {
          padding: 12px 28px;
          background: var(--blue-dark);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-about-more:hover {
          background: var(--blue-hover);
          transform: translateY(-2px);
        }

        /* --- Services Section --- */
        .services-section {
          padding: 100px 0;
          background: #f8fafc;
        }
        .services-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .section-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 60px;
        }
        .section-header h2 {
          font-family: var(--font-outfit);
          font-size: 40px;
          font-weight: 800;
          color: var(--blue-dark);
          margin-bottom: 16px;
        }
        .section-header p {
          color: #64748b;
          font-size: 16px;
          line-height: 1.6;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .service-card {
          background: #ffffff;
          border: 1.5px solid #edf2f7;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          transition: var(--transition-smooth);
          position: relative;
        }
        .service-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 2px solid var(--teal-primary);
          border-radius: 20px;
          opacity: 0;
          transition: var(--transition-smooth);
        }
        .service-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-premium);
        }
        .service-card:hover::after {
          opacity: 1;
        }
        .service-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #e0f8f6;
          color: var(--teal-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .service-card h3 {
          font-family: var(--font-outfit);
          font-size: 22px;
          font-weight: 700;
          color: var(--blue-dark);
          margin: 0 0 16px;
        }
        .service-bullets {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
        }
        .service-bullets li {
          font-size: 14.5px;
          color: #64748b;
          padding: 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .service-bullets li::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--teal-primary);
          border-radius: 50%;
        }
        .service-card-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--teal-primary);
          font-weight: 700;
          text-decoration: none;
          font-size: 14.5px;
          transition: var(--transition-smooth);
        }
        .service-card-btn:hover {
          gap: 12px;
        }

        /* --- Core Features / Grid Stats --- */
        .features-section {
          background: var(--teal-primary);
          padding: 100px 0;
          color: white;
        }
        .features-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 60px;
          align-items: center;
        }
        .features-left h2 {
          font-family: var(--font-outfit);
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
        }
        .features-left p {
          font-size: 17px;
          opacity: 0.9;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .feature-tile {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: var(--transition-smooth);
        }
        .feature-tile:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .feature-tile-icon {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .feature-tile h4 {
          margin: 0;
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.3;
        }

        /* --- Doctors Section --- */
        .doctors-section {
          padding: 100px 0;
        }
        .doctors-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .doctor-card {
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          border: 1.5px solid #edf2f7;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          transition: var(--transition-smooth);
        }
        .doctor-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-premium);
        }
        .doctor-img-wrap {
          height: 320px;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .doctor-badge-overlay.light-blue {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0284c7;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.35);
          border: 2.5px solid #ffffff;
          z-index: 5;
          transition: var(--transition-smooth);
        }
        .doctor-card:hover .doctor-badge-overlay.light-blue {
          transform: scale(1.12) rotate(6deg);
          background: #0369a1;
        }
        .about-img-box {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
        }
        .team-badge-overlay.light-blue {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(2, 132, 199, 0.92);
          backdrop-filter: blur(8px);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.3);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          z-index: 5;
        }
        .doctor-card h3 {
          font-family: var(--font-outfit);
          font-size: 22px;
          font-weight: 700;
          color: var(--blue-dark);
          margin: 24px 24px 4px;
        }
        .doctor-role {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--teal-primary);
          letter-spacing: 0.05em;
          margin: 0 24px 16px;
        }
        .doctor-bio {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 24px 24px;
        }

        /* --- Numbered Practice Section (Dark Blue) --- */
        .numbered-practice-section {
          background: var(--blue-dark);
          padding: 100px 0;
          color: white;
        }
        .numbered-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .numbered-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 60px;
          align-items: center;
        }
        .numbered-header h2 {
          font-family: var(--font-outfit);
          font-size: 38px;
          font-weight: 800;
          margin: 0;
        }
        .numbered-header p {
          font-size: 16px;
          opacity: 0.8;
          line-height: 1.6;
          margin: 0;
        }
        .numbered-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .numbered-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
          position: relative;
          transition: var(--transition-smooth);
        }
        .numbered-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-6px);
        }
        .numbered-card-num {
          font-family: var(--font-outfit);
          font-size: 64px;
          font-weight: 800;
          color: rgba(26, 191, 178, 0.2);
          position: absolute;
          top: 20px;
          right: 30px;
          line-height: 1;
        }
        .numbered-card h3 {
          font-family: var(--font-outfit);
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 16px;
        }
        .numbered-card p {
          font-size: 14.5px;
          opacity: 0.75;
          line-height: 1.6;
          margin: 0;
        }
        .numbered-practice-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(26, 191, 178, 0.15);
          border: 1.5px solid var(--teal-primary);
          border-radius: 20px;
          padding: 24px 40px;
          margin-top: 50px;
        }
        .numbered-practice-cta-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .numbered-practice-cta-left h4 {
          margin: 0;
          font-family: var(--font-outfit);
          font-size: 20px;
          font-weight: 700;
        }
        .btn-cta-now {
          padding: 12px 28px;
          background: var(--teal-primary);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-cta-now:hover {
          background: var(--teal-hover);
        }

        /* --- Testimonial / Inspiring Stories --- */
        .testimonial-section {
          padding: 100px 0;
          background: var(--gray-bg);
        }
        .testimonial-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px;
          text-align: center;
        }
        .testimonial-quote {
          font-family: var(--font-outfit);
          font-size: 26px;
          font-weight: 600;
          color: var(--blue-dark);
          line-height: 1.5;
          margin-bottom: 30px;
          position: relative;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .testimonial-author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: var(--teal-primary);
        }
        .testimonial-author-name {
          font-weight: 700;
          color: var(--text-dark);
        }
        .testimonial-author-title {
          font-size: 13px;
          color: #64748b;
        }

        /* --- Interactive Booking Form (Dual Columns) --- */
        .booking-section {
          padding: 120px 0;
          background: radial-gradient(circle at 10% 80%, #e0f8f6 0%, #ffffff 50%);
        }
        .booking-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .booking-form-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 50px rgba(17, 28, 68, 0.07);
          border: 1.5px solid #edf2f7;
        }
        .booking-form-card h3 {
          font-family: var(--font-outfit);
          font-size: 28px;
          font-weight: 800;
          color: var(--blue-dark);
          margin: 0 0 8px;
        }
        .booking-form-card-subtitle {
          font-size: 14.5px;
          color: #64748b;
          margin-bottom: 32px;
        }
        .booking-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .booking-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .booking-field label {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .booking-input, .booking-select {
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14.5px;
          color: var(--text-dark);
          background: #ffffff;
          outline: none;
          transition: var(--transition-smooth);
        }
        .booking-input:focus, .booking-select:focus {
          border-color: var(--teal-primary);
          box-shadow: 0 0 0 3px rgba(26, 191, 178, 0.15);
        }
        .btn-book-submit {
          width: 100%;
          padding: 14px;
          background: var(--blue-dark);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
          margin-top: 16px;
        }
        .btn-book-submit:hover {
          background: var(--blue-hover);
        }

        .booking-right h2 {
          font-family: var(--font-outfit);
          font-size: 40px;
          font-weight: 800;
          color: var(--blue-dark);
          margin-bottom: 20px;
        }
        .booking-right p {
          font-size: 16.5px;
          line-height: 1.6;
          color: #64748b;
          margin-bottom: 32px;
        }
        .booking-check-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .booking-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .booking-check-item svg {
          color: var(--teal-primary);
        }

        /* --- Recent Stories / Blog --- */
        .blog-section {
          padding: 100px 0;
          background: var(--gray-bg);
        }
        .blog-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .blog-card {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid #edf2f7;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          transition: var(--transition-smooth);
        }
        .blog-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-premium);
        }
        .blog-img-box {
          height: 220px;
          background: linear-gradient(135deg, #e0f8f6 0%, #eff6ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .blog-img-box svg {
          color: var(--teal-primary);
          opacity: 0.6;
        }
        .blog-card-meta {
          padding: 24px 24px 0;
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }
        .blog-card-meta span:first-child {
          background: #e0f8f6;
          color: var(--teal-primary);
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 700;
        }
        .blog-card h3 {
          font-family: var(--font-outfit);
          font-size: 20px;
          font-weight: 700;
          color: var(--blue-dark);
          margin: 14px 24px 10px;
          line-height: 1.4;
        }
        .blog-card p {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 24px 24px;
        }
        .blog-card-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--teal-primary);
          font-weight: 700;
          text-decoration: none;
          font-size: 14px;
          margin: 0 24px 24px;
          transition: var(--transition-smooth);
        }
        .blog-card-link:hover {
          gap: 12px;
        }

        /* --- Footer --- */
        .landing-footer {
          background: var(--blue-dark);
          color: rgba(255, 255, 255, 0.7);
          padding: 80px 0 30px;
          font-size: 14.5px;
        }
        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 0.8fr 1.2fr;
          gap: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 60px;
          margin-bottom: 40px;
        }
        .footer-col h3 {
          color: #ffffff;
          font-family: var(--font-outfit);
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 24px;
        }
        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-col ul a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: var(--transition-smooth);
        }
        .footer-col ul a:hover {
          color: var(--teal-primary);
          padding-left: 6px;
        }
        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .newsletter-input-group {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 4px;
        }
        .newsletter-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 10px 14px;
          color: white;
          font-family: inherit;
          font-size: 14px;
        }
        .newsletter-input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .btn-newsletter {
          background: var(--teal-primary);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-newsletter:hover {
          background: var(--teal-hover);
        }
        .footer-bottom {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13.5px;
        }
        .footer-socials {
          display: flex;
          gap: 16px;
        }
        .footer-social-link {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: var(--transition-smooth);
        }
        .footer-social-link:hover {
          background: var(--teal-primary);
          transform: translateY(-2px);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .hero-content, .about-section, .features-content, .booking-content, .footer-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .hero-right, .about-left-image { order: -1; }
          .hero-cards-overlay {
            grid-template-columns: 1fr;
            margin-top: -50px;
          }
          .services-grid, .doctors-grid, .numbered-grid, .blog-grid {
            grid-template-columns: 1fr;
          }
          .numbered-header {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Navbar / Header */}
      <header className="landing-header">
        <div className="navbar-content">
          <a href="#home" className="nav-logo">
            <div className="nav-logo-pulse">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span>ProMed</span>
          </a>
          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#doctors">Doctors</a>
            <a href="#booking">Book Appointment</a>
          </nav>
          <div className="nav-actions">
            <button className="btn-portal" onClick={() => navigate(user ? '/' : '/login')}>
              {user ? 'Doctor Portal' : 'Login'}
            </button>
            <a href="#booking" className="btn-book-nav">Book Now</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <div className="hero-left">
            <h1>Providing the <span>Best Medical</span> Care</h1>
            <p>
              We are committed to providing you and your family with the highest quality healthcare services. Connect with our medical experts today.
            </p>
            <div className="hero-pills">
              {categories.map((c) => (
                <div
                  key={c}
                  className={`category-pill ${activeCategory === c ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </div>
              ))}
            </div>
            <a href="#booking" className="btn-book-nav" style={{ padding: '14px 32px', fontSize: '15px' }}>
              Request Appointment
            </a>
          </div>
          <div className="hero-right">
            <div className="hero-image-container">
              <img src="/hero_doctors.png" alt="Hero Doctor Team" className="hero-right-img" />
            </div>
            <div className="floating-badge">
              <div className="floating-badge-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="floating-badge-text">
                <div>100% Secure</div>
                <div>FDA Approved Methods</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Info Overlay Cards */}
      <div className="hero-cards-overlay">
        <div className="overlay-card teal">
          <h3>Emergency Cases</h3>
          <p>If you need urgent medical care, our emergency services are active 24/7. Call our hotline now.</p>
          <div className="overlay-phone">
            <div className="overlay-phone-pulse"></div>
            <span>+1 800 123 4567</span>
          </div>
        </div>
        <div className="overlay-card blue">
          <h3>Doctors Timetable</h3>
          <p>Find out the availability of our top specialized doctors and schedule your appointment accordingly.</p>
          <a href="#doctors" className="overlay-link-btn">
            <span>View Timetable</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
        <div className="overlay-card dark">
          <h3>Opening Hours</h3>
          <p>We are available during the following hours to assist with consultations and diagnostics.</p>
          <table className="overlay-hours-table">
            <tbody>
              <tr>
                <td>Monday – Friday</td>
                <td style={{ textAlign: 'right' }}>8:00 – 20:00</td>
              </tr>
              <tr>
                <td>Saturday</td>
                <td style={{ textAlign: 'right' }}>9:00 – 18:00</td>
              </tr>
              <tr>
                <td>Sunday</td>
                <td style={{ textAlign: 'right' }}>9:00 – 15:00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-left-image">
          <div className="about-img-box">
            <img src="/doctors_team.png" alt="Clinical Staff" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="team-badge-overlay light-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Verified Clinical Staff</span>
            </div>
          </div>
          <div className="about-experience-badge">
            <div>15+</div>
            <div>Years of<br />Excellence</div>
          </div>
        </div>
        <div className="about-right">
          <h2>Improving The Quality Of Your Life Through Better Health</h2>
          <div className="about-divider"></div>
          <p>
            ProMed Clinical Center offers personalized medical services powered by state-of-the-art diagnostic tools. We collaborate with international healthcare partners to ensure the highest standards of diagnostic accuracy and care.
          </p>
          <div className="about-bullets">
            <div className="about-bullet-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Personalized Care</span>
            </div>
            <div className="about-bullet-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Qualified Doctors</span>
            </div>
            <div className="about-bullet-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>AI-Assisted Diagnostics</span>
            </div>
            <div className="about-bullet-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>24/7 Clinical Support</span>
            </div>
          </div>
          <button className="btn-about-more">Learn More About Us</button>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="services">
        <div className="services-content">
          <div className="section-header">
            <h2>Providing Medical Care For The Sickest In Our Community</h2>
            <p>Our comprehensive clinical departments deliver premium treatment and diagnostic testing to all patients.</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3>Health Checkup</h3>
              <ul className="service-bullets">
                <li>Comprehensive Blood Analysis</li>
                <li>Cardiac Screening &amp; ECG</li>
                <li>Pulmonary Function Evaluation</li>
                <li>Radiology and Ultrasound Scans</li>
              </ul>
              <a href="#booking" className="service-card-btn">
                <span>Book Checkup</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="service-card">
              <div className="service-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                </svg>
              </div>
              <h3>Dental Care</h3>
              <ul className="service-bullets">
                <li>Routine Cleaning &amp; Prevention</li>
                <li>Orthodontic Treatments</li>
                <li>Restorative Dentistry &amp; Crowns</li>
                <li>Emergency Root Canal Therapy</li>
              </ul>
              <a href="#booking" className="service-card-btn">
                <span>Book Dental</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="service-card">
              <div className="service-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" /><path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m11.4 11.4l.7.7m0-12.8l-.7.7M6.3 17.7l-.7.7" />
                </svg>
              </div>
              <h3>Eye Care</h3>
              <ul className="service-bullets">
                <li>Ophthalmic Vision Testing</li>
                <li>Glaucoma &amp; Cataract Diagnostics</li>
                <li>Laser Eye Surgery Advice</li>
                <li>Designer Frame Fittings</li>
              </ul>
              <a href="#booking" className="service-card-btn">
                <span>Book Eye Care</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Teal Features Banner */}
      <section className="features-section">
        <div className="features-content">
          <div className="features-left">
            <h2>Helping You Recover &amp; Regain Health</h2>
            <p>
              We provide outstanding medical services utilizing modern, state-of-the-art facilities and a highly trained specialist group.
            </p>
            <a href="#booking" className="btn-cta-now" style={{ background: '#ffffff', color: 'var(--teal-primary)' }}>
              Find a Doctor
            </a>
          </div>
          <div className="features-grid">
            <div className="feature-tile">
              <div className="feature-tile-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h4>Qualified Doctors</h4>
            </div>
            <div className="feature-tile">
              <div className="feature-tile-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h4>Modern Lab</h4>
            </div>
            <div className="feature-tile">
              <div className="feature-tile-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h4>Emergency Care</h4>
            </div>
            <div className="feature-tile">
              <div className="feature-tile-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h4>Free Consult</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Doctors */}
      <section className="doctors-section" id="doctors">
        <div className="doctors-content">
          <div className="section-header">
            <h2>Meet Our Doctors</h2>
            <p>Our medical team consists of board-certified specialists dedicated to your medical goals.</p>
          </div>
          <div className="doctors-grid">
            <div className="doctor-card">
              <div className="doctor-img-wrap">
                <img src="/doctor_sarah.png" alt="Dr. Sarah Jenkins" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="doctor-badge-overlay light-blue" title="Cardiology Specialist">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              </div>
              <h3>Dr. Sarah Jenkins</h3>
              <div className="doctor-role">Cardiologist</div>
              <p className="doctor-bio">Specialist in cardiovascular diseases and dynamic interventional cardiac diagnostics.</p>
            </div>
            <div className="doctor-card">
              <div className="doctor-img-wrap">
                <img src="/doctor_marcus.png" alt="Dr. Marcus Vance" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="doctor-badge-overlay light-blue" title="Pediatrics Specialist">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <h3>Dr. Marcus Vance</h3>
              <div className="doctor-role">Pediatrician</div>
              <p className="doctor-bio">Over 12 years of specialized practice in clinical pediatric medicine and child wellness checkups.</p>
            </div>
            <div className="doctor-card">
              <div className="doctor-img-wrap">
                <img src="/doctor_emily.png" alt="Dr. Emily Stone" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="doctor-badge-overlay light-blue" title="Neurology Specialist">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
              </div>
              <h3>Dr. Emily Stone</h3>
              <div className="doctor-role">Neurologist</div>
              <p className="doctor-bio">Leading expert in neurology, brain scans, electroencephalography, and sleep diagnostics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Numbered Practice (Dark Blue) */}
      <section className="numbered-practice-section">
        <div className="numbered-content">
          <div className="numbered-header">
            <h2>We Provide All Aspects Of Medical Practice For Your Family!</h2>
            <p>Our clinics utilize advanced laboratory processing, AI-driven radiology scanners, and personalized treatment workflows to ensure premium care standards.</p>
          </div>
          <div className="numbered-grid">
            <div className="numbered-card">
              <div className="numbered-card-num">01</div>
              <h3>Diagnostics</h3>
              <p>State-of-the-art MRI, CT scan, and laboratory evaluation for complete medical clarity.</p>
            </div>
            <div className="numbered-card">
              <div className="numbered-card-num">02</div>
              <h3>Advanced Surgery</h3>
              <p>Minimally invasive operations led by top board-certified surgeons with premium safety records.</p>
            </div>
            <div className="numbered-card">
              <div className="numbered-card-num">03</div>
              <h3>Post-op Care</h3>
              <p>Attentive recovery care and continuous monitoring to support your complete transition home.</p>
            </div>
          </div>
          <div className="numbered-practice-cta">
            <div className="numbered-practice-cta-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--teal-primary)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h4>Looking for a board-certified medical specialist?</h4>
            </div>
            <a href="#booking" className="btn-cta-now">Book Now</a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonial-section">
        <div className="testimonial-content">
          <div className="testimonial-quote">
            "ProMed Clinical Center exceeded my expectations. The diagnostic precision, AI scan details, and the compassionate care shown by the team helped me recover quickly."
          </div>
          <div className="testimonial-author">
            <div className="testimonial-author-avatar">AT</div>
            <div>
              <div className="testimonial-author-name">Alex Thompson</div>
              <div className="testimonial-author-title">Patient, Recovered Case</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Booking Form Section */}
      <section className="booking-section" id="booking">
        <div className="booking-content">
          <div className="booking-form-card">
            <h3>Book an Appointment</h3>
            <div className="booking-form-card-subtitle">Select your clinic details and we will reach out to confirm.</div>
            <form onSubmit={handleBookingSubmit}>
              <div className="booking-grid-2">
                <div className="booking-field">
                  <label>Department</label>
                  <select
                    className="booking-select"
                    value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div className="booking-field">
                  <label>Doctor</label>
                  <select
                    className="booking-select"
                    value={bookingForm.doctor}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctor: e.target.value })}
                  >
                    <option value="">Select Doctor</option>
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                    <option value="Dr. Marcus Vance">Dr. Marcus Vance</option>
                    <option value="Dr. Emily Stone">Dr. Emily Stone</option>
                  </select>
                </div>
              </div>
              <div className="booking-field">
                <label>Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="booking-input"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                />
              </div>
              <div className="booking-grid-2">
                <div className="booking-field">
                  <label>Date</label>
                  <input
                    type="date"
                    className="booking-input"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  />
                </div>
                <div className="booking-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 555-0192"
                    className="booking-input"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn-book-submit">Book Appointment Now</button>
            </form>
          </div>
          <div className="booking-right">
            <h2>Helping Patients From Around The Globe!</h2>
            <p>
              We aim to make your clinical visit comfortable, efficient, and direct. Schedule an appointment online to bypass wait times and connect directly with a medical doctor.
            </p>
            <div className="booking-check-list">
              <div className="booking-check-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Direct consultation appointments with zero wait time</span>
              </div>
              <div className="booking-check-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Electronic records integration for instant scan reviews</span>
              </div>
              <div className="booking-check-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Full telemedicine support for remote follow-ups</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Stories / Blog */}
      <section className="blog-section">
        <div className="blog-content">
          <div className="section-header">
            <h2>Recent Stories</h2>
            <p>Stay up to date with the latest clinical research and health insights from ProMed.</p>
          </div>
          <div className="blog-grid">
            <div className="blog-card">
              <div className="blog-img-box">
                <img src="/blog_1.png" alt="Clinical Scan" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
                </svg>
              </div>
              <div className="blog-card-meta">
                <span>Research</span>
                <span>July 10, 2026</span>
              </div>
              <h3>Understanding AI in Modern Chest Radiography</h3>
              <p>How deep learning model metrics help clinicians detect pleural effusion and pulmonary lesions.</p>
              <a href="#about" className="blog-card-link">
                <span>Read Article</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="blog-card">
              <div className="blog-img-box">
                <img src="/blog_2.png" alt="Diet Guidelines" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
                </svg>
              </div>
              <div className="blog-card-meta">
                <span>Nutrition</span>
                <span>July 05, 2026</span>
              </div>
              <h3>Top 5 Nutrition Rules for Cardiac Health</h3>
              <p>Key lifestyle modifications and dietary rules to safeguard your cardiovascular health standards.</p>
              <a href="#about" className="blog-card-link">
                <span>Read Article</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="blog-card">
              <div className="blog-img-box">
                <img src="/blog_3.png" alt="Clinical Trials" className="hero-right-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
                </svg>
              </div>
              <div className="blog-card-meta">
                <span>Pediatrics</span>
                <span>June 28, 2026</span>
              </div>
              <h3>Immunization Schedules: A Complete Guide</h3>
              <p>A quick reference schedule summarizing recommended pediatric vaccines and clinical timetables.</p>
              <a href="#about" className="blog-card-link">
                <span>Read Article</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a href="#home" className="nav-logo" style={{ color: '#ffffff' }}>
              <div className="nav-logo-pulse">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span>ProMed</span>
            </a>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.5)' }}>
              ProMed Clinical Center is committed to introducing modern technology solutions into diagnostic workflows.
            </p>
          </div>
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#doctors">Our Specialists</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Services</h3>
            <ul>
              <li><a href="#services">Health Checkups</a></li>
              <li><a href="#services">Cardiology Consults</a></li>
              <li><a href="#services">AI Chest Scans</a></li>
              <li><a href="#services">Dental Care</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Newsletter</h3>
            <p style={{ fontSize: 13, marginBottom: 16, color: 'rgba(255, 255, 255, 0.5)' }}>
              Subscribe to get latest medical updates and clinical recommendations.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="newsletter-input"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="btn-newsletter">Join</button>
              </div>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 ProMed Clinical Center. All Rights Reserved.</div>
          <div className="footer-socials">
            <a href="#" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
            <a href="#" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
