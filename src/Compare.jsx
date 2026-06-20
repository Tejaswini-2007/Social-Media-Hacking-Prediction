import { useState } from "react";
import axios from "axios";
import { useAlerts } from "./AlertsContext";

const PLATFORMS = ["Twitter", "Instagram", "Facebook", "LinkedIn"];

const blankAccount = {
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

function AccountForm({ label, form, setForm }) {
  const handleChange = (k, v) =>
    setForm(prev => ({ ...prev, [k]: isNaN(v) || v === "" ? v : parseFloat(v) }));

  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>{label}</p>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Platform</label>
        <select value={form.platform} onChange={e => handleChange("platform", e.target.value)} style={{ marginTop: 3 }}>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {Object.entries(FIELD_LABELS).map(([k, lbl]) => (
          <div key={k}>
            <label style={{ fontSize: 10, color: "var(--text-secondary)" }}>{lbl}</label>
            <input type="number" step="any" value={form[k]}
              onChange={e => handleChange(k, e.target.value)}
              style={{ marginTop: 2, fontSize: 12, padding: "6px 8px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Compare() {
  const [formA, setFormA] = useState({ ...blankAccount });
  const [formB, setFormB] = useState({ ...blankAccount, followers: 50, following: 900, spam_comments_rate: 90 });
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { pushAlert } = useAlerts();
  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        axios.post("http://localhost:5000/predict", { ...formA, user_id: "compare_a" }),
        axios.post("http://localhost:5000/predict", { ...formB, user_id: "compare_b" }),
      ]);
      setResultA(resA.data);
      setResultB(resB.data);
      pushAlert(resA.data, "Compare A");
      pushAlert(resB.data, "Compare B");
    } catch (e) {
      setError("Cannot connect to Flask API — make sure it is running on port 5000");
    }
    setLoading(false);
  };

  const statusColor = (action) =>
    action === "ALLOW" ? "success" : action === "MFA_REQUIRED" ? "warning" : "danger";

  const renderResult = (label, result) => {
    if (!result) return (
      <div className="card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 20 }}>
        No result yet
      </div>
    );
    const color = statusColor(result.action);
    return (
      <div className="card" style={{ background: `var(--${color}-light)`, borderColor: `var(--${color})` }}>
        <p style={{ fontSize: 12, color: `var(--${color})`, margin: "0 0 4px" }}>{label} — decision</p>
        <p style={{ fontSize: 18, fontWeight: 600, color: `var(--${color})`, margin: 0 }}>
          {result.action.replace("_", " ")}
        </p>
        <p style={{ fontSize: 26, fontWeight: 600, color: `var(--${color})`, margin: "6px 0 0" }}>
          {result.risk_score}%
        </p>
      </div>
    );
  };

  const winner = resultA && resultB
    ? (resultA.risk_score > resultB.risk_score ? "Account A is riskier" :
       resultB.risk_score > resultA.risk_score ? "Account B is riskier" : "Both accounts carry equal risk")
    : null;

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>Compare two accounts</p>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <AccountForm label="Account A" form={formA} setForm={setFormA} />
        <AccountForm label="Account B" form={formB} setForm={setFormB} />
      </div>

      <button onClick={handleCompare} disabled={loading} className="btn-primary" style={{ width: "100%", marginBottom: 16 }}>
        {loading ? "Comparing…" : "⚖️ Compare accounts"}
      </button>

      {(resultA || resultB) && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
            {renderResult("Account A", resultA)}
            {renderResult("Account B", resultB)}
          </div>
          {winner && (
            <div className="card" style={{ textAlign: "center", fontWeight: 600 }}>
              {winner}
            </div>
          )}
        </>
      )}
    </div>
  );
}