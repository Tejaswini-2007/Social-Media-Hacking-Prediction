import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { useAlerts } from "./AlertsContext";
import jsPDF from "jspdf";

const API_URL = "https://social-media-hacking-prediction-1.onrender.com";

const PLATFORMS = ["Twitter", "Instagram", "Facebook", "LinkedIn"];

const defaultForm = {
  platform: "Twitter",
  has_profile_pic: 0,
  bio_length: 50,
  username_randomness: 1,
  followers: 100,
  following: 500,
  follower_following_ratio: 0.2,
  account_age_days: 30,
  posts: 10,
  posts_per_day: 0.3,
  caption_similarity_score: 0.8,
  content_similarity_score: 0.7,
  follow_unfollow_rate: 200,
  spam_comments_rate: 50,
  generic_comment_rate: 80,
  suspicious_links_in_bio: 1,
  verified: 0,
};

const FIELD_LABELS = {
  has_profile_pic: "Has profile pic (0/1)",
  bio_length: "Bio length",
  username_randomness: "Username randomness (0/1)",
  followers: "Followers",
  following: "Following",
  follower_following_ratio: "Follower/following ratio",
  account_age_days: "Account age (days)",
  posts: "Total posts",
  posts_per_day: "Posts per day",
  caption_similarity_score: "Caption similarity score",
  content_similarity_score: "Content similarity score",
  follow_unfollow_rate: "Follow/unfollow rate",
  spam_comments_rate: "Spam comments rate",
  generic_comment_rate: "Generic comment rate",
  suspicious_links_in_bio: "Suspicious links in bio (0/1)",
  verified: "Verified (0/1)",
};

const ACTION_CONFIG = {
  SAFE:      { label: "✅ Safe",       color: "success" },
  NEEDS_MFA: { label: "🔐 Needs MFA", color: "warning" },
  BLOCKED:   { label: "🚫 Blocked",   color: "danger"  },
};

const getActionConfig = (action) =>
  ACTION_CONFIG[action] || { label: action, color: "warning" };

export default function Dashboard() {
  const [form, setForm]       = useState(defaultForm);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);
  const { pushAlert } = useAlerts();

  const handleChange = (k, v) =>
    setForm(prev => ({ ...prev, [k]: isNaN(v) || v === "" ? v : parseFloat(v) }));

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/predict`, {
        ...form, user_id: "dashboard_user_001"
      });
      setResult(res.data);
      pushAlert(res.data, "Analyse");
      setHistory(prev => [res.data, ...prev].slice(0, 5));
    } catch (e) {
      setError("Cannot connect to Flask API — make sure the backend is running.");
    }
    setLoading(false);
  };

  const actionCfg   = result ? getActionConfig(result.action) : null;
  const statusColor = actionCfg?.color || "warning";

  const pieData = result ? [
    { name: "Risk", value: result.risk_score },
    { name: "Safe", value: parseFloat((100 - result.risk_score).toFixed(2)) }
  ] : [];

  const PIE_COLORS = ["var(--danger)", "var(--success)"];

  const handleExportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("HackGuard — Account Risk Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}`, 14, 28);
    doc.setDrawColor(220);
    doc.line(14, 35, 196, 35);
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("Decision Summary", 14, 45);
    doc.setFontSize(11);
    doc.text(`Platform: ${form.platform}`, 14, 53);
    doc.text(`Risk Score: ${result.risk_score}%`, 14, 60);
    doc.text(`Decision: ${actionCfg?.label || result.action}`, 14, 67);
    doc.text(`Anomaly Detected: ${result.anomaly_detected ? "Yes" : "No"}`, 14, 74);
    doc.setFontSize(13);
    doc.text("Account Signals Used", 14, 87);
    let y = 95;
    Object.entries(FIELD_LABELS).forEach(([k, label]) => {
      doc.setFontSize(10);
      doc.text(`${label}: ${form[k]}`, 14, y);
      y += 6;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`hackguard-report-${Date.now()}.pdf`);
  };

  return (
    <div>
      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total checks",    value: history.length },
          { label: "Last risk score", value: result ? `${result.risk_score}%` : "—" },
          { label: "Last decision",   value: result ? (actionCfg?.label || result.action) : "—" },
          { label: "Platform",        value: form.platform },
        ].map(card => (
          <div className="metric-card" key={card.label}
            style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px" }}>
              {card.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)",
                                       marginBottom: 16, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>

        {/* Input panel */}
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 16px" }}>
            Account details
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)",
                            marginBottom: 4 }}>
              Platform
            </label>
            <select value={form.platform}
              onChange={e => handleChange("platform", e.target.value)}
              style={{ width: "100%" }}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "12px 14px" }}>
            {Object.entries(FIELD_LABELS).map(([k, label]) => (
              <div key={k}>
                <label style={{ display: "block", fontSize: 11,
                                color: "var(--text-secondary)", marginBottom: 4 }}>
                  {label}
                </label>
                <input type="number" step="any" value={form[k]}
                  onChange={e => handleChange(k, e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          <button onClick={handlePredict} disabled={loading} className="btn-primary"
            style={{ width: "100%", marginTop: 20 }}>
            {loading ? "Analysing…" : "🔍 Analyse account"}
          </button>
        </div>

        {/* Result panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result ? (
            <>
              {/* Decision card */}
              <div className="card"
                style={{ background: `var(--${statusColor}-light)`,
                         borderColor: `var(--${statusColor})` }}>
                <div style={{ display: "flex", alignItems: "center",
                              justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 12, color: `var(--${statusColor})`,
                                margin: "0 0 4px" }}>Decision</p>
                    <p style={{ fontSize: 22, fontWeight: 700,
                                color: `var(--${statusColor})`, margin: 0 }}>
                      {actionCfg?.label}
                    </p>
                    <p style={{ fontSize: 12, color: `var(--${statusColor})`,
                                margin: "6px 0 0", opacity: 0.8 }}>
                      {result.action === "SAFE"      && "Account looks legitimate — no action needed."}
                      {result.action === "NEEDS_MFA" && "Suspicious signals detected — verify identity."}
                      {result.action === "BLOCKED"   && "High risk account — access denied."}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 36, fontWeight: 700,
                                color: `var(--${statusColor})`, margin: 0 }}>
                      {result.risk_score}%
                    </p>
                    <p style={{ fontSize: 11, color: `var(--${statusColor})`,
                                margin: "2px 0 0", opacity: 0.7 }}>risk score</p>
                  </div>
                </div>

                {/* Threshold bar */}
                <div style={{ marginTop: 12, background: "rgba(0,0,0,0.08)",
                              borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{
                    width: `${result.risk_score}%`, height: "100%",
                    background: `var(--${statusColor})`, borderRadius: 6,
                    transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                              fontSize: 10, color: `var(--${statusColor})`,
                              opacity: 0.7, marginTop: 4 }}>
                  <span>0%</span>
                  <span>40% MFA</span>
                  <span>75% Block</span>
                  <span>100%</span>
                </div>

                <button onClick={handleExportPDF} className="btn-secondary"
                  style={{ width: "100%", marginTop: 12 }}>
                  📄 Export PDF report
                </button>
              </div>

              {/* Anomaly badge */}
              <div className="card" style={{ padding: "10px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Anomaly detected
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: result.anomaly_detected ? "var(--danger-light)" : "var(--success-light)",
                    color: result.anomaly_detected ? "var(--danger)" : "var(--success)"
                  }}>
                    {result.anomaly_detected ? "⚠️ Yes" : "✓ No"}
                  </span>
                </div>
              </div>

              {/* Pie chart */}
              <div className="card">
                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Risk breakdown</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* History bar chart */}
              {history.length > 0 && (
                <div className="card">
                  <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Recent checks</p>
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={history.map((h, i) => ({
                      name: `#${history.length - i}`,
                      risk: h.risk_score,
                      action: h.action
                    }))}>
                      <XAxis dataKey="name" /><YAxis domain={[0, 100]} />
                      <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.action]} />
                      <Bar dataKey="risk" radius={4}>
                        {history.map((h, i) => (
                          <Cell key={i} fill={
                            h.action === "SAFE"      ? "var(--success)" :
                            h.action === "NEEDS_MFA" ? "var(--warning)" : "var(--danger)"
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: "center",
                                           color: "var(--text-tertiary)", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <p>Fill in the account details and analyse to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
