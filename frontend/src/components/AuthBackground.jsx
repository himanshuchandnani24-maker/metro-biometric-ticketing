import React, { useEffect, useRef } from 'react';

export default function AuthBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1

      containerRef.current.style.setProperty('--mouse-x', x.toFixed(3));
      containerRef.current.style.setProperty('--mouse-y', y.toFixed(3));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="auth-bg-canvas" aria-hidden="true">
      {/* Radial Dot Pattern Layer with Parallax */}
      <div className="auth-bg-pattern" />

      {/* Interactive Glowing Ambient Orbs */}
      <div className="auth-bg-orb orb-primary" />
      <div className="auth-bg-orb orb-secondary" />
      <div className="auth-bg-orb orb-accent" />
      <div className="auth-bg-orb orb-center" />

      {/* Floating Transit Particles */}
      <div className="floating-particles-layer">
        <span className="particle p-1" />
        <span className="particle p-2" />
        <span className="particle p-3" />
        <span className="particle p-4" />
        <span className="particle p-5" />
        <span className="particle p-6" />
      </div>

      {/* High-Tech Metro Transit Route Lines SVG */}
      <svg
        className="auth-bg-lines"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="lineGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003366" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#00696e" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#00dce5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#63f7ff" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="lineGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a7c8ff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00f4fe" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#001e40" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="lineGradSpeed" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#006c71" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00dce5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3a5f94" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Primary Metro Line 1 */}
        <path
          id="routeTrack1"
          d="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
          stroke="url(#lineGradMain)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#neonGlow)"
          className="transit-track track-primary"
        />

        {/* Metro Track 1 Base Guide */}
        <path
          d="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
          stroke="#001b3c"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.3"
        />

        {/* Animated Transit Packet 1 */}
        <circle r="6" fill="#ffffff" stroke="#00f4fe" strokeWidth="3" filter="url(#neonGlow)">
          <animateMotion
            dur="9s"
            repeatCount="indefinite"
            path="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
          />
        </circle>

        {/* Secondary Cross Line 2 */}
        <path
          id="routeTrack2"
          d="M -80 780 C 220 620, 520 840, 920 700 C 1220 580, 1380 740, 1580 710"
          stroke="url(#lineGradSecondary)"
          strokeWidth="3.5"
          strokeDasharray="14 10"
          filter="url(#neonGlow)"
          className="transit-track track-secondary"
        />

        {/* Animated Transit Packet 2 */}
        <circle r="5" fill="#00f4fe" stroke="#ffffff" strokeWidth="2.5" filter="url(#neonGlow)">
          <animateMotion
            dur="13s"
            repeatCount="indefinite"
            path="M -80 780 C 220 620, 520 840, 920 700 C 1220 580, 1380 740, 1580 710"
          />
        </circle>

        {/* Speed Arc Line 3 (Angin Vector Curve) */}
        <path
          d="M 50 -80 C 280 280, 680 180, 1080 480 C 1280 660, 1420 830, 1550 980"
          stroke="url(#lineGradSpeed)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="transit-track track-speed"
        />

        {/* Intersecting Biometric Gate Node Beacons */}
        <g className="transit-node node-beacon" transform="translate(420, 480)">
          <circle r="22" fill="#00f4fe" fillOpacity="0.12" className="beacon-ripple" />
          <circle r="12" fill="#00696e" fillOpacity="0.3" />
          <circle r="7" fill="#ffffff" stroke="#00dce5" strokeWidth="3" />
          <circle r="2.5" fill="#001e40" />
        </g>

        <g className="transit-node node-beacon" transform="translate(780, 340)">
          <circle r="26" fill="#a7c8ff" fillOpacity="0.15" className="beacon-ripple" />
          <circle r="14" fill="#003366" fillOpacity="0.35" />
          <circle r="8" fill="#ffffff" stroke="#001e40" strokeWidth="3" />
          <circle r="3.5" fill="#00dce5" />
        </g>

        <g className="transit-node node-beacon" transform="translate(920, 700)">
          <circle r="20" fill="#00f4fe" fillOpacity="0.15" className="beacon-ripple" />
          <circle r="10" fill="#006c71" fillOpacity="0.35" />
          <circle r="6" fill="#ffffff" stroke="#00f4fe" strokeWidth="2.5" />
        </g>

        <g className="transit-node node-beacon" transform="translate(250, 140)">
          <circle r="18" fill="#3a5f94" fillOpacity="0.15" className="beacon-ripple" />
          <circle r="9" fill="#ffffff" stroke="#3a5f94" strokeWidth="2.5" />
          <circle r="3" fill="#00696e" />
        </g>
      </svg>
    </div>
  );
}
