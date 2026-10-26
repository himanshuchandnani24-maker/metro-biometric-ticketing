import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tripEntry } from '../api/api';
import FingerprintPicker from '../components/FingerprintPicker';
import { STATIONS, MIN_WALLET_BALANCE, formatCurrency, stationName } from '../constants';

export default function EntryGate() {
  const [stationId, setStationId] = useState('1');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifiedBalance, setVerifiedBalance] = useState(null);
  const [gateStatus, setGateStatus] = useState('idle'); // 'idle' | 'scanning' | 'open' | 'rejected'

  const handleScanAndEnter = async (event) => {
    if (event) event.preventDefault();
    setError('');
    setSuccess('');
    setVerifiedBalance(null);

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
      const data = await tripEntry(Number(stationId), fingerprintFile);
      setSuccess(data.message || `Biometric verified. Gate turnstile opened at ${stationName(stationId)}.`);
      if (data.balance !== undefined && data.balance !== null) {
        setVerifiedBalance(Number(data.balance));
      }
      setGateStatus('open');
      setFingerprintFile(null);
    } catch (err) {
      setError(err.message || 'Entry authorization failed.');
      setGateStatus('rejected');
    } finally {
      setLoading(false);
    }
  };

  const handleResetGate = () => {
    setGateStatus('idle');
    setSuccess('');
    setError('');
    setVerifiedBalance(null);
    setFingerprintFile(null);
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>door_front</span>
          <span>Station Entry Turnstile Simulator</span>
        </div>
        <h1>Station Entry Gate</h1>
        <p>
          Public Turnstile: Open to everyone without login or sign-in. Upload any fingerprint format (.dat, .bin, 1,532-byte template, .png, .jpg) to verify wallet sufficiency and board.
        </p>
      </header>

      {/* Visual Metro Turnstile Gate Barrier Display */}
      <div className={`turnstile-visual-stage glass-panel ${gateStatus}`}>
        <div className="turnstile-status-marquee">
          <div className="turnstile-led-dot" />
          <span className="turnstile-led-text">
            {gateStatus === 'idle' && 'GATE ARMED • TOUCH BIOMETRIC SENSOR'}
            {gateStatus === 'scanning' && 'AUTHENTICATING BIOMETRIC MINUTIAE…'}
            {gateStatus === 'open' && `PASSAGE GRANTED • BOARDING AT ${stationName(stationId).toUpperCase()}`}
            {gateStatus === 'rejected' && 'ACCESS DENIED • VERIFICATION / ENTRY ERROR'}
          </span>
        </div>

        {/* Turnstile Physical Flaps Simulation */}
        <div className="turnstile-physical-structure">
          <div className="turnstile-stanchion left">
            <div className="turnstile-sensor-light" />
            <div className="stanchion-label">L-01</div>
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
                  <div className="clearance-title">GATE OPEN</div>
                  <div className="clearance-sub">Please Step Through</div>
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
                  <div className="clearance-title">TAP FINGER</div>
                  <div className="clearance-sub">Min. Balance ₹5.00</div>
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
            <div className="stanchion-label">R-01</div>
          </div>
        </div>

        {/* Post-Open Quick Shortcut */}
        {gateStatus === 'open' && (
          <div className="turnstile-action-bar">
            <Link to="/exit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              <span className="material-symbols-outlined">logout</span>
              <span>Proceed to Destination (Exit Gate)</span>
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
            {verifiedBalance !== null && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                Verified Biometric Wallet Balance: <strong>{formatCurrency(verifiedBalance)}</strong> (Min. ₹5.00 Sufficiency Verified)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Controls: Station Picker + Biometric Terminal */}
      <form onSubmit={handleScanAndEnter} style={{ marginTop: '1.5rem' }}>
        <div className="gate-panel">
          {/* Station Selection Card */}
          <div className="card glass-panel interactive-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                train
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>1. Select Origin Station</h2>
            </div>

            <div className="form-group">
              <label htmlFor="entry-station">Boarding Station</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">location_on</span>
                <select
                  id="entry-station"
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
              <span className="material-symbols-outlined">info</span>
              <span>
                Safety Rule: Requires at least <strong>{formatCurrency(MIN_WALLET_BALANCE)}</strong> wallet balance to authenticate entry.
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
                  <span className="material-symbols-outlined">sensor_occupied</span>
                  <span>Scan Fingerprint &amp; Open Gate</span>
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
