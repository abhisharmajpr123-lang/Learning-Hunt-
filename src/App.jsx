import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Brand from './components/Brand.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import LoginPage from './pages/Login.jsx';
import SignupPage from './pages/Signup.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import BrowseClasses from './pages/BrowseClasses.jsx';
import Syllabus from './pages/Syllabus.jsx';
import { CourseRow, SubjectBrowser, SubjectCard } from './components/Catalogue.jsx';
import { SubjectIcon } from './components/SubjectIcon.jsx';
import { styleFor } from './lib/catalogue.js';
import { useCourses, useSubjects } from './hooks/useCatalogue.js';
import { useEnrolments } from './hooks/useEnrolments.js';
import { useTracks } from './hooks/useCurriculum.js';
import { api } from './lib/api.js';
import { isPortalPage, pageTitle, portalFor } from './lib/portals.js';
import { Activity, ArrowRight, Award, Bell, BookOpen, Brain, ChartNoAxesCombined, ClipboardCheck, FileText, Flame, GraduationCap, ListChecks, LogOut, Menu, Plus, ShieldCheck, Sparkles, Target, Users, Video, Zap } from 'lucide-react';

const initialActivities = [
  { id: 1, type: 'video', subject: 'Physics', title: 'Newton’s laws of motion', detail: 'Watched 18 of 22 minutes', date: 'Today' },
  { id: 2, type: 'quiz', subject: 'Mathematics', title: 'Quadratic equations quiz', detail: '8 of 10 correct', score: 80, date: 'Yesterday' },
  { id: 3, type: 'assignment', subject: 'Web Development', title: 'Build a profile card', detail: 'Submitted · awaiting review', date: 'Yesterday' },
  { id: 4, type: 'test', subject: 'Chemistry', title: 'Chemical bonding test', detail: 'Completed', score: 76, date: 'Mon, 16 Nov' }
];
const demoStudents = [
  { name: 'Arjun Mehta', email: 'student@learnhunt.demo', subjects: 3, progress: 72, quiz: 85, assignments: '7/10' },
  { name: 'Sana Khan', email: 'sana@learnhunt.demo', subjects: 4, progress: 84, quiz: 91, assignments: '9/10' },
  { name: 'Dev Patel', email: 'devpatel@learnhunt.demo', subjects: 2, progress: 48, quiz: 67, assignments: '5/8' },
  { name: 'Isha Verma', email: 'isha@learnhunt.demo', subjects: 3, progress: 63, quiz: 78, assignments: '6/8' }
];
const roleLabel = role => role[0].toUpperCase() + role.slice(1);

function Bar({ value }) {
  return <div className="bar"><i style={{ width: value + '%' }} /></div>;
}

function Stat({ icon: Icon, label, value, note, onClick }) {
  const body = (
    <>
      <span><Icon size={19} /></span>
      <div><small>{label}</small><b>{value}</b><em>{note}</em></div>
    </>
  );
  if (onClick) {
    return <button type="button" className="stat stat-button" onClick={onClick}>{body}</button>;
  }
  return <div className="stat">{body}</div>;
}

function Heading({ tag, title, subtitle }) {
  return <div className="heading"><small>{tag}</small><h1>{title}</h1><p>{subtitle}</p></div>;
}

function ActivityFeed({ items }) {
  return (
    <div className="activity-feed">
      {items.map(activity => (
        <div className="activity-row" key={activity.id}>
          <span className={'activity-icon ' + activity.type}>
            {activity.type === 'video' ? <Video /> : activity.type === 'quiz' ? <ListChecks /> : activity.type === 'assignment' ? <FileText /> : <ClipboardCheck />}
          </span>
          <div><b>{activity.title}</b><small>{activity.subject} · {activity.detail}</small></div>
          {activity.score != null && <strong>{activity.score}%</strong>}
          <time>{activity.date}</time>
        </div>
      ))}
    </div>
  );
}

function Table({ students }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Student</th><th>Subjects</th><th>Progress</th><th>Quiz avg.</th><th>Assignments</th></tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.email}>
              <td><b>{student.name}</b><small>{student.email}</small></td>
              <td>{student.subjects}</td>
              <td><div className="table-progress"><Bar value={student.progress} />{student.progress}%</div></td>
              <td>{student.quiz}%</td>
              <td>{student.assignments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubjectRow({ item, onOpen }) {
  const style = styleFor(item.subject);
  return (
    <button type="button" className="course-row course-open" onClick={onOpen}>
      <span className={'course-symbol ' + style.color}>
        <SubjectIcon name={style.icon} size={18} />
      </span>
      <div className="course-details">
        <b>{item.subject.name}</b>
        <small>{item.subject.trackLabel} · CBSE syllabus</small>
      </div>
      <ArrowRight size={15} />
    </button>
  );
}

function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <BookOpen />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="btn primary" onClick={action}>Explore subjects</button>
    </div>
  );
}

function Student({ page, setPage, selected, setSelected, subjectClasses, setSubjectClasses, activities, setActivities, completed, setCompleted, rewards, setRewards, goCourse, goSyllabus }) {
  const today = localDayKey();
  const daily = rewards.daily.date === today ? rewards.daily : { date: today, video: 0, quiz: 0, assignment: 0, test: 0, total: 0 };
  const level = Math.floor(rewards.xp / 250) + 1;
  const badges = [
    { name: 'First Steps', icon: Award, earned: rewards.xp >= 20 },
    { name: 'Quiz Explorer', icon: Brain, earned: daily.quiz >= 1 },
    { name: 'Consistency', icon: Flame, earned: rewards.streak >= 3 },
    { name: 'Learning Hero', icon: Sparkles, earned: rewards.xp >= 500 }
  ];
  const scoredActivities = activities.filter(activity => typeof activity.score === 'number');
  const weakTopics = scoredActivities.filter(activity => activity.score < 75).slice(0, 3);
  const revisionTopics = scoredActivities.filter(activity => activity.score >= 75 && activity.score < 90).slice(0, 3);
  const masteredTopics = scoredActivities.filter(activity => activity.score >= 90).slice(0, 3);

  const [message, setMessage] = useState('');
  // Remember which card was opened so returning from a syllabus page keeps its class.
  const [browseSubjectId, setBrowseSubjectId] = useState(() => loadSaved('learnhunt-browse-subject', null));
  const [browseChange, setBrowseChange] = useState(false);

  useEffect(() => {
    if (browseSubjectId) localStorage.setItem('learnhunt-browse-subject', JSON.stringify(browseSubjectId));
  }, [browseSubjectId]);

  // Live catalogue: published subjects, plus every course of the chosen subjects.
  const catalogue = useSubjects({ published: 'true', limit: 50 });
  // Subjects that exist in the CBSE curriculum; only those get a class picker.
  const curriculum = useTracks();
  const cbseSubjectNames = new Set(curriculum.tracks.flatMap(track => track.subjects || []));
  const courseFeed = useCourses({ limit: 50 });
  // Server-side enrolment rows, not a localStorage selection.
  const learning = useEnrolments();
  const mySubjects = catalogue.subjects.filter(subject => selected.includes(subject.id));
  const myCourses = courseFeed.courses.filter(course => selected.includes(course.subject));
  const subjectFor = course => catalogue.subjects.find(subject => subject.id === course.subject);
  const toggleSubject = id =>
    setSelected(chosen => (chosen.includes(id) ? chosen.filter(item => item !== id) : [...chosen, id]));

  const addActivity = (type, title, subject, detail, score) => {
    const now = Date.now();
    setActivities([{ id: now, type, title, subject, detail, score, date: 'Just now', createdAt: now }, ...activities]);
    setMessage(title + ' recorded in your activity.');
    setRewards(prev => {
      const base = prev.daily.date === today ? prev.daily : { date: today, video: 0, quiz: 0, assignment: 0, test: 0, total: 0 };
      const xp = { video: 20, quiz: 30, assignment: 50, test: 40 }[type] || 10;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = localDayKey(yesterday);
      const streak = prev.lastActive === today ? prev.streak : prev.lastActive === yKey ? prev.streak + 1 : 1;
      return {
        ...prev,
        xp: prev.xp + xp,
        streak,
        lastActive: today,
        daily: { ...base, [type]: base[type] + 1, total: base.total + 1 }
      };
    });
  };

  // An enrolment made on another page must show up as soon as My learning opens.
  useEffect(() => {
    if (page === 'learning') learning.reload();
  }, [page, learning.reload]);

  // Ids from an older catalogue (or a deleted subject) can survive in the saved setup;
  // drop anything the API no longer knows.
  useEffect(() => {
    if (catalogue.status !== 'ready' || !catalogue.subjects.length) return;
    const known = new Set(catalogue.subjects.map(subject => subject.id));
    setSelected(current => {
      const next = current.filter(id => known.has(id));
      return next.length === current.length ? current : next;
    });
    setSubjectClasses(current => {
      const next = Object.fromEntries(Object.entries(current).filter(([id]) => known.has(id)));
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [catalogue.status, catalogue.subjects, setSelected, setSubjectClasses]);

  if (page === 'classes') {
    // Full-screen syllabus browser, opened from My subjects; back returns to that list.
    const chosen = subjectClasses[browseSubjectId || 'last'];
    const browsedCard = catalogue.subjects.find(subject => subject.id === browseSubjectId) || null;
    return (
      <div className="screen-view">
        <div className="screen-view-inner">
          <BrowseClasses
            subjectName={browsedCard?.name}
            trackId={browseChange ? '' : chosen?.trackId || ''}
            onSelectTrack={track => {
              setSubjectClasses(previous => ({
                ...previous,
                [browseSubjectId || 'last']: { trackId: track.id, label: track.label }
              }));
              setBrowseChange(false);
            }}
            onChangeClass={() => setBrowseChange(true)}
            onOpenSyllabus={goSyllabus}
            onBack={() => setPage('subjects')}
          />
        </div>
      </div>
    );
  }

  if (page === 'discover') {
    return (
      <>
        <Heading
          tag="FIND YOUR NEXT SUBJECT"
          title="Explore subjects"
          subtitle="Search, filter and page through the live catalogue, then choose what you want to learn."
        />
        <SubjectBrowser
          filters={{ published: 'true' }}
          selectable
          chosenIds={selected}
          onToggle={toggleSubject}
          onOpenCourse={goCourse}
          coursesPreview={false}
          emptyTitle="No subjects match"
          emptyText="Try a different search term or category."
        />
      </>
    );
  }

  if (page === 'subjects') {
    return (
      <>
        <Heading tag="YOUR LEARNING SPACE" title="My subjects" subtitle="Your chosen subjects and the live courses inside them." />
        {catalogue.status === 'loading' && <p className="muted">Loading your subjects…</p>}
        {catalogue.status === 'error' && <p className="error-notice">{catalogue.error}</p>}
        <div className="subject-grid">
          {mySubjects.map(subject => {
            // Computer Science, Web Development and the like have no CBSE syllabus.
            const hasCbseSyllabus = cbseSubjectNames.has(subject.name);
            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                chosen
                classLabel={subjectClasses[subject.id]?.label}
                onToggle={() => toggleSubject(subject.id)}
                onCourses={
                  hasCbseSyllabus
                    ? () => {
                        setBrowseSubjectId(subject.id);
                        setBrowseChange(false);
                        setPage('classes');
                      }
                    : undefined
                }
                onChangeClass={
                  hasCbseSyllabus
                    ? () => {
                        setBrowseSubjectId(subject.id);
                        setBrowseChange(true);
                        setPage('classes');
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
        {catalogue.status === 'ready' && !mySubjects.length && (
          <Empty title="No subjects selected" text="Explore the catalogue and choose what you would like to study." action={() => setPage('discover')} />
        )}
      </>
    );
  }

  if (page === 'learning') {
    return (
      <>
        <Heading
          tag="YOUR ENROLMENTS"
          title="My learning"
          subtitle="Courses and CBSE subjects you have enrolled in, stored on the server and tied to your account."
        />
        {learning.status === 'loading' && <p className="muted">Loading your courses…</p>}
        {learning.status === 'error' && (
          <p className="error-notice">
            {learning.error}{' '}
            <button className="link-btn" onClick={learning.reload}>Try again</button>
          </p>
        )}
        {learning.status === 'ready' && !learning.enrollments.length && (
          <Empty
            title="Nothing enrolled yet"
            text="Browse classes 9-12, JEE and NEET, then enrol in a subject to see its CBSE syllabus here."
            action={() => setPage('classes')}
          />
        )}
        {learning.enrollments.length > 0 && (
          <section className="panel">
            {learning.enrollments.map(item =>
              item.kind === 'subject' ? (
                <SubjectRow
                  key={item.id}
                  item={item}
                  onOpen={() => goSyllabus(item.subject.trackId, item.subject.id)}
                />
              ) : (
                <CourseRow
                  key={item.id}
                  course={item.course}
                  subject={item.course.subject}
                  onOpen={() => goCourse(item.course.id)}
                />
              )
            )}
          </section>
        )}
      </>
    );
  }

  if (page === 'progress') {
    return (
      <>
        <Heading tag="YOUR LEARNING INSIGHTS" title="My progress" subtitle="See your video, quiz, assignment and test activity separately." />
        <div className="stats-grid">
          <Stat icon={Video} label="Videos completed" value={completed.length + '/6'} note="Sample lesson activity" />
          <Stat icon={ChartNoAxesCombined} label="Overall progress" value={Math.round(completed.length / 6 * 100) + '%'} note="Based on completed videos" />
          <Stat icon={ListChecks} label="Quiz average" value="85%" note="Sample graded attempts" />
          <Stat icon={FileText} label="Assignments" value="7/10" note="3 need attention" />
        </div>
        <section className="panel">
          <h2>Recent learning activity</h2>
          <ActivityFeed items={activities} />
        </section>
      </>
    );
  }

  return (
    <>
      <Heading tag="STUDENT OVERVIEW" title="Good morning, Arjun" subtitle="Keep your curiosity moving. Every completed lesson is progress." />
      <div className="stats-grid">
        <Stat icon={BookOpen} label="Selected subjects" value={selected.length} note="Open My subjects" onClick={() => setPage('subjects')} />
        <Stat icon={Video} label="Videos completed" value={completed.length + '/6'} note="Keep your streak going" />
        <Stat icon={ListChecks} label="Quiz average" value="85%" note="Above your 75% target" />
        <Stat icon={ClipboardCheck} label="Assignments" value="7/10" note="3 submissions remaining" />
      </div>
      <div className="two-col day4-grid">
        <section className="panel rewards-panel">
          <div className="panel-head">
            <div>
              <small>DAY 4 · LEARNING REWARDS</small>
              <h2>Level {level} learner <span className="xp-pill"><Zap size={13} /> {rewards.xp} XP</span></h2>
            </div>
            <span className="streak-chip"><Flame size={16} /> {rewards.streak} day streak</span>
          </div>
          <div className="xp-track"><div className="xp-track-fill" style={{ width: (rewards.xp % 250) / 250 * 100 + '%' }} /></div>
          <small className="xp-caption">{rewards.xp % 250} / 250 XP to Level {level + 1}</small>
          <div className="badge-row">
            {badges.map(({ name, icon: BadgeIcon, earned }) => (
              <span className={'earned-badge ' + (earned ? 'earned' : '')} key={name}><BadgeIcon size={15} />{name}</span>
            ))}
          </div>
        </section>
        <section className="panel mission-panel">
          <small>DAILY MISSIONS</small>
          <h2>Today's goals</h2>
          <div className="mission-line"><span><Video size={14} /> Complete 2 lessons</span><b>{Math.min(daily.video, 2)}/2</b></div>
          <Bar value={Math.min(daily.video / 2 * 100, 100)} />
          <div className="mission-line"><span><ListChecks size={14} /> Attempt 1 quiz</span><b>{Math.min(daily.quiz, 1)}/1</b></div>
          <Bar value={Math.min(daily.quiz * 100, 100)} />
          <div className="mission-line"><span><Target size={14} /> Complete 3 activities</span><b>{Math.min(daily.total, 3)}/3</b></div>
          <Bar value={Math.min(daily.total / 3 * 100, 100)} />
        </section>
      </div>
      <section className="panel insight-panel">
        <div className="panel-head">
          <div><small>QUIZ-BASED INTELLIGENCE</small><h2><Brain size={17} /> Topic insights</h2></div>
          <span className="insight-note">Based on available demo quiz scores</span>
        </div>
        <div className="insight-columns">
          <div>
            <b className="insight-title weak-title">Needs attention</b>
            {weakTopics.length ? weakTopics.map((activity, index) => (
              <div className="topic-row" key={index}><span>{activity.subject}</span><b>{activity.score}%</b></div>
            )) : <small className="muted">No low-score topics yet.</small>}
          </div>
          <div>
            <b className="insight-title revise-title">Review next</b>
            {revisionTopics.length ? revisionTopics.map((activity, index) => (
              <div className="topic-row" key={index}><span>{activity.subject}</span><b>{activity.score}%</b></div>
            )) : <small className="muted">Nothing queued for revision.</small>}
          </div>
          <div>
            <b className="insight-title mastered-title">Strong topics</b>
            {masteredTopics.length ? masteredTopics.map((activity, index) => (
              <div className="topic-row" key={index}><span>{activity.subject}</span><b>{activity.score}%</b></div>
            )) : <small className="muted">Score 90%+ to master a topic.</small>}
          </div>
        </div>
      </section>
      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <div><small>YOUR CLASSROOM</small><h2>Continue learning</h2></div>
            <button className="link-btn" onClick={() => setPage('subjects')}>All subjects <ArrowRight size={14} /></button>
          </div>
          {courseFeed.status === 'loading' && <p className="muted">Loading courses…</p>}
          {courseFeed.status === 'error' && <p className="error-notice">{courseFeed.error}</p>}
          {myCourses.length ? (
            myCourses.slice(0, 4).map(course => (
              <CourseRow key={course.id} course={course} subject={subjectFor(course)} onOpen={() => goCourse(course.id)} />
            ))
          ) : (
            <p className="muted">Choose a subject to see its courses here.</p>
          )}
        </section>
        <section className="panel">
          <small>THIS WEEK</small>
          <h2>Learning snapshot</h2>
          <div className="big-number">{Math.round(completed.length / 6 * 100)}%<small>overall demo progress</small></div>
          <Bar value={completed.length / 6 * 100} />
          <div className="metric"><span>Quiz average</span><b>85%</b></div>
          <div className="metric"><span>Assignments submitted</span><b>7 of 10</b></div>
          <button className="btn secondary full" onClick={() => setPage('progress')}>View detailed progress <ArrowRight size={14} /></button>
        </section>
      </div>
      <section className="panel">
        <div className="panel-head"><h2>Try the demo activities</h2><small>Actions update your sample activity feed.</small></div>
        <div className="actions">
          <button className="btn secondary" onClick={() => { if (completed.length < 6) { setCompleted([...completed, 'v' + Date.now()]); addActivity('video', 'Introduction to the topic', 'Mathematics', 'Watched and completed', null); } }}><Video size={15} /> Complete a video</button>
          <button className="btn secondary" onClick={() => addActivity('quiz', 'Practice quiz', 'Mathematics', '9 of 10 correct', 90)}><ListChecks size={15} /> Attempt a quiz</button>
          <button className="btn secondary" onClick={() => addActivity('assignment', 'Profile card assignment', 'Web Development', 'Submitted · awaiting review', null)}><FileText size={15} /> Submit assignment</button>
          <button className="btn secondary" onClick={() => addActivity('test', 'Chapter test', 'Physics', 'Completed · 8 of 10', 80)}><ClipboardCheck size={15} /> Take a test</button>
        </div>
        {message && <p className="notice">{message}</p>}
        <ActivityFeed items={activities.slice(0, 3)} />
      </section>
    </>
  );
}

function Teacher({ page, setPage, students, goCourse }) {
  const [type, setType] = useState('Quiz');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [notice, setNotice] = useState('');

  // The API owns the relationship: "teacher=me" returns the subjects you own.
  const mine = useSubjects({ teacher: 'me', limit: 50 });
  const subjects = mine.subjects;
  const activeSubject = subjects.find(subject => subject.id === subjectId) || subjects[0] || null;

  if (page === 'students') {
    return (
      <>
        <Heading tag="LEARNER SUPPORT" title="Your students" subtitle="Review learner engagement and identify who may need extra support." />
        <section className="panel"><h2>Student overview</h2><Table students={students} /></section>
      </>
    );
  }

  if (page === 'assessments') {
    return (
      <>
        <Heading tag="CHECK UNDERSTANDING" title="Assessments" subtitle="Create practice activities and review student submissions." />
        <div className="two-col">
          <section className="panel">
            <h2>Create an assessment</h2>
            <div className="type-picker">
              {['Quiz', 'Assignment', 'Test'].map(item => (
                <button className={type === item ? 'active' : ''} onClick={() => setType(item)} key={item}>{item}</button>
              ))}
            </div>
            <label className="field">Assessment title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Chapter 1 checkpoint" /></label>
            <label className="field">
              Subject
              <select value={activeSubject?.id || ''} onChange={event => setSubjectId(event.target.value)} disabled={!subjects.length}>
                {subjects.length ? subjects.map(subject => (
                  <option value={subject.id} key={subject.id}>{subject.name}</option>
                )) : <option value="">No subjects yet</option>}
              </select>
            </label>
            <button
              className="btn primary"
              onClick={() => {
                if (!title.trim()) { setNotice('Enter a title first.'); return; }
                setNotice(type + ' “' + title + '” added to the demo workspace.');
                setTitle('');
              }}
            >
              <Plus size={15} /> Create {type.toLowerCase()}
            </button>
            {notice && <p className="notice">{notice}</p>}
          </section>
          <section className="panel">
            <h2>Recent submissions</h2>
            <ActivityFeed items={[
              { id: 11, type: 'assignment', subject: 'Physics', title: 'Motion worksheet', detail: 'Submitted by Arjun', date: 'Today' },
              { id: 12, type: 'quiz', subject: 'Mathematics', title: 'Algebra checkpoint', detail: '12 students completed', score: 82, date: 'Yesterday' },
              { id: 13, type: 'test', subject: 'Physics', title: 'Forces unit test', detail: '8 submissions to review', date: 'Monday' }
            ]} />
          </section>
        </div>
      </>
    );
  }

  if (page === 'subjects') {
    return (
      <>
        <Heading tag="YOUR CLASSROOM" title="My subjects" subtitle="The subjects where you are the teacher, with their live course outline." />
        <SubjectBrowser
          filters={{ teacher: 'me' }}
          onOpenCourse={goCourse}
          emptyTitle="No subjects yet"
          emptyText="A developer makes you the teacher of a subject, and it appears here."
        />
      </>
    );
  }

  return (
    <>
      <Heading tag="TEACHER WORKSPACE" title="Good morning, Priya" subtitle="Plan lessons, support learners and see how your classes are progressing." />
      <div className="stats-grid">
        <Stat icon={BookOpen} label="Subjects teaching" value={mine.total} note="Your classroom" />
        <Stat icon={Users} label="Active students" value="94" note="Across demo subjects" />
        <Stat icon={ClipboardCheck} label="To review" value="8" note="Assignments and tests" />
        <Stat icon={ChartNoAxesCombined} label="Class average" value="81%" note="Quiz and test scores" />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Teaching subjects</h2>
            <button className="link-btn" onClick={() => setPage('subjects')}>View all <ArrowRight size={14} /></button>
          </div>
          {mine.status === 'loading' && <p className="muted">Loading subjects…</p>}
          {mine.status === 'error' && <p className="error-notice">{mine.error}</p>}
          {subjects.map(subject => {
            const style = styleFor(subject);
            return (
              <div className="teacher-row" key={subject.id}>
                <span className={'course-symbol ' + style.color}><SubjectIcon name={style.icon} /></span>
                <div><b>{subject.name}</b><small>{subject.category}</small></div>
                <span className={subject.published ? 'published' : 'draft'}>{subject.published ? 'Published' : 'Draft'}</span>
              </div>
            );
          })}
          {mine.status === 'ready' && !subjects.length && <p className="muted">No subjects are assigned to you yet.</p>}
        </section>
        <section className="panel">
          <small>QUICK ACTION</small>
          <h2>Build an activity</h2>
          <p className="muted">Create a quiz, assignment or test for one of your subjects.</p>
          <button className="btn primary full" onClick={() => setPage('assessments')}>Create assessment <ArrowRight size={14} /></button>
          <button className="btn secondary full" onClick={() => setPage('students')}>Review students <Users size={14} /></button>
        </section>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Student progress</h2>
          <button className="link-btn" onClick={() => setPage('students')}>Open student list <ArrowRight size={14} /></button>
        </div>
        <Table students={students.slice(0, 3)} />
      </section>
    </>
  );
}

function Developer({ page, setPage, students, user, goCourse }) {
  const { token } = useAuth();
  const catalogue = useSubjects({ limit: 50 });
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [browserVersion, setBrowserVersion] = useState(0);

  const addSubject = async event => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setNotice('Enter a subject name first.'); return; }

    setSaving(true);
    try {
      await api.createSubject({ name: cleanName, category }, token);
      setNotice(cleanName + ' added as a draft subject.');
      setName('');
      catalogue.reload();
      setBrowserVersion(version => version + 1);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (page === 'users') {
    return (
      <>
        <Heading tag="PLATFORM ACCESS" title="User management" subtitle="Review the accounts and role access across Learn Hunt." />
        <section className="panel">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {[user, ...students.map(student => ({ ...student, role: 'student' }))].map(account => (
                <tr key={account.email}>
                  <td>{account.name}</td>
                  <td>{account.email}</td>
                  <td>{roleLabel(account.role || 'student')}</td>
                  <td><span className="published">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  if (page === 'subjects') {
    return (
      <>
        <Heading tag="PLATFORM CATALOGUE" title="Subject catalogue" subtitle="Every subject in MongoDB, with server-side search, filters and pagination." />
        <SubjectBrowser
          key={browserVersion}
          showPublishedFilter
          onOpenCourse={goCourse}
          emptyTitle="The catalogue is empty"
          emptyText="Add the first subject with the form below."
        />
        <div className="two-col">
          <section className="panel">
            <small>QUICK ACTION</small>
            <h2>Add a subject</h2>
            <form onSubmit={addSubject}>
              <label className="field">Subject name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Biology" /></label>
              <label className="field">
                Category
                <select value={category} onChange={event => setCategory(event.target.value)}>
                  <option>Technology</option>
                  <option>Science</option>
                  <option>Languages</option>
                  <option>Business</option>
                </select>
              </label>
              <button className="btn primary full" type="submit" disabled={saving}>
                <Plus size={15} /> {saving ? 'Adding…' : 'Add draft subject'}
              </button>
            </form>
            {notice && <p className="notice">{notice}</p>}
            <p className="muted">POST /api/subjects keeps the subject as a draft until a teacher publishes it.</p>
          </section>
          <section className="panel">
            <h2>Role permissions</h2>
            <div className="permissions">
              <div><ShieldCheck /><b>Developer</b><small>Manage users, subjects and reports.</small></div>
              <div><BookOpen /><b>Teacher</b><small>Manage assigned subjects and assessments.</small></div>
              <div><GraduationCap /><b>Student</b><small>Choose subjects, learn and view progress.</small></div>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (page === 'reports') {
    return (
      <>
        <Heading tag="PLATFORM HEALTH" title="Platform reports" subtitle="High-level usage signals for the platform." />
        <div className="stats-grid">
          <Stat icon={Users} label="Registered users" value="128" note="Demo platform total" />
          <Stat icon={BookOpen} label="Subjects" value={catalogue.total} note="Live catalogue total" />
          <Stat icon={Activity} label="Learning activities" value="486" note="Sample activity records" />
          <Stat icon={ChartNoAxesCombined} label="Average completion" value="71%" note="Active learners" />
        </div>
        <section className="panel">
          <h2>Platform activity</h2>
          {[['Video lessons', 78], ['Quizzes', 64], ['Assignments', 52], ['Tests', 41]].map(([label, value]) => (
            <div className="report-row" key={label}><span>{label}</span><Bar value={value} /><b>{value}%</b></div>
          ))}
        </section>
      </>
    );
  }

  return (
    <>
      <Heading tag="DEVELOPER CONSOLE" title="Platform overview" subtitle="Manage the learning catalogue, role access and platform health." />
      <div className="stats-grid">
        <Stat icon={Users} label="Total users" value="128" note="Students and teachers" />
        <Stat icon={BookOpen} label="Subjects" value={catalogue.total} note="In the catalogue" />
        <Stat icon={ShieldCheck} label="Platform roles" value="3" note="Developer · Teacher · Student" />
        <Stat icon={Activity} label="Learning activity" value="486" note="Sample events" />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Subject catalogue</h2>
            <button className="link-btn" onClick={() => setPage('subjects')}>View catalogue <ArrowRight size={14} /></button>
          </div>
          {catalogue.status === 'loading' && <p className="muted">Loading subjects…</p>}
          {catalogue.status === 'error' && <p className="error-notice">{catalogue.error}</p>}
          {catalogue.subjects.slice(0, 5).map(subject => {
            const style = styleFor(subject);
            return (
              <div className="teacher-row" key={subject.id}>
                <span className={'course-symbol ' + style.color}><SubjectIcon name={style.icon} /></span>
                <div><b>{subject.name}</b><small>{subject.category}</small></div>
                <span className={subject.published ? 'published' : 'draft'}>{subject.published ? 'Published' : 'Draft'}</span>
              </div>
            );
          })}
          {catalogue.status === 'ready' && !catalogue.subjects.length && <p className="muted">The catalogue is empty. Add a subject from the catalogue page.</p>}
        </section>
        <section className="panel">
          <small>QUICK ACTION</small>
          <h2>Add a subject</h2>
          <form onSubmit={addSubject}>
            <label className="field">Subject name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Biology" /></label>
            <label className="field">
              Category
              <select value={category} onChange={event => setCategory(event.target.value)}>
                <option>Technology</option>
                <option>Science</option>
                <option>Languages</option>
                <option>Business</option>
              </select>
            </label>
            <button className="btn primary full" type="submit" disabled={saving}>
              <Plus size={15} /> {saving ? 'Adding…' : 'Add draft subject'}
            </button>
          </form>
          {notice && <p className="notice">{notice}</p>}
          <p className="muted">New subjects remain drafts until a teacher is assigned and content is ready.</p>
        </section>
      </div>
      <section className="panel">
        <h2>Role permissions</h2>
        <div className="permissions">
          <div><ShieldCheck /><b>Developer</b><small>Manage users, subjects and reports.</small></div>
          <div><BookOpen /><b>Teacher</b><small>Manage assigned subjects and assessments.</small></div>
          <div><GraduationCap /><b>Student</b><small>Choose subjects, learn and view progress.</small></div>
        </div>
      </section>
    </>
  );
}

function localDayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function Portal() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, token, logout: clearSession } = useAuth();
  const role = user?.role || 'student';
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState(() => loadSaved('learnhunt-selected', []));
  // The class chosen for each My subjects card; synced to the account below.
  const [subjectClasses, setSubjectClasses] = useState(() => loadSaved('learnhunt-subject-classes', {}));
  const [studyReady, setStudyReady] = useState(false);
  const [activities, setActivities] = useState(() => loadSaved('learnhunt-activities', initialActivities));
  const [completed, setCompleted] = useState(() => loadSaved('learnhunt-completed', ['v1', 'v2', 'v3', 'v4']));
  const [rewards, setRewards] = useState(() => loadSaved('learnhunt-rewards', {
    xp: 0,
    streak: 0,
    lastActive: null,
    daily: { date: localDayKey(), video: 0, quiz: 0, assignment: 0, test: 0, total: 0 }
  }));

  // Restore this account's saved study setup (selected subjects and class picks).
  useEffect(() => {
    if (!user?.id || !token) return undefined;
    let active = true;
    setStudyReady(false);
    api
      .study(token)
      .then(({ study }) => {
        // A fresh account keeps whatever this browser already had, ready for the first save.
        if (!active || (!study.selected.length && !Object.keys(study.classes).length)) return;
        setSelected(study.selected);
        setSubjectClasses(study.classes);
      })
      .catch(() => {})
      .finally(() => { if (active) setStudyReady(true); });
    return () => { active = false; };
  }, [user?.id, token]);

  // Save changes to the account (and the browser) so signing out keeps them.
  useEffect(() => {
    if (!studyReady || !token) return undefined;
    const timer = setTimeout(() => {
      localStorage.setItem('learnhunt-selected', JSON.stringify(selected));
      localStorage.setItem('learnhunt-subject-classes', JSON.stringify(subjectClasses));
      api.saveStudy({ selected, classes: subjectClasses }, token).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [studyReady, selected, subjectClasses, token]);

  useEffect(() => { localStorage.setItem('learnhunt-activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('learnhunt-completed', JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem('learnhunt-rewards', JSON.stringify(rewards)); }, [rewards]);

  const nav = portalFor(role);
  const segments = pathname.split('/').filter(Boolean);
  const isCourseOutline = segments[1] === 'courses' && Boolean(segments[2]);
  const isSyllabus = segments[1] === 'syllabus' && Boolean(segments[2]) && Boolean(segments[3]);
  const page = segments[1] || 'overview';
  const allowed = segments[0] === role && (isCourseOutline || isSyllabus || isPortalPage(role, page));
  const title = isCourseOutline ? 'Course outline' : isSyllabus ? 'Syllabus' : pageTitle(role, page);
  const initials = user.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const setPage = id => navigate(`/${role}/${id}`);
  const goCourse = id => navigate(`/${role}/courses/${id}`);
  const goSyllabus = (trackId, subjectId) => navigate(`/${role}/syllabus/${trackId}/${subjectId}`);
  const logout = () => {
    // Flush the latest subject/class picks before the session goes away.
    if (token) api.saveStudy({ selected, classes: subjectClasses }, token).catch(() => {});
    clearSession();
    navigate('/login', { replace: true });
  };

  if (!allowed) return <Navigate to={`/${role}/overview`} replace />;

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobile ? 'open' : '')}>
        <Brand />
        <small className="side-caption">{role.toUpperCase()} PORTAL</small>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={!isCourseOutline && page === id ? 'active' : ''}
              onClick={() => { setPage(id); setMobile(false); }}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-box"><b>Need a hand?</b><small>Explore the demo workspace</small></div>
          <div className="user-box">
            <span className={'avatar ' + role}>{initials}</span>
            <div><b>{user.name}</b><small>{roleLabel(role)} account</small></div>
            <button onClick={logout} title="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {mobile && <button className="backdrop" onClick={() => setMobile(false)} aria-label="Close menu" />}
      <main className="main">
        <header className="topbar">
          <button className="menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb">Learn Hunt <span>/</span> <b>{title}</b></div>
          <div className="top-actions">
            <span>{role} portal</span>
            <button aria-label="Notifications"><Bell size={18} /></button>
            <span className={'avatar ' + role}>{initials}</span>
          </div>
        </header>
        <div className="content">
          {isCourseOutline ? (
            <CourseDetail courseId={segments[2]} onBack={() => setPage('subjects')} />
          ) : isSyllabus ? (
            <Syllabus trackId={segments[2]} subjectId={segments[3]} onBack={() => setPage('classes')} />
          ) : role === 'student' ? (
            <Student
              page={page}
              setPage={setPage}
              selected={selected}
              setSelected={setSelected}
              subjectClasses={subjectClasses}
              setSubjectClasses={setSubjectClasses}
              activities={activities}
              setActivities={setActivities}
              completed={completed}
              setCompleted={setCompleted}
              rewards={rewards}
              setRewards={setRewards}
              goCourse={goCourse}
              goSyllabus={goSyllabus}
            />
          ) : role === 'teacher' ? (
            <Teacher page={page} setPage={setPage} students={demoStudents} goCourse={goCourse} />
          ) : (
            <Developer page={page} setPage={setPage} students={demoStudents} user={user} goCourse={goCourse} />
          )}
          <footer>© 2026 Learn Hunt <span>Catalogue data comes from the Learn Hunt API</span></footer>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<RequireAuth><Portal /></RequireAuth>} />
    </Routes>
  );
}

export default App;
