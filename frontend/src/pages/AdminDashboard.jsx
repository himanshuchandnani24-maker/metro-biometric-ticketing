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
  const [timeFilter, setTimeFilter] = useState('today');

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
    <div className="main-content">
      {/* Dashboard Header */}
      <header className="dashboard-header-stitch">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.5rem' }}>Admin Control Center</div>
          <h1>System Overview</h1>
          <p>Live metrics, revenue analytics, and biometric fraud monitors across the Angin network.</p>
        </div>

        <div className="header-status-controls">
          <div className="status-live-chip">
            <span className="live-pulsing-dot" />
            <span>Network Online</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchDashboard}
            disabled={loading}
            style={{ padding: '0.5rem 1rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="empty-state" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="loading-spinner dark" style={{ width: '2rem', height: '2rem', marginBottom: '1rem' }} />
          <p>Synchronizing transit gateway telemetry…</p>
        </div>
      ) : (
        <>
          {/* High-Level Metrics Bento Grid */}
          <div className="admin-bento-grid">
            {/* Revenue Metric */}
            <div className="metric-card-stitch primary-metric glass-panel">
              <div className="metric-header">
                <span className="metric-label">Total Network Revenue</span>
                <span className="material-symbols-outlined metric-icon">account_balance_wallet</span>
              </div>
              <div className="metric-main">
                <div className="metric-number">{formatCurrency(revenue)}</div>
                <div className="metric-trend text-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
                  <span>Direct Wallet Transactions</span>
                </div>
              </div>
            </div>

            {/* Completed Trips */}
            <div className="metric-card-stitch glass-panel">
              <div className="metric-header">
                <span className="metric-label">Completed Trips</span>
                <span className="material-symbols-outlined metric-icon text-secondary">check_circle</span>
              </div>
              <div className="metric-main">
                <div className="metric-number">{completedTrips}</div>
                <div className="metric-trend">
                  <span>Successful gate exit validations</span>
                </div>
              </div>
            </div>

            {/* Active Trips */}
            <div className="metric-card-stitch glass-panel">
              <div className="metric-header">
                <span className="metric-label">Active Commuters</span>
                <span className="material-symbols-outlined metric-icon text-primary">groups</span>
              </div>
              <div className="metric-main">
                <div className="metric-number">{activeTrips}</div>
                <div className="metric-trend" style={{ color: 'var(--color-primary-light)' }}>
                  <span>Currently in-transit on network</span>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="metric-card-stitch glass-panel">
              <div className="metric-header">
                <span className="metric-label">System Health</span>
                <span className="material-symbols-outlined metric-icon" style={{ color: '#00c853' }}>monitor_heart</span>
              </div>
              <div className="metric-main">
                <div className="metric-number">99.98%</div>
                <div className="health-bar-container">
                  <div className="health-bar-fill" style={{ width: '99.98%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Ridership Trends & Anomaly Alerts Row */}
          <div className="admin-analytics-grid">
            {/* Interactive Traffic Chart */}
            <div className="analytics-card glass-panel chart-col">
              <div className="analytics-card-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Ridership Telemetry Trends</h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-outline)' }}>
                    Hourly passenger volume across metro lines
                  </p>
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="chart-time-select"
                >
                  <option value="today">Today (Live)</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                </select>
              </div>

              {/* High-Performance SVG Chart */}
              <div className="chart-canvas-wrapper">
                <svg viewBox="0 0 700 240" className="ridership-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00dce5" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00dce5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="680" y2="30" stroke="#e0e3e5" strokeDasharray="4 4" />
                  <line x1="40" y1="80" x2="680" y2="80" stroke="#e0e3e5" strokeDasharray="4 4" />
                  <line x1="40" y1="130" x2="680" y2="130" stroke="#e0e3e5" strokeDasharray="4 4" />
                  <line x1="40" y1="180" x2="680" y2="180" stroke="#e0e3e5" />

                  {/* Chart Fill Area */}
                  <polygon
                    points="40,180 40,150 110,95 190,135 270,120 350,60 430,45 510,90 590,70 670,125 670,180"
                    fill="url(#chartAreaGrad)"
                  />

                  {/* Chart Line */}
                  <polyline
                    points="40,150 110,95 190,135 270,120 350,60 430,45 510,90 590,70 670,125"
                    fill="none"
                    stroke="#00696e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {[
                    [40, 150], [110, 95], [190, 135], [270, 120],
                    [350, 60], [430, 45], [510, 90], [590, 70], [670, 125]
                  ].map(([cx, cy], idx) => (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill="#ffffff"
                      stroke="#00696e"
                      strokeWidth="2.5"
                      className="chart-data-dot"
                    />
                  ))}
                </svg>

                {/* Timeline X-Axis */}
                <div className="chart-x-labels">
                  <span>06:00</span>
                  <span>08:00 (Peak)</span>
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00 (Peak)</span>
                  <span>20:00</span>
                  <span>22:00</span>
                </div>
              </div>
            </div>

            {/* Flagged Anomalies & Fraud Monitor */}
            <div className="analytics-card glass-panel anomalies-col">
              <div className="analytics-card-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-error)' }}>
                    Biometric Anomaly Monitors
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-outline)' }}>
                    Anti-spoof &amp; impossible travel logs
                  </p>
                </div>
                <span className="anomaly-counter-badge">
                  {alerts.length} Detected
                </span>
              </div>

              <div className="anomaly-items-list">
                {alerts.length === 0 ? (
                  <div className="empty-anomaly-state">
                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>
                      verified_user
                    </span>
                    <p>No biometric fraud anomalies flagged. System secure.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="anomaly-alert-card">
                      <div className="anomaly-card-top">
                        <span className="material-symbols-outlined text-error" style={{ fontSize: '20px' }}>
                          warning
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="anomaly-reason">{alert.reason}</div>
                          <div className="anomaly-meta">
                            <span>User ID: #{alert.user_id}</span>
                            {alert.trip_id && <span> • Trip #{alert.trip_id}</span>}
                            <span> • {formatDateTime(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Master Trips Audit Ledger */}
          <div className="card glass-panel" style={{ marginTop: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem' }}>All System Trips</h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
                  Complete transaction log with entry/exit timestamps and fare deductions
                </p>
              </div>
              <span className="badge-count">{trips.length} Total Trips</span>
            </div>

            {trips.length === 0 ? (
              <div className="empty-state">No trips recorded in the system yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>User</th>
                      <th>Entry Station</th>
                      <th>Exit Station</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Entry Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>#{trip.id}</td>
                        <td>User #{trip.user_id}</td>
                        <td>
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
                        <td style={{ fontWeight: 700 }}>
                          {trip.fare_charged != null ? formatCurrency(trip.fare_charged) : '—'}
                        </td>
                        <td>
                          <span className={statusClass(trip.status)}>{trip.status}</span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {formatDateTime(trip.entry_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
