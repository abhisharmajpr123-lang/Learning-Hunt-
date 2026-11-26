import { ArrowLeft, BookOpen } from 'lucide-react';
import { SubjectIcon } from '../components/SubjectIcon.jsx';
import { styleFor } from '../lib/catalogue.js';
import { useSyllabus } from '../hooks/useCurriculum.js';

/** The CBSE syllabus for one class + subject, unit by unit. */
export default function Syllabus({ trackId, subjectId, onBack }) {
  const { status, error, reload, syllabus } = useSyllabus(trackId, subjectId);
  const chapterTotal = syllabus
    ? syllabus.units.reduce((sum, unit) => sum + unit.chapters.length, 0)
    : 0;
  const style = styleFor(syllabus?.subject || {});

  return (
    <>
      <button className="link-btn back-btn" onClick={onBack}>
        <ArrowLeft size={14} /> Back to courses
      </button>

      {status === 'loading' && <p className="muted">Loading syllabus…</p>}

      {status === 'error' && (
        <div className="empty">
          <BookOpen />
          <h3>Syllabus unavailable</h3>
          <p>{error}</p>
          <button className="link-btn" onClick={reload}>Try again</button>
        </div>
      )}

      {syllabus && (
        <>
          <header className="course-hero">
            <span className={'course-symbol ' + style.color}>
              <SubjectIcon name={style.icon} size={24} />
            </span>
            <div>
              <small>{syllabus.track.label} · CBSE 2025-26</small>
              <h1>{syllabus.subject.name} syllabus</h1>
              <p>{syllabus.units.length} units · {chapterTotal} chapters.</p>
            </div>
          </header>

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

          <p className="muted syllabus-source">
            Syllabus source: <a href={syllabus.source} target="_blank" rel="noreferrer">CBSE curriculum 2025-26</a>.
          </p>
        </>
      )}
    </>
  );
}
