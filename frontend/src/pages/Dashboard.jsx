// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeetCodeStats, getLeetCodeCalendar } from "../api/leetcode";
import LeetCodeDash from "../components/LeetCodeDash";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [me, setMe] = useState(null);

  // LeetCode
  const [lc, setLc] = useState(null);
  const [lcErr, setLcErr] = useState("");
  const [cal, setCal] = useState(null);
  const [calErr, setCalErr] = useState("");

  const BASE = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // auth + load profile
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) { navigate("/login"); return; }
    fetch(`${BASE}/api/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMe)
      .catch(() => { localStorage.clear(); navigate("/login"); });
  }, []);

  // fetch LeetCode data
  useEffect(() => {
    if (!me) return;
    const uname = me.leetcode_username || me.username;

    setLc(null); setLcErr("");
    getLeetCodeStats(uname)
      .then(setLc)
      .catch((e) => setLcErr(e.message || "Failed to fetch LeetCode stats"));

    setCal(null); setCalErr("");
    getLeetCodeCalendar(uname)
      .then(setCal)
      .catch((e) => setCalErr(e.message || "Failed to fetch LeetCode calendar"));
  }, [me]);

  if (!me) return <div className="center"><div>Loading dashboard…</div></div>;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-small">DSA Tracker</div>
        <div className="spacer" />
        <div className="user">{me.username}</div>
        <button className="btn" onClick={() => navigate("/roadmap")}>Roadmap</button>
        <button
          className="btn danger small"
          onClick={() => { localStorage.clear(); navigate("/login"); }}
        >
          Logout
        </button>
      </header>

      <main className="dashboard-grid">
        {/* LEFT: compact LC summary */}
        <section className="card summary">
          <h2>LeetCode Summary</h2>
          {lcErr && <div className="msg error">Error: {lcErr}</div>}
          {!lc && !lcErr && <div>Loading…</div>}
          {lc && (
            <ul className="list">
              <li className="metric"><span className="label">Rank</span><span className="dash" /><span className="value">{lc.ranking ?? "—"}</span></li>
              <li className="metric"><span className="label">Total Solved</span><span className="dash" /><span className="value">{lc.totalSolved}</span></li>
              <li className="metric"><span className="label">Easy</span><span className="dash" /><span className="value">{lc.easy}</span></li>
              <li className="metric"><span className="label">Medium</span><span className="dash" /><span className="value">{lc.medium}</span></li>
              <li className="metric"><span className="label">Hard</span><span className="dash" /><span className="value">{lc.hard}</span></li>
            </ul>
          )}
        </section>

        

        {/* RIGHT: interactive analytics */}
        <section className="card analytics">
          <h2>Your Learning Analytics</h2>
          {(calErr || lcErr) && <div className="msg error">Error: {calErr || lcErr}</div>}
          {(!cal || !lc) && !(calErr || lcErr) && <div>Loading charts…</div>}
          {cal && lc && <LeetCodeDash stats={lc} calendar={cal} />}
        </section>

        {/* BELOW: scaffolds for upcoming features (optional) */}
        <section className="card">
          <h2>Topic Mastery</h2>
          <p className="empty-state">
            Connect your practice logs to see mastery by topic (Arrays, DP, Graphs…) with a radar chart.
          </p>
          <ul className="mini-list">
            <li>• Weakest topics will show here with 1-click practice sets.</li>
            <li>• We use attempts, time-to-AC, and last-touched freshness.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Revision Queue</h2>
          <p className="empty-state">
            Spaced repetition queue appears here (Due Today / This Week / Later).
          </p>
          <ul className="mini-list">
            <li>• Revisit ROI: shows problems you now solve faster.</li>
            <li>• Add notes to boost retention tracking.</li>
          </ul>
        </section>


      </main>
    </div>
  );
}
