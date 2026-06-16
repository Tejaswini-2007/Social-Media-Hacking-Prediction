import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('data/fake_social_media.csv')

print("Shape:", df.shape)
print("\nClass distribution:\n", df['is_fake'].value_counts())
print("\nSample:\n", df.head())

# Plot class distribution
plt.figure(figsize=(5, 4))
df['is_fake'].value_counts().plot(kind='bar', color=['green', 'red'])
plt.title('Fake vs Real Accounts')
plt.xticks([0, 1], ['Fake', 'Real'], rotation=0)
plt.ylabel('Count')
plt.tight_layout()
plt.savefig('data/class_distribution.png')
plt.show()

# Correlation heatmap
plt.figure(figsize=(12, 8))
numeric_df = df.drop(columns=['platform'])
sns.heatmap(numeric_df.corr(), annot=True, fmt='.2f', cmap='coolwarm')
plt.title('Feature Correlation')
plt.tight_layout()
plt.savefig('data/correlation_heatmap.png')
plt.show()

# Feature distributions by is_fake
features = ['followers', 'following', 'spam_comments_rate',
            'follow_unfollow_rate', 'posts_per_day', 'account_age_days']
fig, axes = plt.subplots(2, 3, figsize=(15, 8))
for ax, feat in zip(axes.flatten(), features):
    df.groupby('is_fake')[feat].plot(kind='kde', ax=ax, legend=True)
    ax.set_title(feat)
plt.tight_layout()
plt.savefig('data/feature_distributions.png')
plt.show()