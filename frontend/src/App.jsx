import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import TrackDetail from "./pages/TrackDetail";

function Layout() {
  return (
    <div className="app-shell">
      {/* Global header could go here */}
      <Outlet /> {/* 👈 REQUIRED so child routes render */}
    </div>
  );
}

function ProtectedRoute() {
  const token = localStorage.getItem("access");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Private routes */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/roadmap" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/roadmap/:id" element={<TrackDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
