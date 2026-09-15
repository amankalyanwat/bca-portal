import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";

const ADMIN_EMAIL = "amankalyanwat@gmail.com";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const { user, logout, allowedSemester } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);
        setProfileData(profileSnap.exists() ? profileSnap.data() : {});
      } catch (error) {
        console.error("Unable to load profile details:", error);
        setProfileData({});
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (!user) {
    return null;
  }

  const name = user.displayName || user.email?.split("@")[0] || "Student";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const deviceId =
    typeof window !== "undefined" ? localStorage.getItem("bca-material-device-id") || "Not available" : "Not available";
  const activeDeviceId = profileData?.activeDeviceId || profileData?.deviceId || "Not assigned";
  const sessionState = activeDeviceId === deviceId ? "This device is active" : "Another device is active";
  const role = user.email === ADMIN_EMAIL ? "Admin" : "Student";
  const semesterLabel = allowedSemester ? `Semester ${allowedSemester}` : "Not assigned";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="shell profile-page-shell">
      <header className="topbar">
        <div>
          <span className="brand-eyebrow">Account</span>
          <h1 className="brand-title">Your profile</h1>
        </div>
        <div className="topbar-actions">
          <Link to="/" className="btn-ghost">Back to dashboard</Link>
        </div>
      </header>

      <main className="profile-page">
        <section className="profile-hero">
          <div className="profile-avatar">{initials}</div>
          <div>
            <span className="profile-role">{role}</span>
            <h2>{name}</h2>
            <p>{user.email}</p>
          </div>
          <span className={`status-pill ${activeDeviceId === deviceId ? "is-active" : "is-locked"}`}>
            {sessionState}
          </span>
        </section>

        <section className="profile-grid">
          <article className="profile-card">
            <div className="card-header">
              <h3>Profile details</h3>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span>Full name</span>
                <strong>{name}</strong>
              </div>
              <div className="detail-row">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="detail-row">
                <span>UID</span>
                <strong>{user.uid}</strong>
              </div>
              <div className="detail-row">
                <span>Semester</span>
                <strong>{semesterLabel}</strong>
              </div>
              <div className="detail-row">
                <span>Last login</span>
                <strong>{formatDate(profileData?.lastLoginAt)}</strong>
              </div>
            </div>
          </article>

          <article className="profile-card">
            <div className="card-header">
              <h3>Device security</h3>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span>This device ID</span>
                <strong>{deviceId}</strong>
              </div>
              <div className="detail-row">
                <span>Active device ID</span>
                <strong>{activeDeviceId}</strong>
              </div>
              <div className="detail-row">
                <span>Session lock</span>
                <strong>{activeDeviceId === deviceId ? "Enabled" : "Restricted"}</strong>
              </div>
              <div className="detail-row">
                <span>Previous device</span>
                <strong>{profileData?.previousDeviceId || "No previous device"}</strong>
              </div>
              <div className="detail-row">
                <span>Last seen</span>
                <strong>{formatDate(profileData?.lastSeenAt)}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="profile-card profile-actions-card">
          <div className="card-header">
            <h3>Account actions</h3>
          </div>

          <div className="profile-actions">
            <button type="button" className="btn-primary profile-btn" onClick={() => navigate("/")}>
              Go to dashboard
            </button>
            <button type="button" className="btn-ghost profile-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </section>

        {loading && <p className="loading-text">Loading your profile…</p>}
      </main>
    </div>
  );
}
