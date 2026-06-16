CREATE TABLE prediction_logs (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(100),
    platform        VARCHAR(50),
    risk_score      FLOAT,
    action          VARCHAR(30),
    is_suspicious   BOOLEAN,
    timestamp       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_id ON prediction_logs(user_id);
CREATE INDEX idx_timestamp ON prediction_logs(timestamp);
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prediction_logs';

SELECT column_name || ' → ' || data_type AS table_structure
FROM information_schema.columns 
WHERE table_name = 'prediction_logs'
ORDER BY ordinal_position;

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
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'threat_logs'
ORDER BY ordinal_position;