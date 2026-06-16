 HackGuard — Social Media Account Hacking Prediction System

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Flask](https://img.shields.io/badge/Flask-3.0-black)
![XGBoost](https://img.shields.io/badge/XGBoost-Latest-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)
![Redis](https://img.shields.io/badge/Redis-Latest-red)

> An AI-powered full-stack web application that detects fake and hacked social media accounts in real time using machine learning.

 Project Overview

HackGuard is a data science project that predicts whether a social media account is fake or hacked based on behavioral signals such as follower patterns, posting frequency, spam rates, and content similarity. It combines supervised and unsupervised machine learning models with a real-time web dashboard for security analysts.

 Features

-  Real-time risk scoring for social media accounts
-  XGBoost classifier for fake account detection
-  Isolation Forest for anomaly detection
-  Interactive visualization dashboard with charts and graphs
-  Automated decisions — ALLOW / MFA Required / BLOCK
-  PostgreSQL logging of all predictions
-  Redis caching for fast repeated lookups
-  REST API built with Flask

 Machine Learning Models

| Model | Type | Purpose |
|-------|------|---------|
| XGBoost | Supervised | Classify accounts as fake or real |
| Random Forest | Supervised | Backup classifier for validation |
| Isolation Forest | Unsupervised | Detect behavioral anomalies |

 Dataset

- Records: 3,000 social media accounts
- Features: 18 behavioral and structural signals
- Target: `is_fake` (1 = Fake, 0 = Real)
- Class imbalance handled with: SMOTE oversampling

 Key Features Used
| Feature | Description |
|---------|-------------|
| `followers` | Number of followers |
| `following` | Number of accounts followed |
| `follower_following_ratio` | Ratio of followers to following |
| `account_age_days` | Age of the account in days |
| `spam_comments_rate` | Rate of spam comments |
| `content_similarity_score` | How similar posts are to each other |
| `suspicious_links_in_bio` | Whether bio contains suspicious links |
| `follow_unfollow_rate` | Rate of follow/unfollow behavior |

 Tech Stack

 Frontend
- React.js + Vite
- Recharts (data visualization)
- Axios (API calls)

 Backend
- Python Flask (REST API)
- Flask-CORS

 Machine Learning
- XGBoost
- Scikit-learn (Random Forest, Isolation Forest)
- Imbalanced-learn (SMOTE)
- Pandas, NumPy

 Database & Cache
- PostgreSQL (prediction logs)
- Redis (real-time caching)

 Project Structure
social-hack-predictor/
├── backend/         ← Flask API
├── ml/              ← ML model training scripts
├── frontend/        ← React dashboard
├── data/            ← Sample datasets
└── docker-compose.yml

---

 Setup Instructions

 Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis

 1. Clone the repository
```bash
git clone https://github.com/Tejaswini-2007/Social-Media-Hacking-Prediction.git
cd Social-Media-Hacking-Prediction
```

 2. Set up Python environment
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

 3. Set up PostgreSQL
Create a database called `hackguard` and run:
```sql
CREATE TABLE prediction_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    platform VARCHAR(50),
    risk_score FLOAT,
    action VARCHAR(30),
    is_suspicious BOOLEAN,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

 4. Train ML models
```bash
python ml/train_model.py
```

 5. Start Redis server
```bash
Redis\redis-server.exe
```

 6. Run Flask API
```bash
python backend/app.py
```

 7. Run React frontend
```bash
cd frontend
npm install
npm run dev
```

 8. Open in browser
     http://localhost:5173/
---

How It Works
User enters account details

↓

Flask API receives request

↓

XGBoost predicts risk score

Isolation Forest detects anomalies

↓

Result cached in Redis (120 seconds)

Result logged to PostgreSQL

↓

Dashboard shows BLOCK / MFA / ALLOW

with risk score and visualizations


