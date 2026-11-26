const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/** Turn a params object into a query string, skipping empty values. */
function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
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
  me: token => request('/api/auth/me', { token }),

  // Catalogue reads take the query parameters the API already supports.
  subjects: (params, token) => request(`/api/subjects${queryString(params)}`, { token }),
  subject: (id, token) => request(`/api/subjects/${id}`, { token }),
  createSubject: (body, token) => request('/api/subjects', { method: 'POST', body, token }),
  subjectCourses: (id, params, token) => request(`/api/subjects/${id}/courses${queryString(params)}`, { token }),
  courses: (params, token) => request(`/api/courses${queryString(params)}`, { token }),
  course: (id, token) => request(`/api/courses/${id}`, { token }),

  // Enrolment is student-only on the server; the token decides who it belongs to.
  enrollments: token => request('/api/enrollments/mine', { token }),
  enroll: (courseId, token) => request(`/api/courses/${courseId}/enroll`, { method: 'POST', token }),
  unenroll: (courseId, token) => request(`/api/courses/${courseId}/enroll`, { method: 'DELETE', token })
};

export { API_URL };
