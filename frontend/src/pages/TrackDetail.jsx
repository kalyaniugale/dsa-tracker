import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./trackdetail.css";

export default function TrackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL;

  const [track, setTrack] = useState(null);
  const [next, setNext] = useState(null);
  const [completed, setCompleted] = useState([1, 2]); // mock: completed problems

  // Fetch Track Detail
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${BASE}/api/tracks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(setTrack)
      .catch(() => {
        localStorage.clear();
        navigate("/login");
      });
  }, [id, BASE, navigate]);

  // Fetch Suggested Next Problem
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    fetch(`${BASE}/api/tracks/${id}/suggest-next/?completed=${completed.join(",")}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setNext)
      .catch(console.error);
  }, [id, BASE, completed]);

  if (!track) return <div className="center"><div>Loading…</div></div>;

  const solvedCount = completed.length;
  const totalCount = track.track_problems.length;
  const percent = Math.round((solvedCount / totalCount) * 100);

  return (
    <div className="page">
      <h1>{track.name}</h1>
      <p>{track.description}</p>

      {/* Progress bar */}
      <div className="progress">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      <p className="progress-text">
        {solvedCount} / {totalCount} problems solved ({percent}%)
      </p>

      {/* Suggested Next Problem */}
      {next && next.next ? (
        <div className="card highlight">
          <h3>🔥 Suggested Next Problem</h3>
          <p>
            #{next.next.order} – {next.next.title}
          </p>
        </div>
      ) : (
        <p className="done-text">🎉 All problems completed! Confetti time! 🎉</p>
      )}

      <h2>Problems in this Track</h2>
      <div className="problems-grid">
        {track.track_problems.map((tp) => {
          const isDone = completed.includes(tp.problem.id);
          return (
            <div className={`problem-card ${isDone ? "done" : ""}`} key={tp.order}>
              <div className="problem-info">
                <span className="order">#{tp.order}</span>
                <span className="title">{tp.problem.title}</span>
              </div>
              <div className="problem-meta">
                <span className={`badge ${tp.problem.difficulty.toLowerCase()}`}>
                  {tp.problem.difficulty}
                </span>
                {isDone ? "✅" : "⏳"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
