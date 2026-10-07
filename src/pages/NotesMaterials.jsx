import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { BookmarkButton, PdfModal } from "../components/PortalFeatures";

export default function NotesMaterials() {
  const { semId, subjectId } = useParams();
  const [notes, setNotes] = useState([]); const [loading, setLoading] = useState(true); const [selectedNote, setSelectedNote] = useState(null);
  useEffect(() => { let active = true; async function fetchNotes() { setLoading(true); try { const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials"); const snapshot = await getDocs(ref); const filtered = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => m.type?.toLowerCase() === "notes"); if (active) setNotes(filtered); } finally { if (active) setLoading(false); } } fetchNotes(); return () => { active = false; }; }, [semId, subjectId]);
  return <div className="shell"><Link to={`/semester/${semId}/subject/${subjectId}`} className="back-link">← Back to Materials</Link><h1 className="brand-title">Notes</h1>
    {loading && <div className="list-col">{[1, 2, 3].map((item) => <div className="material-row skeleton-row" key={item}><span /><span /></div>)}</div>}
    {!loading && notes.length > 0 && <div className="list-col">{notes.map((note) => <div key={note.id} className="row-card material-row"><button className="material-open" onClick={() => setSelectedNote(note)}><span className="row-title">{note.title}</span><span className="material-meta">PDF · Preview in portal</span></button><BookmarkButton item={{ id: note.id, title: note.title, subject: subjectId, to: `/semester/${semId}/subject/${subjectId}/materials/notes` }} /><button className="material-download material-open-action" onClick={() => setSelectedNote(note)}>Open →</button></div>)}</div>}
    {!loading && !notes.length && <div className="empty-state">No notes have been uploaded for this subject yet.</div>}
    <PdfModal material={selectedNote} onClose={() => setSelectedNote(null)} />
  </div>;
}
