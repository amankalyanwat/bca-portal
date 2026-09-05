// src/pages/Materials.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Materials() {
  const { semId, subjectId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials");
      const snapshot = await getDocs(ref);
      setMaterials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchMaterials();
  }, [semId, subjectId]);

  return (
    <div className="shell">
      <Link to={`/semester/${semId}`} className="back-link">← Back to Subjects</Link>
      <span className="brand-eyebrow">{subjectId}</span>
      <h1 className="brand-title" style={{ marginBottom: "2rem", textTransform: "capitalize" }}>
        Materials
      </h1>

      {loading && <p className="loading-text">Loading…</p>}
      {!loading && materials.length === 0 && (
        <div className="empty-state">No material uploaded for this subject yet.</div>
      )}

      {/* Section boxes — using your existing material-row CSS */}
      <div className="materials-section">
        <Link to={`/semester/${semId}/subject/${subjectId}/materials/notes`} className="row-card material-row">
          <span>
            <span className="row-title">📘 Notes</span>
            <span className="material-meta">Lecture notes and PDFs</span>
          </span>
          <span className="material-download">Open →</span>
        </Link>

        <Link to={`/semester/${semId}/subject/${subjectId}/materials/videos`} className="row-card material-row">
          <span>
            <span className="row-title">🎥 Videos</span>
            <span className="material-meta">Recorded lectures and tutorials</span>
          </span>
          <span className="material-download">Open →</span>
        </Link>

        <Link to={`/semester/${semId}/subject/${subjectId}/materials/mcq`} className="row-card material-row">
          <span>
            <span className="row-title">🧠 MCQs</span>
            <span className="material-meta">Practice multiple-choice questions</span>
          </span>
          <span className="material-download">Open →</span>
        </Link>

        <Link to={`/semester/${semId}/subject/${subjectId}/materials/qa`} className="row-card material-row">
          <span>
            <span className="row-title">💬 Q&A</span>
            <span className="material-meta">Important theory and short answers</span>
          </span>
          <span className="material-download">Open →</span>
        </Link>

        <Link to={`/semester/${semId}/subject/${subjectId}/materials/assignments`} className="row-card material-row">
          <span>
            <span className="row-title">📝 Assignments</span>
            <span className="material-meta">Weekly and project tasks</span>
          </span>
          <span className="material-download">Open →</span>
        </Link>
      </div>
    </div>
  );
}
