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
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand-link" onClick={closeMenu}>
          <BrandLogo size="sm" layout="row" />
        </Link>

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

        {/* Navigation Items */}
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
                to="/wallet"
                className={({ isActive }) =>
                  `nav-link-stitch ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined nav-item-icon">
                  account_balance_wallet
                </span>
                <span>Wallet</span>
              </NavLink>

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

              {/* User Profile & Logout */}
              <div className="nav-user-stitch">
                <div className="user-avatar-chip">
                  <div className="avatar-circle">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="user-display-name">{user?.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-logout-stitch"
                  onClick={handleLogout}
                  title="Sign out of account"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    logout
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
                onClick={closeMenu}
              >
                Get Started
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
