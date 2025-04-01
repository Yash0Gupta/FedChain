import numpy as np
import pickle

# Load the existing model from the pickle file
with open("test_model.pkl", "rb") as file:
    model = pickle.load(file)

print("Loaded model:", model)

# Example new training data
X_new_train = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])  # New feature data
y_new_train = np.array([[7.0], [10.0], [13.0], [16.0], [19.0]])  # New target data

# Train the model on the new data
model.fit(X_new_train, y_new_train)

# Save the updated model as a new pickle file
with open("updated_model.pkl", "wb") as file:
    pickle.dump(model, file)

print("Updated model saved as 'updated_model.pkl'")

# Example input data for predictions
X_new = np.array([[1.5], [2.5], [3.5]])

# Make predictions using the updated model
predictions = model.predict(X_new)
print("Predictions:", predictions)