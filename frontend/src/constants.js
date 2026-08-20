export const STATIONS = [
  { id: 1, name: 'Central Station' },
  { id: 2, name: 'North Park' },
  { id: 3, name: 'South Side' },
  { id: 4, name: 'East End' },
];

export const MIN_WALLET_BALANCE = 5.0;

export const FINGERPRINT_SAMPLES = [
  {
    id: 'finger1',
    label: 'Sample A',
    src: '/fingerprints/finger1.png',
    filename: 'finger1.png',
    hint: 'Use for registration & travel',
  },
  {
    id: 'finger1_copy',
    label: 'Sample A (copy)',
    src: '/fingerprints/finger1_copy.png',
    filename: 'finger1_copy.png',
    hint: 'Matching copy of Sample A',
  },
  {
    id: 'finger2',
    label: 'Sample B',
    src: '/fingerprints/finger2.png',
    filename: 'finger2.png',
    hint: 'Different pattern — mismatch test',
  },
  {
    id: 'blank',
    label: 'Blank (spoof)',
    src: '/fingerprints/blank.png',
    filename: 'blank.png',
    hint: 'Triggers spoof detection',
  },
];

export async function sampleUrlToFile(src, filename) {
  const response = await fetch(src);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function stationName(stationId) {
  const station = STATIONS.find((s) => s.id === Number(stationId));
  return station ? station.name : `Station ${stationId}`;
}
