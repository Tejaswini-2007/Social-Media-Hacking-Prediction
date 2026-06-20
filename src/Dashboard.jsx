import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { useAlerts } from "./AlertsContext";
import jsPDF from "jspdf";

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
      const res = await axios.post("http://localhost:5000/predict", {
        ...form, user_id: "dashboard_user_001"
      });
      setResult(res.data);
      pushAlert(res.data, "Analyse");
      setHistory(prev => [res.data, ...prev].slice(0, 5));
    } catch (e) {
      setError("Cannot connect to Flask API — make sure it is running on port 5000");
    }
    setLoading(false);
  };

  const statusColor =
    result?.action === "ALLOW" ? "success" :
    result?.action === "MFA_REQUIRED" ? "warning" : "danger";

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
  doc.line(14, 32, 196, 32);

  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Decision summary", 14, 42);

  doc.setFontSize(11);
  doc.text(`Platform: ${form.platform}`, 14, 50);
  doc.text(`Risk score: ${result.risk_score}%`, 14, 57);
  doc.text(`Decision: ${result.action.replace("_", " ")}`, 14, 64);
  doc.text(`Anomaly detected: ${result.anomaly_detected ? "Yes" : "No"}`, 14, 71);

  doc.setFontSize(13);
  doc.text("Account signals used", 14, 84);

  let y = 92;
  Object.entries(FIELD_LABELS).forEach(([k, label]) => {
    doc.setFontSize(10);
    doc.text(`${label}: ${form[k]}`, 14, y);
    y += 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(`hackguard-report-${Date.now()}.pdf`);
};

  return (
    <div>
      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total checks", value: history.length },
          { label: "Last risk score", value: result ? `${result.risk_score}%` : "—" },
          { label: "Last decision", value: result ? result.action : "—" },
          { label: "Platform", value: form.platform },
        ].map(card => (
          <div className="metric-card" key={card.label}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 6px" }}>
              {card.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>

        {/* Input panel */}
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 14px" }}>Account details</p>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Platform</label>
            <select value={form.platform} onChange={e => handleChange("platform", e.target.value)}
              style={{ marginTop: 4 }}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(FIELD_LABELS).map(([k, label]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</label>
                <input type="number" step="any" value={form[k]}
                  onChange={e => handleChange(k, e.target.value)}
                  style={{ marginTop: 3 }} />
              </div>
            ))}
          </div>

          <button onClick={handlePredict} disabled={loading} className="btn-primary"
            style={{ width: "100%", marginTop: 18 }}>
            {loading ? "Analysing…" : "🔍 Analyse account"}
          </button>
        </div>

        {/* Result panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result ? (
            <>
              <div className="card" style={{ background: `var(--${statusColor}-light)`, borderColor: `var(--${statusColor})` }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div>
      <p style={{ fontSize: 12, color: `var(--${statusColor})`, margin: "0 0 4px" }}>Decision</p>
      <p style={{ fontSize: 20, fontWeight: 600, color: `var(--${statusColor})`, margin: 0 }}>
        {result.action.replace("_", " ")}
      </p>
    </div>
    <p style={{ fontSize: 30, fontWeight: 600, color: `var(--${statusColor})`, margin: 0 }}>
      {result.risk_score}%
    </p>
  </div>
  <button onClick={handleExportPDF} className="btn-secondary" style={{ width: "100%", marginTop: 12 }}>
    📄 Export PDF report
  </button>
</div>

              <div className="card">
                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Risk breakdown</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {history.length > 0 && (
                <div className="card">
                  <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Recent checks</p>
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={history.map((h, i) => ({ name: `#${history.length - i}`, risk: h.risk_score }))}>
                      <XAxis dataKey="name" /><YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="risk" fill="var(--text-primary)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <p>Fill in the account details and analyse to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
