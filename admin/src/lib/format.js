export const formatPrice = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f1f5f9"/><text x="100" y="108" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#94a3b8">No image</text></svg>',
  );

export const imageUrl = (url) => url || PLACEHOLDER_IMAGE;
