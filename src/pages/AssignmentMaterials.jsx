// src/pages/AssignmentMaterials.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function AssignmentMaterials() {
  const { semId, subjectId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials");
      const snapshot = await getDocs(ref);
      const filtered = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.type === "Assignment");
      setItems(filtered);
      setLoading(false);
    }
    fetchItems();
  }, [semId, subjectId]);

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}`} className="back-link">← Back to Materials</Link>
      <h1 className="brand-title" style={{ marginBottom: "2rem" }}>Assignments</h1>

      {loading && <p className="loading-text">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="empty-state">No assignments uploaded for this subject yet.</div>
      )}

      <div className="list-col">
        {items.map((m) => (
          <Link
            key={m.id}
            to={`/semester/${semId}/subject/${subjectId}/materials/notes/view/${m.id}?from=assignments`}
            className="row-card material-row"
          >
            <span>
              <span className="row-title">{m.title}</span>
              <span className="material-meta">Assignment</span>
            </span>
            <span className="material-download">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
