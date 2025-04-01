from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import pickle
import requests
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

app = Flask(__name__)
CORS(app)

# IPFS Configuration
IPFS_API_URL = "http://127.0.0.1:5001/api/v0"

# Helper functions (reuse from your original code)
def fetch_model_from_ipfs(file_hash):
    response = requests.post(f"{IPFS_API_URL}/cat?arg={file_hash}")
    if response.status_code == 200:
        return pickle.loads(response.content)
    else:
        raise Exception(f"Failed to fetch model from IPFS: {response.status_code} - {response.text}")

def fetch_test_dataset(test_dataset_hash):
    response = requests.post(f"{IPFS_API_URL}/cat?arg={test_dataset_hash}")
    if response.status_code == 200:
        return json.loads(response.text)
    else:
        raise Exception(f"Failed to fetch test dataset from IPFS: {response.status_code} - {response.text}")

def evaluate_model(model, test_dataset):
    X_test = np.array(test_dataset["X"]).reshape(-1, 1)  # Ensure a 2D array for a single feature
    y_test = np.array(test_dataset["y"])
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    return mse

@app.route('/calculate-training-value', methods=['POST'])
def calculate_training_value():
    try:
        #Parse the request data
        data = request.json
        model_id = data.get('modelId')
        global_model_hash = data.get('globalModelHash')
        updated_model_hash = data.get('updatedModelHash')
        test_dataset_hash = data.get('testDatasetHash')
        
        # Fetch the models and test dataset from IPFS
        global_model = fetch_model_from_ipfs(global_model_hash)
        updated_model = fetch_model_from_ipfs(updated_model_hash)
        test_dataset = fetch_test_dataset(test_dataset_hash)
        
        # Evaluate both models
        global_mse = evaluate_model(global_model, test_dataset)
        updated_mse = evaluate_model(updated_model, test_dataset)
        
        # Calculate improvement
        improvement = global_mse - updated_mse
        
        # Calculate training value
        training_value = max(0, int(improvement * 1000))  # Scale up and ensure positive
        
        # return jsonify({
        #     'trainingValue': training_value,
        #     'globalMSE': global_mse,
        #     'updatedMSE': updated_mse,
        #     'improvement': improvement,
        #     'shouldUpdate': improvement > 0
        # })

        # Added for testing purpose
        return jsonify({
            "globalMSE": 1.5,
            "improvement": 1,
            "shouldUpdate": True,
            "trainingValue": 10,
            "updatedMSE": 1.2
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)