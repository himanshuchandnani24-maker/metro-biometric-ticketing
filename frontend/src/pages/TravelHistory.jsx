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
      setError(err.message || 'Failed to load travel history.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <>
      <header className="page-header">
        <h1>Travel History</h1>
        <p>View your past and active metro trips.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <span className="loading-spinner dark" /> Loading trips…
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">No trips recorded yet. Use the entry gate to start your first journey.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Entry time</th>
                  <th>Exit time</th>
                  <th>Fare</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{stationName(trip.entry_station_id)}</td>
                    <td>{trip.exit_station_id ? stationName(trip.exit_station_id) : '—'}</td>
                    <td>{formatDateTime(trip.entry_time)}</td>
                    <td>{formatDateTime(trip.exit_time)}</td>
                    <td>
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
    </>
  );
}
