import numpy as np
import matplotlib.pyplot as plt
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# Generate a simple dataset
np.random.seed(42)
X = 2 * np.random.rand(100, 1)  # Feature
y = 4 + 3 * X + np.random.randn(100, 1)  # Target with some noise

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and train the linear regression model
model = LinearRegression()
model.fit(X_train, y_train)

# Save the trained model using Pickle
with open("test_model.pkl", "wb") as file:
    pickle.dump(model, file)
print("Model saved as 'test_model.pkl'")

# Generate a validation dataset (test dataset)
validation_data = {
    "X": X_test.flatten().tolist(),  # Convert numpy array to list
    "y": y_test.flatten().tolist()   # Convert numpy array to list
}

# Save the validation dataset as a .json file
with open("validation_dataset.json", "w") as json_file:
    json.dump(validation_data, json_file, indent=4)
print("Validation dataset saved as 'validation_dataset.json'")

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("Mean Squared Error:", mse)
print("R-squared:", r2)

# Plot the results
plt.scatter(X_test, y_test, color="blue", label="Actual")
plt.plot(X_test, y_pred, color="red", linewidth=2, label="Predicted")
plt.title("Linear Regression Model")
plt.xlabel("Feature")
plt.ylabel("Target")
plt.legend()
plt.show()