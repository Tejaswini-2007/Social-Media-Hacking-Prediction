import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_URL = "https://social-media-hacking-prediction.onrender.com";

const COLORS = {
  BLOCK: "#dc2626",
  MFA_REQUIRED: "#d97706",
  ALLOW: "#16a34a"
};

export default function Visualizations() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetchLogs();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
      setLoading(false);
    } catch (e) {
      setError("Cannot fetch logs — make sure Flask is running");
      setLoading(false);
    }
  };

  // ── Derived chart data ──────────────────────────────────

  // 1. Risk score over time (line chart)
  const riskOverTime = logs.map((log, i) => ({
    index: i + 1,
    risk_score: parseFloat(log.risk_score?.toFixed(2) || 0),
    timestamp: new Date(log.timestamp).toLocaleTimeString()
  })).reverse();

  // 2. Action distribution (pie chart)
  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});
  const actionPieData = Object.entries(actionCounts).map(([name, value]) => ({
    name, value
  }));

  // 3. Platform distribution (bar chart)
  const platformCounts = logs.reduce((acc, log) => {
    acc[log.platform] = (acc[log.platform] || 0) + 1;
    return acc;
  }, {});
  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    platform: name, count: value
  }));

  // 4. Risk score distribution buckets
  const buckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  logs.forEach(log => {
    const s = log.risk_score;
    if (s <= 25)       buckets["0-25"]++;
    else if (s <= 50)  buckets["26-50"]++;
    else if (s <= 75)  buckets["51-75"]++;
    else               buckets["76-100"]++;
  });
  const bucketData = Object.entries(buckets).map(([range, count]) => ({
    range, count
  }));

  // 5. Suspicious vs normal (scatter)
  const scatterData = logs.map((log, i) => ({
    index: i + 1,
    risk_score: parseFloat(log.risk_score?.toFixed(2) || 0),
    suspicious: log.is_suspicious ? 1 : 0
  }));

  const suspiciousCount = logs.filter(l => l.is_suspicious).length;
  const blockedCount    = logs.filter(l => l.action === "BLOCK").length;
  const avgRisk         = logs.length
    ? (logs.reduce((a, l) => a + (l.risk_score || 0), 0) / logs.length).toFixed(1)
    : 0;

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
      Loading visualizations...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 60, color: "#dc2626" }}>
      ⚠️ {error}
    </div>
  );

  if (logs.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
      <div style={{ fontSize: 48 }}>📊</div>
      <p>No logs yet — analyse some accounts first to see visualizations!</p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>

      <h2 style={{ margin: "0 0 20px", color: "#1e293b" }}>
        📊 Login Patterns & Anomaly Visualizations
      </h2>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Checks",     value: logs.length,       color: "#1e293b" },
          { label: "Suspicious",       value: suspiciousCount,   color: "#d97706" },
          { label: "Blocked",          value: blockedCount,       color: "#dc2626" },
          { label: "Avg Risk Score",   value: `${avgRisk}%`,     color: "#7c3aed" }
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

      {/* Row 1 — Line chart + Pie chart */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr",
                    gap: 16, marginBottom: 16 }}>

        {/* Risk score over time */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
            Risk Score Over Time
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={riskOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="index" label={{ value: "Check #", position: "insideBottom", offset: -2 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, "Risk Score"]}
                labelFormatter={(l) => `Check #${l}`}
              />
              <Line type="monotone" dataKey="risk_score"
                stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }}
                activeDot={{ r: 5 }} />
              {/* Danger threshold line */}
              <Line type="monotone" data={riskOverTime.map(d => ({ ...d, threshold: 70 }))}
                dataKey="threshold" stroke="#f97316" strokeDasharray="5 5"
                strokeWidth={1} dot={false} name="Danger Threshold" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Action distribution pie */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
            Action Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={actionPieData} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                   `${name} ${(percent * 100).toFixed(0)}%`}>
                {actionPieData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — Bar charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 16, marginBottom: 16 }}>

        {/* Platform distribution */}
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

        {/* Risk score distribution */}
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
                {bucketData.map((entry, i) => (
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

      {/* Row 3 — Anomaly scatter + logs table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Scatter plot */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>
            Anomaly Detection Scatter
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8" }}>
            1 = Suspicious, 0 = Normal
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="index" name="Check #" />
              <YAxis dataKey="risk_score" name="Risk Score" domain={[0, 100]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData.filter(d => d.suspicious === 1)}
                name="Suspicious" fill="#dc2626" />
              <Scatter data={scatterData.filter(d => d.suspicious === 0)}
                name="Normal" fill="#16a34a" />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
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
                  {["Platform", "Risk %", "Action", "Time"].map(h => (
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
                                 color: log.risk_score > 70 ? "#dc2626" : "#16a34a",
                                 fontWeight: 600 }}>
                      {log.risk_score?.toFixed(1)}%
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 11,
                                     background: COLORS[log.action] + "20",
                                     color: COLORS[log.action] }}>
                        {log.action}
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
      </div>
    </div>
  );
}
