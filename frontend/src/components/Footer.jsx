import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer className="footer-stitch">
      <div className="footer-container">
        {/* Top Tier: Brand, Mission & Quick Navigation */}
        <div className="footer-grid">
          {/* Brand & Vision */}
          <div className="footer-brand-col">
            <div className="footer-brand-lockup">
              <BrandLogo size="md" layout="row" />
            </div>
            <p className="footer-vision-text">
              Cardless, millisecond biometric ticketing system built for high-velocity metro transit and automated distance fare management.
            </p>
            <div className="footer-status-badge">
              <span className="status-indicator-dot" />
              <span className="status-indicator-text">Transit Network Online • 2026 Core</span>
            </div>
          </div>

          {/* Real Working Page Links: Gate Simulator */}
          <div className="footer-links-col">
            <h4>Gate Simulator</h4>
            <ul>
              <li><Link to="/entry">Station Entry Gate</Link></li>
              <li><Link to="/exit">Station Exit Gate</Link></li>
              <li><Link to="/wallet">Digital Wallet &amp; Pass</Link></li>
            </ul>
          </div>

          {/* Real Working Page Links: Rider Account */}
          <div className="footer-links-col">
            <h4>Rider Services</h4>
            <ul>
              <li><Link to="/history">Personal Travel Logs</Link></li>
              <li><Link to="/admin">Admin Control Center</Link></li>
              <li><Link to="/faq">Commuter Help &amp; FAQs</Link></li>
            </ul>
          </div>

          {/* Real Working Page Links: Account Auth */}
          <div className="footer-links-col">
            <h4>Account Access</h4>
            <ul>
              <li><Link to="/login">Sign In to Account</Link></li>
              <li><Link to="/register">Create New Account</Link></li>
              <li><Link to="/">Home Overview</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Tier: Copyright */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            © 2026 Angin Biometric Transit Infrastructure.
          </div>
          <div className="footer-bottom-tags">
            <span>Cardless Biometric Mobility</span>
            <span className="footer-divider">•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
