import { useCallback, useEffect, useState } from 'react';
import {
  createWalletOrder,
  getWalletBalance,
  getWalletPayments,
  registerFingerprint,
  topupWallet,
  verifyFingerprint,
  verifyWalletPayment,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import RazorpayModal from '../components/RazorpayModal';
import { formatCurrency, formatDateTime, MIN_WALLET_BALANCE } from '../constants';

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [modalOrderData, setModalOrderData] = useState(null);

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

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await getWalletPayments(user.id);
      setPayments(data.payments || []);
    } catch (err) {
      console.warn('Could not load payment history:', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBalance();
    fetchPayments();
  }, [fetchBalance, fetchPayments]);

  // Razorpay Checkout Flow
  const handleRazorpayTopup = async (event) => {
    if (event) event.preventDefault();
    setError('');
    setSuccess('');

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError('Please enter a valid recharge amount greater than zero.');
      return;
    }

    setTopupLoading(true);

    try {
      // 1. Create order on backend
      const orderData = await createWalletOrder(user.id, value);

      // 2. If using test/demo keys, simulated order, or offline, open realistic Test Mode Simulator!
      const isDemoKey = !orderData.key_id || orderData.key_id.startsWith('rzp_test_metroDemo');
      const isSimulated = orderData.is_simulated || isDemoKey || !orderData.order_id || orderData.order_id.startsWith('order_test_');

      if (isSimulated || typeof window.Razorpay !== 'function') {
        setModalOrderData(orderData);
        setShowRazorpayModal(true);
        setTopupLoading(false);
        return;
      }

      // 3. Launch Razorpay Test Checkout modal
      const options = {
        key: orderData.key_id || 'rzp_test_metroDemoKey',
        amount: orderData.amount_paise || Math.round(value * 100),
        currency: orderData.currency || 'INR',
        name: 'Angin Metro Transit',
        description: `Wallet Recharge for Rider #${user.id} (${user.name})`,
        image: '/angin-logo.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setTopupLoading(true);
            await verifyWalletPayment({
              user_id: user.id,
              amount: value,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_test_sig',
            });
            setSuccess(`Payment Successful! Added ${formatCurrency(value)} to your Angin biometric wallet.`);
            setAmount('');
            await fetchBalance({ silent: true });
            await fetchPayments();
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed.');
          } finally {
            setTopupLoading(false);
          }
        },
        prefill: {
          name: user.name || 'Metro Rider',
          email: user.email || 'rider@metro.local',
          contact: '9876543210',
        },
        notes: {
          rider_id: String(user.id),
          service: 'Biometric Transit Balance Recharge',
        },
        theme: {
          color: '#006699',
        },
        modal: {
          ondismiss: function () {
            setTopupLoading(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
        setTopupLoading(false);
      });
      rzpInstance.open();
    } catch (err) {
      setError(err.message || 'Failed to initiate Razorpay checkout.');
      setTopupLoading(false);
    }
  };

  const handleSimulatorSuccess = async (simulatedResponse) => {
    if (!modalOrderData) return;
    setTopupLoading(true);
    try {
      await verifyWalletPayment({
        user_id: user.id,
        amount: modalOrderData.amount,
        razorpay_order_id: simulatedResponse.razorpay_order_id,
        razorpay_payment_id: simulatedResponse.razorpay_payment_id,
        razorpay_signature: simulatedResponse.razorpay_signature,
      });
      setSuccess(`Payment Successful! Added ${formatCurrency(modalOrderData.amount)} to your Angin biometric wallet.`);
      setAmount('');
      await fetchBalance({ silent: true });
      await fetchPayments();
    } catch (verifyErr) {
      setError(verifyErr.message || 'Payment verification failed.');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>payments</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Recharge via Razorpay</h2>
            </div>
            <span className="status-badge status-in_progress" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Test Mode
            </span>
          </div>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            Add funds using credit/debit card, UPI, or netbanking via Razorpay Test Gateway.
          </p>

          <form onSubmit={handleRazorpayTopup}>
            <div className="form-group">
              <label htmlFor="amount">Recharge Amount (INR)</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">currency_rupee</span>
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
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={topupLoading}
              style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {topupLoading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <span className="material-symbols-outlined">lock_open</span>
                  <span>Pay with Razorpay</span>
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

      {/* Payment & Recharge History Table */}
      <div className="card glass-panel" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Recharge &amp; Payment History</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchPayments}
            disabled={paymentsLoading}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {paymentsLoading ? (
          <div className="empty-state">
            <span className="loading-spinner dark" style={{ width: '1.5rem', height: '1.5rem', marginBottom: '0.5rem' }} />
            <p>Loading payment ledger…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '36px', marginBottom: '0.5rem' }}>
              credit_card_off
            </span>
            <p>No recharge payments recorded yet. Top up your wallet to view payment logs.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date &amp; Time</th>
                  <th>Amount Credited</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      TXN-{p.id}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.created_at ? formatDateTime(p.created_at) : 'Just now'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      +{formatCurrency(p.amount)}
                    </td>
                    <td>
                      <span className={`status-badge status-${(p.status || 'success').toLowerCase()}`}>
                        {p.status || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      <RazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={modalOrderData?.amount || 0}
        description={`Wallet Top-up for Rider #${user?.id}`}
        onSuccess={handleSimulatorSuccess}
        onFailure={(msg) => setError(msg)}
      />
    </div>
  );
}
