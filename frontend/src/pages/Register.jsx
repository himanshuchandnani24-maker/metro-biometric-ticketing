import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerUser, loginUser, registerFingerprint } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isAuthenticated && step === 1) {
    return <Navigate to="/wallet" replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const loginRes = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      if (!loginRes.user?.id) {
        throw new Error('Account created, but login did not return a user. Please sign in.');
      }

      setPendingUser(loginRes.user);
      setStep(2);
      setSuccess('Account created. Now register your fingerprint.');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fingerprintFile) {
      setError('Please select or upload a fingerprint image.');
      return;
    }

    setLoading(true);
    try {
      await registerFingerprint(pendingUser.id, fingerprintFile);
      login(pendingUser);
      setSuccess('Fingerprint registered successfully. Redirecting to wallet…');
      setTimeout(() => navigate('/wallet'), 800);
    } catch (err) {
      setError(err.message || 'Fingerprint registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipFingerprint = () => {
    if (!pendingUser) return;
    login(pendingUser);
    navigate('/wallet');
  };

  return (
    <div className="auth-layout">
      <div className={`auth-card card ${step === 2 ? 'wide' : ''}`}>
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 && (
          <>
            <h1>Create account</h1>
            <p className="subtitle">Register for biometric metro ticketing</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleAccountSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <span className="loading-spinner" /> : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Register fingerprint</h1>
            <p className="subtitle">Enroll your biometric template for gate access</p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleFingerprintSubmit}>
              <FingerprintPicker
                selectedFile={fingerprintFile}
                onFileSelect={(file) => setFingerprintFile(file)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || !fingerprintFile}
                style={{ marginTop: '1rem' }}
              >
                {loading ? <span className="loading-spinner" /> : 'Complete registration'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={loading}
                onClick={handleSkipFingerprint}
                style={{ marginTop: '0.5rem' }}
              >
                Skip for now
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
