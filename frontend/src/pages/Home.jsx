import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import AuthBackground from '../components/AuthBackground';
import { useAuth } from '../auth/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page-container">
      {/* Interactive Background */}
      <AuthBackground />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-status-pill">
            <span className="status-dot" />
            <span>Next-Gen Biometric Transit Infrastructure • 2026 Core Live</span>
          </div>

          <h1 className="hero-title">
            The Future of <span className="text-gradient">Metro Travel</span> is in Your Hands
          </h1>

          <p className="hero-subtitle">
            Skip long ticketing queues and eliminate plastic RFID cards. 
            Angin delivers millisecond biometric authentication, automated distance-based fare deductions, 
            and intelligent anti-fraud protection for modern smart cities.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <>
                <Link to="/wallet" className="btn btn-primary hero-btn">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span>My Digital Wallet</span>
                </Link>
                <Link to="/entry" className="btn btn-secondary hero-btn">
                  <span className="material-symbols-outlined">login</span>
                  <span>Launch Gate Simulator</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary hero-btn">
                  <span>Get Started Free</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link to="/login" className="btn btn-secondary hero-btn">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Telemetry Highlights Bar */}
          <div className="hero-metrics-bar">
            <div className="metric-pill">
              <span className="metric-val">&lt; 350ms</span>
              <span className="metric-desc">Gate Auth Velocity</span>
            </div>
            <div className="metric-sep" />
            <div className="metric-pill">
              <span className="metric-val">100%</span>
              <span className="metric-desc">Cardless &amp; Contactless</span>
            </div>
            <div className="metric-sep" />
            <div className="metric-pill">
              <span className="metric-val">Dynamic</span>
              <span className="metric-desc">Smart Distance Fare</span>
            </div>
            <div className="metric-sep" />
            <div className="metric-pill">
              <span className="metric-val">AI Anti-Spoof</span>
              <span className="metric-desc">Fraud Defense</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Identity & Logo Philosophy Section */}
      <section className="identity-section" id="identity">
        <div className="section-header">
          <div className="section-badge">Brand Identity &amp; Meaning</div>
          <h2 className="section-title">The Philosophy Behind Angin</h2>
          <p className="section-subtitle">
            Named after the Indonesian word for <em>&quot;Wind&quot;</em>, Angin represents the seamless fusion of uncompromised security and frictionless urban velocity.
          </p>
        </div>

        <div className="identity-card-grid">
          <div className="identity-hero-card glass-panel">
            {/* Left Column: Big Brand Emblem Showcase */}
            <div className="identity-emblem-showcase">
              <BrandLogo size="hero" layout="column" />
              <div className="emblem-tagline">Security Meets Velocity</div>
              <div className="emblem-subtag">Biometric Transit Identity System</div>
            </div>

            {/* Right Column: The 4 Core Pillars */}
            <div className="identity-pillars">
              <div className="pillar-item">
                <div className="pillar-icon bg-primary-fixed">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                    fingerprint
                  </span>
                </div>
                <div className="pillar-content">
                  <div className="pillar-badge">The Core Emblem</div>
                  <h3>The Fingerprint (Security)</h3>
                  <p>
                    The circular core of the mark is derived from the organic, unique ridge minutiae of a human fingerprint. 
                    This represents the cryptographic foundation of the system—a non-transferable biometric key that belongs strictly to you and can never be lost, cloned, or stolen.
                  </p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon bg-secondary-fixed">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>
                    air
                  </span>
                </div>
                <div className="pillar-content">
                  <div className="pillar-badge secondary">Aerodynamic Motion</div>
                  <h3>The Wind Lines (Velocity)</h3>
                  <p>
                    As the fingerprint ridges transition outward to the right, they evolve into fluid, aerodynamic speed vectors. 
                    This embodies the &quot;wind-like&quot; velocity of modern transit—allowing thousands of commuters to flow through turnstiles in milliseconds without gate congestion.
                  </p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon bg-tertiary-fixed">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-container)' }}>
                    palette
                  </span>
                </div>
                <div className="pillar-content">
                  <div className="pillar-badge tertiary">Visual System</div>
                  <h3>Transit Palette &amp; Typography</h3>
                  <p>
                    <strong>Deep Metro Blue (#001e40)</strong> evokes institutional trust, safety, and infrastructure resilience. 
                    <strong>Electric Teal (#00f4fe)</strong> symbolizes laser sensor precision and digital velocity. 
                    Set in geometric <strong>Plus Jakarta Sans</strong> and <strong>Inter</strong> for optimal readability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Bento Grid */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-badge">Engineering Capabilities</div>
          <h2 className="section-title">Built to Solve Real Transit Challenges</h2>
          <p className="section-subtitle">
            Engineered with full working logic: automated distance fares, entry safety thresholds, and advanced fraud detection.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: Problem vs Solution Full-Width Feature Card */}
          <div className="bento-card bento-wide glass-panel interactive-card">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge text-error bg-error-container">
                <span className="material-symbols-outlined">compare_arrows</span>
              </div>
              <span className="feature-status-tag">The Angin Solution</span>
            </div>

            <h3>Eliminating Metro Friction Points</h3>
            <p>
              Traditional public metro networks suffer from severe passenger throughput bottlenecks: 
              vending machine queues, lost RFID cards, unreadable QR paper tokens, and gate turnstile jams.
            </p>

            <div className="comparison-pills-grid">
              <div className="comparison-item bad">
                <span className="material-symbols-outlined">cancel</span>
                <div>
                  <strong>Traditional Cards &amp; Paper:</strong> 
                  <span> 5–15 min queue wait times, lost tickets, unreadable cards.</span>
                </div>
              </div>
              <div className="comparison-item good">
                <span className="material-symbols-outlined">check_circle</span>
                <div>
                  <strong>Angin Biometric Flow:</strong> 
                  <span> &lt; 350ms gate walkthrough, zero physical tokens, 100% digital wallet.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contactless Biometric Onboarding */}
          <div className="bento-card glass-panel interactive-card">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge text-secondary bg-secondary-container-low">
                <span className="material-symbols-outlined">contactless</span>
              </div>
              <span className="feature-status-tag">Seamless Access</span>
            </div>
            <h3>Cardless Convenience</h3>
            <p>
              Register once, store your biometric template securely, and travel across the entire network. 
              Your physical presence is your ticket.
            </p>
            <div className="bento-sub-badge">
              <span className="material-symbols-outlined">fingerprint</span>
              <span>OpenCV Minutiae Template Matching</span>
            </div>
          </div>

          {/* Card 3: Dynamic Distance Fare */}
          <div className="bento-card glass-panel interactive-card">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge text-primary bg-primary-fixed">
                <span className="material-symbols-outlined">calculate</span>
              </div>
              <span className="feature-status-tag">Automated Engine</span>
            </div>
            <h3>Smart Distance Fare Matrix</h3>
            <p>
              No need to specify your destination station ahead of time. 
              The system timestamps your entry station and calculates exact distance-based fares only when you tap out.
            </p>
            <div className="bento-sub-badge">
              <span className="material-symbols-outlined">route</span>
              <span>Central → North Park → South Side → East End</span>
            </div>
          </div>

          {/* Card 4: Minimum Balance Entry Rule */}
          <div className="bento-card glass-panel interactive-card">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge text-secondary bg-secondary-container-low">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <span className="feature-status-tag">Zero Gate Deadlocks</span>
            </div>
            <h3>Minimum Balance Entry Rule</h3>
            <p>
              Passengers enter only if their wallet holds at least the maximum network fare (₹5.00+). 
              This guarantees that no commuter can run out of funds mid-journey, eliminating exit turnstile blocks.
            </p>
            <div className="bento-sub-badge">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span>Guaranteed Exit Clearance</span>
            </div>
          </div>

          {/* Card 5: Standout Security (Anti-Spoof & Impossible Travel) */}
          <div className="bento-card bento-wide glass-panel interactive-card bg-primary-container text-white">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge bg-white text-primary">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <span className="feature-status-tag highlight">Standout Innovation</span>
            </div>

            <h3 style={{ color: '#ffffff' }}>Standout Anti-Fraud Intelligence</h3>
            <p style={{ color: 'var(--color-primary-fixed-dim)' }}>
              Unlike generic student ticketing projects, Angin implements intelligent security checks to safeguard revenue and commuter integrity:
            </p>

            <div className="fraud-checks-grid">
              <div className="fraud-check-pill">
                <span className="material-symbols-outlined text-secondary-fixed">security_update_warning</span>
                <div>
                  <strong style={{ color: '#ffffff' }}>Synthetic Spoof Detection:</strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.88 }}>
                    Automatically detects and rejects blank, corrupted, or synthetic fake fingerprint images.
                  </p>
                </div>
              </div>

              <div className="fraud-check-pill">
                <span className="material-symbols-outlined text-secondary-fixed">speed</span>
                <div>
                  <strong style={{ color: '#ffffff' }}>Impossible-Travel Spatial Check:</strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.88 }}>
                    Catches and flags fraudulent attempts when the same user ID attempts entry at two distant stations simultaneously.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Zero-Knowledge Privacy */}
          <div className="bento-card glass-panel interactive-card">
            <div className="bento-card-top-row">
              <div className="bento-icon-badge text-primary bg-primary-fixed">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <span className="feature-status-tag">Privacy First</span>
            </div>
            <h3>Biometric Privacy Architecture</h3>
            <p>
              Fingerprint templates are stored securely and matched via mathematical feature vectors. 
              Raw biometric scans are never exposed in readable image format to unauthorized endpoints.
            </p>
            <div className="bento-sub-badge">
              <span className="material-symbols-outlined">encrypted</span>
              <span>Encrypted Feature Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Transit Flow */}
      <section className="workflow-section" id="how-it-works">
        <div className="section-header">
          <div className="section-badge">How It Works</div>
          <h2 className="section-title">Commuting in 3 Seamless Steps</h2>
          <p className="section-subtitle">
            From registration to destination exit, here is the complete end-to-end journey.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card glass-panel interactive-card">
            <div className="step-number-badge">1</div>
            <h4>Enroll &amp; Top Up</h4>
            <p>
              Create your account with name and email, register your biometric fingerprint template, and add funds to your digital wallet with quick recharge chips.
            </p>
            <div className="step-tag">Step 01 • Onboarding</div>
          </div>

          <div className="step-arrow">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>

          <div className="step-card glass-panel interactive-card">
            <div className="step-number-badge">2</div>
            <h4>Entry Gate Verification</h4>
            <p>
              Select your boarding station and scan your fingerprint. The system verifies wallet balance sufficiency (&ge; ₹5.00) and opens the gate in milliseconds.
            </p>
            <div className="step-tag">Step 02 • Boarding</div>
          </div>

          <div className="step-arrow">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>

          <div className="step-card glass-panel highlight-step interactive-card">
            <div className="step-number-badge active">3</div>
            <h4>Exit Gate &amp; Fare Deduction</h4>
            <p>
              Tap your finger at your destination station. The smart fare engine calculates the exact journey distance, deducts the fare, and updates your ride history.
            </p>
            <div className="step-tag active">Step 03 • Completion</div>
          </div>
        </div>
      </section>

      {/* Ready to Ride Call to Action */}
      <section className="cta-banner-section">
        <div className="cta-banner-card glass-panel">
          <div className="section-badge" style={{ marginBottom: '0.75rem' }}>Experience Angin Today</div>
          <h2>Ready for Frictionless Urban Transit?</h2>
          <p>
            Test the complete biometric transit lifecycle: test gate entry, wallet top-ups, distance fare calculation, and admin fraud audits.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.85rem' }}>
              <span>Create Free Account</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/entry" className="btn btn-secondary" style={{ padding: '0.85rem 1.85rem' }}>
              <span className="material-symbols-outlined">login</span>
              <span>Test Entry Gate</span>
            </Link>
            <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.85rem 1.85rem' }}>
              <span className="material-symbols-outlined">dashboard</span>
              <span>Admin Center</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
