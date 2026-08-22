import { useState } from 'react';
import { tripEntry } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import { STATIONS, MIN_WALLET_BALANCE, formatCurrency } from '../constants';

export default function EntryGate() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState('1');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fingerprintFile) {
      setError('Please select or upload your biometric fingerprint scan before entering.');
      return;
    }

    setLoading(true);
    try {
      const data = await tripEntry(user.id, Number(stationId), fingerprintFile);
      setSuccess(data.message || 'Entry authenticated. Gate turnstile open.');
    } catch (err) {
      setError(err.message || 'Entry authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Gate Turnstile Simulator</div>
        <h1>Station Entry Gate</h1>
        <p>Scan your biometric fingerprint and select your boarding station to initiate your metro journey.</p>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <span className="material-symbols-outlined">door_front</span>
          <div>
            <strong>Gate Opened:</strong> {success}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="gate-panel">
          {/* Station Selection Card */}
          <div className="card glass-panel interactive-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                train
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Boarding Station</h2>
            </div>

            <div className="form-group">
              <label htmlFor="entry-station">Select Origin Station</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">location_on</span>
                <select
                  id="entry-station"
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
              <span className="material-symbols-outlined">info</span>
              <span>
                Safety Rule: Requires at least <strong>{formatCurrency(MIN_WALLET_BALANCE)}</strong> wallet balance to authenticate entry.
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
                  <span className="material-symbols-outlined">sensor_occupied</span>
                  <span>Scan &amp; Authenticate Entry</span>
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
