from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Load models
xgb     = pickle.load(open('ml/xgb_model.pkl', 'rb'))
iso     = pickle.load(open('ml/iso_model.pkl', 'rb'))
scaler  = pickle.load(open('ml/scaler.pkl',    'rb'))
le      = pickle.load(open('ml/label_encoder.pkl', 'rb'))

@app.route('/api/predict', methods=['POST'])
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

    return jsonify({
        'risk_score': risk_score,
        'is_suspicious': is_suspicious,
        'anomaly_detected': anomaly == -1,
        'action': action,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
