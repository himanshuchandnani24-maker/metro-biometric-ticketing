import { useCallback, useEffect, useState } from 'react';
import { getTripHistory } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency, formatDateTime, stationName } from '../constants';

function statusClass(status) {
  return `status-badge status-${(status || '').toLowerCase()}`;
}

export default function TravelHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTripHistory(user.id);
      setTrips(data.history || []);
    } catch (err) {
      setError(err.message || 'Failed to load personal travel history.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="main-content">
      <header className="page-header">
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Personal Ride Records</div>
        <h1>My Travel History</h1>
        <p>View your previous and in-progress transit rides, timestamps, and fare deduction receipts.</p>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined text-primary">history</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Ride Logs</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchHistory}
            disabled={loading}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="loading-spinner dark" style={{ width: '1.75rem', height: '1.75rem', marginBottom: '0.75rem' }} />
            <p>Loading your ride history…</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px', marginBottom: '0.5rem' }}>
              directions_subway
            </span>
            <p>No trips recorded yet. Use the Entry Gate to begin your first biometric transit journey.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Origin Station</th>
                  <th>Destination</th>
                  <th>Entry Timestamp</th>
                  <th>Exit Timestamp</th>
                  <th>Fare Charged</th>
                  <th>Trip Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>login</span>
                        {stationName(trip.entry_station_id)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>logout</span>
                        {trip.exit_station_id ? stationName(trip.exit_station_id) : 'In Transit…'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDateTime(trip.entry_time)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDateTime(trip.exit_time)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {trip.fare_charged != null ? formatCurrency(trip.fare_charged) : '—'}
                    </td>
                    <td>
                      <span className={statusClass(trip.status)}>{trip.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
