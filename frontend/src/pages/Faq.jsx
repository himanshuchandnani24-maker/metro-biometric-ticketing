import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthBackground from '../components/AuthBackground';

const FAQ_ITEMS = [
  {
    id: 1,
    category: 'Biometric Technology & Security',
    icon: 'fingerprint',
    question: 'How does Angin biometric gate authentication work?',
    answer:
      'When you touch the station gate sensor, your fingerprint minutiae (ridge ends and bifurcations) are scanned at 500-DPI resolution. The extracted pattern is converted into an encrypted mathematical hash and matched against your enrolled template in under 350 milliseconds. No raw fingerprint images are stored.',
  },
  {
    id: 2,
    category: 'Biometric Technology & Security',
    icon: 'shield_lock',
    question: 'What is Anti-Spoofing / Liveness Detection?',
    answer:
      'Angin incorporates optical ridge density and liveness sensors to detect synthetic molds, printed paper prints, or gel samples. Spoofed samples trigger an immediate gate lock and generate a real-time security alert on the Admin Control Center.',
  },
  {
    id: 3,
    category: 'Wallet & Fares',
    icon: 'account_balance_wallet',
    question: 'What is the minimum balance required to enter a station?',
    answer:
      'A minimum wallet balance of ₹5.00 (the maximum single route fare across the network) is required to authenticate station entry turnstiles. If your balance is below ₹5.00, entry is denied until topped up.',
  },
  {
    id: 4,
    category: 'Wallet & Fares',
    icon: 'auto_graph',
    question: 'How are route fares calculated?',
    answer:
      'Fares are automatically distance-computed when you tap out at your destination station. Journeys range from ₹2.00 (adjacent stations) up to ₹5.00 (full cross-city express line). The exact fare is deducted from your wallet instantly upon gate clearance.',
  },
  {
    id: 5,
    category: 'Station Gate Turnstiles',
    icon: 'door_front',
    question: 'What happens if I forget to tap out at the exit gate?',
    answer:
      'If an entry turnstile tap is not paired with an exit tap within 120 minutes, the trip is flagged as incomplete. You can view your active journey banner or consult station personnel to resolve incomplete trips.',
  },
  {
    id: 6,
    category: 'Account & Support',
    icon: 'app_registration',
    question: 'Can I re-enroll or change my biometric fingerprint sample?',
    answer:
      'Yes! Visit your Digital Wallet & Biometrics page (/wallet) at any time. You can test different fingerprint cartridges or upload a fresh high-resolution scan to update your enrolled template.',
  },
];

export default function Faq() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState(1);

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">
      <AuthBackground />

      {/* Header */}
      <header className="page-header text-center" style={{ marginBottom: '2.5rem' }}>
        <div className="section-badge" style={{ marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>help</span>
          <span>Commuter Support &amp; Knowledge Base</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>Commuter Help &amp; FAQs</h1>
        <p style={{ maxWidth: '640px', margin: '0.5rem auto 0' }}>
          Everything you need to know about cardless biometric travel, automated distance fares, and network security.
        </p>

        {/* Search Bar */}
        <div className="faq-search-wrapper" style={{ maxWidth: '520px', margin: '1.75rem auto 0' }}>
          <div className="input-with-icon">
            <span className="material-symbols-outlined input-icon-lead">search</span>
            <input
              type="text"
              placeholder="Search topics (e.g. balance, fare, security, spoof)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '50px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.9)' }}
            />
          </div>
        </div>
      </header>

      {/* FAQ Accordion List */}
      <div className="faq-container" style={{ maxWidth: '840px', margin: '0 auto' }}>
        {filteredFaqs.length === 0 ? (
          <div className="card glass-panel empty-state">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '44px', marginBottom: '0.5rem' }}>
              search_off
            </span>
            <h3>No matching help topics found</h3>
            <p style={{ fontSize: '0.875rem' }}>Try searching for &quot;fare&quot;, &quot;balance&quot;, or &quot;biometric&quot;.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`faq-accordion-item glass-panel ${isOpen ? 'open' : ''}`}
                style={{ marginBottom: '1rem', transition: 'all 0.2s ease' }}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-fixed)',
                        color: 'var(--color-primary)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {faq.icon}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {faq.category}
                      </div>
                      <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.05rem', color: 'var(--color-text)' }}>
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      color: 'var(--color-primary)',
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="faq-answer-body"
                    style={{
                      padding: '0 1.5rem 1.25rem 4.25rem',
                      fontSize: '0.925rem',
                      color: 'var(--color-on-surface-variant)',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--color-surface-container-high)',
                      paddingTop: '1rem',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA Banner */}
      <div
        className="card glass-panel text-center"
        style={{ maxWidth: '840px', margin: '3rem auto 0', padding: '2rem', background: 'linear-gradient(135deg, rgba(0,30,64,0.04) 0%, rgba(0,244,254,0.08) 100%)' }}
      >
        <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Ready to Experience Cardless Travel?</h2>
        <p style={{ margin: '0.5rem 0 1.25rem', color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
          Test the interactive turnstile simulator or top up your transit balance now.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/entry" className="btn btn-primary">
            <span className="material-symbols-outlined">door_front</span>
            <span>Launch Entry Gate Simulator</span>
          </Link>
          <Link to="/wallet" className="btn btn-secondary">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span>Manage Transit Wallet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
