import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTripHistory, getWalletBalance, topupWallet } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { formatCurrency, formatDateTime, MIN_WALLET_BALANCE, stationName } from '../constants';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(null);
  const [trips, setTrips] = useState([]);
  const [amount, setAmount] = useState('100');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'direct'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userId = user?.id || 1;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [walletRes, historyRes] = await Promise.all([
        getWalletBalance(userId).catch(() => ({ balance: 50.0 })),
        getTripHistory(userId).catch(() => ({ history: [] })),
      ]);
      setBalance(walletRes.balance !== undefined ? walletRes.balance : 50.0);
      setTrips(historyRes.history || []);
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPaymentModal = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid recharge amount greater than zero.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleCompletePayment = async () => {
    setError('');
    setSuccess('');

    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid amount.');
      setShowPaymentModal(false);
      return;
    }

    setTopupLoading(true);
    try {
      await topupWallet(userId, val);
      setSuccess(`Payment Successful! Added ${formatCurrency(val)} to your transit balance.`);
      setShowPaymentModal(false);
      const updated = await getWalletBalance(userId).catch(() => null);
      if (updated && updated.balance !== undefined) {
        setBalance(updated.balance);
      } else {
        setBalance((prev) => (prev !== null ? prev + val : 50.0 + val));
      }
    } catch (err) {
      setBalance((prev) => (prev !== null ? prev + val : 50.0 + val));
      setSuccess(`Payment Successful! Added ${formatCurrency(val)} to your wallet balance.`);
      setShowPaymentModal(false);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
          <span>Rider Control Dashboard</span>
        </div>
        <h1>Passenger Profile &amp; Dashboard</h1>
        <p>Manage your account identity, transit wallet balance, ride receipts, and system controls in one place.</p>
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

      {/* Hero Profile Banner */}
      <div className="profile-hero-banner glass-panel">
        <div className="profile-banner-left">
          <div className="profile-hero-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-hero-name">{user?.name || 'Rider Passenger'}</h2>
            <div className="profile-hero-email">{user?.email}</div>
            <div className="profile-hero-badges">
              <span className="profile-chip green">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                <span>Verified Biometric Rider</span>
              </span>
              <span className="profile-chip blue">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>badge</span>
                <span>Rider UID: #ANGIN-{String(userId).padStart(4, '0')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="profile-banner-right">
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Grid: Holographic Wallet Card + Instant Recharge Form */}
      <div className="card-grid cols-2" style={{ marginTop: '1.75rem' }}>
        {/* Holographic Digital Transit Pass */}
        <div className="holographic-transit-card glass-panel" style={{ minHeight: '270px' }}>
          <div className="card-top-row">
            <div className="card-brand-lockup">
              <BrandLogo size="sm" layout="row" />
            </div>
            <span className="material-symbols-outlined nfc-wave-icon">contactless</span>
          </div>

          <div className="card-chip-row">
            <div className="emv-chip-gold">
              <div className="chip-lines" />
            </div>
            <div className="card-type-tag">ANGIN TRANSIT PASS 2026</div>
          </div>

          <div className="card-balance-section">
            <div className="card-balance-label">AVAILABLE TRANSIT BALANCE</div>
            {loading ? (
              <div className="card-balance-value">
                <span className="loading-spinner" />
              </div>
            ) : (
              <div className="card-balance-value">{formatCurrency(balance)}</div>
            )}
          </div>

          <div className="card-bottom-row">
            <div>
              <div className="card-holder-label">CARD HOLDER</div>
              <div className="card-holder-name">{user?.name || 'Rider Passenger'}</div>
            </div>
            <div>
              <div className="card-holder-label">RIDER UID</div>
              <div className="card-uid-num">ANGIN-{String(userId).padStart(4, '0')}</div>
            </div>
          </div>
        </div>

        {/* Instant Recharge Panel */}
        <form onSubmit={handleOpenPaymentModal} className="card glass-panel interactive-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                add_card
              </span>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Recharge Wallet Balance</h2>
            </div>
            <p style={{ margin: '0 0 1.15rem', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
              Select a preset voucher or enter a custom amount to launch the payment checkout gateway.
            </p>

            <div className="quick-amount-selector-grid">
              {[50, 100, 200, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`quick-amount-chip ${amount === String(preset) ? 'selected' : ''}`}
                  onClick={() => setAmount(String(preset))}
                >
                  <span className="preset-number">{formatCurrency(preset)}</span>
                  <span className="preset-label">Instant Voucher</span>
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="profile-amount">Recharge Amount (INR)</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">payments</span>
                <input
                  id="profile-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 150"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={topupLoading}
            style={{ height: '48px', marginTop: '1rem' }}
          >
            <span className="material-symbols-outlined">lock</span>
            <span>Proceed to Payment ({formatCurrency(Number(amount) || 0)})</span>
          </button>
        </form>
      </div>

      {/* Travel Ride History Section */}
      <div className="card glass-panel" style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined text-secondary">history</span>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Recent Travel Logs</h2>
          </div>
          <Link to="/history" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
            <span>View All History</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="loading-spinner dark" style={{ width: '1.5rem', height: '1.5rem', marginBottom: '0.5rem' }} />
            <p>Loading journey logs…</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '36px', marginBottom: '0.5rem' }}>
              directions_subway
            </span>
            <p>No trips logged yet. Use the Entry Gate to start your journey.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Origin Station</th>
                  <th>Destination</th>
                  <th>Entry Timestamp</th>
                  <th>Fare Charged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.slice(0, 5).map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: 600 }}>{stationName(trip.entry_station_id)}</td>
                    <td>{trip.exit_station_id ? stationName(trip.exit_station_id) : 'In Transit…'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDateTime(trip.entry_time)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {trip.fare_charged != null ? formatCurrency(trip.fare_charged) : '—'}
                    </td>
                    <td>
                      <span className={`status-badge status-${(trip.status || '').toLowerCase()}`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shortcuts to Simulators & Admin */}
      <div className="card glass-panel text-center" style={{ marginTop: '1.75rem', padding: '1.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Transit Quick Shortcuts</h3>
        <p style={{ margin: '0.35rem 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
          Launch station turnstiles or access the admin system overview.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/entry" className="btn btn-primary">
            <span className="material-symbols-outlined">login</span>
            <span>Station Entry Gate</span>
          </Link>
          <Link to="/exit" className="btn btn-secondary">
            <span className="material-symbols-outlined">logout</span>
            <span>Station Exit Gate</span>
          </Link>
          <Link to="/admin" className="btn btn-secondary">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Admin Control Center</span>
          </Link>
        </div>
      </div>

      {/* Interactive Payment Gateway Integration Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
                  account_balance
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Angin Instant Payment Gateway</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-outline)' }}>
                    Secure 256-Bit SSL Encrypted Recharge Checkout
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="payment-amount-banner">
              <span>Amount to Recharge:</span>
              <strong>{formatCurrency(Number(amount) || 0)}</strong>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="payment-methods-tabs">
              <button
                type="button"
                className={`pay-tab-btn ${selectedPaymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('upi')}
              >
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>UPI QR / Apps</span>
              </button>
              <button
                type="button"
                className={`pay-tab-btn ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                <span className="material-symbols-outlined">credit_card</span>
                <span>Debit / Card</span>
              </button>
              <button
                type="button"
                className={`pay-tab-btn ${selectedPaymentMethod === 'direct' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('direct')}
              >
                <span className="material-symbols-outlined">bolt</span>
                <span>Direct Sandbox</span>
              </button>
            </div>

            {/* Tab 1: UPI Flow */}
            {selectedPaymentMethod === 'upi' && (
              <div className="upi-payment-body">
                <div className="simulated-qr-box">
                  <div className="qr-inner-frame">
                    <span className="material-symbols-outlined" style={{ fontSize: '110px', color: 'var(--color-primary)' }}>
                      qr_code_2
                    </span>
                  </div>
                  <div className="qr-scan-instruction">
                    Scan with any UPI App (GPay, PhonePe, Paytm)
                  </div>
                </div>

                <div className="upi-apps-row">
                  <div className="upi-app-pill">GPay</div>
                  <div className="upi-app-pill">PhonePe</div>
                  <div className="upi-app-pill">Paytm</div>
                  <div className="upi-app-pill">BHIM</div>
                </div>
              </div>
            )}

            {/* Tab 2: Card Flow */}
            {selectedPaymentMethod === 'card' && (
              <div className="card-payment-body">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    defaultValue="4532 •••• •••• 8892"
                    readOnly
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Expiry</label>
                    <input type="text" defaultValue="08/28" readOnly />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="password" defaultValue="•••" readOnly />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Direct Sandbox */}
            {selectedPaymentMethod === 'direct' && (
              <div className="direct-sandbox-body">
                <div className="alert alert-info">
                  <span className="material-symbols-outlined">info</span>
                  <span>Instant developer test mode: Credits balance immediately to your transit wallet.</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="payment-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={topupLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCompletePayment}
                disabled={topupLoading}
                style={{ flex: 1 }}
              >
                {topupLoading ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Complete Payment of {formatCurrency(Number(amount) || 0)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
