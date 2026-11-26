import { api } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from './useCatalogue.js';

const EMPTY = { enrollments: [], total: 0 };

/**
 * The student's enrolments, read from the server.
 * Enrolment is student-only, so other roles pass { enabled: false } and no request is made.
 */
export function useEnrolments({ enabled = true } = {}) {
  const { token } = useAuth();
  const remote = useAsync(
    bearer => (enabled ? api.enrollments(bearer) : Promise.resolve(EMPTY)),
    enabled ? 'mine' : 'disabled'
  );
  const data = remote.data;

  const mutate = async action => {
    await action(token);
    remote.reload();
  };

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    enrollments: data?.enrollments ?? [],
    total: data?.total ?? 0,
    enrol: courseId => mutate(bearer => api.enroll(courseId, bearer)),
    unenrol: courseId => mutate(bearer => api.unenroll(courseId, bearer))
  };
}
