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
      setError('Please select a fingerprint before exiting.');
      return;
    }

    setLoading(true);
    try {
      const data = await tripExit(user.id, Number(stationId), fingerprintFile);
      setSuccess(data.message || 'Exit successful.');
      if (data.fare_charged !== undefined) {
        setFareCharged(data.fare_charged);
      }
    } catch (err) {
      setError(err.message || 'Exit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Exit Gate</h1>
        <p>Verify your fingerprint and select your destination station to complete your trip.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success">
          {success}
          {fareCharged !== null && (
            <strong> Fare charged: {formatCurrency(fareCharged)}</strong>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="gate-panel">
          <div className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Destination station</h2>
            <div className="form-group">
              <label htmlFor="exit-station">Exit station</label>
              <select
                id="exit-station"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
              >
                {STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !fingerprintFile}
            >
              {loading ? <span className="loading-spinner" /> : 'Confirm exit'}
            </button>
          </div>

          <div className="card">
            <FingerprintPicker
              selectedFile={fingerprintFile}
              onFileSelect={(file) => setFingerprintFile(file)}
            />
          </div>
        </div>
      </form>
    </>
  );
}
