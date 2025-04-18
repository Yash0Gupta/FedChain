# Federated Learning Reward System

This project is a decentralized federated learning reward system where users (trainers) can host machine learning models, train them with updated data, and earn rewards based on the improvement in performance. The platform integrates blockchain (using a smart contract written in Solidity), IPFS for decentralized file storage, and a Flask aggregator API for evaluating training value. The frontend is built with React using Create React App.

## Functionalities

- **Host a New Model:**  
  Users can host a model by providing its name, description, model file (pickle, joblib, or h5), and a test dataset (CSV or JSON). The model is uploaded to IPFS and registered on the blockchain with an initial reward pool.

- **Train a Model:**  
  Trainers can upload a new version of a hosted model. The backend aggregator API fetches the current global model and evaluates the updated model using an IPFS-stored test dataset. Based on the improvement in performance, a training value is calculated and, if positive, the smart contract rewards the trainer accordingly and updates the model on-chain.

- **Manage Models:**  
  Model owners can deactivate or take down models. They can also add extra funds to the reward pool.

- **Blockchain and IPFS Integration:**  
  The smart contract (Solidity) manages model data and rewards on a local blockchain (Ganache). IPFS is used for decentralized storage of model files and datasets.

## 🎥 Video Demonstration

Watch the full project Demonstration here:  

https://github.com/user-attachments/assets/e05ffb15-e338-4526-aea1-b8cbd7c218bc

## Prerequisites

- **Metamask Wallet:**  
  Create a MetaMask wallet and configure it to connect to your local blockchain network (e.g., Ganache).

- **Ganache:**  
  Download and start Ganache to run a local blockchain. Link Ganache to MetaMask by importing the network details.

- **IPFS:**  
  Install and start IPFS on your machine (ensure the IPFS daemon is running on `http://127.0.0.1:5001`). Configure the IPFS client if necessary.

## How to Run the Project

1. **Clone the Repository and Install Dependencies:**
   - Open a terminal in the project directory and run:
     ```
     npm install
     ```

2. **Start Ganache and Configure MetaMask:**
   - Start Ganache.
   - In MetaMask, add a Custom RPC network with RPC URL `http://127.0.0.1:8545` (or your Ganache endpoint).
   - Import or create an account in MetaMask with funds from Ganache.

3. **Start the IPFS Daemon:**
   - Open a terminal and run:
     ```
     ipfs daemon
     ```
   - Verify that IPFS is running on `http://127.0.0.1:5001`.

4. **Deploy the Smart Contract:**
   - Ensure the smart contract (located in `src/resources/FederatedLearning.sol`) is compiled and deployed to your Ganache network.
   - Update the contract address in `src/contracts/FederatedLearning.js` if necessary.

5. **Start the Aggregator API:**
   - Navigate to the aggregator API directory (if separate) or run the API using:
     ```
     python src/aggregator_module/aggAPI.py
     ```
   - The API should run on port 5002 by default.

6. **Start the React App:**
   - In the project root, run:
     ```
     npm start
     ```
   - This will launch the frontend at [http://localhost:3000](http://localhost:3000).

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ganache Documentation](https://trufflesuite.com/ganache/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Contributors

- **Yash Gupta** - [yash.cs21@bmsce.ac.in](mailto:yash.cs21@bmsce.ac.in)

Happy federated learning!
