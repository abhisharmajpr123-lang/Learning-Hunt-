import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { SubjectIcon } from './SubjectIcon.jsx';
import { levelLabel, styleFor } from '../lib/catalogue.js';
import { useSubjectCourses, useSubjects } from '../hooks/useCatalogue.js';

const CATEGORIES = ['Science', 'Technology', 'Languages', 'Business'];
const PAGE_SIZE = 6;

/** One row of the course list; the whole row opens the course outline. */
export function CourseRow({ course, subject, onOpen }) {
  const style = styleFor(subject || {});
  return (
    <button type="button" className="course-row course-open" onClick={onOpen}>
      <span className={'course-symbol ' + style.color}>
        <SubjectIcon name={style.icon} size={18} />
      </span>
      <div className="course-details">
        <b>{course.title}</b>
        <small>
          {levelLabel(course.level)} · {course.sectionCount} {course.sectionCount === 1 ? 'section' : 'sections'} ·{' '}
          {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
          {course.published ? '' : ' · draft'}
        </small>
      </div>
      <ArrowRight size={15} />
    </button>
  );
}

export function SubjectCard({ subject, chosen, onToggle, expanded, onCourses }) {
  const style = styleFor(subject);
  return (
    <article className="subject-card">
      <div className={'subject-art ' + style.color}>
        <span>
          <SubjectIcon name={style.icon} size={26} />
        </span>
        <small>{subject.category}</small>
      </div>
      <div className="subject-content">
        <div className="subject-title">
          <h3>{subject.name}</h3>
          {chosen && <Check size={16} className="chosen-check" />}
        </div>
        <p>{subject.description || 'No description yet.'}</p>
        <div className="subject-meta">
          <span>
            <BookOpen size={14} /> {subject.published ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="subject-actions">
          {onToggle && (
            <button className={'btn full ' + (chosen ? 'soft-success' : 'primary')} onClick={onToggle}>
              {chosen ? (
                <>
                  <Check size={15} /> Added to my subjects
                </>
              ) : (
                <>
                  <Plus size={15} /> Choose subject
                </>
              )}
            </button>
          )}
          <button className="link-btn" onClick={onCourses}>
            {expanded ? 'Hide courses' : 'View courses'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

/** The courses inside one subject, read from /api/subjects/:id/courses. */
export function SubjectCourses({ subject, onOpenCourse, onClose }) {
  const { status, courses, error, reload } = useSubjectCourses(subject.id);

  return (
    <section className="panel course-panel">
      <div className="panel-head">
        <h2>{subject.name} courses</h2>
        <button className="link-btn" onClick={onClose}>
          Close
        </button>
      </div>
      {status === 'loading' && <p className="muted">Loading courses…</p>}
      {status === 'error' && (
        <p className="error-notice">
          {error}{' '}
          <button className="link-btn" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      {status !== 'loading' && !courses.length && status !== 'error' && (
        <p className="muted">This subject has no courses yet.</p>
      )}
      {courses.map(course => (
        <CourseRow
          key={course.id}
          course={course}
          subject={subject}
          onOpen={() => onOpenCourse(course.id)}
        />
      ))}
    </section>
  );
}

/**
 * Paginated subject list with server-side search and filters.
 * `filters` holds fixed query values (for example { teacher: 'me' }).
 */
export function SubjectBrowser({
  filters = {},
  selectable = false,
  chosenIds = [],
  onToggle,
  onOpenCourse,
  showPublishedFilter = false,
  emptyTitle = 'No subjects found',
  emptyText = 'Try a different search term or category.'
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [state, setState] = useState('All');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  // Only ask the API once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [query, category, state]);

  const params = {
    ...filters,
    q: query || undefined,
    category: category === 'All' ? undefined : category,
    page,
    limit: PAGE_SIZE
  };
  if (showPublishedFilter) params.published = state === 'All' ? undefined : state === 'Published' ? 'true' : 'false';

  const { status, subjects, pagination, total, error, reload } = useSubjects(params);

  // A filter change can leave the current page beyond the last one.
  useEffect(() => {
    if (status === 'ready' && !subjects.length && page > 1) setPage(1);
  }, [status, subjects.length, page]);

  const openSubject = subjects.find(subject => subject.id === openId) || null;
  const first = pagination && total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const last = pagination ? Math.min(pagination.page * pagination.limit, total) : 0;

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search subjects..."
            aria-label="Search subjects"
          />
        </div>
        <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category">
          <option>All</option>
          {CATEGORIES.map(item => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {showPublishedFilter && (
          <select value={state} onChange={event => setState(event.target.value)} aria-label="Filter by state">
            <option>All</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        )}
        <small>{status === 'loading' ? 'Loading…' : `${total} ${total === 1 ? 'subject' : 'subjects'}`}</small>
      </div>

      {status === 'error' && (
        <p className="error-notice">
          {error}{' '}
          <button className="link-btn" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      {status === 'loading' && <p className="muted">Loading subjects…</p>}
      {status !== 'loading' && status !== 'error' && !subjects.length && (
        <div className="empty">
          <BookOpen />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      )}

      <div className="subject-grid">
        {subjects.map(subject => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            chosen={chosenIds.includes(subject.id)}
            onToggle={selectable ? () => onToggle(subject.id) : undefined}
            expanded={openId === subject.id}
            onCourses={() => setOpenId(openId === subject.id ? null : subject.id)}
          />
        ))}
      </div>

      {openSubject && (
        <SubjectCourses
          subject={openSubject}
          onOpenCourse={onOpenCourse}
          onClose={() => setOpenId(null)}
        />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pager">
          <span>
            Showing {first}–{last} of {total}
          </span>
          <button onClick={() => setPage(pagination.page - 1)} disabled={!pagination.hasPreviousPage}>
            <ChevronLeft size={14} /> Prev
          </button>
          <strong>
            Page {pagination.page} of {pagination.totalPages}
          </strong>
          <button onClick={() => setPage(pagination.page + 1)} disabled={!pagination.hasNextPage}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  );
}
