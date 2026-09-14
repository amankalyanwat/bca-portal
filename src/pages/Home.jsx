// src/pages/Home.jsx
import { useEffect, useState } from "react";
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

function Icon({ children }) {
  return <span className="dashboard-icon" aria-hidden="true">{children}</span>;
}

function StatCard({ label, value, detail, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-card-top"><span>{label}</span><span className="stat-dot" /></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function SkeletonCard() {
  return <div className="subject-skeleton"><span /><span /><span /></div>;
}

export default function Home() {
  const { logout, user, allowedSemester } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const semester = allowedSemester ? String(allowedSemester) : null;
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

  useEffect(() => {
    async function loadDashboard() {
      if (!semester) {
        setLoading(false);
        return;
      }
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [semester]);

  const notesCount = subjects.reduce((total, subject) => total + subject.notes, 0);
  const mcqCount = subjects.reduce((total, subject) => total + subject.mcqs, 0);

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav">
        <Link to="/" className="dashboard-brand" aria-label="BCA Material Portal home">
          <span className="brand-mark">bca<span>.</span></span>
          <span className="brand-caption">material portal</span>
        </Link>
        <div className="nav-actions">
          {user?.email === ADMIN_EMAIL && <Link to="/admin" className="nav-text-link">Admin</Link>}
          <button className="notification-button" aria-label="Notifications"><Icon>o</Icon><span /></button>
          <button className="avatar-button" onClick={logout} aria-label="Sign out">{firstName.slice(0, 1).toUpperCase()}</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div>
            <span className="dashboard-kicker">Monday, keep learning</span>
            <h1>Good morning, {firstName} <span className="wave">*</span></h1>
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
            <Link to={semester ? `/semester/${semester}` : "#"} className="quick-action"><Icon>=</Icon><span><strong>View notes</strong><small>Keep concepts close</small></span><b>-&gt;</b></Link>
            <Link to={semester ? `/semester/${semester}` : "#"} className="quick-action"><Icon>&gt;</Icon><span><strong>Start MCQ test</strong><small>Test your recall</small></span><b>-&gt;</b></Link>
            <Link to={semester ? `/semester/${semester}` : "#"} className="quick-action"><Icon>v</Icon><span><strong>Download material</strong><small>Learn offline</small></span><b>-&gt;</b></Link>
            <Link to={semester ? `/semester/${semester}` : "#"} className="quick-action"><Icon>~</Icon><span><strong>Performance analytics</strong><small>See your momentum</small></span><b>-&gt;</b></Link>
          </div>
        </section>

        <section className="subjects-section">
          <div className="section-heading"><div><span className="dashboard-kicker">Your curriculum</span><h2>Explore subjects</h2></div>{semester && <Link to={`/semester/${semester}`} className="view-all">View all <span>-&gt;</span></Link>}</div>
          {!semester && <div className="empty-dashboard">No semester is assigned to your account yet.<br />Contact your admin to get started.</div>}
          {semester && loading && <div className="subjects-grid">{[1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)}</div>}
          {semester && !loading && subjects.length === 0 && <div className="empty-dashboard">No subjects have been added for this semester yet.</div>}
          {semester && !loading && subjects.length > 0 && <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <Link key={subject.id} to={`/semester/${semester}/subject/${subject.id}`} className="modern-subject-card">
                <div className={`subject-badge ${subject.style.color}`}><span>{subject.style.icon}</span><small>0{index + 1}</small></div>
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
