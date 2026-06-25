let token = localStorage.getItem('token') || null;

export function setToken(newToken) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
}

export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
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
    return null;
  }

  // 🔥 IMPORTANT: return actual object (for login)
  return data;
}
