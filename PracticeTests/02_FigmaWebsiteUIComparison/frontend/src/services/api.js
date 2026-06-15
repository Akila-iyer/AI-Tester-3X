/* API client for Visual UI Testing Platform */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (options.download) return res.blob();
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  createComparison: (data) =>
    request('/comparisons', { method: 'POST', body: JSON.stringify(data) }),

  getStatus: (sessionId) =>
    request(`/comparisons/${sessionId}/status`),

  getResults: (sessionId) =>
    request(`/comparisons/${sessionId}/results`),

  getElementDetail: (sessionId, elementId) =>
    request(`/comparisons/${sessionId}/elements/${elementId}`),

  getScreenshots: (sessionId) =>
    request(`/comparisons/${sessionId}/screenshots`),

  downloadReport: (sessionId, format) =>
    request(`/comparisons/${sessionId}/report/${format}`, { download: true }),

  getHistory: (limit = 25, offset = 0) =>
    request(`/history?limit=${limit}&offset=${offset}`),
};
