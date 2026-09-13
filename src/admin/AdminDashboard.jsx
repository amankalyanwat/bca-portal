// src/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../AuthContext";

const SEM_OPTIONS = [1, 2, 3, 4, 5, 6];

const EMPTY_QUESTION = { question: "", options: ["", "", "", ""], correct: 0 };

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [semId, setSemId] = useState(3);

  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  // Selected subject for materials
  const [activeSubject, setActiveSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Notes");
  const [newUrl, setNewUrl] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // null = not uploading

  // MCQ builder state
  const [mcqQuestions, setMcqQuestions] = useState([{ ...EMPTY_QUESTION }]);
  const [editingMcqId, setEditingMcqId] = useState(null); // null = creating new set, else editing this doc id

  const [status, setStatus] = useState("");

  async function loadSubjects() {
    setSubjectsLoading(true);
    setActiveSubject(null);
    const ref = collection(db, "semesters", `sem${semId}`, "subjects");
    const snap = await getDocs(ref);
    setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setSubjectsLoading(false);
  }

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semId]);

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!newSubjectId.trim()) return;
    const cleanId = newSubjectId.trim().toLowerCase().replace(/\s+/g, "-");
    await setDoc(doc(db, "semesters", `sem${semId}`, "subjects", cleanId), {
      name: newSubjectName.trim() || cleanId,
    });
    setNewSubjectId("");
    setNewSubjectName("");
    setStatus(`Subject "${cleanId}" added.`);
    loadSubjects();
  }

  async function handleDeleteSubject(subjId) {
    if (!confirm(`Delete subject "${subjId}" and all its materials?`)) return;
    await deleteDoc(doc(db, "semesters", `sem${semId}`, "subjects", subjId));
    setStatus(`Subject "${subjId}" deleted.`);
    loadSubjects();
  }

  async function openSubject(subj) {
    setActiveSubject(subj);
    setEditingMcqId(null);
    setNewTitle("");
    setMcqQuestions([{ ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
    setMaterialsLoading(true);
    const ref = collection(
      db,
      "semesters",
      `sem${semId}`,
      "subjects",
      subj.id,
      "materials"
    );
    const snap = await getDocs(ref);
    setMaterials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setMaterialsLoading(false);
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!newTitle.trim() || !activeSubject) return;
    if (!newFile && !newUrl.trim()) return; // need either a file or a link

    const materialsRef = collection(
      db,
      "semesters",
      `sem${semId}`,
      "subjects",
      activeSubject.id,
      "materials"
    );

    if (newFile) {
      // Upload the actual file to Firebase Storage, then save its download URL
      const path = `materials/sem${semId}/${activeSubject.id}/${Date.now()}-${newFile.name}`;
      const fileRef = storageRef(storage, path);
      const task = uploadBytesResumable(fileRef, newFile);

      setUploadProgress(0);
      task.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (error) => {
          setUploadProgress(null);
          alert("Upload failed: " + error.message);
        },
        async () => {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          await setDoc(doc(materialsRef), {
            title: newTitle.trim(),
            type: newType,
            fileUrl: downloadUrl,
          });
          setNewTitle("");
          setNewUrl("");
          setNewFile(null);
          setUploadProgress(null);
          setStatus("File uploaded and material added.");
          openSubject(activeSubject);
        }
      );
      return;
    }

    // No file selected — fall back to a plain link (e.g. YouTube for videos)
    await setDoc(doc(materialsRef), {
      title: newTitle.trim(),
      type: newType,
      fileUrl: newUrl.trim(),
    });
    setNewTitle("");
    setNewUrl("");
    setStatus("Material added.");
    openSubject(activeSubject);
  }

  // ---- MCQ builder helpers ----
  function updateQuestionText(i, value) {
    setMcqQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, question: value } : q)));
  }

  function updateOptionText(qIndex, optIndex, value) {
    setMcqQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qIndex) return q;
        const options = [...q.options];
        options[optIndex] = value;
        return { ...q, options };
      })
    );
  }

  function updateCorrect(qIndex, optIndex) {
    setMcqQuestions((qs) => qs.map((q, idx) => (idx === qIndex ? { ...q, correct: optIndex } : q)));
  }

  function addQuestionRow() {
    setMcqQuestions((qs) => [...qs, { ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
  }

  function removeQuestionRow(i) {
    setMcqQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function handleSaveMcqSet(e) {
    e.preventDefault();
    if (!newTitle.trim() || !activeSubject) return;

    const cleanedQuestions = mcqQuestions
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correct: q.correct,
      }))
      .filter((q) => q.question && q.options.every((o) => o));

    if (cleanedQuestions.length === 0) {
      alert("Add at least one complete question (all 4 options filled).");
      return;
    }

    const materialsRef = collection(
      db,
      "semesters",
      `sem${semId}`,
      "subjects",
      activeSubject.id,
      "materials"
    );

    if (editingMcqId) {
      // Update the existing MCQ set instead of creating a new one
      await setDoc(doc(materialsRef, editingMcqId), {
        title: newTitle.trim(),
        type: "MCQ",
        questions: cleanedQuestions,
      });
      setStatus(`MCQ set updated — now ${cleanedQuestions.length} question(s).`);
    } else {
      await setDoc(doc(materialsRef), {
        title: newTitle.trim(),
        type: "MCQ",
        questions: cleanedQuestions,
      });
      setStatus(`MCQ set added with ${cleanedQuestions.length} question(s).`);
    }

    setNewTitle("");
    setMcqQuestions([{ ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
    setEditingMcqId(null);
    openSubject(activeSubject);
  }

  function startEditingMcq(m) {
    setNewType("MCQ");
    setNewTitle(m.title);
    setMcqQuestions(
      (m.questions || []).map((q) => ({
        question: q.question,
        options: [...q.options],
        correct: q.correct,
      }))
    );
    setEditingMcqId(m.id);
  }

  function cancelEditingMcq() {
    setNewTitle("");
    setMcqQuestions([{ ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
    setEditingMcqId(null);
  }

  async function handleDeleteMaterial(matId) {
    if (!confirm("Delete this material?")) return;
    await deleteDoc(
      doc(
        db,
        "semesters",
        `sem${semId}`,
        "subjects",
        activeSubject.id,
        "materials",
        matId
      )
    );
    setStatus("Material deleted.");
    openSubject(activeSubject);
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <span className="brand-eyebrow">Admin</span>
          <h1 className="brand-title">Manage Content</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="user-chip">{user?.email}</span>
          <button onClick={logout} className="btn-ghost">Sign out</button>
        </div>
      </div>

      {status && (
        <div className="admin-status mono">▸ {status}</div>
      )}

      {/* Semester selector */}
      <span className="section-label">Semester</span>
      <div className="sem-tabs">
        {SEM_OPTIONS.map((s) => (
          <button
            key={s}
            className={`sem-tab ${s === semId ? "sem-tab-active" : ""}`}
            onClick={() => setSemId(s)}
          >
            Sem {s}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        {/* Subjects column */}
        <div className="admin-panel">
          <span className="section-label">Subjects — Sem {semId}</span>

          <form onSubmit={handleAddSubject} className="admin-form">
            <input
              placeholder="subject-id (e.g. dbms)"
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
            />
            <input
              placeholder="Display name (e.g. DBMS)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-sm">Add Subject</button>
          </form>

          {subjectsLoading && <p className="loading-text">Loading…</p>}

          <div className="admin-list">
            {subjects.map((s) => (
              <div
                key={s.id}
                className={`admin-list-item ${activeSubject?.id === s.id ? "admin-list-item-active" : ""}`}
              >
                <button className="admin-list-btn" onClick={() => openSubject(s)}>
                  {s.name || s.id}
                </button>
                <button className="admin-delete" onClick={() => handleDeleteSubject(s.id)}>✕</button>
              </div>
            ))}
            {!subjectsLoading && subjects.length === 0 && (
              <p className="loading-text">No subjects yet.</p>
            )}
          </div>
        </div>

        {/* Materials column */}
        <div className="admin-panel">
          <span className="section-label">
            {activeSubject ? `Materials — ${activeSubject.name || activeSubject.id}` : "Select a subject"}
          </span>

          {activeSubject && (
            <>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ marginBottom: "0.8rem" }}
              >
                <option>Notes</option>
                <option>PYQ</option>
                <option>Assignment</option>
                <option>Question Answer</option>
                <option>Syllabus</option>
                <option>Video</option>
                <option>MCQ</option>
              </select>

              {newType !== "MCQ" ? (
                /* Normal materials: title + (file upload OR link) */
                <form onSubmit={handleAddMaterial} className="admin-form">
                  <input
                    placeholder="Title (e.g. Unit 1 Notes)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  {newType === "Video" ? (
                    <input
                      placeholder="YouTube link (unlisted)"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  ) : (
                    <>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                        onChange={(e) => setNewFile(e.target.files[0] || null)}
                      />
                      <span className="material-meta" style={{ margin: "-0.3rem 0 0" }}>
                        or paste a link instead ↓
                      </span>
                      <input
                        placeholder="Google Drive / external link (optional if file chosen above)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        disabled={!!newFile}
                      />
                    </>
                  )}

                  {uploadProgress !== null && (
                    <div className="upload-progress-track">
                      <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                      <span className="upload-progress-label mono">{uploadProgress}%</span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary btn-sm" disabled={uploadProgress !== null}>
                    {uploadProgress !== null ? "Uploading…" : "Add Material"}
                  </button>
                </form>
              ) : (
                /* MCQ builder: title + list of questions with 4 options each */
                <form onSubmit={handleSaveMcqSet} className="admin-form mcq-builder">
                  {editingMcqId && (
                    <div className="admin-status mono" style={{ background: "var(--amber)" }}>
                      ▸ Editing existing set — new questions add karke Save karo
                    </div>
                  )}
                  <input
                    placeholder="MCQ Set Title (e.g. Unit 1 Quiz)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  {mcqQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="mcq-question-block">
                      <div className="mcq-question-header">
                        <span className="material-meta">Question {qIndex + 1}</span>
                        {mcqQuestions.length > 1 && (
                          <button
                            type="button"
                            className="admin-delete"
                            onClick={() => removeQuestionRow(qIndex)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <input
                        placeholder="Question text"
                        value={q.question}
                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                      />
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="mcq-option-row">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correct === optIndex}
                            onChange={() => updateCorrect(qIndex, optIndex)}
                            title="Mark as correct answer"
                          />
                          <input
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  <button type="button" className="btn-ghost btn-sm" onClick={addQuestionRow}>
                    + Add Another Question
                  </button>
                  <button type="submit" className="btn-primary btn-sm">
                    {editingMcqId ? "Save Changes" : "Save MCQ Set"}
                  </button>
                  {editingMcqId && (
                    <button type="button" className="btn-ghost btn-sm" onClick={cancelEditingMcq}>
                      Cancel Edit
                    </button>
                  )}
                </form>
              )}

              {materialsLoading && <p className="loading-text">Loading…</p>}

              <div className="admin-list">
                {materials.map((m) => (
                  <div key={m.id} className="admin-list-item">
                    <span className="admin-list-btn" style={{ cursor: "default" }}>
                      {m.title} <span className="material-meta">
                        {m.type}{m.type === "MCQ" ? ` · ${m.questions?.length || 0} Qs` : ""}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {m.type === "MCQ" && (
                        <button className="admin-delete" style={{ color: "var(--sage)" }} onClick={() => startEditingMcq(m)}>
                          Edit
                        </button>
                      )}
                      <button className="admin-delete" onClick={() => handleDeleteMaterial(m.id)}>✕</button>
                    </div>
                  </div>
                ))}
                {!materialsLoading && materials.length === 0 && (
                  <p className="loading-text">No materials yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
