import { useState } from "react";
import Dashboard from "./Dashboard";
import Visualizations from "./Visualizations";

// Move your existing App.jsx content to Dashboard.jsx first!
export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>

      {/* Header with nav */}
      <div style={{ background: "#1e293b", color: "#fff", padding: "16px 32px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>HackGuard</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Social Media Account Hacking Prediction System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "dashboard",       label: "🔍 Analyse" },
            { id: "visualizations",  label: "📊 Visualizations" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              style={{ padding: "8px 16px", borderRadius: 6, border: "none",
                       cursor: "pointer", fontWeight: 600, fontSize: 13,
                       background: page === tab.id ? "#fff" : "transparent",
                       color: page === tab.id ? "#1e293b" : "#94a3b8" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page content */}
      {page === "dashboard"      && <Dashboard />}
      {page === "visualizations" && <Visualizations />}
    </div>
  );
}