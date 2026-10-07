// src/pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";
import { BookmarksPanel, SearchPalette } from "../components/PortalFeatures";

function normalizeResourceType(type) {
  const value = (type || "").toLowerCase();

  if (value === "mcq") return "mcq";
  if (value === "video") return "videos";
  if (value === "notes") return "notes";
  if (value === "qa" || value === "q&a") return "qa";
  if (value === "assignment" || value === "assignments") return "assignments";

  return "notes";
}

const ADMIN_EMAIL = "amankalyanwat@gmail.com";

const SUBJECT_STYLES = [
  { icon: "+", color: "coral" },
  { icon: "~", color: "violet" },
  { icon: "*", color: "teal" },
  { icon: "#", color: "gold" },
  { icon: "o", color: "blue" },
];

const STUDY_PROGRESS_KEY = "bca-study-progress-v1";

const STUDENT_ACTIVATION_STEPS = [
  { key: "semester", label: "Choose your semester", hint: "Your active study track" },
  { key: "notes", label: "Open notes", hint: "Review a subject update" },
  { key: "mcq", label: "Attempt a quick MCQ", hint: "Build daily recall" },
  { key: "premium", label: "Upgrade when ready", hint: "Unlock deeper prep" },
];

const SUBJECT_ICON_MAP = {
  java: "/assets/java.png",
  os: "/assets/os.png",
  multimedia: "/assets/multimedia.png",
  iks: "/assets/iks.png",
  english: "/assets/english.png",
  ecommerce: "/assets/ecommerce.png",
};

function readStudyProgress() {
  try {
    const raw = localStorage.getItem(STUDY_PROGRESS_KEY);
    if (!raw) {
      return { done: [], lastUpdated: null };
    }

    const parsed = JSON.parse(raw);
    return {
      done: Array.isArray(parsed.done) ? parsed.done : [],
      lastUpdated: parsed.lastUpdated || null,
    };
  } catch {
    return { done: [], lastUpdated: null };
  }
}

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

function PlanCard({ name, price, description, features, featured, actionLabel, href }) {
  return (
    <div className={`plan-card ${featured ? "plan-card-featured" : ""}`}>
      <div className="plan-header">
        <span className="plan-name">{name}</span>
        {featured && <span className="plan-badge">Popular</span>}
      </div>
      <div className="plan-price">
        {price}
        <span>/month</span>
      </div>
      <p className="plan-description">{description}</p>
      <ul className="plan-features">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <a href={href} className={`plan-button ${featured ? "plan-button-featured" : ""}`}>
        {actionLabel}
      </a>
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
  const [recentResources, setRecentResources] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [studyProgress, setStudyProgress] = useState(() => readStudyProgress());
  const [profileOpen, setProfileOpen] = useState(false);
  const [nightMode, setNightMode] = useState(() => localStorage.getItem("bca-night-mode") === "true");
  const [premiumTier, setPremiumTier] = useState(() => {
    const tier = localStorage.getItem("bca-premium-demo");
    return tier === "semester" || tier === "yearly" || tier === "true" ? tier : "free";
  });
  const semester = allowedSemester ? String(allowedSemester) : null;
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";
  const greeting = getGreeting(currentTime.getHours());
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const isPremium = premiumTier !== "free";

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("night-mode", nightMode);
    localStorage.setItem("bca-night-mode", String(nightMode));
  }, [nightMode]);

  useEffect(() => {
    const syncPremiumState = () => {
      const tier = localStorage.getItem("bca-premium-demo");
      setPremiumTier(tier === "semester" || tier === "yearly" || tier === "true" ? tier : "free");
    };

    syncPremiumState();
    window.addEventListener("storage", syncPremiumState);
    return () => window.removeEventListener("storage", syncPremiumState);
  }, []);

  useEffect(() => {
    localStorage.setItem(STUDY_PROGRESS_KEY, JSON.stringify(studyProgress));
  }, [studyProgress]);

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
          const materialRows = materials.docs.map((material) => ({
            id: material.id,
            ...material.data(),
          }));

          return {
            id: subjectDoc.id,
            name: subjectDoc.data().name || subjectDoc.id,
            notes: materialRows.filter((material) => material.type?.toLowerCase() === "notes").length,
            mcqs: materialRows.filter((material) => material.type?.toLowerCase() === "mcq").length,
            style: SUBJECT_STYLES[index % SUBJECT_STYLES.length],
            materials: materialRows,
          };
        }));

        const recent = subjectRows
          .flatMap((subject) =>
            subject.materials.map((material) => ({
              ...material,
              subjectId: subject.id,
              subjectName: subject.name,
              resourceType: normalizeResourceType(material.type),
              route: `/semester/${semester}/subject/${subject.id}/materials/${normalizeResourceType(material.type)}`,
            }))
          )
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
            const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 4);

        setRecentResources(recent);
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
  const completedCount = studyProgress.done.length;
  const completionRate = Math.min(100, Math.round((completedCount / Math.max(1, notesCount + mcqCount || 1)) * 100));
  const revisionStreak = Math.max(3, Math.min(14, 3 + Math.floor(completedCount / 2)));
  const activationSteps = STUDENT_ACTIVATION_STEPS.map((step) => {
    if (step.key === "semester") return { ...step, done: Boolean(semester) };
    if (step.key === "notes") return { ...step, done: notesCount > 0 };
    if (step.key === "mcq") return { ...step, done: mcqCount > 0 || completedCount > 0 };
    return { ...step, done: isPremium };
  });
  const activationProgress = Math.round((activationSteps.filter((step) => step.done).length / activationSteps.length) * 100);
  const todayPlan = recentResources.slice(0, 3).map((resource, index) => ({
    id: `${resource.subjectId}-${resource.id}`,
    title: resource.title,
    subtitle: `${resource.subjectName} • ${resource.type || "material"}`,
    time: ["09:00", "12:30", "18:00"][index] || "Today",
    route: resource.route,
  }));
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = `${subject.name} ${subject.id}`.toLowerCase().includes(subjectSearch.toLowerCase());
    const matchesFilter =
      resourceFilter === "all" ||
      (resourceFilter === "notes" && subject.notes > 0) ||
      (resourceFilter === "mcq" && subject.mcqs > 0);

    return matchesSearch && matchesFilter;
  });
  usePremiumMotion(`${semester}-${loading}-${subjects.length}`);

  const markResourceDone = (resource) => {
    const key = `${resource.subjectId}:${resource.id}`;
    setStudyProgress((current) => {
      const done = current.done.includes(key)
        ? current.done
        : [...current.done, key];

      return {
        done,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav">
        <Link to="/dashboard" className="dashboard-brand" aria-label="BCA Material Portal home">
          <span className="brand-mark">bca<span>.</span></span>
          <span className="brand-caption">material portal</span>
        </Link>
        <div className="nav-actions">
          <SearchPalette subjects={subjects} semester={semester} />
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
            {/* <span className="profile-chevron" aria-hidden="true">v</span> */}
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
            <div className="hero-actions"><Link to="/world" className="hero-button">Enter 3D world <span>→</span></Link>{semester && <Link to={`/semester/${semester}`} className="hero-button hero-button-subtle">Explore subjects <span>→</span></Link>}</div>
          </div>
          <div className="hero-meta"><span>01</span><span>2026 / 27</span></div>
        </section>

        <section className="activation-panel">
          <div className="section-heading">
            <div>
              <span className="dashboard-kicker">Getting started</span>
              <h2>Student activation checklist</h2>
            </div>
            <span className="section-count">{activationProgress}% complete</span>
          </div>

          <div className="activation-grid">
            {activationSteps.map((step) => (
              <div key={step.key} className={`activation-step ${step.done ? "activation-step-done" : ""}`}>
                <span className="activation-status">{step.done ? "Done" : "Next"}</span>
                <strong>{step.label}</strong>
                <small>{step.hint}</small>
                {!step.done && step.key === "premium" && (
                  <Link to="/pricing" className="activation-link">View plans</Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* <div className={`upgrade-banner ${isPremium ? "upgrade-banner-premium" : ""}`}>
          {isPremium
            ? <strong>Premium active:</strong>
            : <strong>Free access:</strong>} {isPremium ? `You unlocked ${premiumTier === "yearly" ? "Yearly" : "Semester"} premium.` : "Start free and upgrade when you want more value."}
          {!isPremium && <Link to="/pricing">View pricing</Link>}
        </div> */}

        {/* <section className="startup-panel" id="pricing">
          <div className="section-heading">
            <div>
              <span className="dashboard-kicker">BCA startup</span>
              <h2>Free for students. Premium when they want more.</h2>
            </div>
            <Link to={mcqPath} className="view-all">Try free sample <span>-&gt;</span></Link>
          </div>

          <div className="startup-grid">
            <div className="startup-copy">
              <h3>Built for students who want smarter prep.</h3>
              <p>
                Start free with notes and beginner MCQs. Upgrade when a student wants full semester access,
                advanced mock tests, and performance tracking.
              </p>
              <ul>
                <li>Free notes and sample practice</li>
                <li>Semester-wise premium packs</li>
                <li>Quick revision and mock tests</li>
                <li>Strong retention through repeat practice</li>
              </ul>
            </div>

            <div className="plans-grid">
              <PlanCard
                name="Free"
                price="₹0"
                description="Best for quick access and sample practice."
                features={[
                  "Basic subject access",
                  "Limited notes",
                  "Starter MCQ sample",
                  "No payment required"
                ]}
                actionLabel="Start free"
                href={mcqPath}
              />

              <PlanCard
                name="Semester"
                price="₹299"
                description="Perfect for students who want full subject preparation."
                features={[
                  "All notes for current semester",
                  "Full MCQ test library",
                  "Fast revision support",
                  "Subject-wise practice"
                ]}
                featured={true}
                actionLabel="Unlock semester"
                href="#pricing"
              />

              <PlanCard
                name="Yearly"
                price="₹799"
                description="Best value for long-term prep and consistency."
                features={[
                  "All semester resources",
                  "Advanced mock tests",
                  "Priority access to new content",
                  "Better exam readiness"
                ]}
                actionLabel="Go annual"
                href="#pricing"
              />
            </div>
          </div>
        </section> */}

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
            <Link to={isPremium ? "#" : "/pricing"} className={`quick-action ${!isPremium ? "quick-action-premium-gate" : ""}`}>
              <Icon>~</Icon>
              <span>
                <strong>{isPremium ? "Performance analytics" : "Premium analytics"}</strong>
                <small>{isPremium ? "Your growth snapshot" : "Unlock with a plan"}</small>
              </span>
              <b>-&gt;</b>
            </Link>
            <Link to="/forum" className="quick-action"><Icon>?</Icon><span><strong>Ask a doubt</strong><small>Learn with your peers</small></span><b>-&gt;</b></Link>
            <Link to="/playground" className="quick-action"><Icon>&lt;/&gt;</Icon><span><strong>Code playground</strong><small>Practice practicals</small></span><b>-&gt;</b></Link>
          </div>
        </section>

        <section className="focus-rail">
          <div className="section-heading">
            <div>
              <span className="dashboard-kicker">Student growth</span>
              <h2>Keep the momentum going</h2>
            </div>
            <span className="section-count">{recentResources.length} fresh items</span>
          </div>

          <div className="focus-grid">
            <div className="focus-card focus-card-primary">
              <span className="dashboard-kicker">Study focus</span>
              <h3>{Math.min(90, Math.max(25, subjects.length * 18 + recentResources.length * 8))}% weekly target</h3>
              <p>One small revision loop today compounds into big exam gains.</p>
            </div>

            <div className="focus-card">
              <span className="dashboard-kicker">Next win</span>
              <h3>{recentResources[0]?.title || "Open your first subject"}</h3>
              <p>{recentResources[0] ? `Continue with ${recentResources[0].subjectName}.` : "Start with the subject you are most behind in."}</p>
            </div>

            <div className="focus-card">
              <span className="dashboard-kicker">Daily streak</span>
              <h3>{revisionStreak} day streak</h3>
              <p>Stay consistent and your revision quality improves every week.</p>
            </div>
          </div>

          <div className="progress-panel">
            <div>
              <span className="dashboard-kicker">Progress snapshot</span>
              <h3>Revision momentum</h3>
            </div>
            <div className="progress-metrics">
              <div>
                <strong>{completionRate}%</strong>
                <small>completed</small>
              </div>
              <div>
                <strong>{completedCount}</strong>
                <small>done today</small>
              </div>
              <div>
                <strong>{studyProgress.lastUpdated ? "Live" : "Start"}</strong>
                <small>{studyProgress.lastUpdated ? "updated" : "not started"}</small>
              </div>
            </div>
          </div>

          <div className="daily-plan-panel">
            <div className="section-heading">
              <div>
                <span className="dashboard-kicker">Today’s study plan</span>
                <h2>Stay on track</h2>
              </div>
              <span className="section-count">{todayPlan.length} tasks</span>
            </div>

            <div className="plan-list">
              {todayPlan.length === 0 ? (
                <div className="empty-dashboard">Add materials to your semester and your revision plan will appear here.</div>
              ) : (
                todayPlan.map((task) => {
                  const isDone = studyProgress.done.includes(task.id);
                  return (
                    <Link key={task.id} to={task.route} className={`daily-plan-item ${isDone ? "daily-plan-item-done" : ""}`}>
                      <div className="daily-plan-time">{task.time}</div>
                      <div className="daily-plan-copy">
                        <strong>{task.title}</strong>
                        <small>{task.subtitle}</small>
                      </div>
                      <span className="daily-plan-status">{isDone ? "Done" : "Open"}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="recent-grid">
            {recentResources.length === 0 ? (
              <div className="empty-dashboard">New study resources will appear here as your teachers upload them.</div>
            ) : (
              recentResources.map((resource) => {
                const key = `${resource.subjectId}:${resource.id}`;
                const isDone = studyProgress.done.includes(key);

                return (
                  <div key={`${resource.subjectId}-${resource.id}`} className="recent-resource-card">
                    <span className="recent-tag">{resource.type || "Material"}</span>
                    <Link to={resource.route} className="recent-resource-link">
                      <strong>{resource.title}</strong>
                    </Link>
                    <small>{resource.subjectName}</small>
                    <button type="button" className={`progress-check ${isDone ? "progress-check-done" : ""}`} onClick={() => markResourceDone(resource)}>
                      {isDone ? "Done" : "Mark done"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <BookmarksPanel />

        <section className="subjects-section">
          <div className="section-heading"><div><span className="dashboard-kicker">Your curriculum</span><h2>Explore subjects</h2></div>{semester && <Link to={`/semester/${semester}`} className="view-all">View all <span>-&gt;</span></Link>}</div>

          {semester && !loading && !loadError && subjects.length > 0 && (
            <div className="subject-toolbar">
              <input
                className="subject-search"
                type="text"
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                placeholder="Search subject name..."
                aria-label="Search subjects"
              />
              <div className="filter-pills" aria-label="Subject filters">
                {[
                  { value: "all", label: "All" },
                  { value: "notes", label: "Notes" },
                  { value: "mcq", label: "MCQ" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`filter-pill ${resourceFilter === filter.value ? "filter-pill-active" : ""}`}
                    onClick={() => setResourceFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!semester && <div className="empty-dashboard">No semester is assigned to your account yet.<br />Contact your admin to get started.</div>}
          {semester && loading && <div className="subjects-grid">{[1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)}</div>}
          {semester && !loading && loadError && <div className="empty-dashboard dashboard-error">We could not load your subjects right now.<br />Please refresh and try again.</div>}
          {semester && !loading && !loadError && subjects.length === 0 && <div className="empty-dashboard">No subjects have been added for this semester yet.</div>}
          {semester && !loading && subjects.length > 0 && (
            <>
              {filteredSubjects.length === 0 ? (
                <div className="empty-dashboard">No subjects match your current search or filter.</div>
              ) : (
                <div className="subjects-grid">
                  {filteredSubjects.map((subject, index) => (
                    <Link key={subject.id} to={`/semester/${semester}/subject/${subject.id}`} className="modern-subject-card">
                      <div className={`subject-badge ${subject.style.color}`}>
                        <img src={getSubjectIcon(subject)} alt="" className="subject-badge-image" />
                        <small>0{index + 1}</small>
                      </div>
                      <div className="subject-card-copy"><h3>{subject.name}</h3><p>{subject.notes} notes / {subject.mcqs} tests</p></div>
                      <span className="subject-arrow">-&gt;</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
