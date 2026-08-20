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
      setError('Enter a valid amount greater than zero.');
      return;
    }

    setTopupLoading(true);
    try {
      await topupWallet(user.id, value);
      setSuccess(`Successfully added ${formatCurrency(value)} to your wallet.`);
      setAmount('');
      await fetchBalance({ silent: true });
    } catch (err) {
      setError(err.message || 'Top-up failed.');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleFingerprintAction = async (action) => {
    setError('');
    setSuccess('');

    if (!fingerprintFile) {
      setError('Select or upload a fingerprint image first.');
      return;
    }

    setFingerprintLoading(true);
    try {
      if (action === 'register') {
        const data = await registerFingerprint(user.id, fingerprintFile);
        setSuccess(data.message || 'Fingerprint enrolled.');
      } else {
        const data = await verifyFingerprint(user.id, fingerprintFile);
        const score = data.score != null ? ` Match score: ${Number(data.score).toFixed(2)}.` : '';
        setSuccess((data.message || 'Fingerprint verified.') + score);
      }
    } catch (err) {
      setError(err.message || 'Fingerprint request failed.');
    } finally {
      setFingerprintLoading(false);
    }
  };

  const hasSufficientBalance = balance !== null && balance >= MIN_WALLET_BALANCE;

  return (
    <>
      <header className="page-header">
        <h1>My Wallet</h1>
        <p>Manage your metro balance. A minimum of {formatCurrency(MIN_WALLET_BALANCE)} is required for entry.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="wallet-balance-display">
        <div className="balance-label">Current balance</div>
        {loading ? (
          <div className="balance-amount">
            <span className="loading-spinner dark" />
          </div>
        ) : (
          <div className="balance-amount">{formatCurrency(balance)}</div>
        )}
        <div className="min-balance">
          Minimum required for entry: {formatCurrency(MIN_WALLET_BALANCE)}
        </div>
      </div>

      {!loading && !hasSufficientBalance && (
        <div className="alert alert-warning">
          Your balance is below the minimum required for metro entry. Please top up before using the entry gate.
        </div>
      )}

      <div className="card-grid cols-2">
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Top up wallet</h2>
          <div className="alert alert-info" style={{ fontSize: '0.8125rem' }}>
            Direct top-up (Razorpay payment integration coming in Phase 6).
          </div>
          <form onSubmit={handleTopup}>
            <div className="form-group">
              <label htmlFor="amount">Amount (INR)</label>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-accent btn-block" disabled={topupLoading}>
              {topupLoading ? <span className="loading-spinner" /> : 'Add funds'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Quick amounts</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[50, 100, 200, 500].map((quick) => (
              <button
                key={quick}
                type="button"
                className="btn btn-secondary"
                onClick={() => setAmount(String(quick))}
              >
                {formatCurrency(quick)}
              </button>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Tap a quick amount, then click &quot;Add funds&quot; to credit your wallet instantly.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Fingerprint enrollment</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Enroll or re-verify your fingerprint using Phase 3 sample images or an uploaded scan.
        </p>
        <FingerprintPicker
          inputId="wallet-fingerprint-upload"
          selectedFile={fingerprintFile}
          onFileSelect={(file) => setFingerprintFile(file)}
        />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={fingerprintLoading || !fingerprintFile}
            onClick={() => handleFingerprintAction('register')}
          >
            {fingerprintLoading ? <span className="loading-spinner" /> : 'Enroll fingerprint'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={fingerprintLoading || !fingerprintFile}
            onClick={() => handleFingerprintAction('verify')}
          >
            Verify fingerprint
          </button>
        </div>
      </div>
    </>
  );
}
