import { useAlerts } from "./AlertsContext";

export default function Alerts() {
  const { alerts, removeAlert } = useAlerts();

  const colorFor = (action) =>
    action === "MFA_REQUIRED" ? "warning" : "danger";

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>
        Alerts {alerts.length > 0 && <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: 13 }}>({alerts.length})</span>}
      </p>

      {alerts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
          <p>No alerts yet — flagged accounts will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map(a => {
            const color = colorFor(a.action);
            return (
              <div key={a.id} className="card" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: `var(--${color}-light)`, borderColor: `var(--${color})`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{a.action === "BLOCK" ? "🚫" : "🔐"}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: `var(--${color})`, margin: 0 }}>
                      {a.action.replace("_", " ")} — {a.risk_score}% risk
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                      From {a.source} · {new Date(a.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => removeAlert(a.id)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}