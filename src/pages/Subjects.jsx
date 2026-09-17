// src/pages/Subjects.jsx
import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

const SUBJECT_ICON_MAP = {
  java: "/assets/java.png",
  os: "/assets/os.png",
  multimedia: "/assets/multimedia.png",
  iks: "/assets/iks.png",
  english: "/assets/english.png",
  ecommerce: "/assets/ecommerce.png",
};

function getSubjectIcon(subject) {
  if (subject?.icon) {
    return subject.icon;
  }

  const key = (subject?.name || subject?.id || "").toLowerCase().trim();
  if (!key) return "/assets/java.png";

  const directMatch = Object.keys(SUBJECT_ICON_MAP).find((name) => key.includes(name));
  return SUBJECT_ICON_MAP[directMatch] || "/assets/java.png";
}

export default function Subjects() {
  const { semId } = useParams();
  const { allowedSemester } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Block access if this semester isn't the one assigned to the user
  if (String(allowedSemester) !== String(semId)) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      const ref = collection(db, "semesters", `sem${semId}`, "subjects");
      const snapshot = await getDocs(ref);
      setSubjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchSubjects();
  }, [semId]);

  return (
    <div className="shell">
      <Link to="/" className="back-link">← Back to Semester</Link>
      <span className="brand-eyebrow">Semester {semId}</span>
      <h1 className="brand-title" style={{ marginBottom: "2rem" }}>Subjects</h1>

      {loading && <p className="loading-text">Loading…</p>}
      {!loading && subjects.length === 0 && (
        <div className="empty-state">No subjects added for this semester yet.</div>
      )}

      <div className="list-col">
        {subjects.map((subj) => (
          <Link
            key={subj.id}
            to={`/semester/${semId}/subject/${subj.id}`}
            className="subject-card"
          >
            <div className="subject-icon">
              <img
                src={getSubjectIcon(subj)}
                alt={`${subj.name || subj.id} icon`}
              />
            </div>
            <div className="subject-info">
              <h3 className="subject-title">{subj.name || subj.id}</h3>
            </div>
          </Link>
        ))}
      </div>

      
      
    </div>
    
  );
}
