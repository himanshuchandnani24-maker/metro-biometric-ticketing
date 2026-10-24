import { useState } from 'react';
import { formatCurrency } from '../constants';

export default function RazorpayModal({
  isOpen,
  onClose,
  amount,
  description,
  onSuccess,
  onFailure,
}) {
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulateSuccess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess({
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_order_id: `order_test_${Date.now()}`,
        razorpay_signature: `simulated_sig_${Date.now()}`,
      });
      onClose();
    }, 700);
  };

  const handleSimulateFailure = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (onFailure) {
        onFailure('Payment declined by issuing bank (Simulated Test Mode failure).');
      }
      onClose();
    }, 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Razorpay Header */}
        <div
          style={{
            backgroundColor: '#0c2340',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span
                style={{
                  backgroundColor: '#00baee',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                }}
              >
                TEST MODE
              </span>
              <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Razorpay Checkout</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>Angin Metro Transit</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{description || 'Biometric Transit Payment'}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>AMOUNT</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#00e5ff' }}>
              {formatCurrency(amount)}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '0.85rem', fontWeight: 600 }}>
            SELECT TEST PAYMENT INSTRUMENT:
          </div>

          {/* Payment Method Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setMethod('card')}
              style={{
                padding: '0.65rem 0.5rem',
                border: method === 'card' ? '2px solid #00baee' : '1px solid #e2e8f0',
                backgroundColor: method === 'card' ? '#f0f9ff' : '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.25rem' }}>💳</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem', color: '#1a1a1a' }}>Card</div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('upi')}
              style={{
                padding: '0.65rem 0.5rem',
                border: method === 'upi' ? '2px solid #00baee' : '1px solid #e2e8f0',
                backgroundColor: method === 'upi' ? '#f0f9ff' : '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.25rem' }}>📱</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem', color: '#1a1a1a' }}>UPI / QR</div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('netbanking')}
              style={{
                padding: '0.65rem 0.5rem',
                border: method === 'netbanking' ? '2px solid #00baee' : '1px solid #e2e8f0',
                backgroundColor: method === 'netbanking' ? '#f0f9ff' : '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.25rem' }}>🏦</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem', color: '#1a1a1a' }}>Netbanking</div>
            </button>
          </div>

          {/* Test Method Details */}
          <div
            style={{
              padding: '0.85rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: '#334155',
              marginBottom: '1.25rem',
            }}
          >
            {method === 'card' && (
              <div>
                <strong>Test Visa Card:</strong> 4111 •••• •••• 1111 (Expiry: 12/28)
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Simulates standard debit/credit card tokenization.
                </div>
              </div>
            )}
            {method === 'upi' && (
              <div>
                <strong>Test VPA:</strong> passenger@okhdfcbank
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Simulates instantaneous Unified Payments Interface (UPI) credit.
                </div>
              </div>
            )}
            {method === 'netbanking' && (
              <div>
                <strong>Test Bank:</strong> State Bank of India (Simulated Sandbox)
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Direct institutional account debit authorization.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={processing}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#00baee',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {processing ? (
                'Processing...'
              ) : (
                <>
                  <span>✓ Authorize &amp; Pay {formatCurrency(amount)}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateFailure}
              disabled={processing}
              style={{
                width: '100%',
                padding: '0.55rem',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Simulate Payment Failure (Test decline)
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              style={{
                width: '100%',
                padding: '0.45rem',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
