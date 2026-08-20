import { useState } from 'react';
import { tripEntry } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import FingerprintPicker from '../components/FingerprintPicker';
import { STATIONS } from '../constants';

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
      setError('Please select a fingerprint before entering.');
      return;
    }

    setLoading(true);
    try {
      const data = await tripEntry(user.id, Number(stationId), fingerprintFile);
      setSuccess(data.message || 'Entry successful.');
    } catch (err) {
      setError(err.message || 'Entry failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Entry Gate</h1>
        <p>Scan your fingerprint and select your entry station to begin a trip.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="gate-panel">
          <div className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Station selection</h2>
            <div className="form-group">
              <label htmlFor="entry-station">Entry station</label>
              <select
                id="entry-station"
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
            <div className="alert alert-info" style={{ fontSize: '0.8125rem' }}>
              Ensure your wallet has at least the maximum fare balance before entry.
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !fingerprintFile}
            >
              {loading ? <span className="loading-spinner" /> : 'Confirm entry'}
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
