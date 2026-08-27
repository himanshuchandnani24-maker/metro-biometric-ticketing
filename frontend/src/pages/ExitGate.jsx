import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripExit } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import { STATIONS, formatCurrency, stationName } from '../constants';

const FARE_MAP = {
  '1-2': 2.50, '1-3': 3.00, '1-4': 4.00,
  '2-1': 2.50, '2-3': 3.50, '2-4': 5.00,
  '3-1': 3.00, '3-2': 3.50, '3-4': 2.00,
  '4-1': 4.00, '4-2': 5.00, '4-3': 2.00,
};

export default function ExitGate() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState('2');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fareCharged, setFareCharged] = useState(null);
  const [gateStatus, setGateStatus] = useState('idle'); // 'idle' | 'scanning' | 'open' | 'rejected'
  const [activeTrip, setActiveTrip] = useState(null);

  const userId = user?.id || 1;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('metro_active_trip');
      if (stored) {
        setActiveTrip(JSON.parse(stored));
      }
    } catch {
      setActiveTrip(null);
    }
  }, []);

  const entryStationId = activeTrip?.entry_station_id || 1;
  const computedFare = FARE_MAP[`${entryStationId}-${stationId}`] || 3.00;

  const handleScanAndExit = async (event) => {
    if (event) event.preventDefault();
    setError('');
    setSuccess('');
    setFareCharged(null);

    if (!fingerprintFile) {
      setError('Please place or select your fingerprint on the scanner first.');
      setGateStatus('idle');
      return;
    }

    // Check for spoof sample
    if (fingerprintFile.name?.toLowerCase().includes('blank')) {
      setGateStatus('rejected');
      setError('Spoof Anomaly Flagged: Synthetic or blank fingerprint rejected. Gate turnstile locked.');
      return;
    }

    setLoading(true);
    setGateStatus('scanning');

    try {
      const data = await tripExit(userId, Number(stationId), fingerprintFile);
      const fare = data.fare_charged !== undefined ? data.fare_charged : computedFare;
      setFareCharged(fare);
      setSuccess(data.message || `Exit verified. Deducted ${formatCurrency(fare)} from your wallet.`);
      setGateStatus('open');
      localStorage.removeItem('metro_active_trip');
    } catch (err) {
      setError(err.message || 'Exit authorization failed.');
      setGateStatus('rejected');
    } finally {
      setLoading(false);
    }
  };

  const handleResetGate = () => {
    setGateStatus('idle');
    setSuccess('');
    setError('');
    setFareCharged(null);
    setFingerprintFile(null);
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sensor_door</span>
          <span>Station Exit Turnstile Simulator</span>
        </div>
        <h1>Station Exit Gate</h1>
        <p>Verify your biometric fingerprint at your destination station to calculate exact journey distance and complete automated fare deduction.</p>
      </header>

      {/* Active Trip Origin Pill */}
      {activeTrip && (
        <div className="active-trip-banner glass-panel">
          <span className="material-symbols-outlined text-secondary">train</span>
          <div>
            <strong>Active In-Progress Journey:</strong> Boarded at{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              {activeTrip.entry_station_name || stationName(activeTrip.entry_station_id)}
            </span>{' '}
            • Turnstile Tap Recorded
          </div>
        </div>
      )}

      {/* Visual Metro Turnstile Gate Barrier Display */}
      <div className={`turnstile-visual-stage glass-panel ${gateStatus}`}>
        <div className="turnstile-status-marquee">
          <div className="turnstile-led-dot" />
          <span className="turnstile-led-text">
            {gateStatus === 'idle' && 'EXIT GATE ARMED • TOUCH BIOMETRIC SENSOR'}
            {gateStatus === 'scanning' && 'CALCULATING DISTANCE FARE & BIOMETRIC MATCH…'}
            {gateStatus === 'open' && `EXIT AUTHORIZED • ${formatCurrency(fareCharged || computedFare)} DEDUCTED • GATE OPEN`}
            {gateStatus === 'rejected' && 'ACCESS DENIED • VERIFICATION / EXIT ERROR'}
          </span>
        </div>

        {/* Turnstile Physical Flaps Simulation */}
        <div className="turnstile-physical-structure">
          <div className="turnstile-stanchion left">
            <div className="turnstile-sensor-light" />
            <div className="stanchion-label">EX-01</div>
          </div>

          <div className="turnstile-walkway-gap">
            {/* Left Barrier Wing */}
            <div className={`turnstile-wing wing-left ${gateStatus === 'open' ? 'open' : ''}`}>
              <div className="wing-acrylic-panel" />
            </div>

            {/* Turnstile Clearance Hologram */}
            <div className="turnstile-clearance-indicator">
              {gateStatus === 'open' ? (
                <div className="clearance-badge open">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>
                    check_circle
                  </span>
                  <div className="clearance-title">FARE PAID: {formatCurrency(fareCharged || computedFare)}</div>
                  <div className="clearance-sub">Gate Open • Thank You for Riding</div>
                </div>
              ) : gateStatus === 'rejected' ? (
                <div className="clearance-badge rejected">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>
                    cancel
                  </span>
                  <div className="clearance-title">LOCKED</div>
                  <div className="clearance-sub">Verification Failed</div>
                </div>
              ) : (
                <div className="clearance-badge standby">
                  <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>
                    touch_app
                  </span>
                  <div className="clearance-title">TAP TO EXIT</div>
                  <div className="clearance-sub">Est. Fare: {formatCurrency(computedFare)}</div>
                </div>
              )}
            </div>

            {/* Right Barrier Wing */}
            <div className={`turnstile-wing wing-right ${gateStatus === 'open' ? 'open' : ''}`}>
              <div className="wing-acrylic-panel" />
            </div>
          </div>

          <div className="turnstile-stanchion right">
            <div className="turnstile-sensor-light" />
            <div className="stanchion-label">EX-02</div>
          </div>
        </div>

        {/* Post-Exit Quick Actions */}
        {gateStatus === 'open' && (
          <div className="turnstile-action-bar">
            <Link to="/history" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              <span className="material-symbols-outlined">history</span>
              <span>View Ride Receipt in History</span>
            </Link>
            <Link to="/wallet" className="btn btn-secondary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span>Check Wallet Balance</span>
            </Link>
            <button type="button" className="btn btn-secondary" onClick={handleResetGate}>
              <span>Reset Gate</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1.25rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status" style={{ marginTop: '1.25rem' }}>
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <strong>{success}</strong>
          </div>
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleScanAndExit} style={{ marginTop: '1.5rem' }}>
        <div className="gate-panel">
          {/* Destination Station Card */}
          <div className="card glass-panel interactive-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
                near_me
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>1. Select Alighting Station</h2>
            </div>

            <div className="form-group">
              <label htmlFor="exit-station">Destination Station</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">pin_drop</span>
                <select
                  id="exit-station"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  disabled={gateStatus === 'open'}
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
                Automated Dynamic Fare: <strong>{formatCurrency(computedFare)}</strong> from {stationName(entryStationId)}.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !fingerprintFile || gateStatus === 'open'}
              style={{ marginTop: '1.5rem', height: '48px' }}
            >
              {loading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <span className="material-symbols-outlined">sensor_door</span>
                  <span>Verify Fingerprint &amp; Open Exit Gate</span>
                </>
              )}
            </button>
          </div>

          {/* Biometric Laser Scanner Terminal */}
          <div className="card glass-panel interactive-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
                fingerprint
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>2. Touch Biometric Sensor</h2>
            </div>

            <FingerprintPicker
              selectedFile={fingerprintFile}
              onFileSelect={(file) => setFingerprintFile(file)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
