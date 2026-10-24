import { useState } from 'react';
import {
  createWalletOrder,
  topupWallet,
  tripExit,
  verifyWalletPayment,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import RazorpayModal from '../components/RazorpayModal';
import { formatCurrency, STATIONS } from '../constants';

export default function ExitGate() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState('2');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fareCharged, setFareCharged] = useState(null);
  const [dueInfo, setDueInfo] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  const performExit = async (fileToUse) => {
    const file = fileToUse || fingerprintFile;
    if (!file) {
      setError('Please select or upload your biometric fingerprint scan before exiting.');
      return;
    }

    setLoading(true);
    setError('');
    setDueInfo(null);
    setSuccess('');
    setFareCharged(null);

    try {
      const data = await tripExit(user.id, Number(stationId), file);
      setSuccess(data.message || 'Exit authenticated. Journey completed.');
      if (data.fare_charged !== undefined) {
        setFareCharged(data.fare_charged);
      }
    } catch (err) {
      if (err.data?.insufficient_balance || err.status === 402) {
        setDueInfo({
          amountNeeded: err.data?.amount_needed || 10,
          fareAmount: err.data?.fare_amount || 10,
          currentBalance: err.data?.current_balance || 0,
        });
        setError(err.message || 'Insufficient wallet balance. You must pay the fare at the gate to exit.');
      } else {
        setError(err.message || 'Exit authorization failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    performExit();
  };

  const handleSimulatorSuccess = async (simulatedResponse) => {
    if (!orderInfo) return;
    setPayLoading(true);
    try {
      await verifyWalletPayment({
        user_id: user.id,
        amount: orderInfo.amount,
        razorpay_order_id: simulatedResponse.razorpay_order_id,
        razorpay_payment_id: simulatedResponse.razorpay_payment_id,
        razorpay_signature: simulatedResponse.razorpay_signature,
      });
      setDueInfo(null);
      setShowRazorpayModal(false);
      // Auto retry exit with fingerprint
      await performExit(fingerprintFile);
    } catch (vErr) {
      setError(vErr.message || 'Payment verification failed.');
    } finally {
      setPayLoading(false);
    }
  };

  // Instant Gate Payment to clear fare due and unlock gate
  const handlePayAtGate = async () => {
    if (!dueInfo) return;
    setPayLoading(true);
    setError('');

    const amountToPay = dueInfo.amountNeeded;

    try {
      // 1. Create order
      const orderData = await createWalletOrder(user.id, amountToPay);
      setOrderInfo(orderData);

      // 2. Check if using test/demo keys, simulated order, or offline
      const isDemoKey = !orderData.key_id || orderData.key_id.startsWith('rzp_test_metroDemo');
      const isSimulated = orderData.is_simulated || isDemoKey || !orderData.order_id || orderData.order_id.startsWith('order_test_');

      if (isSimulated || typeof window.Razorpay !== 'function') {
        setShowRazorpayModal(true);
        setPayLoading(false);
        return;
      }

      // 3. Launch live Razorpay popup for real test keys
      const options = {
        key: orderData.key_id || 'rzp_test_metroDemoKey',
        amount: orderData.amount_paise || Math.round(amountToPay * 100),
        currency: 'INR',
        name: 'Angin Metro — Gate Exit Terminal',
        description: `Settle Journey Fare (${formatCurrency(amountToPay)}) - Rider #${user.id}`,
        image: '/angin-logo.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setPayLoading(true);
            await verifyWalletPayment({
              user_id: user.id,
              amount: amountToPay,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_test_sig',
            });
            setDueInfo(null);
            // Auto retry exit with fingerprint
            await performExit(fingerprintFile);
          } catch (vErr) {
            setError(vErr.message || 'Payment verification failed.');
          } finally {
            setPayLoading(false);
          }
        },
        prefill: {
          name: user.name || 'Metro Rider',
          email: user.email || 'rider@metro.local',
          contact: '9876543210',
        },
        theme: { color: '#006699' },
        modal: {
          ondismiss: function () {
            setPayLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (r) {
        setError(`Gate payment failed: ${r.error?.description || 'Declined'}`);
        setPayLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Could not initiate gate payment.');
      setPayLoading(false);
    }
  };

  return (
    <div className="main-content">
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Gate Turnstile Simulator</div>
        <h1>Station Exit Gate</h1>
        <p>Verify your biometric fingerprint at your destination station to calculate fare and complete your journey.</p>
      </header>

      {error && !dueInfo && (
        <div className="alert alert-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Instant Gate Payment Notice if Insufficient Balance */}
      {dueInfo && (
        <div className="alert alert-warning" style={{ display: 'block', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f59e0b' }}>lock</span>
            <strong style={{ fontSize: '1.05rem' }}>Exit Turnstile Locked — Insufficient Fare Balance</strong>
          </div>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
            Your journey fare is <strong>{formatCurrency(dueInfo.fareAmount)}</strong>, but your wallet only has <strong>{formatCurrency(dueInfo.currentBalance)}</strong>.
            You must pay the remaining balance right here to open the turnstile.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePayAtGate}
              disabled={payLoading}
              style={{ padding: '0.6rem 1.25rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {payLoading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <span className="material-symbols-outlined">payments</span>
                  <span>Pay {formatCurrency(dueInfo.amountNeeded)} Now at Gate &amp; Exit</span>
                </>
              )}
            </button>
            <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
              Powered by Razorpay Instant Test Checkout
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <strong>Trip Completed:</strong> {success}
            {fareCharged !== null && (
              <div style={{ marginTop: '0.25rem' }}>
                Automated Fare Deducted: <strong>{formatCurrency(fareCharged)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="gate-panel">
          {/* Destination Station Card */}
          <div className="card glass-panel interactive-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
                near_me
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Destination Station</h2>
            </div>

            <div className="form-group">
              <label htmlFor="exit-station">Select Exit Station</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">pin_drop</span>
                <select
                  id="exit-station"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                >
                  {STATIONS.map((station) => (
                    <option key={station.id} value={station.id}>
                      Station #{station.id} — {station.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
              <span className="material-symbols-outlined">auto_graph</span>
              <span>
                Automated Fare Engine: Computes exact journey distance from entry station and automatically deducts from your digital wallet.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !fingerprintFile}
              style={{ marginTop: '1.5rem', height: '48px' }}
            >
              {loading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <span className="material-symbols-outlined">sensor_door</span>
                  <span>Verify &amp; Open Exit Gate</span>
                </>
              )}
            </button>
          </div>

          {/* Fingerprint Biometric Scanner */}
          <div className="card glass-panel interactive-card">
            <FingerprintPicker
              selectedFile={fingerprintFile}
              onFileSelect={(file) => setFingerprintFile(file)}
            />
          </div>
        </div>
      </form>

      <RazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={orderInfo?.amount || dueInfo?.amountNeeded || 0}
        description={`Settle Transit Fare at Gate — Rider #${user?.id}`}
        onSuccess={handleSimulatorSuccess}
        onFailure={(msg) => setError(msg)}
      />
    </div>
  );
}
