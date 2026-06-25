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

// ── Stage D: Simulate values from a URL ─────────────────
const detectPlatform = (url) => {
  if (url.includes("twitter.com") || url.includes("x.com"))    return "Twitter";
  if (url.includes("instagram.com"))                            return "Instagram";
  if (url.includes("facebook.com"))                             return "Facebook";
  if (url.includes("linkedin.com"))                             return "LinkedIn";
  return "Twitter";
};

const rand = (min, max, dec = 0) => {
  const v = Math.random() * (max - min) + min;
  return dec > 0 ? parseFloat(v.toFixed(dec)) : Math.round(v);
};

// Generate simulated values biased by URL patterns
const simulateFromUrl = (url) => {
  const platform   = detectPlatform(url);
  const lowerUrl   = url.toLowerCase();

  // Suspicious signals in the URL itself
  const hasNumbers     = /\d{4,}/.test(url);
  const hasRandomChars = /[_-]{2,}/.test(url);
  const isSuspicious   = hasNumbers || hasRandomChars;

  if (isSuspicious) {
    // Likely fake/bot account
    return {
      platform,
      has_profile_pic:           rand(0, 1),
      bio_length:                rand(0, 40),
      username_randomness:       1,
      followers:                 rand(1, 80),
      following:                 rand(2000, 7000),
      follower_following_ratio:  rand(0.001, 0.05, 3),
      account_age_days:          rand(1, 30),
      posts:                     rand(100, 800),
      posts_per_day:             rand(10, 50, 1),
      caption_similarity_score:  rand(0.8, 0.99, 2),
      content_similarity_score:  rand(0.8, 0.99, 2),
      follow_unfollow_rate:      rand(300, 999),
      spam_comments_rate:        rand(200, 900),
      generic_comment_rate:      rand(300, 900),
      suspicious_links_in_bio:   1,
      verified:                  0,
    };
  } else {
    // Likely legitimate account
    return {
      platform,
      has_profile_pic:           1,
      bio_length:                rand(80, 250),
      username_randomness:       0,
      followers:                 rand(500, 50000),
      following:                 rand(100, 1000),
      follower_following_ratio:  rand(1.5, 30, 2),
      account_age_days:          rand(180, 2000),
      posts:                     rand(50, 500),
      posts_per_day:             rand(0.1, 2, 2),
      caption_similarity_score:  rand(0.05, 0.3, 2),
      content_similarity_score:  rand(0.05, 0.3, 2),
      follow_unfollow_rate:      rand(1, 20),
      spam_comments_rate:        rand(0, 10),
      generic_comment_rate:      rand(0, 15),
      suspicious_links_in_bio:   0,
      verified:                  rand(0, 1),
    };
  }
};

export default function Dashboard() {
  const [form, setForm]         = useState(defaultForm);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [error, setError]       = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlMode, setUrlMode]   = useState(false);
  const [simulated, setSimulated] = useState(false);
  const { pushAlert } = useAlerts();

  const handleChange = (k, v) =>
    setForm(prev => ({ ...prev, [k]: isNaN(v) || v === "" ? v : parseFloat(v) }));

  // Stage D — auto-fill from URL
  const handleUrlSimulate = () => {
    if (!urlInput.trim()) return;
    const simValues = simulateFromUrl(urlInput.trim());
    setForm(simValues);
    setSimulated(true);
    setResult(null);
  };

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
    if (urlInput) doc.text(`URL Analysed: ${urlInput}`, 14, 35);
    doc.setDrawColor(220);
    doc.line(14, 40, 196, 40);
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("Decision Summary", 14, 50);
    doc.setFontSize(11);
    doc.text(`Platform: ${form.platform}`, 14, 58);
    doc.text(`Risk Score: ${result.risk_score}%`, 14, 65);
    doc.text(`Decision: ${actionCfg?.label || result.action}`, 14, 72);
    doc.text(`Anomaly Detected: ${result.anomaly_detected ? "Yes" : "No"}`, 14, 79);
    doc.setFontSize(13);
    doc.text("Account Signals Used", 14, 92);
    let y = 100;
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
                    gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total checks",    value: history.length },
          { label: "Last risk score", value: result ? `${result.risk_score}%` : "—" },
          { label: "Last decision",   value: result ? (actionCfg?.label || result.action) : "—" },
          { label: "Platform",        value: form.platform },
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
        <div className="card" style={{ borderColor: "var(--danger)",
                                       marginBottom: 16, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* ── Stage D: URL Input Bar ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>🔗 Paste a social media URL</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            — auto-fills the form with simulated signals
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setSimulated(false); }}
            placeholder="e.g. https://twitter.com/some_user123"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8,
                     border: "1px solid var(--border)", fontSize: 13 }}
          />
          <button
            onClick={handleUrlSimulate}
            disabled={!urlInput.trim()}
            className="btn-secondary"
            style={{ whiteSpace: "nowrap", padding: "8px 16px" }}>
            ⚡ Auto-fill
          </button>
          {simulated && (
            <button
              onClick={() => { setUrlInput(""); setForm(defaultForm);
                               setSimulated(false); setResult(null); }}
              className="btn-secondary"
              style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
              ✕ Clear
            </button>
          )}
        </div>
        {simulated && (
          <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6,
                        background: "var(--success-light)", color: "var(--success)",
                        fontSize: 12, fontWeight: 500 }}>
            ✅ Form auto-filled from URL — review values below then click Analyse
          </div>
        )}
      </div>

      {/* Toggle: URL mode vs Manual mode */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["Manual entry", "URL simulated"].map((tab, i) => (
          <button key={tab}
            onClick={() => setUrlMode(i === 1)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: urlMode === (i === 1) ? "var(--text-primary)" : "var(--bg-secondary)",
              color: urlMode === (i === 1) ? "#fff" : "var(--text-secondary)"
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>

        {/* Input panel */}
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 14px" }}>
            Account details
            {simulated && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400,
                             color: "var(--success)", background: "var(--success-light)",
                             padding: "2px 8px", borderRadius: 10 }}>
                🔗 from URL
              </span>
            )}
          </p>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Platform</label>
            <select value={form.platform}
              onChange={e => handleChange("platform", e.target.value)}
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
              <p>
                {simulated
                  ? "Form filled from URL — click Analyse account to see results!"
                  : "Fill in the account details and analyse to see results"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
