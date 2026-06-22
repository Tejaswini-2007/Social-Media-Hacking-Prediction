export default function Landing({ onGetStarted }) {
  const techStack = [
    "XGBoost", "Isolation Forest", "Flask", "React",
    "PostgreSQL", "Redis"
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="card" style={{ textAlign: "center", padding: "60px 40px", maxWidth: 560 }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🛡️</div>

        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 10px", color: "var(--text-primary)" }}>
          HackGuard
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Analyse your social media account's security in seconds using machine learning powered risk detection.
        </p>

        <button onClick={onGetStarted} className="btn-primary" style={{ padding: "12px 32px", fontSize: 15 }}>
          Get started →
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 36, marginBottom: 32 }}>
          {[
            { icon: "⚡", label: "Real-time scoring" },
            { icon: "📊", label: "Visual insights" },
            { icon: "🔒", label: "Anomaly detection" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 20 }}>{f.icon}</div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{f.label}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 10, letterSpacing: 0.5 }}>
            BUILT WITH
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {techStack.map(tech => (
              <span key={tech} className="badge" style={{
                background: "var(--bg-muted)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)"
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}