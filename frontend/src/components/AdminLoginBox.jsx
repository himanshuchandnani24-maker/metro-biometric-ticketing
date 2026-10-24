import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import BrandLogo from './BrandLogo';

export default function AdminLoginBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, login, logout } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  useEffect(() => {
    if (location.state?.loggedOut) {
      setJustLoggedOut(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setJustLoggedOut(false);
    setLoading(true);

    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      if (data.user?.role !== 'admin') {
        setError('Access denied. This login is for administrators only.');
        return;
      }

      login(data.user, data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stitch-card" id="admin-login-box">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="auth-brand-badge">
          <BrandLogo size="lg" layout="row" />
        </div>
        <h1>Admin Login</h1>
        <p>Secure administrator access to the Angin transit network.</p>
      </div>

      {justLoggedOut && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>Logged out successfully.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {isAdmin ? (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius)' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Logged in as Administrator</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate('/admin')}
            style={{ height: '48px' }}
          >
            <span>Go to Admin Dashboard</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              logout();
              setJustLoggedOut(true);
            }}
            style={{ height: '44px' }}
          >
            <span>Logout</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form-fields" autoComplete="off">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="admin-email">Email address</label>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon-lead">mail</span>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@metro.local"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="admin-password" style={{ margin: 0 }}>Password</label>
            </div>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon-lead">lock</span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="input-icon-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '0.75rem', height: '48px' }}
          >
            {loading ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <span>Sign in</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
