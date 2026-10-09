/**
 * Thin fetch wrapper for the Free Code Hub API.
 * Uses same-origin relative URLs — the Vite dev server proxies /api and
 * /socket.io to the Express backend, and production deployments put the API
 * behind the same origin (or set VITE_API_URL).
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('fch_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('fch_token', token);
  else localStorage.removeItem('fch_token');
}

export async function api(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default api;
