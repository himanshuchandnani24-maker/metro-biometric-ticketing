import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import AuthBackground from '../components/AuthBackground';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/wallet';

  if (isAuthenticated) {
    return <Navigate to="/wallet" replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      login(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthBackground />

      <div className="auth-stitch-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <BrandLogo size="lg" layout="row" />
          </div>
          <h1>Welcome Back</h1>
          <p>Secure access to the Angin biometric transit network.</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-fields" autoComplete="off">
          {/* Email / Username Field */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon-lead">mail</span>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-outline)' }}>
                Protected by Biometrics
              </span>
            </div>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon-lead">lock</span>
              <input
                id="password"
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

        {/* Footer Link */}
        <div className="auth-footer-nav">
          <span>Don&apos;t have an account? </span>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
