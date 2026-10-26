import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BrandLogo from './components/BrandLogo';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import EntryGate from './pages/EntryGate';
import ExitGate from './pages/ExitGate';
import TravelHistory from './pages/TravelHistory';
import AdminDashboard from './pages/AdminDashboard';
import Faq from './pages/Faq';
import Profile from './pages/Profile';
import './App.css';

/**
 * Standard Passenger & General Layout (Includes user navbar and logout)
 */
function StandardLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content-wrapper">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Public Gate Kiosk Bare Layout (Turnstile kiosk terminals without user navbar / logout)
 */
function GateLayout() {
  return (
    <div className="app-shell">
      <header className="gate-kiosk-bar">
        <div className="gate-kiosk-inner">
          <div className="gate-kiosk-brand">
            <Link to="/" className="navbar-brand-link" style={{ textDecoration: 'none' }}>
              <BrandLogo size="sm" layout="row" />
            </Link>
            <span className="gate-kiosk-pill">
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  marginRight: '6px',
                }}
              />
              Turnstile Gate Terminal
            </span>
          </div>
          <nav className="gate-kiosk-nav">
            <Link to="/entry" className="nav-link-stitch" style={{ textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
              <span>Entry Gate</span>
            </Link>
            <Link to="/exit" className="nav-link-stitch" style={{ textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              <span>Exit Gate</span>
            </Link>
            <Link to="/" className="nav-link-stitch" style={{ textDecoration: 'none', opacity: 0.65 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              <span>Exit Kiosk</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content-wrapper">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Gate Routes (Bare layout, no user navbar/logout, unauthenticated access) */}
      <Route element={<GateLayout />}>
        <Route path="/entry" element={<EntryGate />} />
        <Route path="/exit" element={<ExitGate />} />
      </Route>

      {/* Passenger Application Routes (Standard layout with user navbar) */}
      <Route element={<StandardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<Home />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <TravelHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
