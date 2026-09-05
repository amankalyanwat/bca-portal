// src/pages/PdfViewer.jsx
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getDriveEmbedUrl } from "../utils";

// Maps a "from" query param to the section's back link + label.
// Falls back to Notes if not provided (keeps old /notes/view/:id links working).
const SECTION_MAP = {
  notes: { path: "notes", label: "Notes" },
  assignments: { path: "assignments", label: "Assignments" },
  qa: { path: "qa", label: "Q&A" },
};

export default function PdfViewer() {
  const { semId, subjectId, noteId } = useParams();
  const [searchParams] = useSearchParams();
  const from = SECTION_MAP[searchParams.get("from")] || SECTION_MAP.notes;

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterial() {
      setLoading(true);
      const ref = doc(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials", noteId);
      const snap = await getDoc(ref);
      if (snap.exists()) setMaterial(snap.data());
      setLoading(false);
    }
    fetchMaterial();
  }, [semId, subjectId, noteId]);

  const embedUrl = material ? getDriveEmbedUrl(material.fileUrl) : null;

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}/materials/${from.path}`} className="back-link">
        ← Back to {from.label}
      </Link>

      {loading && <p className="loading-text">Loading…</p>}

      {!loading && !material && (
        <div className="empty-state">This file couldn't be found.</div>
      )}

      {!loading && material && (
        <>
          <span className="brand-eyebrow">{material.type}</span>
          <h1 className="brand-title" style={{ marginBottom: "1.2rem" }}>{material.title}</h1>

          {embedUrl ? (
            <>
              <div className="pdf-frame-wrap">
                <iframe src={embedUrl} title={material.title} className="pdf-frame" />
              </div>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ display: "inline-block", marginTop: "1rem", textDecoration: "none" }}
              >
                Open in Google Drive ↗
              </a>
            </>
          ) : (
            <div className="empty-state">
              This file can't be previewed inline.
              <br />
              <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--rust)", fontWeight: 600 }}>
                Open the file directly ↗
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
