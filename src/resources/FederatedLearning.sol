// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1;

contract FederatedLearning {
    struct Model {
        string name;
        string description;
        string fileHash; // Store the IPFS hash of the model architecture file
        string testDatasetHash; // Store the IPFS hash of the test dataset
        address owner;
        uint256 rewardPool;
        bool isActive;
    }

    struct Trainer {
        uint256 totalRewards;
        uint256[] trainedModels;
    }

    mapping(uint256 => Model) public models;
    mapping(address => Trainer) public trainers;
    uint256 public modelCount;

    // Declare all events
    event ModelCreated(
        uint256 indexed modelId,
        address indexed owner,
        string name,
        string testDatasetHash
    );
    event ModelUpdated(uint256 indexed modelId, string newFileHash);
    event ModelTrained(
        uint256 indexed modelId,
        address indexed trainer,
        uint256 reward
    );
    event RewardAdded(uint256 indexed modelId, uint256 amount); // Event for adding rewards
    event ModelDeactivated(uint256 indexed modelId, address indexed owner); // Event for deactivating a model

    /// @dev Create a new model with an initial reward pool and IPFS hash
    function createModel(
        string memory _name,
        string memory _description,
        string memory _fileHash,
        string memory _testDatasetHash
    ) public payable {
        require(msg.value > 0, "Must provide initial reward pool");

        modelCount++;
        models[modelCount] = Model({
            name: _name,
            description: _description,
            fileHash: _fileHash,
            testDatasetHash: _testDatasetHash,
            owner: msg.sender,
            rewardPool: msg.value,
            isActive: true
        });

        emit ModelCreated(modelCount, msg.sender, _name, _testDatasetHash);
    }

    /// @dev Add a method to update the model
    function updateModel(uint256 modelId, string memory newFileHash) public {
        Model storage model = models[modelId];
        
        require(model.isActive, "Model is not active");

        model.fileHash = newFileHash;

        emit ModelUpdated(modelId, newFileHash); // Emit an event after updating the model
    }

    /// @dev Train the model and earn rewards based on training value
    function trainModel(uint256 _modelId, uint256 _trainingValue) public {
        Model storage model = models[_modelId];

        require(model.isActive, "Model is not active");
        require(model.rewardPool > 0, "No rewards available");
        require(_trainingValue > 0, "Training value must be greater than 0");

        uint256 reward = calculateReward(_modelId, _trainingValue);
        require(
            reward <= model.rewardPool,
            "Insufficient reward pool for this training"
        );

        // Update model's reward pool and trainer's rewards
        model.rewardPool -= reward;
        Trainer storage trainer = trainers[msg.sender];
        trainer.totalRewards += reward;
        trainer.trainedModels.push(_modelId);

        emit ModelTrained(_modelId, msg.sender, reward);

        // Transfer the reward to the trainer using call instead of transfer
        (bool success, ) = msg.sender.call.value(reward)("");
        require(success, "Transfer failed.");
    }

    /// @dev Calculate the reward based on the model's pool and training value
    function calculateReward(uint256 _modelId, uint256 _trainingValue)
        internal
        view
        returns (uint256)
    {
        // Simple reward calculation - training value determines a percentage of the reward pool
        Model memory model = models[_modelId];
        uint256 reward = (_trainingValue * model.rewardPool) / 1000;

        // Return the smaller of the calculated reward or the available reward pool
        return reward > model.rewardPool ? model.rewardPool : reward;
    }

    /// @dev Get trainer's total rewards and list of trained models
    function getTrainerInfo(address _trainer)
        public
        view
        returns (uint256, uint256[] memory)
    {
        Trainer memory trainer = trainers[_trainer];
        return (trainer.totalRewards, trainer.trainedModels);
    }

    /// @dev Add more funds to the reward pool for an active model
    function addToRewardPool(uint256 _modelId) public payable {
        Model storage model = models[_modelId];
        require(
            msg.sender == model.owner,
            "Only the model owner can add to the reward pool"
        );
        require(model.isActive, "Model is not active");
        require(
            msg.value > 0,
            "Must send some value to add to the reward pool"
        );

        model.rewardPool += msg.value;
        emit RewardAdded(_modelId, msg.value);
    }

    /// @dev Deactivate a model. Only the owner can deactivate it.
    function deactivateModel(uint256 _modelId) public {
        Model storage model = models[_modelId];
        require(
            msg.sender == model.owner,
            "Only the model owner can deactivate it"
        );
        require(model.isActive, "Model is already inactive");

        model.isActive = false;
        emit ModelDeactivated(_modelId, msg.sender);
    }

    /// @dev Take down a model and refund remaining reward pool to owner
    function takeDownModel(uint256 _modelId) public {
        Model storage model = models[_modelId];
        require(
            msg.sender == model.owner,
            "Only the model owner can take it down"
        );
        require(model.isActive, "Model is already inactive");

        // Deactivate the model
        model.isActive = false;

        // Refund the remaining reward pool to the owner
        if (model.rewardPool > 0) {
            uint256 refundAmount = model.rewardPool;
            model.rewardPool = 0;
            (bool success,) = msg.sender.call.value(refundAmount)("");
            require(success, "Refund failed");
        }

        emit ModelDeactivated(_modelId, msg.sender);
    }

    /// @dev Get model information including IPFS hash
    function getModelInfo(uint256 _modelId)
        public
        view
        returns (
            address,
            string memory,
            string memory,
            string memory,
            uint256,
            bool
        )
    {
        Model memory model = models[_modelId];
        return (
            model.owner,
            model.name,
            model.description,
            model.fileHash,
            model.rewardPool,
            model.isActive
        );
    }
}