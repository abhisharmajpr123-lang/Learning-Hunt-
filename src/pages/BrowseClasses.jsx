import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Target } from 'lucide-react';
import { SubjectIcon } from '../components/SubjectIcon.jsx';
import { styleFor } from '../lib/catalogue.js';
import { useSyllabus, useTrack, useTracks } from '../hooks/useCurriculum.js';

/** The CBSE units and chapters of one subject of the chosen class. */
function SubjectSyllabus({ track, subject, onOpenSyllabus }) {
  const { status, error, reload, syllabus } = useSyllabus(track.id, subject.id);
  const style = styleFor(subject);
  const chapterTotal = syllabus
    ? syllabus.units.reduce((sum, unit) => sum + unit.chapters.length, 0)
    : 0;

  return (
    <article className="syllabus-subject">
      <header className="syllabus-subject-head">
        <span className={'course-symbol ' + style.color}>
          <SubjectIcon name={style.icon} size={20} />
        </span>
        <div>
          <h2>{subject.name}</h2>
          <small>
            {syllabus
              ? `${syllabus.units.length} units · ${chapterTotal} chapters`
              : 'CBSE 2025-26 syllabus'}
          </small>
        </div>
        <button className="link-btn" onClick={() => onOpenSyllabus(track.id, subject.id)}>
          View syllabus <ArrowRight size={14} />
        </button>
      </header>

      {status === 'loading' && <p className="muted">Loading syllabus…</p>}
      {status === 'error' && (
        <p className="error-notice">
          {error} <button className="link-btn" onClick={reload}>Try again</button>
        </p>
      )}

      {syllabus && (
        <div className="syllabus-units">
          {syllabus.units.map(unit => (
            <section className="unit-card" key={unit.title}>
              <h3>{unit.title}</h3>
              <ol className="chapter-list">
                {unit.chapters.map((chapter, index) => (
                  <li key={chapter}>
                    <span className="chapter-number">{index + 1}</span>
                    {chapter}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

/** The card's subject name, matched against the chosen class's CBSE subjects. */
function findSubject(track, subjectName) {
  if (!track || !subjectName) return null;
  const wanted = subjectName.trim().toLowerCase();
  return (
    track.subjects.find(subject => subject.name.toLowerCase() === wanted) ||
    track.subjects.find(subject => subject.name.toLowerCase().startsWith(wanted)) ||
    null
  );
}

/**
 * Class picker and syllabus for the subject of a My subjects card.
 * The class is remembered for that subject, so the picker does not come back;
 * it is changed by double-clicking the card.
 */
export default function BrowseClasses({
  subjectName,
  trackId,
  onSelectTrack,
  onChangeClass,
  onOpenSyllabus,
  onBack
}) {
  const tracks = useTracks();
  const detail = useTrack(trackId);
  const subject = findSubject(detail.track, subjectName);

  // Computer Science, Web Development and similar have no class-wise CBSE syllabus,
  // so they never get a class picker.
  const tracksReady = tracks.status === 'ready';
  const subjectHasCbseSyllabus =
    !subjectName ||
    !tracksReady ||
    tracks.tracks.some(track => (track.subjects || []).includes(subjectName));
  const showPicker = !trackId && subjectHasCbseSyllabus;
  const showNoSyllabus = !trackId && tracksReady && !subjectHasCbseSyllabus;
  // Offer only the classes/exams that actually teach this subject, e.g. Business
  // Studies is Class 11-12 only, Science is Class 9-10 only.
  const offerableTracks = subjectName
    ? tracks.tracks.filter(track => (track.subjects || []).includes(subjectName))
    : tracks.tracks;

  return (
    <>
      {onBack && (
        <button type="button" className="link-btn back-btn" onClick={onBack}>
          <ArrowLeft size={15} /> My subjects
        </button>
      )}

      <div className="heading">
        <small>CBSE CLASSES 9-12 · JEE · NEET</small>
        <h1>
          {trackId
            ? `${subjectName || 'Subject'} syllabus`
            : showNoSyllabus
              ? subjectName
              : 'Select a class'}
        </h1>
        <p>
          {trackId
            ? 'The CBSE 2025-26 units and chapters for the class you selected.'
            : showNoSyllabus
              ? 'This subject is not part of the CBSE curriculum, so there is no class syllabus to choose.'
              : `Choose a class or entrance exam${subjectName ? ` for ${subjectName}` : ''}. It stays selected, so this picker does not come back.`}
        </p>
      </div>

      {!trackId && !tracksReady && tracks.status === 'loading' && <p className="muted">Loading classes…</p>}
      {!trackId && tracks.status === 'error' && (
        <p className="error-notice">
          {tracks.error} <button className="link-btn" onClick={tracks.reload}>Try again</button>
        </p>
      )}

      {showNoSyllabus && (
        <div className="empty">
          <BookOpen />
          <h3>{subjectName} has no CBSE syllabus</h3>
          <p>
            Class-wise CBSE syllabus exists only for the subjects CBSE teaches. Pick a CBSE
            subject from My subjects to browse its classes.
          </p>
          {onBack && (
            <button className="btn primary" onClick={onBack}>
              Back to My subjects
            </button>
          )}
        </div>
      )}

      {showPicker && (
        <div className="track-grid">
          {offerableTracks.map(track => (
            <button
              type="button"
              key={track.id}
              className="track-card"
              onClick={() => onSelectTrack(track)}
            >
              <span className="track-badge">
                {track.kind === 'exam' ? <Target size={18} /> : <GraduationCap size={18} />}
              </span>
              <b>{track.label}</b>
              <small>{track.note}</small>
              <em>{track.subjectCount} subjects · {track.chapterCount} chapters</em>
            </button>
          ))}
        </div>
      )}

      {trackId && detail.status === 'loading' && <p className="muted">Loading syllabus…</p>}
      {trackId && detail.status === 'error' && (
        <p className="error-notice">
          {detail.error} <button className="link-btn" onClick={detail.reload}>Try again</button>
        </p>
      )}

      {detail.track && (
        <>
          <div className="track-head">
            <div>
              <h2>{detail.track.label}</h2>
              <small>Only the syllabus of the subject you opened is shown.</small>
            </div>
          </div>

          {subject ? (
            <SubjectSyllabus
              track={detail.track}
              subject={subject}
              onOpenSyllabus={onOpenSyllabus}
            />
          ) : (
            <div className="empty">
              <BookOpen />
              <h3>{subjectName} is not part of {detail.track.label}</h3>
              <p>This subject has no CBSE syllabus for that class. Pick another class instead.</p>
              {onChangeClass && (
                <button className="btn primary" onClick={onChangeClass}>
                  Choose another class
                </button>
              )}
            </div>
          )}
        </>
      )}

      {detail.source && (
        <p className="muted syllabus-source">
          Syllabus source: <a href={detail.source} target="_blank" rel="noreferrer">CBSE curriculum 2025-26</a>.
        </p>
      )}
    </>
  );
}
