import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const BOOKMARK_KEY = "bca-bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks)), [bookmarks]);

  const toggleBookmark = (item) => setBookmarks((current) => {
    const exists = current.some((bookmark) => bookmark.id === item.id);
    return exists ? current.filter((bookmark) => bookmark.id !== item.id) : [...current, item];
  });
  const isBookmarked = (id) => bookmarks.some((bookmark) => bookmark.id === id);
  return { bookmarks, toggleBookmark, isBookmarked };
}

export function BookmarkButton({ item, className = "" }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const active = isBookmarked(item.id);
  return <button type="button" className={`bookmark-button ${active ? "is-bookmarked" : ""} ${className}`}
    onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleBookmark(item); }}
    aria-label={active ? "Remove bookmark" : "Bookmark this material"} aria-pressed={active}>
    {active ? "★" : "☆"}
  </button>;
}

export function PdfModal({ material, onClose }) {
  useEffect(() => {
    if (!material) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.classList.remove("modal-open"); window.removeEventListener("keydown", closeOnEscape); };
  }, [material, onClose]);
  if (!material) return null;
  const embedUrl = material.fileUrl?.includes("drive.google.com")
    ? material.fileUrl.replace(/\/view.*$/, "/preview") : material.fileUrl;
  return <div className="feature-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="feature-modal pdf-modal" role="dialog" aria-modal="true" aria-label={`Preview ${material.title}`}>
      <div className="feature-modal-header"><div><span className="dashboard-kicker">PDF preview</span><h2>{material.title}</h2></div>
        <div className="modal-actions"><a className="btn-ghost btn-sm" href={material.fileUrl} download>Download</a><button className="modal-close" onClick={onClose} aria-label="Close preview">×</button></div>
      </div>
      <iframe className="feature-pdf-frame" src={embedUrl} title={material.title} />
    </section>
  </div>;
}

export function SearchPalette({ subjects = [], semester }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const handler = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); } if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);
  const results = useMemo(() => {
    const base = [
      { id: "notes", title: "Notes library", meta: "Browse lecture notes", to: subjects[0] ? `/semester/${semester}/subject/${subjects[0].id}/materials/notes` : "/" },
      { id: "mcq", title: "MCQ practice", meta: "Test your recall", to: subjects[0] ? `/semester/${semester}/subject/${subjects[0].id}/materials/mcq` : "/" },
      { id: "forum", title: "Doubt forum", meta: "Ask and discuss", to: "/forum" },
      { id: "playground", title: "Coding playground", meta: "Browse practical snippets", to: "/playground" },
      ...subjects.map((subject) => ({ id: subject.id, title: subject.name, meta: `${subject.notes} notes · ${subject.mcqs} tests`, to: `/semester/${semester}/subject/${subject.id}` }))
    ];
    return base.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, subjects, semester]);
  return <>
    <button className="search-trigger" onClick={() => setOpen(true)}><span>⌕</span><span>Search subjects, notes...</span><kbd>⌘ K</kbd></button>
    {open && <div className="palette-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <div className="command-palette" role="dialog" aria-label="Quick search"><div className="palette-input-wrap"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects, notes or topics..." /><kbd>ESC</kbd></div>
        <div className="palette-results">{results.length ? results.map((item) => <Link key={item.id} to={item.to} onClick={() => setOpen(false)}><span className="palette-result-icon">↗</span><span><strong>{item.title}</strong><small>{item.meta}</small></span><span>Enter</span></Link>) : <p className="palette-empty">No matching resources yet.</p>}</div><div className="palette-footer">Tip: press <kbd>Ctrl K</kbd> anytime to search</div>
      </div>
    </div>}
  </>;
}

export function BookmarksPanel() {
  const { bookmarks } = useBookmarks();
  return <section className="feature-panel bookmarks-panel"><div className="section-heading"><div><span className="dashboard-kicker">Saved for later</span><h2>Your bookmarks</h2></div><span className="section-count">{bookmarks.length} saved</span></div>{bookmarks.length ? <div className="bookmark-list">{bookmarks.slice(0, 5).map((item) => <Link key={item.id} to={item.to || "#"}><span>★</span><span><strong>{item.title}</strong><small>{item.subject || "Material"}</small></span><b>→</b></Link>)}</div> : <p className="feature-muted">Star a note or topic to keep it close during revision.</p>}</section>;
}
