import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Smart study hub",
    copy: "Keep notes, PYQs, videos, MCQs, and assignments organised by semester and subject.",
  },
  {
    title: "Revision that sticks",
    copy: "Daily study flow, quick wins, and momentum tracking help students stay consistent.",
  },
  {
    title: "Faster access",
    copy: "Search, filter, and jump straight to the resource students need before an exam.",
  },
];

const valueStats = [
  { label: "Semesters", value: "6" },
  { label: "Resource types", value: "5+" },
  { label: "Student focus", value: "100%" },
];

const journeySteps = [
  { number: "01", title: "Choose your semester", copy: "Jump directly into the subjects and modules you need this week." },
  { number: "02", title: "Study from one hub", copy: "Access notes, PYQs, tutorials, MCQs, and assignments in one clean flow." },
  { number: "03", title: "Revise and retain", copy: "Use repeated practice and daily planning to stay consistent before exams." },
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-mark">bca<span>.</span></span>
          <span className="brand-caption">material portal</span>
        </div>

        <nav className="landing-nav">
          <Link to="/login">Login</Link>
          <Link to="/pricing" className="landing-nav-primary">View pricing</Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-kicker">Built for BCA students</span>
            <h1>Everything you need to learn, revise, and stay ahead.</h1>
            <p>
              A student-first academic platform for notes, assignments, videos, MCQs, and exam prep—built to make semester study simpler and smarter.
            </p>

            <div className="landing-actions">
              <Link to="/login" className="landing-primary-btn">Student login</Link>
              <Link to="/pricing" className="landing-secondary-btn">See plans</Link>
            </div>

            <div className="landing-stats">
              {valueStats.map((stat) => (
                <div key={stat.label} className="landing-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-visual">
            <div className="visual-card visual-card-main">
              <span className="visual-tag">Current semester</span>
              <h3>Semester 3</h3>
              <ul>
                <li>DBMS notes</li>
                <li>Java practice sets</li>
                <li>Revision checklist</li>
              </ul>
            </div>
            <div className="visual-card visual-card-small">
              <span>MCQ score</span>
              <strong>87%</strong>
            </div>
          </div>
        </section>

        <section className="landing-proof">
          <div className="proof-badges">
            <span>500+ active learners</span>
            <span>Free onboarding</span>
            <span>Exam-first workflow</span>
          </div>
        </section>

        <section className="landing-features">
          {featureCards.map((feature) => (
            <article key={feature.title} className="feature-panel-card">
              <span>{feature.title}</span>
              <p>{feature.copy}</p>
            </article>
          ))}
        </section>

        <section className="landing-steps">
          <div className="section-heading compact-heading">
            <div>
              <span className="landing-kicker">How it works</span>
              <h2>From confusion to clarity in three simple steps.</h2>
            </div>
          </div>

          <div className="steps-grid">
            {journeySteps.map((step) => (
              <article key={step.number} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
