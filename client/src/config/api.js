const DEFAULT_DEV_API = 'http://localhost:5000';

const normalizeBase = (value) => {
  if (!value) return '';
  let normalized = value.trim();
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);

  // Accept shorthand host:port values in development env vars
  if (/^:\d+$/.test(normalized)) {
    normalized = `http://localhost${normalized}`;
  } else if (/^[^:/?#]+:\d+$/.test(normalized) && !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(normalized)) {
    normalized = `http://${normalized}`;
  } else if (normalized.startsWith('//')) {
    normalized = `http:${normalized}`;
  }

  return normalized;
};

const resolveApiBase = () => {
  const rawEnvBase = import.meta.env.VITE_API_BASE_URL;
  const envBase = typeof rawEnvBase === 'string' ? normalizeBase(rawEnvBase) : '';
  const isVercelHost =
    typeof window !== 'undefined' && /\.vercel\.app$/i.test(window.location.hostname || '');

  const localNetworkDevBase =
    typeof window !== 'undefined'
      ? `http://${window.location.hostname || 'localhost'}:5000`
      : DEFAULT_DEV_API;

  // In local dev, a blank env value should not override localhost backend.
  if (!import.meta.env.PROD) {
    return envBase || localNetworkDevBase;
  }

  // This project is deployed as a single Vercel app (static + /api function).
  // Prefer same-origin in production on Vercel to avoid stale external API env values.
  if (isVercelHost) {
    return '';
  }

  // In production, default to same-origin when not explicitly configured.
  return envBase;
};

// In production, default to same-origin (empty string) so the app can be served by Express.
// If you deploy frontend + backend separately, set VITE_API_BASE_URL to your backend URL.
export const API_BASE_URL = normalizeBase(
  resolveApiBase()
);

export const DEV_API_ORIGIN = DEFAULT_DEV_API;
