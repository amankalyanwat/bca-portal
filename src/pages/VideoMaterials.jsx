// src/pages/VideoMaterials.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getYouTubeId } from "../utils";

export default function VideoMaterials() {
  const { semId, subjectId } = useParams();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function fetchVideos() {
      const ref = collection(db, "semesters", `sem${semId}`, "subjects", subjectId, "materials");
      const snapshot = await getDocs(ref);
      const filtered = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.type === "Video");
      setVideos(filtered);
    }
    fetchVideos();
  }, [semId, subjectId]);

  return (
    <div className="shell">
      <Link to={`/semester/${semId}/subject/${subjectId}`} className="back-link">← Back to Materials</Link>
      <h1 className="brand-title">Videos</h1>

        <div className="list-col">
            {videos.map((v) => {
                const ytId = getYouTubeId(v.fileUrl);
                return (
                <div key={v.id} className="material-video-block">
                    <h3 className="row-title">{v.title}</h3>
                    {ytId && (
                    <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={v.title}
                        allowFullScreen
                        className="video-embed"
                    />
                    )}
                </div>
                );
            })}
        </div>


    </div>
  );
}
