import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "For quick access and sample practice.",
    features: [
      "Basic subject access",
      "Starter notes",
      "Limited MCQ sample",
      "Free student onboarding"
    ],
    accent: "neutral"
  },
  {
    name: "Semester",
    price: "₹299",
    description: "For serious preparation and full semester coverage.",
    features: [
      "Complete semester notes",
      "Full MCQ library",
      "Mock-test practice",
      "Revision support"
    ],
    accent: "featured",
    popular: true
  },
  {
    name: "Yearly",
    price: "₹799",
    description: "Best value for sustained preparation and growth.",
    features: [
      "All semester content",
      "Advanced practice tests",
      "Priority updates",
      "Long-term exam readiness"
    ],
    accent: "neutral"
  }
];

export default function PricingPage() {
  const { user, logout } = useAuth();

  const handleDemoUpgrade = () => {
    localStorage.setItem("bca-premium-demo", "true");
    window.location.href = "/";
  };

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav">
        <Link to="/" className="dashboard-brand" aria-label="Back to dashboard">
          <span className="brand-mark">bca<span>.</span></span>
          <span className="brand-caption">material portal</span>
        </Link>
        <div className="nav-actions">
          <Link to="/" className="nav-text-link">Dashboard</Link>
          <button className="sign-out-link" type="button" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <main className="dashboard-main pricing-page-shell">
        <section className="pricing-hero">
          <span className="dashboard-kicker">Startup pricing</span>
          <h1>Keep it free for students, unlock value with premium packs.</h1>
          <p>
            This product is built to grow from a student-first learning portal into a simple BCA startup model.
            Start free, then upgrade when students want deeper prep and better revision tools.
          </p>
        </section>

        <section className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-plan pricing-plan-${plan.accent} ${plan.popular ? "pricing-plan-featured" : ""}`}>
              <div className="plan-header">
                <span className="plan-name">{plan.name}</span>
                {plan.popular && <span className="plan-badge">Popular</span>}
              </div>

              <div className="plan-price">
                {plan.price}
                <span>/month</span>
              </div>

              <p className="plan-description">{plan.description}</p>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                type="button"
                className={`plan-button ${plan.popular ? "plan-button-featured" : ""}`}
                onClick={handleDemoUpgrade}
              >
                {plan.name === "Free" ? "Continue free" : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </section>

        <section className="pricing-meta">
          <div>
            <span className="dashboard-kicker">Why this works</span>
            <h2>Built for acquisition, retention, and trust.</h2>
          </div>
          <ul>
            <li>Free tier helps students start instantly</li>
            <li>Semester pack fits normal BCA student spending</li>
            <li>Yearly pack improves conversion and retention</li>
            <li>Premium unlocks confidence around value</li>
          </ul>
        </section>

        <div className="pricing-footer-note">
          Signed in as <strong>{user?.email}</strong>
        </div>
      </main>
    </div>
  );
}
