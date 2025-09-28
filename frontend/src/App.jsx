import { useEffect, useState } from "react";

function App() {
  const [api, setApi] = useState("checking…");

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL}/api/health`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => setApi(JSON.stringify(j)))
      .catch(() => setApi("API not running"));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>DSA Tracker — Frontend</h1>
      <p>API status: {api}</p>
    </div>
  );
}

export default App;
