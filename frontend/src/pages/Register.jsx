import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerUser, loginUser, registerFingerprint, generateFingerprintTemplate } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import AuthBackground from '../components/AuthBackground';
import BrandLogo from '../components/BrandLogo';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
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
        throw new Error('Account created, but login did not return a user session. Please sign in.');
      }

      setPendingUser(loginRes.user);
      setPendingToken(loginRes.token);
      setStep(2);
      setSuccess('Account created successfully. Please enroll your biometric fingerprint.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fingerprintFile) {
      setError('Please select or upload a fingerprint scan.');
      return;
    }

    setLoading(true);
    try {
      await registerFingerprint(pendingUser.id, fingerprintFile);
      login(pendingUser, pendingToken);
      setSuccess('Biometrics enrolled successfully. Navigating to wallet…');
      setTimeout(() => navigate('/wallet'), 700);
    } catch (err) {
      setError(err.message || 'Fingerprint registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTemplate = async () => {
    setGeneratingTemplate(true);
    setError('');
    setSuccess('');
    try {
      const data = await generateFingerprintTemplate(pendingUser?.id);
      const binaryString = atob(data.template_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const file = new File([bytes], `fingerprint_u${pendingUser?.id || 'new'}_template.dat`, {
        type: 'application/octet-stream',
      });
      setFingerprintFile(file);
      setSuccess('Unique 1,532-byte template generated! You can download it below to keep on your device.');
    } catch (err) {
      setError(err.message || 'Failed to generate biometric template.');
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!fingerprintFile) return;
    const url = URL.createObjectURL(fingerprintFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = fingerprintFile.name || 'fingerprint_template.dat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSkipFingerprint = () => {
    if (!pendingUser) return;
    login(pendingUser, pendingToken);
    navigate('/wallet');
  };

  return (
    <div className="auth-wrapper">
      <AuthBackground />

      <div className={`auth-stitch-card ${step === 2 ? 'wide' : ''}`}>
        {/* Step Progress Bar */}
        <div className="stitch-step-nav" aria-label="Registration Progress">
          <div
            className={`stitch-step-bar ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}
          />
          <div className={`stitch-step-bar ${step >= 2 ? 'active' : ''}`} />
        </div>

        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <BrandLogo size="lg" layout="row" />
          </div>
          {step === 1 ? (
            <>
              <h1>Join the Future of Transit</h1>
              <p>Create an Angin account to begin your seamless journey.</p>
            </>
          ) : (
            <>
              <h1>Enroll Biometric Identity</h1>
              <p>Generate a unique 1,532-byte template, upload any file, or download your template.</p>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleAccountSubmit} className="auth-form-fields">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">person</span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">mail</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
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
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">lock_reset</span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                />
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
                  <span>Create Account</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleFingerprintSubmit} className="auth-form-fields">
            {/* Quick Template Generator & Downloader Card */}
            <div
              style={{
                background: 'rgba(0, 102, 153, 0.06)',
                border: '1px solid rgba(0, 102, 153, 0.18)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1.15rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px' }}>
                  auto_awesome
                </span>
                <strong style={{ fontSize: '0.95rem' }}>Biometric Template Options</strong>
              </div>
              <p style={{ fontSize: '0.825rem', opacity: 0.85, margin: '0 0 0.85rem', lineHeight: 1.4 }}>
                Generate a unique 1,532-byte template, upload your own file (any format: .dat, .bin, .png, .jpg), or download your biometric file to scan at gates without signing in.
              </p>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateTemplate}
                  disabled={generatingTemplate || loading}
                  style={{
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {generatingTemplate ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        fingerprint
                      </span>
                      <span>Generate Unique 1,532-Byte Template</span>
                    </>
                  )}
                </button>

                {fingerprintFile && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDownloadTemplate}
                    style={{
                      padding: '0.55rem 1rem',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      download
                    </span>
                    <span>Download Template (.dat)</span>
                  </button>
                )}
              </div>
            </div>

            <FingerprintPicker
              selectedFile={fingerprintFile}
              onFileSelect={(file) => setFingerprintFile(file)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || !fingerprintFile}
                style={{ height: '48px' }}
              >
                {loading ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <span>Complete registration</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      fingerprint
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={loading}
                onClick={handleSkipFingerprint}
              >
                Skip for now
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="auth-footer-nav">
          <span>Already have an account? </span>
          <Link to="/login">Log in instead</Link>
        </div>
      </div>
    </div>
  );
}
