import pandas as pd
import numpy as np
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from imblearn.over_sampling import SMOTE

# Load dataset
df = pd.read_csv('data/fake_social_media.csv')

le = pickle.load(open('ml/label_encoder.pkl', 'rb'))
scaler = pickle.load(open('ml/scaler.pkl', 'rb'))
xgb = pickle.load(open('ml/xgb_model.pkl', 'rb'))

df['platform_encoded'] = le.transform(df['platform'])
df_numeric = df.drop(columns=['platform'])

FEATURES = [
    'platform_encoded', 'has_profile_pic', 'bio_length',
    'username_randomness', 'followers', 'following',
    'follower_following_ratio', 'account_age_days', 'posts',
    'posts_per_day', 'caption_similarity_score',
    'content_similarity_score', 'follow_unfollow_rate',
    'spam_comments_rate', 'generic_comment_rate',
    'suspicious_links_in_bio', 'verified'
]

X = df_numeric[FEATURES]
y = df_numeric['is_fake']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Re-balance train set the same way training did, for a fair confusion matrix on test set
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

X_test_scaled = scaler.transform(X_test)
y_pred = xgb.predict(X_test_scaled)

cm = confusion_matrix(y_test, y_pred).tolist()

# Correlation matrix (numeric features + target)
corr_df = df_numeric[FEATURES + ['is_fake']]
corr_matrix = corr_df.corr().round(3)

correlation_data = {
    "labels": corr_matrix.columns.tolist(),
    "matrix": corr_matrix.values.tolist()
}

stats = {
    "confusion_matrix": {
        "labels": ["Real", "Fake"],
        "matrix": cm
    },
    "correlation_matrix": correlation_data
}

with open('ml/model_stats.json', 'w') as f:
    json.dump(stats, f)

print("✅ model_stats.json generated")
print(json.dumps(stats, indent=2)[:500], "...")