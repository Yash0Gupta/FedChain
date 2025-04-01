import Web3 from 'web3';
import ContractABI from './FederatedLearningABI.json'; // Make sure your ABI JSON is correct

const contractAddress = '0xa6c15abc6f8c047d8ec0c71515a0ab22c62fc598'; // Make sure this address is correct for your network

const getContract = async (web3) => {
  const networkId = await web3.eth.net.getId();
  const contractInstance = new web3.eth.Contract(ContractABI, contractAddress);
  return contractInstance;
};

export default getContract;

