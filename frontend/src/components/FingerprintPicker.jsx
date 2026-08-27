import { useEffect, useState } from 'react';
import { FINGERPRINT_SAMPLES, sampleUrlToFile } from '../constants';

export default function FingerprintPicker({
  onFileSelect,
  selectedFile,
  inputId = 'fingerprint-upload',
}) {
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setIsScanning(true);

    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 1800);

    return () => {
      URL.revokeObjectURL(url);
      clearTimeout(timer);
    };
  }, [selectedFile]);

  const handleSampleClick = async (sample) => {
    setLoadingSample(true);
    setSampleError('');
    setSelectedSampleId(sample.id);
    setIsScanning(true);

    try {
      const file = await sampleUrlToFile(sample.src, sample.filename);
      onFileSelect(file, sample.id);
    } catch {
      setSampleError('Could not load sample image. Please upload a file instead.');
      onFileSelect(null, null);
    } finally {
      setLoadingSample(false);
      setTimeout(() => setIsScanning(false), 1600);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedSampleId(null);
    setSampleError('');
    setIsScanning(true);
    onFileSelect(file, file ? 'upload' : null);
    setTimeout(() => setIsScanning(false), 1600);
  };

  const isSpoofSample = selectedSampleId === 'blank' || (selectedFile && selectedFile.name?.toLowerCase().includes('blank'));

  return (
    <div className="biometric-scanner-terminal">
      {/* Scanner Terminal Header */}
      <div className="scanner-terminal-header">
        <div className="terminal-brand-title">
          <span className="material-symbols-outlined scanner-icon-pulse">fingerprint</span>
          <div>
            <div className="terminal-title">Biometric Optical Sensor Terminal</div>
            <div className="terminal-subtitle">500 DPI • SOCOFing Ridge Extraction Engine</div>
          </div>
        </div>

        <div className={`terminal-status-badge ${selectedFile ? (isSpoofSample ? 'spoof' : 'active') : 'idle'}`}>
          <span className="status-mini-dot" />
          <span>
            {selectedFile
              ? isSpoofSample
                ? 'Spoof Alert'
                : 'Sensor Active'
              : 'Ready for Scan'}
          </span>
        </div>
      </div>

      {/* Main Scanner Stage: Viewport + Live Laser Sweep */}
      <div className="scanner-viewport-stage">
        <div className={`scanner-hud-box ${isScanning ? 'scanning' : ''} ${isSpoofSample ? 'spoof-detected' : ''}`}>
          {/* Corner Reticle Brackets */}
          <span className="hud-corner corner-tl" />
          <span className="hud-corner corner-tr" />
          <span className="hud-corner corner-bl" />
          <span className="hud-corner corner-br" />

          {/* Biometric Laser Sweep Line */}
          {isScanning && <div className="scanner-laser-line" />}

          {/* Minutiae Radar Overlay Grid */}
          <div className="scanner-grid-overlay" />

          {/* Fingerprint Image Display */}
          {previewUrl ? (
            <div className="scanner-image-container">
              <img
                src={previewUrl}
                alt="Biometric scan"
                className={`scanner-print-image ${isScanning ? 'in-scan' : ''}`}
              />

              {/* Simulated Minutiae Feature Nodes */}
              {!isSpoofSample && (
                <div className="minutiae-points-layer">
                  <span className="minutiae-dot m-1" title="Ridge bifurcation" />
                  <span className="minutiae-dot m-2" title="Core delta" />
                  <span className="minutiae-dot m-3" title="Ridge ending" />
                  <span className="minutiae-dot m-4" title="Island node" />
                  <span className="minutiae-dot m-5" title="Loop termination" />
                </div>
              )}
            </div>
          ) : (
            <div className="scanner-idle-placeholder">
              <div className="scanner-pulse-ring">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>
                  touch_app
                </span>
              </div>
              <div className="placeholder-text">Place Fingerprint on Sensor</div>
              <div className="placeholder-sub">Select a cartridge sample below or upload a template file</div>
            </div>
          )}
        </div>

        {/* Live Diagnostics Analysis Strip */}
        {selectedFile && (
          <div className={`scanner-diagnostics-strip ${isSpoofSample ? 'warning' : 'verified'}`}>
            <span className="material-symbols-outlined">
              {isSpoofSample ? 'warning' : 'verified_user'}
            </span>
            <div style={{ flex: 1 }}>
              <div className="diag-heading">
                {isSpoofSample
                  ? 'Spoof Anomaly Flagged: Synthetic / Blank Ridge Density'
                  : 'Liveness Verified: Human Ridge Minutiae Extracted'}
              </div>
              <div className="diag-sub">
                {isSpoofSample
                  ? 'Confidence 0.00% • Turnstile gate safety lock engaged'
                  : 'Feature Vector Match Confidence: 98.7% • Valid for Gate Tap'}
              </div>
            </div>
          </div>
        )}
      </div>

      {sampleError && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{sampleError}</span>
        </div>
      )}

      {/* Biometric Sample Cartridge Selector Grid */}
      <div className="sample-cartridges-section">
        <div className="cartridge-section-title">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_module</span>
          <span>Fast-Select Biometric Sample Cartridges:</span>
        </div>

        <div className="sample-cartridges-grid">
          {FINGERPRINT_SAMPLES.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            const isBlank = sample.id === 'blank';

            return (
              <button
                key={sample.id}
                type="button"
                className={`sample-cartridge-btn ${isSelected ? 'selected' : ''} ${isBlank ? 'spoof-btn' : ''}`}
                onClick={() => handleSampleClick(sample)}
                disabled={loadingSample}
              >
                <div className="cartridge-thumb-wrap">
                  <img src={sample.src} alt={sample.label} />
                  {isSelected && <span className="cartridge-active-check">✓</span>}
                </div>
                <div className="cartridge-text-block">
                  <div className="cartridge-name">{sample.label}</div>
                  <div className="cartridge-hint">{sample.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Upload Trigger */}
      <div className="scanner-upload-bar">
        <label htmlFor={inputId} className="scanner-upload-label">
          <span className="material-symbols-outlined">file_upload</span>
          <span>Upload Custom Scan Image (PNG/JPG/BMP)</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/bmp"
          onChange={handleFileChange}
          className="scanner-file-input"
        />
        {selectedFile && !selectedSampleId && (
          <div className="custom-file-indicator">
            <span className="material-symbols-outlined">attachment</span>
            <span>{selectedFile.name} (Custom scan attached)</span>
          </div>
        )}
      </div>
    </div>
  );
}
