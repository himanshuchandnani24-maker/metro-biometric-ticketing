import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATIONS, formatCurrency } from '../constants';

// Realistic fare and travel time matrix based on station distances
const ROUTE_DATA = {
  '1-2': { fare: 2.50, time: 5, stops: 1, dist: '3.2 km', line: 'Cyan Express' },
  '1-3': { fare: 3.00, time: 9, stops: 2, dist: '6.8 km', line: 'Blue Metro Line' },
  '1-4': { fare: 4.00, time: 14, stops: 3, dist: '11.5 km', line: 'Direct Express' },
  '2-1': { fare: 2.50, time: 5, stops: 1, dist: '3.2 km', line: 'Cyan Express' },
  '2-3': { fare: 3.50, time: 8, stops: 1, dist: '5.4 km', line: 'Cross-City Link' },
  '2-4': { fare: 5.00, time: 16, stops: 2, dist: '13.1 km', line: 'Perimeter Line' },
  '3-1': { fare: 3.00, time: 9, stops: 2, dist: '6.8 km', line: 'Blue Metro Line' },
  '3-2': { fare: 3.50, time: 8, stops: 1, dist: '5.4 km', line: 'Cross-City Link' },
  '3-4': { fare: 2.00, time: 4, stops: 1, dist: '2.9 km', line: 'East Shuttle' },
  '4-1': { fare: 4.00, time: 14, stops: 3, dist: '11.5 km', line: 'Direct Express' },
  '4-2': { fare: 5.00, time: 16, stops: 2, dist: '13.1 km', line: 'Perimeter Line' },
  '4-3': { fare: 2.00, time: 4, stops: 1, dist: '2.9 km', line: 'East Shuttle' },
};

const STATION_META = {
  1: { code: 'CEN', type: 'Grand Central Terminal', status: 'Optimal Flow', crowd: '24% Load', icon: 'hub' },
  2: { code: 'NPK', type: 'Tech District Hub', status: 'On-Time', crowd: '48% Load', icon: 'apartment' },
  3: { code: 'SSD', type: 'Commercial Interchange', status: 'Moderate Flow', crowd: '62% Load', icon: 'storefront' },
  4: { code: 'EED', type: 'East Bay Residential', status: 'Light Traffic', crowd: '18% Load', icon: 'nature_people' },
};

export default function MetroMapCalculator() {
  const [originId, setOriginId] = useState(1);
  const [destId, setDestId] = useState(4);
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'lines'

  const isSameStation = originId === destId;
  const routeKey = `${originId}-${destId}`;
  const routeInfo = ROUTE_DATA[routeKey] || { fare: 2.00, time: 3, stops: 0, dist: '0.0 km', line: 'Local Loop' };

  const handleSwapStations = () => {
    const temp = originId;
    setOriginId(destId);
    setDestId(temp);
  };

  const handleStationNodeClick = (stationId) => {
    if (originId === stationId) {
      // do nothing or cycle
      return;
    }
    if (originId && !destId) {
      setDestId(stationId);
    } else {
      // set as destination if different from origin
      setDestId(stationId);
    }
  };

  return (
    <div className="metro-map-calculator-container glass-panel">
      {/* Section Header with Mode Switch */}
      <div className="calculator-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>route</span>
            <span>Interactive Network Map &amp; Fare Engine</span>
          </div>
          <h3 className="calc-title">Network Route &amp; Dynamic Fare Calculator</h3>
          <p className="calc-subtitle">
            Select boarding and destination stations to compute real-time distance fares, transit duration, and crowd levels.
          </p>
        </div>

        <div className="calc-tab-controls">
          <button
            type="button"
            className={`calc-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <span className="material-symbols-outlined">calculate</span>
            <span>Fare Engine</span>
          </button>
          <button
            type="button"
            className={`calc-tab-btn ${activeTab === 'lines' ? 'active' : ''}`}
            onClick={() => setActiveTab('lines')}
          >
            <span className="material-symbols-outlined">map</span>
            <span>Line Schematics</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Live Fare Summary */}
      <div className="calc-main-grid">
        {/* Left Column: Interactive Visual Transit Line Map */}
        <div className="map-visual-panel">
          <div className="map-panel-header">
            <span className="map-network-tag">
              <span className="live-pulsing-dot" />
              <span>Angin Metro Line 1 &amp; Express Link</span>
            </span>
            <span className="map-interactive-hint">Tap any station node to select destination</span>
          </div>

          {/* Interactive SVG Transit Line Map */}
          <div className="interactive-svg-track-wrapper">
            <svg viewBox="0 0 700 240" className="transit-map-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Active Path Gradient */}
                <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#001e40" />
                  <stop offset="50%" stopColor="#00696e" />
                  <stop offset="100%" stopColor="#00dce5" />
                </linearGradient>

                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Inactive Track Grid */}
              <line x1="80" y1="120" x2="620" y2="120" stroke="#d8dadc" strokeWidth="8" strokeLinecap="round" />
              <line x1="80" y1="120" x2="620" y2="120" stroke="#eceef0" strokeWidth="4" strokeDasharray="6 6" />

              {/* Active Path Line Segment */}
              <line
                x1={80 + (Math.min(originId, destId) - 1) * 180}
                y1="120"
                x2={80 + (Math.max(originId, destId) - 1) * 180}
                y2="120"
                stroke="url(#activeRouteGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                filter="url(#nodeGlow)"
                className="active-route-line-anim"
              />

              {/* Moving Train Packet Indicator on Active Route */}
              {!isSameStation && (
                <circle r="7" fill="#00f4fe" stroke="#ffffff" strokeWidth="2.5" filter="url(#nodeGlow)">
                  <animate
                    attributeName="cx"
                    from={80 + (originId - 1) * 180}
                    to={80 + (destId - 1) * 180}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="cy" values="120; 120" dur="3s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Interactive Station Nodes */}
              {STATIONS.map((station, idx) => {
                const cx = 80 + idx * 180;
                const isOrigin = station.id === originId;
                const isDest = station.id === destId;
                const isInPath =
                  (station.id >= Math.min(originId, destId) && station.id <= Math.max(originId, destId));

                return (
                  <g
                    key={station.id}
                    className={`station-svg-node ${isOrigin ? 'is-origin' : ''} ${isDest ? 'is-dest' : ''}`}
                    onClick={() => handleStationNodeClick(station.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Ripple on active nodes */}
                    {(isOrigin || isDest) && (
                      <circle
                        cx={cx}
                        cy="120"
                        r="24"
                        fill={isOrigin ? 'rgba(0, 30, 64, 0.15)' : 'rgba(0, 220, 229, 0.25)'}
                        className="beacon-ripple"
                      />
                    )}

                    {/* Outer Circle */}
                    <circle
                      cx={cx}
                      cy="120"
                      r="16"
                      fill="#ffffff"
                      stroke={
                        isOrigin
                          ? '#001e40'
                          : isDest
                          ? '#00696e'
                          : isInPath
                          ? '#00dce5'
                          : '#c3c6d1'
                      }
                      strokeWidth={isOrigin || isDest ? '4' : '3'}
                      filter="url(#nodeGlow)"
                    />

                    {/* Inner Core */}
                    <circle
                      cx={cx}
                      cy="120"
                      r="7"
                      fill={
                        isOrigin
                          ? '#001e40'
                          : isDest
                          ? '#00dce5'
                          : isInPath
                          ? '#00696e'
                          : '#737780'
                      }
                    />

                    {/* Station Number Badge */}
                    <text
                      x={cx}
                      y="124"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {station.id}
                    </text>

                    {/* Station Label Top */}
                    <text
                      x={cx}
                      y="78"
                      textAnchor="middle"
                      className="svg-station-name"
                      fontWeight="700"
                      fontSize="13"
                      fill={isOrigin || isDest ? '#001e40' : '#43474f'}
                    >
                      {station.name}
                    </text>

                    {/* Station Status Subtitle */}
                    <text
                      x={cx}
                      y="94"
                      textAnchor="middle"
                      fontSize="10.5"
                      fill={isOrigin ? '#001e40' : isDest ? '#00696e' : '#737780'}
                      fontWeight="600"
                    >
                      {isOrigin ? 'Origin Station' : isDest ? 'Destination' : STATION_META[station.id].code}
                    </text>

                    {/* Live Crowd Tag Bottom */}
                    <rect
                      x={cx - 38}
                      y="155"
                      width="76"
                      height="22"
                      rx="11"
                      fill={isOrigin || isDest ? '#d5e3ff' : '#eceef0'}
                    />
                    <text
                      x={cx}
                      y="170"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={isOrigin || isDest ? '#001b3c' : '#5c6b7a'}
                    >
                      {STATION_META[station.id].crowd}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Station Quick Meta Cards */}
          <div className="station-meta-cards-row">
            {STATIONS.map((station) => {
              const meta = STATION_META[station.id];
              const isSelected = station.id === originId || station.id === destId;
              return (
                <div
                  key={station.id}
                  className={`station-mini-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleStationNodeClick(station.id)}
                >
                  <div className="mini-pill-top">
                    <span className="material-symbols-outlined mini-pill-icon">{meta.icon}</span>
                    <span className="mini-pill-code">#{station.id} {meta.code}</span>
                  </div>
                  <div className="mini-pill-name">{station.name}</div>
                  <div className="mini-pill-status">
                    <span className="status-mini-dot" />
                    <span>{meta.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Station Selector & Dynamic Calculation Result */}
        <div className="calc-summary-panel">
          <div className="selector-control-box">
            {/* Origin Station Dropdown */}
            <div className="selector-group">
              <label className="selector-label">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                  trip_origin
                </span>
                <span>Boarding Station (Origin)</span>
              </label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">login</span>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(Number(e.target.value))}
                  className="calc-select"
                >
                  {STATIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      Station #{st.id} — {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="swap-btn-wrap">
              <button
                type="button"
                className="btn-swap-stations"
                onClick={handleSwapStations}
                title="Swap Origin and Destination"
              >
                <span className="material-symbols-outlined">swap_vert</span>
              </button>
            </div>

            {/* Destination Station Dropdown */}
            <div className="selector-group">
              <label className="selector-label">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>
                  location_on
                </span>
                <span>Alighting Station (Destination)</span>
              </label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon-lead">logout</span>
                <select
                  value={destId}
                  onChange={(e) => setDestId(Number(e.target.value))}
                  className="calc-select"
                >
                  {STATIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      Station #{st.id} — {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fare Calculation Display Box */}
          <div className="calc-result-card">
            {isSameStation ? (
              <div className="same-station-alert">
                <span className="material-symbols-outlined text-warning" style={{ fontSize: '28px' }}>
                  info
                </span>
                <p>
                  Please select two different stations to compute transit fare and route schedule.
                </p>
              </div>
            ) : (
              <>
                <div className="fare-metric-row">
                  <div>
                    <span className="fare-label">Dynamic Distance Fare</span>
                    <div className="fare-big-number">{formatCurrency(routeInfo.fare)}</div>
                  </div>
                  <div className="fare-service-tag">
                    <span className="material-symbols-outlined">bolt</span>
                    <span>{routeInfo.line}</span>
                  </div>
                </div>

                <div className="route-stats-grid">
                  <div className="route-stat-item">
                    <span className="material-symbols-outlined">timer</span>
                    <div>
                      <div className="stat-value">{routeInfo.time} Mins</div>
                      <div className="stat-sub">Est. Travel Time</div>
                    </div>
                  </div>

                  <div className="route-stat-item">
                    <span className="material-symbols-outlined">distance</span>
                    <div>
                      <div className="stat-value">{routeInfo.dist}</div>
                      <div className="stat-sub">Network Distance</div>
                    </div>
                  </div>

                  <div className="route-stat-item">
                    <span className="material-symbols-outlined">alt_route</span>
                    <div>
                      <div className="stat-value">{routeInfo.stops} Intermediate</div>
                      <div className="stat-sub">Interchange Stops</div>
                    </div>
                  </div>

                  <div className="route-stat-item">
                    <span className="material-symbols-outlined">verified</span>
                    <div>
                      <div className="stat-value">₹5.00 Balance</div>
                      <div className="stat-sub">Gate Entry Rule</div>
                    </div>
                  </div>
                </div>

                <div className="fare-action-footer">
                  <Link
                    to={`/entry`}
                    className="btn btn-primary btn-block"
                    style={{ height: '46px' }}
                  >
                    <span className="material-symbols-outlined">sensor_door</span>
                    <span>Simulate Entry at Station #{originId}</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
