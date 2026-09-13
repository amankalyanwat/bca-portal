// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const ADMIN_EMAIL = "amankalyanwat@gmail.com";

export default function Home() {
  const { logout, user, allowedSemester } = useAuth();

  // Only show the semester this user is allowed to access
  const SEMESTERS = allowedSemester ? [allowedSemester] : [];

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <span className="brand-eyebrow">Catalog</span>
          <h1 className="brand-title">BCA Material Portal</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="user-chip">{user?.email}</span>
          {user?.email === ADMIN_EMAIL && (
            <Link to="/admin" className="btn-ghost">Admin panel</Link>
          )}
          <button onClick={logout} className="btn-ghost">Sign out</button>
        </div>
      </div>

      <span className="section-label">Your Semester</span>

      {SEMESTERS.length === 0 && (
        <div className="empty-state">
          No semester is assigned to your account yet.<br />Contact your admin.
        </div>
      )}

      <div className="stamp-grid">
        {SEMESTERS.map((sem) => (
          <Link key={sem} to={`/semester/${sem}`} className="stamp-card">
            <span className="stamp-num mono">{String(sem).padStart(2, "0")}</span>
            <span className="stamp-label">Semester</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
