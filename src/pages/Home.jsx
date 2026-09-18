// src/pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";

const ADMIN_EMAIL = "amankalyanwat@gmail.com";

const SUBJECT_STYLES = [
  { icon: "+", color: "coral" },
  { icon: "~", color: "violet" },
  { icon: "*", color: "teal" },
  { icon: "#", color: "gold" },
  { icon: "o", color: "blue" },
];

const SUBJECT_ICON_MAP = {
  java: "/assets/java.png",
  os: "/assets/os.png",
  multimedia: "/assets/multimedia.png",
  iks: "/assets/iks.png",
  english: "/assets/english.png",
  ecommerce: "/assets/ecommerce.png",
};

function getSubjectIcon(subject) {
  if (subject?.icon) return subject.icon;

  const key = (subject?.name || subject?.id || "").toLowerCase().trim();
  const match = Object.keys(SUBJECT_ICON_MAP).find((name) => key.includes(name));
  return SUBJECT_ICON_MAP[match] || "/assets/java.png";
}

function Icon({ children }) {
  return <span className="dashboard-icon" aria-hidden="true">{children}</span>;
}

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numberRef = useRef(null);

  useEffect(() => {
    const element = numberRef.current;
    if (!element) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(value);
      return undefined;
    }

    let frameId;
    let started = false;
    const duration = 850;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const startTime = performance.now();
      const animate = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
      observer.disconnect();
    }, { threshold: 0.35 });

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <strong ref={numberRef}>{displayValue}</strong>;
}

function StatCard({ label, value, detail, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-card-top"><span>{label}</span><span className="stat-dot" /></div>
      {typeof value === "number" ? <AnimatedNumber value={value} /> : <strong>{value}</strong>}
      <small>{detail}</small>
    </div>
  );
}

function SkeletonCard() {
  return <div className="subject-skeleton"><span /><span /><span /></div>;
}

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function usePremiumMotion(motionKey) {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 560px)").matches;
    if (reduceMotion) return undefined;

    root.classList.add("motion-ready");
    const motionItems = document.querySelectorAll(
      ".stamp-card, .subject-card, .modern-subject-card, .stat-card, .quick-action"
    );
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px" });

    motionItems.forEach((item, index) => {
      item.style.setProperty("--motion-delay", `${Math.min(index * 55, 440)}ms`);
      revealObserver.observe(item);
    });

    const cleanups = [];
    if (!mobile) {
      motionItems.forEach((item) => {
        const handleMove = (event) => {
          const rect = item.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          item.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
          item.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
          item.classList.add("is-tilting");
        };
        const handleLeave = () => {
          item.classList.remove("is-tilting");
          item.style.setProperty("--tilt-x", "0deg");
          item.style.setProperty("--tilt-y", "0deg");
        };
        item.addEventListener("pointermove", handleMove);
        item.addEventListener("pointerleave", handleLeave);
        cleanups.push(() => {
          item.removeEventListener("pointermove", handleMove);
          item.removeEventListener("pointerleave", handleLeave);
        });
      });
    }

    const nav = document.querySelector(".dashboard-nav");
    const handleScroll = () => nav?.classList.toggle("nav-scrolled", window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      cleanups.forEach((cleanup) => cleanup());
      root.classList.remove("motion-ready");
    };
  }, [motionKey]);
}

export default function Home() {
  const { logout, user, allowedSemester } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nightMode, setNightMode] = useState(() => localStorage.getItem("bca-night-mode") === "true");
  const semester = allowedSemester ? String(allowedSemester) : null;
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";
  const greeting = getGreeting(currentTime.getHours());
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("night-mode", nightMode);
    localStorage.setItem("bca-night-mode", String(nightMode));
  }, [nightMode]);

  useEffect(() => {
    async function loadDashboard() {
      if (!semester) {
        setSubjects([]);
        setLoadError(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(false);
      try {
        const snapshot = await getDocs(collection(db, "semesters", `sem${semester}`, "subjects"));
        const subjectRows = await Promise.all(snapshot.docs.map(async (subjectDoc, index) => {
          const materials = await getDocs(collection(
            db,
            "semesters",
            `sem${semester}`,
            "subjects",
            subjectDoc.id,
            "materials"
          ));
          const materialRows = materials.docs.map((material) => material.data());
          return {
            id: subjectDoc.id,
            name: subjectDoc.data().name || subjectDoc.id,
            notes: materialRows.filter((material) => material.type?.toLowerCase() === "notes").length,
            mcqs: materialRows.filter((material) => material.type?.toLowerCase() === "mcq").length,
            style: SUBJECT_STYLES[index % SUBJECT_STYLES.length],
          };
        }));
        setSubjects(subjectRows);
      } catch (error) {
        console.error("Unable to load dashboard data:", error);
        setSubjects([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [semester]);

  const notesCount = subjects.reduce((total, subject) => total + subject.notes, 0);
  const mcqCount = subjects.reduce((total, subject) => total + subject.mcqs, 0);
  const firstSubject = subjects[0];
  const notesPath = firstSubject ? `/semester/${semester}/subject/${firstSubject.id}/materials/notes` : "#";
  const mcqPath = firstSubject ? `/semester/${semester}/subject/${firstSubject.id}/materials/mcq` : "#";
  const materialsPath = firstSubject ? `/semester/${semester}/subject/${firstSubject.id}` : "#";
  usePremiumMotion(`${semester}-${loading}-${subjects.length}`);

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav">
        <Link to="/" className="dashboard-brand" aria-label="BCA Material Portal home">
          <span className="brand-mark">bca<span>.</span></span>
          <span className="brand-caption">material portal</span>
        </Link>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setNightMode((isNight) => !isNight)}
            aria-pressed={nightMode}
            aria-label={nightMode ? "Switch to light mode" : "Switch to night mode"}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{nightMode ? "sun" : "moon"}</span>
            <span>{nightMode ? "Day" : "Night"}</span>
          </button>
          {user?.email === ADMIN_EMAIL && <Link to="/admin" className="nav-text-link">Admin</Link>}
          <button
            className="profile-button"
            onClick={() => setProfileOpen((isOpen) => !isOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label={`Open profile menu for ${firstName}`}
          >
            <span className="avatar-button">{firstName.slice(0, 1).toUpperCase()}</span>
            <span className="profile-name">{firstName}</span>
            <span className="profile-chevron" aria-hidden="true">v</span>
          </button>
          {profileOpen && (
            <div className="profile-menu" role="menu">
              <span className="profile-menu-email">{user?.email}</span>
              <Link to="/profile" className="profile-menu-link" role="menuitem" onClick={() => setProfileOpen(false)}>
                Profile
              </Link>
              <button type="button" onClick={logout} role="menuitem">Sign out</button>
            </div>
          )}
        </div>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div>
            <span className="dashboard-kicker">{dayName}, keep learning</span>
            <h1>{greeting}, {firstName} <span className="wave">*</span></h1>
            <p>Your academic workspace, thoughtfully organised.</p>
          </div>
          <button className="sign-out-link" onClick={logout}>Sign out</button>
        </section>

        <section className="hero-card">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-content">
            <span className="hero-overline">Your learning space</span>
            {semester ? <h2>Semester {semester}<br /><em>in focus.</em></h2> : <h2>Your semester<br /><em>is almost ready.</em></h2>}
            <p>{semester ? "Everything you need for your next chapter, in one calm place." : "Your administrator will assign your semester soon."}</p>
            {semester && <Link to={`/semester/${semester}`} className="hero-button">Explore subjects <span>-&gt;</span></Link>}
          </div>
          <div className="hero-meta"><span>01</span><span>2026 / 27</span></div>
        </section>

        <section className="stats-grid" aria-label="Dashboard statistics">
          <StatCard label="Current semester" value={semester ? `Sem ${semester}` : "-"} detail="Your active workspace" tone="red" />
          <StatCard label="Total subjects" value={loading ? "-" : subjects.length} detail="Across your curriculum" tone="violet" />
          <StatCard label="Available notes" value={loading ? "-" : notesCount} detail="Ready to revisit" tone="teal" />
          <StatCard label="MCQ tests" value={loading ? "-" : mcqCount} detail="Practice your edge" tone="gold" />
        </section>

        <section className="quick-section">
          <div className="section-heading"><div><span className="dashboard-kicker">Shortcuts</span><h2>Make progress faster</h2></div><span className="section-count">04 actions</span></div>
          <div className="quick-grid">
            <Link to={notesPath} className={`quick-action ${!firstSubject ? "quick-action-disabled" : ""}`}><Icon>=</Icon><span><strong>View notes</strong><small>Open your first subject</small></span><b>-&gt;</b></Link>
            <Link to={mcqPath} className={`quick-action ${!firstSubject ? "quick-action-disabled" : ""}`}><Icon>&gt;</Icon><span><strong>Start MCQ test</strong><small>Practice your recall</small></span><b>-&gt;</b></Link>
            <Link to={materialsPath} className={`quick-action ${!firstSubject ? "quick-action-disabled" : ""}`}><Icon>v</Icon><span><strong>Download material</strong><small>Browse subject resources</small></span><b>-&gt;</b></Link>
            <Link to="#" className="quick-action quick-action-disabled"><Icon>~</Icon><span><strong>Performance analytics</strong><small>Coming soon</small></span><b>-&gt;</b></Link>
          </div>
        </section>

        <section className="subjects-section">
          <div className="section-heading"><div><span className="dashboard-kicker">Your curriculum</span><h2>Explore subjects</h2></div>{semester && <Link to={`/semester/${semester}`} className="view-all">View all <span>-&gt;</span></Link>}</div>
          {!semester && <div className="empty-dashboard">No semester is assigned to your account yet.<br />Contact your admin to get started.</div>}
          {semester && loading && <div className="subjects-grid">{[1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)}</div>}
          {semester && !loading && loadError && <div className="empty-dashboard dashboard-error">We could not load your subjects right now.<br />Please refresh and try again.</div>}
          {semester && !loading && !loadError && subjects.length === 0 && <div className="empty-dashboard">No subjects have been added for this semester yet.</div>}
          {semester && !loading && subjects.length > 0 && <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <Link key={subject.id} to={`/semester/${semester}/subject/${subject.id}`} className="modern-subject-card">
                <div className={`subject-badge ${subject.style.color}`}>
                  <img src={getSubjectIcon(subject)} alt="" className="subject-badge-image" />
                  <small>0{index + 1}</small>
                </div>
                <div className="subject-card-copy"><h3>{subject.name}</h3><p>{subject.notes} notes / {subject.mcqs} tests</p></div>
                <span className="subject-arrow">-&gt;</span>
              </Link>
            ))}
          </div>}
        </section>
      </main>
    </div>
  );
}
