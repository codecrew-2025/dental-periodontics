import { API_BASE_URL } from '../config/api';

const sanitizeForStorage = (value) => {
  if (value instanceof File) return null;
  if (Array.isArray(value)) return value.map(sanitizeForStorage);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeForStorage(val)])
    );
  }
  return value;
};

const getAuthHeaders = () => {
  const token = String(localStorage.getItem('token') || '').trim();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

const getApiUrl = (path) => {
  const base = String(API_BASE_URL || '').trim();
  return `${base}${path}`;
};

export const saveConsentDraft = async ({ patientId, data }) => {
  const normalizedPatientId = String(patientId || '').trim();
  if (!normalizedPatientId) {
    console.warn('[saveConsentDraft] Missing patientId');
    return;
  }
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    console.warn('[saveConsentDraft] No auth headers');
    return;
  }

  const payload = {
    patientId: normalizedPatientId,
    data: sanitizeForStorage(data),
  };

  try {
    const response = await fetch(getApiUrl('/api/consent-drafts'), {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn('[saveConsentDraft] Save failed:', response.status);
    } else {
      console.log('[saveConsentDraft] Saved successfully');
    }
  } catch (error) {
    console.error('[saveConsentDraft] Error:', error);
  }
};

export const loadConsentDraft = async ({ patientId }) => {
  const normalizedPatientId = String(patientId || '').trim();
  if (!normalizedPatientId) {
    console.warn('[loadConsentDraft] Missing patientId');
    return null;
  }
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    console.warn('[loadConsentDraft] No auth headers');
    return null;
  }

  try {
    const params = new URLSearchParams({ patientId: normalizedPatientId });
    const response = await fetch(getApiUrl(`/api/consent-drafts?${params.toString()}`), {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      console.warn('[loadConsentDraft] Fetch failed:', response.status);
      return null;
    }
    const payload = await response.json();
    return payload?.draft || null;
  } catch (error) {
    console.error('[loadConsentDraft] Error:', error);
    return null;
  }
};

export const clearConsentDraft = async ({ patientId }) => {
  const normalizedPatientId = String(patientId || '').trim();
  if (!normalizedPatientId) return;
  const authHeaders = getAuthHeaders();
  if (!authHeaders) return;

  try {
    const params = new URLSearchParams({ patientId: normalizedPatientId });
    await fetch(getApiUrl(`/api/consent-drafts?${params.toString()}`), {
      method: 'DELETE',
      headers: authHeaders,
    });
  } catch {
    // Best-effort cleanup
  }
};
