// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL;

  const setVal = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function doLogin(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${BASE}/api/users/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Login failed");
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function doRegister(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${BASE}/api/users/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = data?.detail;
        throw new Error(
          Array.isArray(d) ? d.join(", ") : d || "Register failed"
        );
      }
      setMsg("Registered! Please login.");
      setTab("login");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="center">
      <div className="card">
        <h1 className="brand">DSA Tracker</h1>

        <div className="tabs">
          <button
            className={tab === "login" ? "tab active" : "tab"}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={tab === "register" ? "tab active" : "tab"}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {tab === "login" ? (
          <form className="form" onSubmit={doLogin}>
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={setVal}
              autoComplete="username"
              required
            />
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={setVal}
              autoComplete="current-password"
              required
            />
            <button className="btn primary" type="submit">
              Login
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={doRegister}>
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={setVal}
              required
            />
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={setVal}
              required
            />
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={setVal}
              required
            />
            <button className="btn success" type="submit">
              Create account
            </button>
          </form>
        )}

        {msg && <p className="msg">{msg}</p>}

        <p className="hint">
          Use a strong password (e.g. <code>Pass123!@#</code>)
        </p>
      </div>
    </div>
  );
}
