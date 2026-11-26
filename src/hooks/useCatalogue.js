import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Run an API loader whenever its key changes, keeping the previous data visible
 * while a new page or search result is on the way.
 */
export function useAsync(load, key) {
  const { token } = useAuth();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let active = true;
    setState(previous => ({
      status: previous.data ? 'refreshing' : 'loading',
      data: previous.data,
      error: null
    }));

    loadRef
      .current(token)
      .then(data => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch(error => {
        if (active) setState(previous => ({ status: 'error', data: previous.data, error: error.message }));
      });

    return () => {
      active = false;
    };
  }, [key, token, nonce]);

  const reload = useCallback(() => setNonce(value => value + 1), []);
  return { ...state, reload };
}

export function useSubjects(params = {}) {
  const key = JSON.stringify(params);
  const remote = useAsync(token => api.subjects(params, token), key);
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    subjects: data?.subjects ?? [],
    total: data?.total ?? 0,
    pagination: data?.pagination ?? null
  };
}

export function useCourses(params = {}) {
  const key = JSON.stringify(params);
  const remote = useAsync(token => api.courses(params, token), key);
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    courses: data?.courses ?? [],
    total: data?.total ?? 0
  };
}

export function useSubjectCourses(subjectId) {
  const remote = useAsync(
    token => api.subjectCourses(subjectId, { limit: 50 }, token),
    subjectId || ''
  );
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    courses: data?.courses ?? [],
    total: data?.total ?? 0
  };
}
