import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">
            <img src="/metro-icon.svg" alt="" />
          </span>
          MetroPass
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              <NavLink to="/wallet" className="nav-link" onClick={closeMenu}>
                Wallet
              </NavLink>
              <NavLink to="/entry" className="nav-link" onClick={closeMenu}>
                Entry Gate
              </NavLink>
              <NavLink to="/exit" className="nav-link" onClick={closeMenu}>
                Exit Gate
              </NavLink>
              <NavLink to="/history" className="nav-link" onClick={closeMenu}>
                History
              </NavLink>
              <NavLink to="/admin" className="nav-link" onClick={closeMenu}>
                Admin
              </NavLink>
              <div className="nav-user">
                <span className="nav-user-name">{user?.name}</span>
                <button type="button" className="btn-nav-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav-link" onClick={closeMenu}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
