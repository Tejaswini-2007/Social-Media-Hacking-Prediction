from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import redis
import json
from datetime import datetime
import psycopg2
import os

app = Flask(__name__)
CORS(app)

xgb      = pickle.load(open('ml/xgb_model.pkl',    'rb'))
iso      = pickle.load(open('ml/iso_model.pkl',     'rb'))
scaler   = pickle.load(open('ml/scaler.pkl',        'rb'))
le       = pickle.load(open('ml/label_encoder.pkl', 'rb'))
FEATURES = pickle.load(open('ml/features.pkl',      'rb'))

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
except:
    r = None

def get_db():
    return psycopg2.connect(
        dbname="hackguard", user="postgres",
        password="Tejaswini1031", host="localhost"
    )

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    platform_encoded = le.transform([data.get('platform', 'Twitter')])[0]
    feature_values = [
        platform_encoded,
        data.get('has_profile_pic', 0),
        data.get('bio_length', 0),
        data.get('username_randomness', 0),
        data.get('followers', 0),
        data.get('following', 0),
        data.get('follower_following_ratio', 0.0),
        data.get('account_age_days', 0),
        data.get('posts', 0),
        data.get('posts_per_day', 0.0),
        data.get('caption_similarity_score', 0.0),
        data.get('content_similarity_score', 0.0),
        data.get('follow_unfollow_rate', 0),
        data.get('spam_comments_rate', 0),
        data.get('generic_comment_rate', 0),
        data.get('suspicious_links_in_bio', 0),
        data.get('verified', 0)
    ]
    X = np.array([feature_values])
    X_scaled = scaler.transform(X)
    risk_prob  = xgb.predict_proba(X_scaled)[0][1]
    risk_score = float(round(risk_prob * 100, 2))
    anomaly    = int(iso.predict(X_scaled)[0])
    is_suspicious = risk_score > 70 or anomaly == -1
    if risk_score > 85:
        action = 'BLOCK'
    elif is_suspicious:
        action = 'MFA_REQUIRED'
    else:
        action = 'ALLOW'
    result = {
        'risk_score': risk_score,
        'is_suspicious': is_suspicious,
        'anomaly_detected': anomaly == -1,
        'action': action,
        'timestamp': datetime.utcnow().isoformat()
    }
    user_id = data.get('user_id', 'unknown')
    if r:
    try:
        r.setex(f"prediction:{user_id}", 120, json.dumps(result))
    except:
        pass
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO prediction_logs
            (user_id, platform, risk_score, action, is_suspicious, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, data.get('platform'), risk_score,
              action, is_suspicious, datetime.utcnow()))
        conn.commit()
        cur.close(); conn.close()
    except Exception as e:
        print("DB log error:", e)
    return jsonify(result)

@app.route('/logs', methods=['GET'])
def get_logs():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT user_id, platform, risk_score, action, is_suspicious, timestamp
            FROM prediction_logs
            ORDER BY timestamp DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify([{
            'user_id': row[0],
            'platform': row[1],
            'risk_score': row[2],
            'action': row[3],
            'is_suspicious': row[4],
            'timestamp': str(row[5])
        } for row in rows])
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/history/<user_id>', methods=['GET'])
def get_history(user_id):
    cached = r.get(f"prediction:{user_id}")
    if cached:
        return jsonify({'source': 'cache', 'data': json.loads(cached)})
    return jsonify({'source': 'none', 'data': None})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'models_loaded': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
