import { api } from '../lib/api.js';
import { useAsync } from './useCatalogue.js';

/** Every CBSE track the catalogue offers: classes 9-12, JEE and NEET. */
export function useTracks() {
  const remote = useAsync(token => api.curriculum(token), 'curriculum');
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    tracks: data?.tracks ?? [],
    source: data?.source ?? null
  };
}

export function useTrack(trackId) {
  const remote = useAsync(
    token => (trackId ? api.track(trackId, token) : Promise.resolve(null)),
    trackId || ''
  );
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    track: data?.track ?? null,
    source: data?.source ?? null
  };
}

export function useUnit(trackId, subjectId, unitIndex) {
  const key = trackId && subjectId && unitIndex != null ? `${trackId}:${subjectId}:${unitIndex}` : '';
  const remote = useAsync(
    token => (key ? api.unit(trackId, subjectId, unitIndex, token) : Promise.resolve(null)),
    key
  );
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    unit: data?.unit ?? null,
    track: data?.track ?? null,
    subject: data?.subject ?? null
  };
}

/** The unit's YouTube lessons: one search, started alongside the unit header. */
export function useUnitVideos(trackId, subjectId, unitIndex) {
  const ready = Boolean(trackId && subjectId) && unitIndex != null;
  const key = ready ? `${trackId}:${subjectId}:${unitIndex}` : '';
  const remote = useAsync(
    token => (ready ? api.unitVideos(trackId, subjectId, unitIndex, token) : Promise.resolve(null)),
    key
  );
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    videos: data?.videos ?? [],
    searchUrl: data?.searchUrl ?? null
  };
}

export function useSyllabus(trackId, subjectId) {
  const key = trackId && subjectId ? `${trackId}:${subjectId}` : '';
  const remote = useAsync(
    token => (key ? api.syllabus(trackId, subjectId, token) : Promise.resolve(null)),
    key
  );
  const data = remote.data;

  return {
    status: remote.status,
    error: remote.error,
    reload: remote.reload,
    syllabus: data?.units ? data : null
  };
}
