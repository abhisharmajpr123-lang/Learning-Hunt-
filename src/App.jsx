import { useMemo, useState } from "react";
import {
  Search, Bell, Compass, LayoutDashboard, BookOpen, Bookmark,
  Settings, ChevronRight, Play, Clock3, Star, Flame, Target,
  Plus, Menu, X, CheckCircle2, GraduationCap, Sparkles
} from "lucide-react";

const courses = [
  { id: 1, title: "The Complete React Guide", category: "Development", level: "Beginner", lessons: 24, hours: "8h 20m", rating: "4.9", progress: 68, color: "violet", instructor: "Sarah Chen", initials: "SC", enrolled: true },
  { id: 2, title: "UI Design Fundamentals", category: "Design", level: "Beginner", lessons: 18, hours: "5h 45m", rating: "4.8", progress: 32, color: "orange", instructor: "Alex Morgan", initials: "AM", enrolled: true },
  { id: 3, title: "Python for Everyone", category: "Development", level: "Beginner", lessons: 32, hours: "11h 10m", rating: "4.9", progress: 0, color: "blue", instructor: "Jordan Lee", initials: "JL", enrolled: false },
  { id: 4, title: "Digital Marketing Mastery", category: "Business", level: "Intermediate", lessons: 21, hours: "7h 05m", rating: "4.7", progress: 0, color: "pink", instructor: "Priya Kapoor", initials: "PK", enrolled: false },
  { id: 5, title: "JavaScript: From Zero to Hero", category: "Development", level: "Intermediate", lessons: 28, hours: "9h 30m", rating: "4.9", progress: 0, color: "green", instructor: "Daniel Kim", initials: "DK", enrolled: false },
  { id: 6, title: "Build Your Creative Portfolio", category: "Design", level: "All levels", lessons: 14, hours: "4h 15m", rating: "4.8", progress: 0, color: "cyan", instructor: "Mia Wilson", initials: "MW", enrolled: false }
];

const categories = ["All courses", "Development", "Design", "Business"];

function App() {
  const [activeTab, setActiveTab] = useState("Discover");
  const [category, setCategory] = useState("All courses");
  const [query, setQuery] = useState("");
  const [joined, setJoined] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const visibleCourses = useMemo(() => courses.filter((course) => {
    const matchesCategory = category === "All courses" || course.category === category;
    const matchesQuery = course.title.toLowerCase().includes(query.toLowerCase()) || course.category.toLowerCase().includes(query.toLowerCase());
    const matchesTab = activeTab !== "My learning" || course.enrolled || joined.includes(course.id);
    return matchesCategory && matchesQuery && matchesTab;
  }), [category, query, activeTab, joined]);

  const joinCourse = (id) => {
    setJoined((current) => current.includes(id) ? current : [...current, id]);
    setNotice("Course added to My learning!");
    window.setTimeout(() => setNotice(""), 2600);
  };

  const navItems = [
    { label: "Discover", icon: Compass },
    { label: "My learning", icon: BookOpen },
    { label: "Saved courses", icon: Bookmark },
    { label: "Dashboard", icon: LayoutDashboard }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={21} /></div><span>learn<span className="brand-accent">hunt</span><i>.</i></span></div>
        <div className="workspace-label">LEARNING SPACE</div>
        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeTab === label ? "active" : ""}`} onClick={() => { setActiveTab(label); setSidebarOpen(false); }}>
              <Icon size={18} /><span>{label}</span>{label === "My learning" && <span className="nav-count">2</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17} /></div><strong>Keep your momentum</strong><p>Small steps every day lead to big wins.</p><button onClick={() => setNotice("Your learning streak starts today!")}>View your goals <ChevronRight size={14} /></button></div>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
          <div className="profile-row"><div className="profile-avatar">AS</div><div className="profile-copy"><strong>Alex Student</strong><span>Free learner</span></div><button className="profile-more" aria-label="Profile options">···</button></div>
        </div>
      </aside>

      {sidebarOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb">Learning space <span>/</span> <strong>{activeTab}</strong></div>
          <div className="top-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses..." /></label><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">AS</div></div>
        </header>

        <div className="content">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Good afternoon, Alex <span>✦</span></h1><p>Ready to learn something new today?</p></div><div className="date-chip"><span className="date-spark">✳</span><div><strong>Keep showing up.</strong><small>Your future self will thank you.</small></div></div></section>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-icon purple"><BookOpen size={18} /></div><div><span>Courses in progress</span><strong>02</strong><small><b>+1</b> this month</small></div></div>
            <div className="stat-card"><div className="stat-icon amber"><Flame size={18} /></div><div><span>Learning streak</span><strong>05 days</strong><small>You're on fire!</small></div></div>
            <div className="stat-card"><div className="stat-icon mint"><Clock3 size={18} /></div><div><span>Hours learned</span><strong>12.5h</strong><small><b>+3.5h</b> this week</small></div></div>
            <div className="stat-card"><div className="stat-icon blue"><Target size={18} /></div><div><span>Weekly goal</span><strong>70%</strong><div className="mini-progress"><i /></div></div></div>
          </section>

          <section className="continue-section"><div className="section-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Continue learning</h2></div><button className="text-link" onClick={() => setActiveTab("My learning")}>My learning <ChevronRight size={15} /></button></div>
            <div className="continue-card"><div className="continue-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-code">&lt;/&gt;</div><span className="art-label">REACT.JS</span></div><div className="continue-info"><div className="course-kicker">DEVELOPMENT <span>•</span> BEGINNER</div><h3>The Complete React Guide</h3><p>Build modern interfaces with components, hooks, and real-world projects.</p><div className="continue-meta"><span><BookOpen size={14} /> 16 of 24 lessons</span><span><Clock3 size={14} /> 2h 10m left</span></div><div className="progress-line"><i style={{ width: "68%" }} /></div><div className="continue-bottom"><span><b>68%</b> completed</span><button className="primary-button" onClick={() => setNotice("Lesson player will be added in the next build step.")}><Play size={14} fill="currentColor" /> Continue course</button></div></div></div>
          </section>

          <section className="catalog-section"><div className="section-heading"><div><div className="eyebrow">EXPLORE. LEARN. GROW.</div><h2>{activeTab === "My learning" ? "Your courses" : "Explore courses"} <span className="heading-count">{visibleCourses.length}</span></h2></div><button className="view-all" onClick={() => { setCategory("All courses"); setActiveTab("Discover"); }}>View all courses <ChevronRight size={15} /></button></div>
            <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
            {visibleCourses.length ? <div className="course-grid">{visibleCourses.map((course) => {
              const isJoined = course.enrolled || joined.includes(course.id);
              return <article className="course-card" key={course.id}><div className={`course-art ${course.color}`}><span className="art-category">{course.category}</span><div className="course-art-symbol">{course.category === "Development" ? "</>" : course.category === "Design" ? "✳" : "↗"}</div><span className="level-pill">{course.level}</span></div><div className="course-card-body"><div className="course-card-title"><h3>{course.title}</h3><span className="rating"><Star size={13} fill="currentColor" /> {course.rating}</span></div><div className="instructor"><span className="instructor-avatar">{course.initials}</span><span>{course.instructor}</span></div><div className="course-details"><span><BookOpen size={13} /> {course.lessons} lessons</span><span><Clock3 size={13} /> {course.hours}</span></div>{isJoined ? <button className="enrolled-button" onClick={() => setActiveTab("My learning")}><CheckCircle2 size={15} /> Enrolled <ChevronRight size={14} /></button> : <button className="outline-button" onClick={() => joinCourse(course.id)}><Plus size={15} /> Enrol now</button>}</div></article>;
            })}</div> : <div className="empty-state"><BookOpen size={25} /><strong>No courses found</strong><span>Try another search or category.</span></div>}
          </section>
          <footer>© 2026 Learn Hunt <span>Made for curious minds <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
    </div>
  );
}

export default App;