import { useEffect, useState } from 'react';
import { FINGERPRINT_SAMPLES, sampleUrlToFile } from '../constants';

export default function FingerprintPicker({ onFileSelect, selectedFile, inputId = 'fingerprint-upload' }) {
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleSampleClick = async (sample) => {
    setLoadingSample(true);
    setSampleError('');
    setSelectedSampleId(sample.id);
    try {
      const file = await sampleUrlToFile(sample.src, sample.filename);
      onFileSelect(file, sample.id);
    } catch {
      setSampleError('Could not load that sample image. Try another sample or upload a file.');
      onFileSelect(null, null);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedSampleId(null);
    setSampleError('');
    onFileSelect(file, file ? 'upload' : null);
  };

  return (
    <div className="fingerprint-picker">
      <div className="fingerprint-picker-header">
        <h3>Select fingerprint</h3>
        <p>Choose a sample image or upload your own fingerprint scan.</p>
      </div>

      <div className="sample-grid">
        {FINGERPRINT_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={`sample-card ${selectedSampleId === sample.id ? 'selected' : ''}`}
            onClick={() => handleSampleClick(sample)}
            disabled={loadingSample}
          >
            <img src={sample.src} alt={sample.label} />
            <div className="sample-label">{sample.label}</div>
            <div className="sample-hint">{sample.hint}</div>
          </button>
        ))}
      </div>

      {sampleError && <div className="alert alert-error">{sampleError}</div>}

      <div className="upload-section">
        <label htmlFor={inputId}>Or upload a file</label>
        <div className="file-input-wrap">
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/bmp"
            onChange={handleFileChange}
          />
          {selectedFile && (
            <span className="selected-file">{selectedFile.name} selected</span>
          )}
        </div>
        {previewUrl && (
          <div className="preview-wrap">
            <img src={previewUrl} alt="Fingerprint preview" />
          </div>
        )}
      </div>
    </div>
  );
}
