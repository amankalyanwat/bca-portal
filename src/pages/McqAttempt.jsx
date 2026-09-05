// src/pages/McqAttempt.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function McqAttempt() {
  const { semId, subjectId, mcqId } = useParams();
  const [mcqSet, setMcqSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchSet() {
      setLoading(true);
      const ref = doc(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials", mcqId);
      const snap = await getDoc(ref);
      if (snap.exists()) setMcqSet(snap.data());
      setLoading(false);
    }
    fetchSet();
  }, [semId, subjectId, mcqId]);

  function selectAnswer(qIndex, optIndex) {
    if (submitted) return; // lock answers after submit
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
  }

  if (loading) {
    return (
      <div className="shell">
        <p className="loading-text">Loading…</p>
      </div>
    );
  }

  if (!mcqSet) {
    return (
      <div className="shell">
        <div className="empty-state">MCQ set not found.</div>
      </div>
    );
  }

  const totalQuestions = mcqSet.questions.length;
  const attemptedCount = Object.keys(answers).length;
  const score = submitted
    ? mcqSet.questions.reduce(
        (acc, q, i) => (answers[i] === q.correct ? acc + 1 : acc),
        0
      )
    : 0;

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}/materials/mcq`} className="back-link">
        ← Back to MCQs
      </Link>
      <span className="brand-eyebrow">{totalQuestions} Questions</span>
      <h1 className="brand-title" style={{ marginBottom: "1.5rem" }}>{mcqSet.title}</h1>

      {submitted && (
        <div className="mcq-score-banner mono">
          Score: {score} / {totalQuestions}
        </div>
      )}

      <div className="mcq-quiz-list">
        {mcqSet.questions.map((q, qIndex) => {
          const selected = answers[qIndex];
          const isCorrect = selected === q.correct;

          return (
            <div key={qIndex} className="mcq-quiz-block">
              <p className="mcq-quiz-question">
                <span className="mono">{qIndex + 1}.</span> {q.question}
              </p>
              <div className="mcq-quiz-options">
                {q.options.map((opt, optIndex) => {
                  let cls = "mcq-option-btn";
                  if (submitted) {
                    if (optIndex === q.correct) cls += " mcq-option-correct";
                    else if (optIndex === selected) cls += " mcq-option-wrong";
                  } else if (selected === optIndex) {
                    cls += " mcq-option-selected";
                  }
                  return (
                    <button
                      key={optIndex}
                      type="button"
                      className={cls}
                      onClick={() => selectAnswer(qIndex, optIndex)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className={`mcq-result-tag ${isCorrect ? "mcq-tag-correct" : "mcq-tag-wrong"}`}>
                  {isCorrect ? "Correct" : `Correct answer: ${q.options[q.correct]}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button className="btn-primary" onClick={handleSubmit} style={{ marginTop: "1.5rem" }}>
          Submit ({attemptedCount}/{totalQuestions} answered)
        </button>
      ) : (
        <button className="btn-ghost" onClick={handleRetry} style={{ marginTop: "1.5rem" }}>
          Retry Quiz
        </button>
      )}
    </div>
  );
}
