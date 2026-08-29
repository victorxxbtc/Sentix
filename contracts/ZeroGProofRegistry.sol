// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZeroGProofRegistry
 * @notice Dedicated on-chain registry for confirming 0G Storage Merkle roots, model signatures,
 *         and telemetry archives on the 0G Chain. Eliminates fire-and-forget proof writes.
 */
contract ZeroGProofRegistry is Ownable {
    
    struct StorageProof {
        bytes32 storageRoot;
        uint256 chunkCount;
        string dataUri;
        uint256 blockNumber;
        uint256 timestamp;
        address submitter;
        bool isConfirmed;
    }

    // Mapping from proof ID to StorageProof
    mapping(uint256 => StorageProof) public proofs;
    // Mapping from storageRoot to proof ID
    mapping(bytes32 => uint256) public rootToProofId;
    
    uint256 public totalProofsCount;

    // Authorized AI Agent submitters
    mapping(address => bool) public authorizedSubmitters;

    event ProofRegistered(
        uint256 indexed proofId,
        bytes32 indexed storageRoot,
        uint256 chunkCount,
        string dataUri,
        address submitter,
        uint256 blockNumber
    );

    event SubmitterAuthorizationChanged(address indexed submitter, bool authorized);

    modifier onlyAuthorizedSubmitter() {
        require(authorizedSubmitters[msg.sender] || msg.sender == owner(), "ZeroGProofRegistry: caller not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedSubmitters[msg.sender] = true;
    }

    function setSubmitterAuthorization(address submitter, bool authorized) external onlyOwner {
        require(submitter != address(0), "ZeroGProofRegistry: zero address");
        authorizedSubmitters[submitter] = authorized;
        emit SubmitterAuthorizationChanged(submitter, authorized);
    }

    /**
     * @notice Registers and confirms a 0G Storage Merkle root on-chain with queryable receipt.
     * @param storageRoot The Merkle root of the market snapshot / reasoning tree in 0G Storage
     * @param chunkCount Number of 0G storage chunks composing the dataset
     * @param dataUri Standard 0G decentralized storage URI / locator
     * @return proofId Confirmable on-chain proof identifier
     */
    function registerProof(
        bytes32 storageRoot,
        uint256 chunkCount,
        string calldata dataUri
    ) external onlyAuthorizedSubmitter returns (uint256 proofId) {
        require(storageRoot != bytes32(0), "ZeroGProofRegistry: empty storage root");
        require(chunkCount > 0, "ZeroGProofRegistry: chunk count must be > 0");
        require(bytes(dataUri).length > 0, "ZeroGProofRegistry: empty data URI");
        require(rootToProofId[storageRoot] == 0, "ZeroGProofRegistry: proof root already registered");

        totalProofsCount++;
        proofId = totalProofsCount;

        proofs[proofId] = StorageProof({
            storageRoot: storageRoot,
            chunkCount: chunkCount,
            dataUri: dataUri,
            blockNumber: block.number,
            timestamp: block.timestamp,
            submitter: msg.sender,
            isConfirmed: true
        });

        rootToProofId[storageRoot] = proofId;

        emit ProofRegistered(
            proofId,
            storageRoot,
            chunkCount,
            dataUri,
            msg.sender,
            block.number
        );

        return proofId;
    }

    /**
     * @notice Verifies whether a storage root is registered and confirmed on 0G Chain.
     */
    function isProofConfirmed(bytes32 storageRoot) external view returns (bool) {
        uint256 proofId = rootToProofId[storageRoot];
        return proofId > 0 && proofs[proofId].isConfirmed;
    }

    /**
     * @notice Cryptographically verifies that a specific leaf hash belongs to a confirmed 0G Storage Merkle root.
     */
    function verifyMerkleProof(
        bytes32 storageRoot,
        bytes32[] calldata merkleProof,
        bytes32 leaf
    ) external view returns (bool) {
        require(this.isProofConfirmed(storageRoot), "ZeroGProofRegistry: root not confirmed on-chain");
        
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < merkleProof.length; i++) {
            bytes32 proofElement = merkleProof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == storageRoot;
    }

    /**
     * @notice Returns complete storage proof metadata for auditing by judges and users.
     */
    function getProof(uint256 proofId) external view returns (
        bytes32 storageRoot,
        uint256 chunkCount,
        string memory dataUri,
        uint256 blockNumber,
        uint256 timestamp,
        address submitter,
        bool isConfirmed
    ) {
        require(proofId > 0 && proofId <= totalProofsCount, "ZeroGProofRegistry: invalid proof ID");
        StorageProof storage p = proofs[proofId];
        return (
            p.storageRoot,
            p.chunkCount,
            p.dataUri,
            p.blockNumber,
            p.timestamp,
            p.submitter,
            p.isConfirmed
        );
    }
}
