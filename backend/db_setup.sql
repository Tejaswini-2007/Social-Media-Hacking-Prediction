CREATE TABLE IF NOT EXISTS prediction_logs (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(100),
    platform        VARCHAR(50),
    risk_score      FLOAT,
    action          VARCHAR(30),
    is_suspicious   BOOLEAN,
    timestamp       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    platform VARCHAR(50),
    risk_score FLOAT,
    action VARCHAR(30),
    is_suspicious BOOLEAN,
    feature_data TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
