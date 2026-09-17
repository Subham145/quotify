export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

let token = localStorage.getItem('token') || null;

export function setToken(newToken) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
}

export function getApiUrl(path = '') {
  if (!path) return API_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function api(path, options = {}) {
  const url = getApiUrl(path);
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // 🔥 handle unauthorized
  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
    return null;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}
