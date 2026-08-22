import { useCallback, useEffect, useState } from 'react';
import { getWalletBalance, registerFingerprint, topupWallet, verifyFingerprint } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import { formatCurrency, MIN_WALLET_BALANCE } from '../constants';

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBalance = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getWalletBalance(user.id);
      setBalance(data.balance);
    } catch (err) {
      setError(err.message || 'Failed to load wallet balance.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleTopup = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError('Please enter a valid recharge amount greater than zero.');
      return;
    }

    setTopupLoading(true);
    try {
      await topupWallet(user.id, value);
      setSuccess(`Successfully added ${formatCurrency(value)} to your Angin transit wallet.`);
      setAmount('');
      await fetchBalance({ silent: true });
    } catch (err) {
      setError(err.message || 'Wallet top-up failed.');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleFingerprintAction = async (action) => {
    setError('');
    setSuccess('');

    if (!fingerprintFile) {
      setError('Please select or upload a fingerprint scan template first.');
      return;
    }

    setFingerprintLoading(true);
    try {
      if (action === 'register') {
        const data = await registerFingerprint(user.id, fingerprintFile);
        setSuccess(data.message || 'Biometric fingerprint template enrolled successfully.');
      } else {
        const data = await verifyFingerprint(user.id, fingerprintFile);
        const score = data.score != null ? ` (Match confidence: ${Number(data.score).toFixed(2)})` : '';
        setSuccess((data.message || 'Biometric signature verified.') + score);
      }
    } catch (err) {
      setError(err.message || 'Biometric verification request failed.');
    } finally {
      setFingerprintLoading(false);
    }
  };

  const hasSufficientBalance = balance !== null && balance >= MIN_WALLET_BALANCE;

  return (
    <div className="main-content">
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Digital Transit Account</div>
        <h1>Digital Wallet &amp; Biometrics</h1>
        <p>Manage your account balance and biometric gate credentials. A minimum of {formatCurrency(MIN_WALLET_BALANCE)} is required for station entry.</p>
      </header>

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

      {/* Hero Wallet Balance Card */}
      <div className="wallet-balance-display-stitch glass-panel">
        <div className="balance-info-left">
          <div className="balance-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance_wallet</span>
            <span>Available Balance</span>
          </div>
          {loading ? (
            <div className="balance-number">
              <span className="loading-spinner" style={{ borderTopColor: '#00f4fe' }} />
            </div>
          ) : (
            <div className="balance-number">{formatCurrency(balance)}</div>
          )}
          <div className="balance-gate-rule">
            <span className="material-symbols-outlined text-secondary-fixed">verified</span>
            <span>Minimum entry requirement: <strong>{formatCurrency(MIN_WALLET_BALANCE)}</strong></span>
          </div>
        </div>

        <div className="balance-user-tag">
          <div className="user-icon-tag">
            <span className="material-symbols-outlined">fingerprint</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Rider ID: #{user?.id} • Active</div>
          </div>
        </div>
      </div>

      {!loading && !hasSufficientBalance && (
        <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
          <span className="material-symbols-outlined">warning</span>
          <span>Your balance is below the network entry threshold ({formatCurrency(MIN_WALLET_BALANCE)}). Please recharge before tapping into any station.</span>
        </div>
      )}

      {/* Top-up and Quick Recharge Cards */}
      <div className="card-grid cols-2" style={{ marginTop: '1.5rem' }}>
        <div className="card glass-panel interactive-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>add_card</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Recharge Wallet</h2>
          </div>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            Instantly add funds to your biometric transit balance via direct test payment.
          </p>

          <form onSubmit={handleTopup}>
            <div className="form-group">
              <label htmlFor="amount">Recharge Amount (INR)</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">payments</span>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={topupLoading} style={{ height: '46px' }}>
              {topupLoading ? <span className="loading-spinner" /> : (
                <>
                  <span>Add Funds to Wallet</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card glass-panel interactive-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>bolt</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Quick Recharge Chips</h2>
          </div>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            Select a preset voucher amount to instantly populate your recharge field:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[50, 100, 200, 500].map((quick) => (
              <button
                key={quick}
                type="button"
                className={`quick-amount-chip ${amount === String(quick) ? 'selected' : ''}`}
                onClick={() => setAmount(String(quick))}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(quick)}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>Tap to select</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric Enrollment Card */}
      <div className="card glass-panel interactive-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '26px' }}>fingerprint</span>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Biometric Template Management</h2>
        </div>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
          Enroll or re-verify your fingerprint template using standard biometric sample scans or an uploaded image.
        </p>

        <FingerprintPicker
          inputId="wallet-fingerprint-upload"
          selectedFile={fingerprintFile}
          onFileSelect={(file) => setFingerprintFile(file)}
        />

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={fingerprintLoading || !fingerprintFile}
            onClick={() => handleFingerprintAction('register')}
          >
            {fingerprintLoading ? <span className="loading-spinner" /> : (
              <>
                <span className="material-symbols-outlined">app_registration</span>
                <span>Enroll Fingerprint</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={fingerprintLoading || !fingerprintFile}
            onClick={() => handleFingerprintAction('verify')}
          >
            <span className="material-symbols-outlined">verified_user</span>
            <span>Verify Fingerprint Match</span>
          </button>
        </div>
      </div>
    </div>
  );
}
