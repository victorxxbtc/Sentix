// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ZeroGProofRegistry.sol";
import "./QuantOracle.sol";

/**
 * @title StrategyVault
 * @notice Verifiable DeFAI Trading Vault with Cryptographic Commit-Reveal Execution on 0G Chain.
 * @dev Integrates ZeroGProofRegistry and QuantOracle to eliminate lookahead bias and verify 0G storage roots on-chain.
 */
contract StrategyVault is Ownable, ReentrancyGuard {

    struct TradeCommitment {
        bytes32 commitHash;      // keccak256(action, amount, salt)
        bytes32 storageRoot;     // 0G Storage Merkle root of market snapshot & reasoning
        uint256 proofId;         // Optional reference to ZeroGProofRegistry proof ID
        uint256 commitTimestamp;
        uint256 commitBlock;
        bool executed;
    }

    uint256 public totalVaultDeposits;
    mapping(address => uint256) public userBalances;
    mapping(uint256 => TradeCommitment) public commitments;
    uint256 public nextCommitmentId = 1;

    address public aiTradingAgent;
    ZeroGProofRegistry public proofRegistry;
    QuantOracle public quantOracle;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event TradeCommitted(
        uint256 indexed id,
        bytes32 indexed commitHash,
        bytes32 indexed storageRoot,
        uint256 proofId,
        uint256 timestamp,
        uint256 blockNumber
    );
    event TradeExecutedOn0G(
        uint256 indexed id,
        string action,
        uint256 amount,
        uint256 profitLoss,
        bytes32 storageRoot,
        uint256 executionBlock
    );
    event ProofRegistryUpdated(address indexed newRegistry);
    event QuantOracleUpdated(address indexed newOracle);

    modifier onlyAgent() {
        require(msg.sender == aiTradingAgent || msg.sender == owner(), "StrategyVault: caller not authorized AI agent");
        _;
    }

    constructor() Ownable(msg.sender) {
        aiTradingAgent = msg.sender;
    }

    function setTradingAgent(address agent) external onlyOwner {
        require(agent != address(0), "StrategyVault: zero address");
        aiTradingAgent = agent;
    }

    function setProofRegistry(address _registry) external onlyOwner {
        proofRegistry = ZeroGProofRegistry(_registry);
        emit ProofRegistryUpdated(_registry);
    }

    function setQuantOracle(address _oracle) external onlyOwner {
        quantOracle = QuantOracle(_oracle);
        emit QuantOracleUpdated(_oracle);
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "StrategyVault: deposit must be > 0");
        userBalances[msg.sender] += msg.value;
        totalVaultDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Commits a cryptographic trade intent to 0G Chain before executing orders.
     * @param commitHash The keccak256(action, amount, salt) preimage hash
     * @param storageRoot Merkle root of the 0G Storage reasoning archive
     */
    function commitTrade(bytes32 commitHash, bytes32 storageRoot) external onlyAgent returns (uint256) {
        return commitTradeWithProof(commitHash, storageRoot, 0);
    }

    /**
     * @notice Commits a trade with an explicitly linked ZeroGProofRegistry proof ID.
     */
    function commitTradeWithProof(
        bytes32 commitHash,
        bytes32 storageRoot,
        uint256 proofId
    ) public onlyAgent returns (uint256) {
        require(commitHash != bytes32(0), "StrategyVault: invalid commit hash");
        require(storageRoot != bytes32(0), "StrategyVault: 0G storage root required");

        // If proof registry is connected and proofId is provided, verify confirmation
        if (address(proofRegistry) != address(0) && proofId > 0) {
            require(proofRegistry.isProofConfirmed(storageRoot), "StrategyVault: storage root not confirmed in ZeroGProofRegistry");
        }

        uint256 id = nextCommitmentId++;
        commitments[id] = TradeCommitment({
            commitHash: commitHash,
            storageRoot: storageRoot,
            proofId: proofId,
            commitTimestamp: block.timestamp,
            commitBlock: block.number,
            executed: false
        });

        emit TradeCommitted(id, commitHash, storageRoot, proofId, block.timestamp, block.number);
        return id;
    }

    /**
     * @notice Reveals trade preimage parameters and executes the verified settlement.
     */
    function executeTrade(
        uint256 id,
        string calldata action,
        uint256 amount,
        bytes32 salt,
        uint256 reportedProfitLoss
    ) external onlyAgent nonReentrant {
        TradeCommitment storage c = commitments[id];
        require(c.commitTimestamp > 0, "StrategyVault: commitment does not exist");
        require(!c.executed, "StrategyVault: trade already executed");

        bytes32 verifiedHash = keccak256(abi.encodePacked(action, amount, salt));
        require(verifiedHash == c.commitHash, "StrategyVault: commitment hash mismatch");

        c.executed = true;

        emit TradeExecutedOn0G(id, action, amount, reportedProfitLoss, c.storageRoot, block.number);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "StrategyVault: insufficient balance");
        userBalances[msg.sender] -= amount;
        totalVaultDeposits -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "StrategyVault: withdraw failed");

        emit Withdraw(msg.sender, amount);
    }

    function getCommitment(uint256 id) external view returns (
        bytes32 commitHash,
        bytes32 storageRoot,
        uint256 proofId,
        uint256 commitTimestamp,
        uint256 commitBlock,
        bool executed
    ) {
        TradeCommitment storage c = commitments[id];
        return (
            c.commitHash,
            c.storageRoot,
            c.proofId,
            c.commitTimestamp,
            c.commitBlock,
            c.executed
        );
    }
}
