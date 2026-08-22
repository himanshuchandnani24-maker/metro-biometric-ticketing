import { useState } from 'react';
import { tripExit } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import { formatCurrency, STATIONS } from '../constants';

export default function ExitGate() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState('2');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fareCharged, setFareCharged] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFareCharged(null);

    if (!fingerprintFile) {
      setError('Please select or upload your biometric fingerprint scan before exiting.');
      return;
    }

    setLoading(true);
    try {
      const data = await tripExit(user.id, Number(stationId), fingerprintFile);
      setSuccess(data.message || 'Exit authenticated. Journey completed.');
      if (data.fare_charged !== undefined) {
        setFareCharged(data.fare_charged);
      }
    } catch (err) {
      setError(err.message || 'Exit authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Gate Turnstile Simulator</div>
        <h1>Station Exit Gate</h1>
        <p>Verify your biometric fingerprint at your destination station to calculate fare and complete your journey.</p>
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
    </div>
  );
}
