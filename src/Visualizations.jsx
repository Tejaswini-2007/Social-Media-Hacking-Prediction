import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_URL = "https://social-media-hacking-prediction-1.onrender.com";

const COLORS = {
  BLOCKED:   "#dc2626",
  NEEDS_MFA: "#d97706",
  SAFE:      "#16a34a"
};

// ── Correlation Heatmap ──────────────────────────────────
function CorrelationHeatmap({ labels, matrix }) {
  const SHORT = {
    platform_encoded: "Platform", has_profile_pic: "Pic",
    bio_length: "Bio Len", username_randomness: "Rndm",
    followers: "Followers", following: "Following",
    follower_following_ratio: "F/F Ratio", account_age_days: "Age",
    posts: "Posts", posts_per_day: "PPD",
    caption_similarity_score: "Cap Sim", content_similarity_score: "Cont Sim",
    follow_unfollow_rate: "FU Rate", spam_comments_rate: "Spam",
    generic_comment_rate: "Generic", suspicious_links_in_bio: "Susp Links",
    verified: "Verified", is_fake: "Is Fake"
  };
  const short = labels.map(l => SHORT[l] || l);
  const size = 28;
  const labelW = 70;
  const topH = 70;
  const W = labelW + size * labels.length;
  const H = topH + size * labels.length;

  const getColor = (val) => {
    if (val === null || val === undefined) return "#e2e8f0";
    const v = Math.max(-1, Math.min(1, val));
    if (v > 0) return `rgba(37,99,235,${Math.abs(v)})`;
    if (v < 0) return `rgba(220,38,38,${Math.abs(v)})`;
    return "#f8fafc";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ fontFamily: "sans-serif" }}>
        {/* Top labels */}
        {short.map((lbl, i) => (
          <text key={i}
            x={labelW + i * size + size / 2}
            y={topH - 4}
            textAnchor="end"
            fontSize={8}
            fill="#475569"
            transform={`rotate(-45, ${labelW + i * size + size / 2}, ${topH - 4})`}>
            {lbl}
          </text>
        ))}
        {/* Left labels */}
        {short.map((lbl, i) => (
          <text key={i}
            x={labelW - 4}
            y={topH + i * size + size / 2 + 3}
            textAnchor="end"
            fontSize={8}
            fill="#475569">
            {lbl}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((val, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={labelW + j * size}
                y={topH + i * size}
                width={size - 1}
                height={size - 1}
                fill={getColor(val)}
                rx={2}
              />
              {Math.abs(val) > 0.3 && (
                <text
                  x={labelW + j * size + size / 2}
                  y={topH + i * size + size / 2 + 3}
                  textAnchor="middle"
                  fontSize={7}
                  fill={Math.abs(val) > 0.6 ? "#fff" : "#1e293b"}>
                  {val.toFixed(2)}
                </text>
              )}
            </g>
          ))
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8,
                    marginTop: 8, fontSize: 11, color: "#64748b" }}>
        <div style={{ width: 16, height: 16, background: "rgba(220,38,38,0.8)",
                      borderRadius: 2 }} />
        <span>Negative</span>
        <div style={{ width: 16, height: 16, background: "#f8fafc",
                      border: "1px solid #e2e8f0", borderRadius: 2 }} />
        <span>Zero</span>
        <div style={{ width: 16, height: 16, background: "rgba(37,99,235,0.8)",
                      borderRadius: 2 }} />
        <span>Positive</span>
      </div>
    </div>
  );
}

// ── Confusion Matrix ─────────────────────────────────────
function ConfusionMatrix({ labels, matrix }) {
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const cellColors = ["#16a34a", "#dc2626", "#d97706", "#16a34a"];

  return (
    <div>
      <div style={{ display: "grid",
                    gridTemplateColumns: `80px repeat(${labels.length}, 1fr)`,
                    gap: 4 }}>
        <div />
        {labels.map(l => (
          <div key={l} style={{ textAlign: "center", fontSize: 12,
                                fontWeight: 600, color: "#64748b",
                                padding: "4px 0" }}>
            Pred: {l}
          </div>
        ))}
        {matrix.map((row, i) => (
          <>
            <div key={`label-${i}`}
              style={{ display: "flex", alignItems: "center",
                       fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              Act: {labels[i]}
            </div>
            {row.map((val, j) => (
              <div key={`${i}-${j}`}
                style={{ background: cellColors[i * labels.length + j] + "20",
                         border: `2px solid ${cellColors[i * labels.length + j]}`,
                         borderRadius: 8, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700,
                              color: cellColors[i * labels.length + j] }}>
                  {val}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                  {total > 0 ? ((val / total) * 100).toFixed(1) : 0}%
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  {i === j ? "✓ Correct" : "✗ Wrong"}
                </div>
              </div>
            ))}
          </>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 16,
                    fontSize: 12, color: "#64748b" }}>
        {(() => {
          const tn = matrix[0]?.[0] || 0;
          const fp = matrix[0]?.[1] || 0;
          const fn = matrix[1]?.[0] || 0;
          const tp = matrix[1]?.[1] || 0;
          const acc = total > 0 ? (((tp + tn) / total) * 100).toFixed(1) : 0;
          const prec = (tp + fp) > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : 0;
          const rec = (tp + fn) > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : 0;
          return (
            <>
              <span>Accuracy: <strong>{acc}%</strong></span>
              <span>Precision: <strong>{prec}%</strong></span>
              <span>Recall: <strong>{rec}%</strong></span>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function Visualizations() {
  const [logs, setLogs]         = useState([]);
  const [modelStats, setStats]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchLogs(), fetchStats()]);
    setLoading(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
    } catch (e) {
      setError("Cannot fetch logs");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/model-stats`);
      setStats(res.data);
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  };

  // Derived data
  const riskOverTime = [...logs].reverse().map((log, i) => ({
    index: i + 1,
    risk_score: parseFloat(log.risk_score?.toFixed(2) || 0),
  }));

  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});
  const actionPieData = Object.entries(actionCounts).map(([name, value]) => ({ name, value }));

  const platformCounts = logs.reduce((acc, log) => {
    acc[log.platform] = (acc[log.platform] || 0) + 1;
    return acc;
  }, {});
  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    platform: name, count: value
  }));

  const buckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  logs.forEach(log => {
    const s = log.risk_score;
    if (s <= 25) buckets["0-25"]++;
    else if (s <= 50) buckets["26-50"]++;
    else if (s <= 75) buckets["51-75"]++;
    else buckets["76-100"]++;
  });
  const bucketData = Object.entries(buckets).map(([range, count]) => ({ range, count }));

  const suspiciousCount = logs.filter(l => l.is_suspicious).length;
  const blockedCount    = logs.filter(l => l.action === "BLOCKED").length;
  const avgRisk         = logs.length
    ? (logs.reduce((a, l) => a + (l.risk_score || 0), 0) / logs.length).toFixed(1) : 0;

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
      Loading visualizations...
    </div>
  );

  const tabStyle = (tab) => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 13,
    background: activeTab === tab ? "#1e293b" : "#f1f5f9",
    color: activeTab === tab ? "#fff" : "#64748b"
  });

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 16px", color: "#1e293b" }}>
        📊 Login Patterns & Anomaly Visualizations
      </h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button style={tabStyle("live")}    onClick={() => setActiveTab("live")}>
          🔴 Live Analytics
        </button>
        <button style={tabStyle("model")}   onClick={() => setActiveTab("model")}>
          🧠 Model Stats
        </button>
      </div>

      {/* ── LIVE ANALYTICS TAB ── */}
      {activeTab === "live" && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Checks",   value: logs.length,     color: "#1e293b" },
              { label: "Suspicious",     value: suspiciousCount, color: "#d97706" },
              { label: "Blocked",        value: blockedCount,    color: "#dc2626" },
              { label: "Avg Risk Score", value: `${avgRisk}%`,  color: "#7c3aed" }
            ].map(card => (
              <div key={card.label}
                style={{ background: "#fff", borderRadius: 10, padding: 16,
                         boxShadow: "0 1px 4px rgba(0,0,0,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr",
                        gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
                Risk Score Over Time
              </h3>
              {logs.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
                  No data yet — analyse some accounts first!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={riskOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="index" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, "Risk Score"]} />
                    <Line type="monotone" dataKey="risk_score"
                      stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
                Decision Distribution
              </h3>
              {actionPieData.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={actionPieData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={80}
                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {actionPieData.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
                Checks by Platform
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="platform" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e293b" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
                Risk Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bucketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={4}>
                    {bucketData.map((_, i) => (
                      <Cell key={i} fill={
                        i === 0 ? "#16a34a" : i === 1 ? "#d97706" :
                        i === 2 ? "#f97316" : "#dc2626"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent logs table */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
              Recent Activity Log
            </h3>
            <div style={{ overflowY: "auto", maxHeight: 220 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Platform", "Risk %", "Decision", "Time"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left",
                                          borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px 8px" }}>{log.platform}</td>
                      <td style={{ padding: "6px 8px",
                                   color: log.risk_score > 75 ? "#dc2626" :
                                          log.risk_score > 40 ? "#d97706" : "#16a34a",
                                   fontWeight: 600 }}>
                        {log.risk_score?.toFixed(1)}%
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11,
                                       background: (COLORS[log.action] || "#94a3b8") + "20",
                                       color: COLORS[log.action] || "#94a3b8",
                                       fontWeight: 600 }}>
                          {log.action === "SAFE" ? "✅ Safe" :
                           log.action === "NEEDS_MFA" ? "🔐 Needs MFA" :
                           log.action === "BLOCKED" ? "🚫 Blocked" : log.action}
                        </span>
                      </td>
                      <td style={{ padding: "6px 8px", color: "#94a3b8" }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MODEL STATS TAB ── */}
      {activeTab === "model" && (
        <>
          {!modelStats ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              ⚠️ Could not load model stats — make sure model_stats.json exists in ml/
            </div>
          ) : (
            <>
              {/* Confusion Matrix */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#1e293b" }}>
                  🔲 Confusion Matrix
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>
                  How well the model classifies Real vs Fake accounts on the test set
                </p>
                <ConfusionMatrix
                  labels={modelStats.confusion_matrix.labels}
                  matrix={modelStats.confusion_matrix.matrix}
                />
              </div>

              {/* Correlation Heatmap */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#1e293b" }}>
                  🌡️ Feature Correlation Matrix
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>
                  Blue = positive correlation, Red = negative correlation, intensity = strength
                </p>
                <CorrelationHeatmap
                  labels={modelStats.correlation_matrix.labels}
                  matrix={modelStats.correlation_matrix.matrix}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
