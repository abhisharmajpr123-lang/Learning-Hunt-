const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(
      `Cannot reach the Learn Hunt API at ${API_URL}. Start it with "npm run server".`
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}.`, {
      status: response.status,
      errors: Array.isArray(payload?.errors) ? payload.errors : []
    });
  }

  return payload;
}

export const api = {
  signup: body => request('/api/auth/signup', { method: 'POST', body }),
  login: body => request('/api/auth/login', { method: 'POST', body }),
  me: token => request('/api/auth/me', { token })
};

export { API_URL };
