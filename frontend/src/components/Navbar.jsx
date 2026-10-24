import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/', { state: { loggedOut: true } });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar-stitch">
      <div className="navbar-inner">
        {/* Left Side: Rider Profile Dashboard Button (When Authenticated) or Welcome Tag */}
        <div className="navbar-left-section">
          {isAuthenticated ? (
            <Link to="/profile" className="nav-profile-chip-btn" onClick={closeMenu} title="Open Rider Profile & Dashboard">
              <div className="avatar-circle">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="profile-chip-text">
                <span className="chip-user-name">{user?.name?.split(' ')[0] || 'Rider'}</span>
                <span className="chip-sub-label">Profile &amp; Wallet</span>
              </div>
            </Link>
          ) : (
            <div className="guest-welcome-tag">
              <span className="status-indicator-dot" />
              <span>Angin Transit Core</span>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="navbar-toggle-stitch"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="material-symbols-outlined">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Center / Middle: Primary Navigation Tools */}
        <div className={`navbar-links-stitch ${menuOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link-stitch ${isActive ? 'active' : ''}`
            }
            onClick={closeMenu}
          >
            <span className="material-symbols-outlined nav-item-icon">home</span>
            <span>Home</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/entry"
                className={({ isActive }) =>
                  `nav-link-stitch ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined nav-item-icon">
                  login
                </span>
                <span>Entry Gate</span>
              </NavLink>

              <NavLink
                to="/exit"
                className={({ isActive }) =>
                  `nav-link-stitch ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined nav-item-icon">
                  logout
                </span>
                <span>Exit Gate</span>
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `nav-link-stitch ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined nav-item-icon">
                  history
                </span>
                <span>History</span>
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link-stitch ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  <span className="material-symbols-outlined nav-item-icon">
                    dashboard
                  </span>
                  <span>Admin</span>
                </NavLink>
              )}

              <button
                type="button"
                className="btn-logout-stitch mobile-logout-only"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  logout
                </span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="nav-auth-buttons">
              <NavLink
                to="/register"
                className="btn btn-primary nav-cta-btn"
                onClick={closeMenu}
              >
                <span>Register</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-link-stitch ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                Passenger Login
              </NavLink>
              <a
                href="/#admin-portal"
                className="nav-link-stitch nav-admin-quick-link"
                onClick={(e) => {
                  closeMenu();
                  const el = document.getElementById('admin-login-box');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.querySelector('input')?.focus();
                  } else {
                    navigate('/?admin=1');
                  }
                }}
              >
                <span className="material-symbols-outlined nav-item-icon">admin_panel_settings</span>
                <span>Admin Login</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Side: Brand Logo Lockup */}
        <div className="navbar-right-section">
          <Link to="/" className="navbar-brand-link" onClick={closeMenu}>
            <BrandLogo size="sm" layout="row" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
