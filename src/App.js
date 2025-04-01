import React, { useState, useEffect } from 'react';
import getWeb3 from './utils/web3';
import getContract from './contracts/FederatedLearning';
import { create } from 'ipfs-http-client';

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [models, setModels] = useState([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [trainedModels, setTrainedModels] = useState([]);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [rewardPool, setRewardPool] = useState('');
  const [testDataset, setTestDataset] = useState(null); // New state for test dataset
  const [additionalFunds, setAdditionalFunds] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modelFile, setModelFile] = useState(null);
  const [updatedFile, setUpdatedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const ipfs = create({ url: 'http://127.0.0.1:5001' });

  // Initialize web3, contract, and account
  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        const accounts = await web3Instance.eth.getAccounts();
        const contractInstance = await getContract(web3Instance);

        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(accounts[0]);

        // Fetch trainer info and models after setting up
        await fetchTrainerInfo(accounts[0], contractInstance);
        await fetchModels(contractInstance);
      } catch (error) {
        console.error("Could not connect to contract or blockchain network.", error);
        setErrorMessage("Blockchain connection failed.");
      }
    };

    init();

    // // Refresh model list periodically
    // const interval = setInterval(() => {
    //   if (contract) fetchModels(contract);
    // }, 10000);

    // return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [contract]); // Dependency on contract

  const fetchModels = async (contractInstance = contract) => {
    if (!contractInstance) return;
    setIsLoading(true);

    try {
      const modelCount = await contractInstance.methods.modelCount().call();
      const modelList = [];

      for (let i = 1; i <= modelCount; i++) {
        const model = await contractInstance.methods.models(i).call();
        if (model.isActive) {
          modelList.push({ id: i, ...model });
        }
      }

      setModels(modelList);
    } catch (error) {
      console.error("Error fetching models:", error);
      setErrorMessage("Error fetching models.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrainerInfo = async () => {
    if (!contract) return;

    try {
      const response = await contract.methods.getTrainerInfo(account).call();
      const rewards = response['0'];
      const modelsTrained = response['1'];

      setTotalRewards(web3.utils.fromWei(rewards.toString(), 'ether'));
      setTrainedModels(modelsTrained.map((modelId) => modelId.toString()));
    } catch (error) {
      console.error("Error fetching trainer info:", error);
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await ipfs.add(file);
      return added.path; // Return the IPFS hash
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
      throw new Error("Failed to upload file to IPFS.");
    }
  };

  const hostModel = async () => {
    if (!modelFile || !testDataset || !modelName.trim() || !modelDescription.trim() || !rewardPool) {
      setErrorMessage("Please provide all required details.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Upload model file to IPFS
      const modelFileHash = await uploadToIPFS(modelFile);

      // Upload test dataset to IPFS
      const testDatasetHash = await uploadToIPFS(testDataset);

      // Call the smart contract to host the model
      await contract.methods.createModel(modelName, modelDescription, modelFileHash, testDatasetHash).send({
        from: account,
        value: web3.utils.toWei(rewardPool, 'ether'),
      });

      setModelName('');
      setModelDescription('');
      setRewardPool('');
      setModelFile(null);
      setTestDataset(null); // Reset test dataset
      setSuccessMessage('Model hosted successfully!');
      fetchModels();
    } catch (error) {
      console.error("Error hosting model:", error);
      setErrorMessage("Error hosting model.");
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateModel = async (modelId) => {
    try {
      await contract.methods.deactivateModel(modelId).send({ from: account });
      fetchModels();
    } catch (error) {
      console.error("Error deactivating model:", error);
      setErrorMessage("Error deactivating model.");
    }
  };

  const takeDownModel = async (modelId) => {
    try {
      await contract.methods.takeDownModel(modelId).send({ from: account });
      fetchModels();
    } catch (error) {
      console.error("Error taking down model:", error);
      setErrorMessage("Error taking down model.");
    }
  };

  const addFundsToModel = async (modelId) => {
    if (!additionalFunds) {
      setErrorMessage("Please specify the amount of funds to add.");
      return;
    }

    try {
      await contract.methods.addToRewardPool(modelId).send({
        from: account,
        value: web3.utils.toWei(additionalFunds, 'ether'),
      });
      setAdditionalFunds('');
      fetchModels();
    } catch (error) {
      console.error("Error adding funds to model:", error);
      setErrorMessage("Error adding funds to model.");
    }
  };

  // const trainModel = async (modelId) => {
  //   if (!updatedFile) {
  //     setErrorMessage("Please upload the updated model file.");
  //     return;
  //   }

  //   try {
  //     const updatedFileHash = await uploadToIPFS(updatedFile);
  //     await contract.methods.trainModel(modelId, updatedFileHash).send({ from: account });
  //     setUpdatedFile(null);
  //     fetchTrainerInfo();
  //     fetchModels();
  //   } catch (error) {
  //     console.error("Error training model:", error);
  //     setErrorMessage("Error training model.");
  //   }
  // };

  const trainModel = async (modelId) => {
    if (!updatedFile) {
      setErrorMessage("Please upload the updated model file.");
      return;
    }
  
    try {
      setIsLoading(true);
      
      // 1. Upload the model to IPFS
      const updatedFileHash = await uploadToIPFS(updatedFile);
      
      // 2. Get the global model hash and test dataset hash
      const model = await contract.methods.models(modelId).call();
      const globalModelHash = model.fileHash;
      const testDatasetHash = model.testDatasetHash;
      
      // 3. Call the aggregator API to calculate the training value
      const response = await fetch('http://localhost:5002/calculate-training-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId,
          globalModelHash,
          updatedModelHash: updatedFileHash,
          testDatasetHash
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // 4. Check if the model improves performance
      if (result.shouldUpdate) {
        // 5. Call the smart contract to train the model with the calculated value
        await contract.methods.trainModel(modelId, result.trainingValue).send({ from: account });
        await contract.methods.updateModel(modelId, updatedFileHash).send({ from: account });
        
        setSuccessMessage(`Model trained successfully! Training value: ${result.trainingValue}`);
      } else {
        setErrorMessage("Your model didn't improve performance. No training value awarded.");
      }
    } catch (error) {
      console.error("Error training model:", error);
      setErrorMessage(`Error training model: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUpdatedFile(null);
      fetchTrainerInfo();
      fetchModels();
    }
  };

  return (
    <div>
      <h1>Federated Learning Reward System</h1>
      <p>Connected Account: {account}</p>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <h2>Available Models</h2>
      {isLoading ? (
        <p>Loading models...</p>
      ) : (
        <ul>
          {models.map((model) => (
            <li key={model.id}>
              <h3>{model.name}</h3>
              <p>{model.description}</p>
              <p>Reward Pool: {web3.utils.fromWei(model.rewardPool, 'ether')} ETH</p>
              <a href={`https://ipfs.io/ipfs/${model.fileHash}`} download>Download Model Architecture</a>
              <button onClick={() => deactivateModel(model.id)}>Deactivate</button>
              <button onClick={() => takeDownModel(model.id)}>Take Down</button>
              <input
                type="number"
                placeholder="Add Funds (ETH)"
                value={additionalFunds}
                onChange={(e) => setAdditionalFunds(e.target.value)}
              />
              <button onClick={() => addFundsToModel(model.id)}>Add Funds</button>
              <input type="file" accept=".pkl,.joblib,.h5" onChange={(e) => setUpdatedFile(e.target.files[0])} />
              <button onClick={() => trainModel(model.id)}>Upload Updated Model</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Host a New Model</h2>
      <form onSubmit={(e) => { e.preventDefault(); hostModel(); }}>
        <input
          type="text"
          placeholder="Model Name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          required
        />
        <textarea
          placeholder="Model Description"
          value={modelDescription}
          onChange={(e) => setModelDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Reward Pool (ETH)"
          value={rewardPool}
          onChange={(e) => setRewardPool(e.target.value)}
          required
        />
        <label htmlFor="modelFile">Upload Model File (.pkl, .joblib, .h5):</label>
        <input
          type="file"
          accept=".pkl,.joblib,.h5"
          onChange={(e) => setModelFile(e.target.files[0])}
          required
        />
        <label htmlFor="testDataset">Upload Test Dataset (.csv, .json):</label>
        <input
          type="file"
          accept=".csv,.json"
          onChange={(e) => setTestDataset(e.target.files[0])}
          required
        />
        <button type="submit">Host Model</button>
      </form>

      <h3>Trained Models:</h3>
      <ul>
        {trainedModels.length > 0 ? (
          trainedModels.map((modelId, index) => (
            <li key={index}>Model ID: {modelId}</li>
          ))
        ) : (
          <p>No models trained yet.</p>
        )}
      </ul>
    </div>
  );
}

export default App;