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

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

xgb      = pickle.load(open('ml/xgb_model.pkl',    'rb'))
iso      = pickle.load(open('ml/iso_model.pkl',     'rb'))
scaler   = pickle.load(open('ml/scaler.pkl',        'rb'))
le       = pickle.load(open('ml/label_encoder.pkl', 'rb'))
FEATURES = pickle.load(open('ml/features.pkl',      'rb'))

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except:
    r = None

def get_db():
    db_url = os.environ.get("DATABASE_URL")
    print(f"DATABASE_URL found: {bool(db_url)}")  # Debug
    if db_url:
        return psycopg2.connect(db_url)
    return psycopg2.connect(
        dbname="hackguard",
        user="postgres",
        password="Tejaswini1031",
        host="localhost"
    )

# ── DEBUG route — remove after fixing ──
@app.route('/debug', methods=['GET'])
def debug():
    db_url = os.environ.get("DATABASE_URL")
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM prediction_logs")
        count = cur.fetchone()[0]
        cur.close(); conn.close()
        return jsonify({
            'DATABASE_URL_set': bool(db_url),
            'DATABASE_URL_preview': db_url[:30] + '...' if db_url else None,
            'db_connected': True,
            'row_count': count
        })
    except Exception as e:
        return jsonify({
            'DATABASE_URL_set': bool(db_url),
            'DATABASE_URL_preview': db_url[:30] + '...' if db_url else None,
            'db_connected': False,
            'error': str(e)
        })

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
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

    is_suspicious = risk_score > 50 or anomaly == -1
    if risk_score > 75:
        action = 'BLOCKED'
    elif risk_score > 40 or anomaly == -1:
        action = 'NEEDS_MFA'
    else:
        action = 'SAFE'

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
        print("DB insert success!")  # Debug
    except Exception as e:
        print(f"DB log error: {e}")  # Debug
    return jsonify(result)

@app.route('/logs', methods=['GET', 'OPTIONS'])
def get_logs():
    if request.method == 'OPTIONS':
        return jsonify([]), 200
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
        print(f"Logs error: {e}")
        return jsonify([])

@app.route('/history/<user_id>', methods=['GET'])
def get_history(user_id):
    if r:
        try:
            cached = r.get(f"prediction:{user_id}")
            if cached:
                return jsonify({'source': 'cache', 'data': json.loads(cached)})
        except:
            pass
    return jsonify({'source': 'none', 'data': None})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'models_loaded': True})

@app.route('/model-stats', methods=['GET', 'OPTIONS'])
def model_stats():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        with open('ml/model_stats.json', 'r') as f:
            stats = json.load(f)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
