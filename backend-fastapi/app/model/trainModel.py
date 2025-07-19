from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Train model
X, y = load_iris(return_X_y=True)
clf = RandomForestClassifier()
clf.fit(X, y)

# Save model
os.makedirs("model", exist_ok=True)
joblib.dump(clf, "model/model.pkl")
