import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer className="footer-stitch">
      <div className="footer-container">
        {/* Top Tier: Brand, Mission Vision & Network Status */}
        <div className="footer-grid">
          {/* Brand & Vision */}
          <div className="footer-brand-col">
            <div className="footer-brand-lockup">
              <BrandLogo size="md" layout="row" />
            </div>
            <p className="footer-vision-text">
              Revolutionizing urban transit with secure, millisecond biometric authentication. 
              Eliminating physical tickets and bottlenecks to power frictionless mobility for next-generation smart cities.
            </p>
            <div className="footer-status-badge">
              <span className="status-indicator-dot" />
              <span className="status-indicator-text">Transit Network Online • 2026 Core Live</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="footer-links-col">
            <h4>Transit System</h4>
            <ul>
              <li><Link to="/wallet">Digital Wallet</Link></li>
              <li><Link to="/entry">Entry Gate Simulator</Link></li>
              <li><Link to="/exit">Exit Gate Simulator</Link></li>
              <li><Link to="/history">Travel Logs</Link></li>
            </ul>
          </div>

          {/* Infrastructure & Security */}
          <div className="footer-links-col">
            <h4>Technology & Privacy</h4>
            <ul>
              <li><a href="#biometrics" onClick={(e) => e.preventDefault()}>Biometric Zero-Knowledge Proofs</a></li>
              <li><a href="#security" onClick={(e) => e.preventDefault()}>Encrypted Edge Enclaves</a></li>
              <li><a href="#fare" onClick={(e) => e.preventDefault()}>Smart Dynamic Fare Matrix</a></li>
              <li><Link to="/admin">Admin Operations</Link></li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="footer-links-col">
            <h4>Standards & Support</h4>
            <ul>
              <li><a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
              <li><a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
              <li><a href="#accessibility" onClick={(e) => e.preventDefault()}>A11y Accessibility</a></li>
              <li><a href="#support" onClick={(e) => e.preventDefault()}>24/7 Transit Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Tier: Copyright & Meta */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            © 2026 Angin Infrastructure Project. Designed for High-Velocity Commuters.
          </div>
          <div className="footer-bottom-tags">
            <span>Powered by Biometric Enclave Architecture</span>
            <span className="footer-divider">•</span>
            <span>Version 2.4.0 (2026 Edition)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
