// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    typeof window !== "undefined" ? localStorage.getItem("bca-session-lock-message") || "" : ""
  );
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const dismissLockMessage = () => {
    localStorage.removeItem("bca-session-lock-message");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err?.message || "Invalid email or password. Please contact admin if this device is already in use."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-eyebrow">Restricted Access</span>
        <h1 className="login-title">BCA Material Portal</h1>
        <p className="login-subtitle">Sign in with the credentials issued to you.</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-box" role="alert" style={{ marginBottom: "12px" }}>
              <p className="error-text" style={{ margin: 0 }}>{error}</p>
              <button
                type="button"
                className="btn-link"
                onClick={dismissLockMessage}
                style={{ marginTop: "8px", background: "none", border: "none", color: "#ef4444", padding: 0, cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@college.edu"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-text">▸ {error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="footer-note">No login yet? Ask your admin to issue one.</p>
      </div>
    </div>
  );
}
