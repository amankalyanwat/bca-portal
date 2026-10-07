import { useState } from "react";
import { Link } from "react-router-dom";

const starterPosts = [{ id: 1, title: "How do pointers work in C?", tag: "C programming", replies: 4 }, { id: 2, title: "Which OSI layer handles routing?", tag: "Computer Networks", replies: 7 }];
export default function Forum() {
  const [posts, setPosts] = useState(starterPosts); const [draft, setDraft] = useState("");
  const addPost = (event) => { event.preventDefault(); if (!draft.trim()) return; setPosts([{ id: Date.now(), title: draft.trim(), tag: "New discussion", replies: 0 }, ...posts]); setDraft(""); };
  return <div className="shell feature-page"><Link to="/" className="back-link">← Dashboard</Link><div className="feature-page-heading"><div><span className="brand-eyebrow">Peer learning</span><h1 className="brand-title">Doubt forum</h1><p>Ask a question, share a solution, and learn together.</p></div><span className="feature-pill">Coming alive</span></div><form className="discussion-composer" onSubmit={addPost}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What are you stuck on?" aria-label="New discussion question" /><button className="btn-primary">Post doubt</button></form><div className="discussion-list">{posts.map((post) => <article className="discussion-card" key={post.id}><div className="discussion-avatar">?</div><div><span className="discussion-tag">{post.tag}</span><h2>{post.title}</h2><small>{post.replies} replies · Open discussion</small></div><button className="btn-ghost btn-sm">View</button></article>)}</div></div>;
}
