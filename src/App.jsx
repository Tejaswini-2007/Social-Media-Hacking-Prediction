import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Visualizations from "./Visualizations";
import Compare from "./Compare";
import Alerts from "./Alerts";
import { AlertsProvider, useAlerts } from "./AlertsContext";
import "./theme.css";

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const { unread, clearUnread } = useAlerts();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const tabs = [
    { id: "dashboard", label: "Analyse", icon: "🔍" },
    { id: "visualizations", label: "Visualizations", icon: "📊" },
    { id: "compare", label: "Compare", icon: "⚖️" },
    { id: "alerts", label: "Alerts", icon: "🔔", badge: unread },
  ];

  const handleTabClick = (id) => {
    setPage(id);
    if (id === "alerts") clearUnread();
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 24px" }}>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 16, borderBottom: "1px solid var(--border-color)", marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>HackGuard</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Account intelligence platform
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <button className="btn-secondary" onClick={() => handleTabClick("alerts")}>
                🔔
              </button>
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: "var(--danger)", color: "white",
                  borderRadius: "999px", fontSize: 11, fontWeight: 600,
                  padding: "1px 6px", minWidth: 16, textAlign: "center"
                }}>
                  {unread}
                </span>
              )}
            </div>

            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="btn-secondary">
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab ${page === t.id ? "active" : ""}`}
              onClick={() => handleTabClick(t.id)}
              style={{ position: "relative" }}
            >
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span style={{
                  marginLeft: 6, background: "var(--danger)", color: "white",
                  borderRadius: "999px", fontSize: 10, fontWeight: 600,
                  padding: "1px 6px"
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {page === "dashboard" && <Dashboard />}
        {page === "visualizations" && <Visualizations />}
        {page === "compare" && <Compare />}
        {page === "alerts" && <Alerts />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AlertsProvider>
      <AppShell />
    </AlertsProvider>
  );
}
