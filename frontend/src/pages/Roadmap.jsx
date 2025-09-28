import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./roadmap.css";

export default function Roadmap() {
  const [tracks, setTracks] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(new Set()); // "EASY" | "MEDIUM" | "HARD"
  const [sortBy, setSortBy] = useState("name");   // name | problems | pinned
  const [pinned, setPinned] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("pinnedTracks") || "[]")); }
    catch { return new Set(); }
  });

  const BASE = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // keyboard niceties
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "f") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") setQuery("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    fetch(`${BASE}/api/tracks/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setTracks(Array.isArray(data) ? data : data.results ?? []))
      .catch((err) => {
        console.error(err);
        if (err.status === 401) { localStorage.clear(); navigate("/login"); }
      });
  }, [BASE, navigate]);

  // persist pinned
  useEffect(() => {
    localStorage.setItem("pinnedTracks", JSON.stringify([...pinned]));
  }, [pinned]);

  // compute list (search + filter + sort)
  const view = useMemo(() => {
    if (!tracks) return null;

    const q = query.trim().toLowerCase();
    const hasFilter = filter.size > 0;

    let list = tracks.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      if (!nameMatch) return false;

      if (!hasFilter) return true;
      const diffs = new Set(t.track_problems.map((tp) => tp.problem.difficulty));
      // show track if it contains ANY selected difficulty
      for (const d of filter) if (diffs.has(d)) return true;
      return false;
    });

    list.sort((a, b) => {
      if (sortBy === "pinned") {
        const ap = pinned.has(a.id) ? 0 : 1;
        const bp = pinned.has(b.id) ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "problems") return b.track_problems.length - a.track_problems.length;
      return a.name.localeCompare(b.name); // name
    });

    return list;
  }, [tracks, query, filter, sortBy, pinned]);

  // skeletons while loading
  if (!tracks) {
    return (
      <div className="page">
        <Hero title="Learning Roadmap" subtitle="Pick a track and start solving." count={null} />
        <Toolbar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchRef={searchRef}
          onReset={() => { setQuery(""); setFilter(new Set()); setSortBy("name"); }}
        />
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Hero
        title="Learning Roadmap"
        subtitle="Choose a track. Stay in flow."
        count={{ tracks: tracks.length, problems: tracks.reduce((n, t) => n + t.track_problems.length, 0) }}
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchRef={searchRef}
        onReset={() => { setQuery(""); setFilter(new Set()); setSortBy("name"); }}
      />

      {view?.length === 0 ? (
        <EmptyState onClear={() => { setQuery(""); setFilter(new Set()); setSortBy("name"); }} />
      ) : (
        <div className="grid">
          {view.map((t) => (
            <TrackCard
              key={t.id}
              track={t}
              pinned={pinned.has(t.id)}
              onPin={() => setPinned((s) => new Set(s.has(t.id) ? [...[...s].filter(id => id !== t.id)] : [...s, t.id]))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------- components ----------------- */

function Hero({ title, subtitle, count }) {
  return (
    <header className="hero">
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
      {count && (
        <div className="hero-stats">
          <span>📚 {count.tracks} tracks</span>
          <span>🧩 {count.problems} problems</span>
        </div>
      )}
    </header>
  );
}

function Toolbar({ query, setQuery, filter, setFilter, sortBy, setSortBy, searchRef, onReset }) {
  const toggle = (d) =>
    setFilter((s) => { const n = new Set(s); n.has(d) ? n.delete(d) : n.add(d); return n; });

  return (
    <div className="toolbar">
      <input
        ref={searchRef}
        className="search"
        placeholder="Search tracks… (press F to focus)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chips">
        {["EASY", "MEDIUM", "HARD"].map((d) => (
          <button
            key={d}
            className={`chip ${filter.has(d) ? d.toLowerCase() + " active" : ""}`}
            onClick={() => toggle(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="sort-wrap">
        <label>Sort</label>
        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="pinned">Pinned first</option>
          <option value="name">Name A–Z</option>
          <option value="problems">Problem count</option>
        </select>
      </div>

      {(query || filter.size > 0 || sortBy !== "name") && (
        <button className="reset" onClick={onReset}>Reset</button>
      )}
    </div>
  );
}

function TrackCard({ track, pinned, onPin }) {
  // fade-in on view
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add("in"); }, { threshold: 0.12 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const shown = track.track_problems.slice(0, 3);
  const rest = track.track_problems.length - shown.length;

  return (
    <section ref={ref} className="card track">
      <div className="card-top">
        <h2 className="card-title">
          <Link to={`/roadmap/${track.id}`}>{track.name}</Link>
        </h2>
        <button className={`pin ${pinned ? "on" : ""}`} onClick={onPin} title={pinned ? "Unpin" : "Pin"}>
          {pinned ? "★" : "☆"}
        </button>
      </div>

      <p className="card-desc">{track.description}</p>

      <div className="mini-list">
        {shown.map((tp) => (
          <div className="mini-row" key={tp.order}>
            <span className="mini-left">#{tp.order} {tp.problem.title}</span>
            <span className={`badge ${tp.problem.difficulty.toLowerCase()}`}>{tp.problem.difficulty}</span>
          </div>
        ))}
        {rest > 0 && <div className="more">+{rest} more…</div>}
      </div>

      <div className="progress slim">
        <div className="progress-bar" style={{ width: "0%" }} />
      </div>

      <div className="card-actions">
        <Link className="btn primary" to={`/roadmap/${track.id}`}>View Full Track →</Link>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <section className="card skeleton">
      <div className="sk-line lg" />
      <div className="sk-line sm" />
      <div className="sk-row" />
      <div className="sk-row" />
      <div className="sk-row" />
      <div className="sk-progress" />
      <div className="sk-btn" />
    </section>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="empty">
      <div className="emoji">🧭</div>
      <h3>No tracks match your filters</h3>
      <p className="muted">Try clearing the search or difficulty chips.</p>
      <button className="btn" onClick={onClear}>Clear filters</button>
    </div>
  );
}
