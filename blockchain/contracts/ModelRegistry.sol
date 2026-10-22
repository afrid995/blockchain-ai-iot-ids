// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModelRegistry
 * @dev Lightweight, tamper-evident on-chain provenance registry for AI models.
 * Stores only compact cryptographic digests (bytes32) and release metadata.
 * Does NOT store raw network traffic, datasets, or heavy ML model weights.
 */
contract ModelRegistry {
    address public owner;

    struct ModelRecord {
        string modelId;
        string version;
        bytes32 modelHash;      // 32-byte binary SHA-256 digest
        string algorithm;
        uint256 registeredAt;   // Block timestamp
        address registrant;
        bool exists;
    }

    // Mapping: keccak256(abi.encodePacked(modelId, ":", version)) => ModelRecord
    mapping(bytes32 => ModelRecord) private _models;

    // Ordered list of registered keys
    bytes32[] private _registeredKeys;

    // Events
    event ModelRegistered(
        string indexed modelIdIndexed,
        string version,
        bytes32 modelHash,
        address indexed registrant,
        uint256 timestamp,
        string modelId
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "ModelRegistry: Caller is not the authorized owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function computeKey(string memory modelId, string memory version) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(modelId, ":", version));
    }

    /**
     * @notice Register a new trusted AI model's cryptographic provenance.
     * @dev Rejects duplicate registrations of identical model_id + version to prevent tampering.
     */
    function registerModel(
        string memory modelId,
        string memory version,
        bytes32 modelHash,
        string memory algorithm
    ) external onlyOwner {
        require(bytes(modelId).length > 0, "ModelRegistry: modelId cannot be empty");
        require(bytes(version).length > 0, "ModelRegistry: version cannot be empty");
        require(modelHash != bytes32(0), "ModelRegistry: modelHash cannot be zero");

        bytes32 key = computeKey(modelId, version);
        require(!_models[key].exists, "ModelRegistry: Model version already registered");

        _models[key] = ModelRecord({
            modelId: modelId,
            version: version,
            modelHash: modelHash,
            algorithm: algorithm,
            registeredAt: block.timestamp,
            registrant: msg.sender,
            exists: true
        });

        _registeredKeys.push(key);

        emit ModelRegistered(
            modelId,
            version,
            modelHash,
            msg.sender,
            block.timestamp,
            modelId
        );
    }

    /**
     * @notice Check whether a given model version has been registered.
     */
    function isModelRegistered(string memory modelId, string memory version) external view returns (bool) {
        bytes32 key = computeKey(modelId, version);
        return _models[key].exists;
    }

    /**
     * @notice Retrieve the registered cryptographic hash for a given model version.
     */
    function getModelHash(string memory modelId, string memory version) external view returns (bytes32) {
        bytes32 key = computeKey(modelId, version);
        require(_models[key].exists, "ModelRegistry: Model version not registered");
        return _models[key].modelHash;
    }

    /**
     * @notice Retrieve the complete on-chain provenance record for a given model version.
     */
    function getModelRecord(string memory modelId, string memory version)
        external
        view
        returns (
            string memory retrievedModelId,
            string memory retrievedVersion,
            bytes32 modelHash,
            string memory algorithm,
            uint256 registeredAt,
            address registrant
        )
    {
        bytes32 key = computeKey(modelId, version);
        require(_models[key].exists, "ModelRegistry: Model version not registered");
        ModelRecord memory r = _models[key];
        return (r.modelId, r.version, r.modelHash, r.algorithm, r.registeredAt, r.registrant);
    }

    /**
     * @notice Get total count of registered models.
     */
    function totalRegisteredModels() external view returns (uint256) {
        return _registeredKeys.length;
    }
}
