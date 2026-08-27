import { useEffect, useRef } from 'react';

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
      {/* Precision Digital Dot-Matrix Grid */}
      <div className="auth-bg-pattern" />

      {/* Ambient Glowing Luminescence */}
      <div className="auth-bg-orb orb-primary" />
      <div className="auth-bg-orb orb-secondary" />
      <div className="auth-bg-orb orb-accent" />
      <div className="auth-bg-orb orb-center" />

      {/* Floating Micro-Particles */}
      <div className="floating-particles-layer">
        <span className="particle p-1" />
        <span className="particle p-2" />
        <span className="particle p-3" />
        <span className="particle p-4" />
        <span className="particle p-5" />
        <span className="particle p-6" />
      </div>

      {/* Elegant SVG Transit Lines & Biometric Vectors (No Text Clutter) */}
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
            <stop offset="0%" stopColor="#001e40" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#00696e" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#00dce5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#63f7ff" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="lineGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d5e3ff" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#00f4fe" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#001e40" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="lineGradExpress" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#006c71" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00dce5" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3a5f94" stopOpacity="0.2" />
          </linearGradient>

          {/* High-Tech Neon Glow filter */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Global Coordinate Gridlines */}
        <g stroke="#c3c6d1" strokeWidth="0.75" opacity="0.25" strokeDasharray="6 6">
          <line x1="0" y1="180" x2="1440" y2="180" />
          <line x1="0" y1="450" x2="1440" y2="450" />
          <line x1="0" y1="720" x2="1440" y2="720" />
          <line x1="240" y1="0" x2="240" y2="900" />
          <line x1="680" y1="0" x2="680" y2="900" />
          <line x1="1120" y1="0" x2="1120" y2="900" />
        </g>

        {/* Biometric Concentric Radar Reticle */}
        <g transform="translate(1220, 180)" opacity="0.35">
          <circle r="140" stroke="#00dce5" strokeWidth="1" strokeDasharray="4 8" className="radar-spin-slow" />
          <circle r="100" stroke="#003366" strokeWidth="1.2" strokeDasharray="12 6" className="radar-spin-reverse" />
          <circle r="60" stroke="#00f4fe" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="-150" y1="0" x2="150" y2="0" stroke="#00dce5" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="0" y1="-150" x2="0" y2="150" stroke="#00dce5" strokeWidth="0.75" strokeDasharray="4 4" />
        </g>

        {/* Biometric Ridge Waveform Oscilloscope Curve */}
        <path
          d="M 0 540 Q 180 500, 360 540 T 720 540 T 1080 540 T 1440 540"
          stroke="#00f4fe"
          strokeWidth="1.25"
          opacity="0.3"
          strokeDasharray="4 4"
          className="waveform-anim"
        />

        {/* Line 1: Express Blue/Cyan Trunk Route */}
        <path
          id="routeTrack1"
          d="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
          stroke="url(#lineGradMain)"
          strokeWidth="4.5"
          strokeLinecap="round"
          filter="url(#neonGlow)"
          className="transit-track track-primary"
        />

        {/* Line 1 Base Track Guide */}
        <path
          d="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
          stroke="#001b3c"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.3"
        />

        {/* Train Carriage Data Packet 1 on Line 1 */}
        <g filter="url(#neonGlow)">
          <circle r="6.5" fill="#ffffff" stroke="#00f4fe" strokeWidth="3">
            <animateMotion
              dur="8.5s"
              repeatCount="indefinite"
              path="M -150 220 C 250 140, 420 480, 780 340 C 1120 220, 1260 620, 1650 540"
            />
          </circle>
        </g>

        {/* Line 2: South-East Cross-City Link */}
        <path
          id="routeTrack2"
          d="M -80 780 C 220 620, 520 840, 920 700 C 1220 580, 1380 740, 1580 710"
          stroke="url(#lineGradSecondary)"
          strokeWidth="3.5"
          strokeDasharray="14 10"
          filter="url(#neonGlow)"
          className="transit-track track-secondary"
        />

        {/* Train Carriage Data Packet 2 on Line 2 */}
        <g filter="url(#neonGlow)">
          <circle r="5.5" fill="#00f4fe" stroke="#ffffff" strokeWidth="2.5">
            <animateMotion
              dur="12s"
              repeatCount="indefinite"
              path="M -80 780 C 220 620, 520 840, 920 700 C 1220 580, 1380 740, 1580 710"
            />
          </circle>
        </g>

        {/* Line 3: Speed Aerodynamic Curve (Angin Vector Spine) */}
        <path
          d="M 50 -80 C 280 280, 680 180, 1080 480 C 1280 660, 1420 830, 1550 980"
          stroke="url(#lineGradExpress)"
          strokeWidth="3"
          strokeDasharray="6 6"
          className="transit-track track-speed"
        />

        {/* Station Interchanges with Radiating Radar Beacons */}
        <g className="transit-node node-beacon" transform="translate(420, 480)">
          <circle r="26" fill="#00f4fe" fillOpacity="0.14" className="beacon-ripple" />
          <circle r="14" fill="#00696e" fillOpacity="0.35" />
          <circle r="8" fill="#ffffff" stroke="#00dce5" strokeWidth="3" />
          <circle r="3" fill="#001e40" />
        </g>

        <g className="transit-node node-beacon" transform="translate(780, 340)">
          <circle r="30" fill="#a7c8ff" fillOpacity="0.16" className="beacon-ripple" />
          <circle r="16" fill="#003366" fillOpacity="0.4" />
          <circle r="9" fill="#ffffff" stroke="#001e40" strokeWidth="3.5" />
          <circle r="4" fill="#00dce5" />
        </g>

        <g className="transit-node node-beacon" transform="translate(920, 700)">
          <circle r="22" fill="#00f4fe" fillOpacity="0.16" className="beacon-ripple" />
          <circle r="11" fill="#006c71" fillOpacity="0.4" />
          <circle r="6.5" fill="#ffffff" stroke="#00f4fe" strokeWidth="2.5" />
        </g>

        <g className="transit-node node-beacon" transform="translate(250, 140)">
          <circle r="20" fill="#3a5f94" fillOpacity="0.15" className="beacon-ripple" />
          <circle r="10" fill="#ffffff" stroke="#3a5f94" strokeWidth="3" />
          <circle r="3.5" fill="#00696e" />
        </g>
      </svg>
    </div>
  );
}
