// src/pages/NotesMaterials.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function NotesMaterials() {
  const { semId, subjectId } = useParams();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    async function fetchNotes() {
      const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials");
      const snapshot = await getDocs(ref);
      const filtered = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.type === "Notes");
      setNotes(filtered);
    }
    fetchNotes();
  }, [semId, subjectId]);

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}`} className="back-link">
        ← Back to Materials
      </Link>
      <h1 className="brand-title">Notes</h1>

      <div className="list-col">
        {notes.map((n) => (
          <Link
            key={n.id}
            to={`/semester/${semId}/subject/${subjectId}/materials/notes/view/${n.id}`}
            className="row-card material-row"
          >
            
            <span className="row-title">{n.title}</span>
            <span className="material-meta">PDF</span>
          
            <span className="material-download">Open →</span>
        
          </Link>
        ))}
      </div>
    </div>
  );
}
