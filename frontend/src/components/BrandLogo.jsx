import React from 'react';

export default function BrandLogo({
  size = 'md',
  layout = 'row',
  showText = true,
  className = '',
}) {
  const isColumn = layout === 'column';

  return (
    <div
      className={`brand-logo-lockup size-${size} ${isColumn ? 'layout-column' : 'layout-row'} ${className}`}
      aria-label="Angin Biometric Smart Transit"
    >
      <div className="brand-icon-wrapper">
        <img
          src="/angin-icon.png"
          alt="Angin Biometric Transit Emblem"
          className="brand-emblem-img"
        />
      </div>

      {showText && (
        <div className="brand-text-block">
          <span className="brand-name-title">Angin</span>
        </div>
      )}
    </div>
  );
}
