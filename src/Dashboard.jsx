import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

const API_URL = "https://social-media-hacking-prediction.onrender.com";

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
  has_profile_pic: "Has Profile Pic (0/1)",
  bio_length: "Bio Length",
  username_randomness: "Username Randomness (0/1)",
  followers: "Followers",
  following: "Following",
  follower_following_ratio: "Follower/Following Ratio",
  account_age_days: "Account Age (Days)",
  posts: "Total Posts",
  posts_per_day: "Posts Per Day",
  caption_similarity_score: "Caption Similarity Score",
  content_similarity_score: "Content Similarity Score",
  follow_unfollow_rate: "Follow/Unfollow Rate",
  spam_comments_rate: "Spam Comments Rate",
  generic_comment_rate: "Generic Comment Rate",
  suspicious_links_in_bio: "Suspicious Links in Bio (0/1)",
  verified: "Verified (0/1)",
};

export default function Dashboard() {
  const [form, setForm]       = useState(defaultForm);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);

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
      setHistory(prev => [res.data, ...prev].slice(0, 5));
    } catch (e) {
      setError("Cannot connect to Flask API — make sure the backend is running.");
    }
    setLoading(false);
  };

  const actionColor =
    result?.action === "ALLOW"        ? "#16a34a" :
    result?.action === "MFA_REQUIRED" ? "#d97706" : "#dc2626";

  const pieData = result ? [
    { name: "Risk", value: result.risk_score },
    { name: "Safe", value: parseFloat((100 - result.risk_score).toFixed(2)) }
  ] : [];

  const PIE_COLORS = ["#dc2626", "#16a34a"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5",
                      borderRadius: 8, padding: "12px 16px", marginBottom: 16,
                      color: "#dc2626" }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#1e293b" }}>
            Account Details
          </h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>
              Platform
            </label>
            <select value={form.platform}
              onChange={e => handleChange("platform", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6,
                       border: "1px solid #e2e8f0", fontSize: 14 }}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(FIELD_LABELS).map(([k, label]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: "#64748b",
                                display: "block", marginBottom: 3 }}>
                  {label}
                </label>
                <input type="number" step="any" value={form[k]}
                  onChange={e => handleChange(k, e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: 6,
                           border: "1px solid #e2e8f0", fontSize: 13,
                           boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <button onClick={handlePredict} disabled={loading}
            style={{ marginTop: 20, width: "100%", padding: "12px",
                     background: loading ? "#94a3b8" : "#1e293b",
                     color: "#fff", border: "none", borderRadius: 8,
                     fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                     fontWeight: 600 }}>
            {loading ? "Analysing..." : "🔍 Analyse Account"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {result ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Risk Score", value: `${result.risk_score}%`, color: actionColor },
                  { label: "Decision",   value: result.action,           color: actionColor },
                  { label: "Anomaly",    value: result.anomaly_detected ? "YES" : "NO",
                    color: result.anomaly_detected ? "#dc2626" : "#16a34a" }
                ].map(card => (
                  <div key={card.label}
                    style={{ background: "#fff", borderRadius: 10, padding: 16,
                             boxShadow: "0 1px 4px rgba(0,0,0,0.08)", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: 16,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Risk Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: 16,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            borderLeft: `4px solid ${actionColor}` }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>Recommended Action</h3>
                {result.action === "BLOCK" && (
                  <p style={{ margin: 0, color: "#dc2626" }}>
                    🚫 Account blocked — highly suspicious activity detected.
                  </p>
                )}
                {result.action === "MFA_REQUIRED" && (
                  <p style={{ margin: 0, color: "#d97706" }}>
                    🔐 MFA required — additional verification needed.
                  </p>
                )}
                {result.action === "ALLOW" && (
                  <p style={{ margin: 0, color: "#16a34a" }}>
                    ✅ Account allowed — activity looks normal.
                  </p>
                )}
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>
                  Checked at: {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
              {history.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 12, padding: 16,
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Recent Checks</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={history.map((h, i) => ({
                      name: `#${history.length - i}`, risk: h.risk_score
                    }))}>
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="risk" fill="#1e293b" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, padding: 40,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                          textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p>Fill in the account details and click<br />
                <strong>Analyse Account</strong> to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
