export const formatPrice = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const formatStars = (average = 0) => {
  const filled = Math.round(Number(average) || 0);
  return '★'.repeat(Math.min(5, Math.max(0, filled))) + '☆'.repeat(Math.max(0, 5 - filled));
};

export const imageUrl = (url, width = 800) =>
  url ? String(url).replace(/w=\d+/, `w=${width}`) : PLACEHOLDER_IMAGE;

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#f1f5f9"/><text x="300" y="310" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#94a3b8">Sookshop</text></svg>',
  );

const COLOR_HEX = {
  black: '#0f172a',
  white: '#ffffff',
  midnight: '#1e293b',
  silver: '#cbd5e1',
  gray: '#64748b',
  grey: '#64748b',
  graphite: '#475569',
  starlight: '#f5f5f4',
  blue: '#3b82f6',
  pink: '#f472b6',
  yellow: '#facc15',
  orange: '#f97316',
  red: '#e11d48',
  green: '#16a34a',
  bronze: '#b45309',
  violet: '#7c3aed',
  titanium: '#94a3b8',
  space: '#334155',
};

export const colorToHex = (name) => {
  const key = String(name || '').toLowerCase();
  const match = Object.keys(COLOR_HEX).find((color) => key.includes(color));
  return match ? COLOR_HEX[match] : '#4f46e5';
};
