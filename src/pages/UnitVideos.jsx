import { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, ExternalLink, Play, Video, X } from 'lucide-react';
import { SubjectIcon } from '../components/SubjectIcon.jsx';
import { styleFor } from '../lib/catalogue.js';
import { useUnit, useUnitVideos } from '../hooks/useCurriculum.js';

function VideoCard({ video, onPlay }) {
  return (
    <button type="button" className="video-card" onClick={() => onPlay(video)}>
      <span className="video-thumb">
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          onError={event => {
            // Not every video has the small thumbnail; the large one always exists.
            const image = event.currentTarget;
            if (image.dataset.fallback) return;
            image.dataset.fallback = '1';
            image.src = video.thumbnail.replace('mqdefault', 'hqdefault');
          }}
        />
        <span className="video-play"><Play size={16} /></span>
        {video.duration && <em className="video-duration">{video.duration}</em>}
      </span>
      <span className="video-meta">
        <b>{video.title}</b>
        <small>{video.channel || 'YouTube'}</small>
      </span>
    </button>
  );
}

function SkeletonCards() {
  return (
    <div className="video-grid" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map(index => (
        <span className="video-card video-skeleton" key={index}>
          <span className="video-thumb" />
          <span className="video-meta"><b /><small /></span>
        </span>
      ))}
    </div>
  );
}

/** YouTube lessons for one unit of a CBSE syllabus. */
export default function UnitVideos({ trackId, subjectId, unitIndex, onBack }) {
  const unitState = useUnit(trackId, subjectId, unitIndex);
  // Both requests start together: the header is local data, the videos are not.
  const { status, error, reload, videos, searchUrl } = useUnitVideos(trackId, subjectId, unitIndex);
  const [active, setActive] = useState(null);
  const { unit, track, subject } = unitState;
  const style = styleFor(subject || {});

  const play = video => {
    setActive(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <button className="link-btn back-btn" onClick={onBack}>
        <ArrowLeft size={14} /> Back to syllabus
      </button>

      {unitState.status === 'loading' && !unit && <p className="muted">Loading unit…</p>}

      {unitState.status === 'error' && !unit && (
        <div className="empty">
          <Video />
          <h3>This unit is unavailable</h3>
          <p>{unitState.error}</p>
          <button className="link-btn" onClick={unitState.reload}>Try again</button>
        </div>
      )}

      {unit && (
        <>
          <header className="course-hero">
            <span className={'course-symbol ' + style.color}>
              <SubjectIcon name={style.icon} size={24} />
            </span>
            <div>
              <small>
                {track?.label} · {subject?.name} · Unit {unitIndex + 1}
              </small>
              <h1>{unit.title}</h1>
              <p>{unit.chapters.length} chapters · videos from YouTube.</p>
            </div>
          </header>

          <div className="video-chips">
            {unit.chapters.map(chapter => (
              <span className="chip" key={chapter}><BookOpen size={11} /> {chapter}</span>
            ))}
          </div>

          {active && (
            <section className="video-player">
              <div className="video-frame">
                <iframe
                  src={`${active.embedUrl}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="video-player-meta">
                <div>
                  <b>{active.title}</b>
                  <small>{active.channel}{active.views ? ` · ${active.views}` : ''}</small>
                </div>
                <div className="video-player-actions">
                  <a className="btn secondary" href={active.watchUrl} target="_blank" rel="noreferrer">
                    Watch on YouTube <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setActive(null)}
                    title="Stop the video"
                  >
                    <X size={13} /> Close
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="video-group">
            <div className="video-group-head">
              <h3><Play size={14} /> Lessons for this unit</h3>
              {searchUrl && (
                <a className="link-btn" href={searchUrl} target="_blank" rel="noreferrer">
                  More on YouTube <ExternalLink size={13} />
                </a>
              )}
            </div>

            {status === 'loading' && <SkeletonCards />}

            {status === 'error' && (
              <p className="error-notice">
                {error} <button className="link-btn" onClick={reload}>Try again</button>
              </p>
            )}

            {status !== 'loading' && status !== 'error' && !videos.length && (
              <p className="muted">
                No videos loaded for this unit.{' '}
                {searchUrl ? (
                  <a href={searchUrl} target="_blank" rel="noreferrer">Search YouTube</a>
                ) : null}
              </p>
            )}

            {videos.length > 0 && (
              <div className="video-grid">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} onPlay={play} />
                ))}
              </div>
            )}
          </section>

          <p className="muted syllabus-source">
            <Clock size={11} /> Videos are searched on YouTube for this unit. Answers and pacing
            come from the creators, not Learn Hunt.
          </p>
        </>
      )}
    </>
  );
}
