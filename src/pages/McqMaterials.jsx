// src/pages/McqMaterials.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function McqMaterials() {
  const { semId, subjectId } = useParams();
  const [mcqSets, setMcqSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMcqSets() {
      setLoading(true);
      const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials");
      const snapshot = await getDocs(ref);
      const filtered = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.type === "MCQ");
      setMcqSets(filtered);
      setLoading(false);
    }
    fetchMcqSets();
  }, [semId, subjectId]);

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}`} className="back-link">
        ← Back to Materials
      </Link>
      <h1 className="brand-title" style={{ marginBottom: "2rem" }}>MCQs</h1>

      {loading && <p className="loading-text">Loading…</p>}
      {!loading && mcqSets.length === 0 && (
        <div className="empty-state">No MCQ sets uploaded for this subject yet.</div>
      )}

      <div className="list-col">
        {mcqSets.map((set) => (
          <Link
            key={set.id}
            to={`/semester/${semId}/subject/${subjectId}/materials/mcq/${set.id}`}
            className="row-card material-row"
          >
            <span>
              <span className="row-title">{set.title}</span>
              <span className="material-meta">{set.questions?.length || 0} Questions</span>
            </span>
            <span className="material-download">Start →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
