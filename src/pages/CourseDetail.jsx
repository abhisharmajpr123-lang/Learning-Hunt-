import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Clock, Layers, ListOrdered, Plus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { SubjectIcon } from '../components/SubjectIcon.jsx';
import { levelLabel, styleFor } from '../lib/catalogue.js';
import { useEnrolments } from '../hooks/useEnrolments.js';

/** A course preview: numbered sections and the numbered lessons inside each one. */
export default function CourseDetail({ courseId, onBack }) {
  const { token, user } = useAuth();
  const [state, setState] = useState({ status: 'loading', course: null, subject: null, error: null });
  const isStudent = user?.role === 'student';
  const enrolments = useEnrolments({ enabled: isStudent });
  const enrolled = enrolments.enrollments.some(item => item.course.id === courseId);
  const [enrolBusy, setEnrolBusy] = useState(false);
  const [enrolNotice, setEnrolNotice] = useState('');

  async function toggleEnrolment() {
    setEnrolBusy(true);
    setEnrolNotice('');
    try {
      if (enrolled) {
        await enrolments.unenrol(courseId);
        setEnrolNotice('You left this course.');
      } else {
        await enrolments.enrol(courseId);
        setEnrolNotice('Added to My learning.');
      }
    } catch (error) {
      setEnrolNotice(error.message);
    } finally {
      setEnrolBusy(false);
    }
  }

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', course: null, subject: null, error: null });

    api
      .course(courseId, token)
      .then(async payload => {
        const course = payload.course;
        const subject = await api
          .subject(course.subject, token)
          .then(response => response.subject)
          .catch(() => null);
        if (active) setState({ status: 'ready', course, subject, error: null });
      })
      .catch(error => {
        if (active) setState({ status: 'error', course: null, subject: null, error: error.message });
      });

    return () => {
      active = false;
    };
  }, [courseId, token]);

  const { course, subject } = state;
  const style = styleFor(subject || {});

  return (
    <>
      <button className="link-btn back-btn" onClick={onBack}>
        <ArrowLeft size={14} /> Back to subjects
      </button>

      {state.status === 'loading' && <p className="muted">Loading course outline…</p>}

      {state.status === 'error' && (
        <div className="empty">
          <BookOpen />
          <h3>Course unavailable</h3>
          <p>{state.error}</p>
        </div>
      )}

      {course && (
        <>
          <header className="course-hero">
            <span className={'course-symbol ' + style.color}>
              <SubjectIcon name={style.icon} size={24} />
            </span>
            <div>
              <small>{subject ? subject.name : 'Course'} · {levelLabel(course.level)}</small>
              <h1>{course.title}</h1>
              <p>{course.description || 'No description yet.'}</p>
            </div>
            <span className={course.published ? 'published' : 'draft'}>
              {course.published ? 'Published' : 'Draft'}
            </span>
          </header>

          <div className="meta-chips">
            <span className="chip">
              <Layers size={13} /> {course.sectionCount} {course.sectionCount === 1 ? 'section' : 'sections'}
            </span>
            <span className="chip">
              <ListOrdered size={13} /> {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
            </span>
            <span className="chip">
              <Clock size={13} /> {course.totalDurationMinutes} min
            </span>
          </div>

          {isStudent && (
            <div className="enrol-bar">
              <button
                className={'btn ' + (enrolled ? 'secondary' : 'primary')}
                onClick={toggleEnrolment}
                disabled={enrolBusy || enrolments.status === 'loading'}
              >
                {enrolled ? 'Leave course' : <><Plus size={15} /> Enrol in this course</>}
              </button>
              {enrolled && <span className="chip"><Check size={13} /> Enrolled</span>}
              {enrolNotice && <small className="muted">{enrolNotice}</small>}
            </div>
          )}

          <p className="outline-note">{course.message}</p>

          {course.isEmpty ? (
            <div className="empty">
              <BookOpen />
              <h3>No lessons yet</h3>
              <p>This course has sections to fill. Lessons appear here in the order they are added.</p>
            </div>
          ) : (
            <div className="outline">
              {course.sections.map(section => (
                <section className="outline-section" key={section.id}>
                  <header className="outline-head">
                    <span className="outline-number">{section.number}</span>
                    <div>
                      <small>SECTION {section.number}</small>
                      <h3>{section.title}</h3>
                    </div>
                    <span className="outline-count">
                      {section.lessonCount} {section.lessonCount === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </header>
                  <ol className="lesson-list">
                    {section.lessons.map(lesson => (
                      <li key={lesson.id}>
                        <span className="lesson-number">{lesson.courseNumber}</span>
                        <div className="lesson-body">
                          <b>
                            Lesson {lesson.courseNumber} · {lesson.title}
                          </b>
                          {lesson.content && <p>{lesson.content}</p>}
                        </div>
                        {lesson.durationMinutes > 0 && (
                          <em className="lesson-duration">
                            <Clock size={12} /> {lesson.durationMinutes} min
                          </em>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
