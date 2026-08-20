import { useCallback, useEffect, useState } from 'react';
import { getAdminAlerts, getAdminRevenue, getAdminTrips } from '../api/api';
import { formatCurrency, formatDateTime, stationName } from '../constants';

function statusClass(status) {
  return `status-badge status-${(status || '').toLowerCase()}`;
}

export default function AdminDashboard() {
  const [trips, setTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripsData, revenueData, alertsData] = await Promise.all([
        getAdminTrips(),
        getAdminRevenue(),
        getAdminAlerts(),
      ]);
      setTrips(tripsData.trips || []);
      setRevenue(revenueData.total_revenue ?? 0);
      setAlerts(alertsData.alerts || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const activeTrips = trips.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <>
      <header className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview — revenue, trips, and fraud alerts.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <span className="loading-spinner dark" /> Loading dashboard…
        </div>
      ) : (
        <>
          <div className="card-grid cols-3" style={{ marginBottom: '1rem' }}>
            <div className="card stat-card">
              <div className="stat-value">{formatCurrency(revenue)}</div>
              <div className="stat-label">Total revenue</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{completedTrips}</div>
              <div className="stat-label">Completed trips</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{activeTrips}</div>
              <div className="stat-label">Active trips</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>All trips</h2>
              <button type="button" className="btn btn-secondary" onClick={fetchDashboard}>
                Refresh
              </button>
            </div>
            {trips.length === 0 ? (
              <div className="empty-state">No trips in the system.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Entry time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>{trip.id}</td>
                        <td>{trip.user_id}</td>
                        <td>{stationName(trip.entry_station_id)}</td>
                        <td>{trip.exit_station_id ? stationName(trip.exit_station_id) : '—'}</td>
                        <td>
                          {trip.fare_charged != null ? formatCurrency(trip.fare_charged) : '—'}
                        </td>
                        <td>
                          <span className={statusClass(trip.status)}>{trip.status}</span>
                        </td>
                        <td>{formatDateTime(trip.entry_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>
              Fraud alerts ({alerts.length})
            </h2>
            {alerts.length === 0 ? (
              <div className="empty-state">No fraud alerts recorded.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Trip</th>
                      <th>Reason</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>{alert.id}</td>
                        <td>{alert.user_id}</td>
                        <td>{alert.trip_id ?? '—'}</td>
                        <td>{alert.reason}</td>
                        <td>{formatDateTime(alert.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
