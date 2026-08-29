// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuantOracle
 * @notice Decentralized telemetry oracle for 0G DEX orderbook depth imbalances,
 *         cross-exchange funding rate spreads, and AI sentiment scores.
 */
contract QuantOracle is Ownable {
    
    struct TelemetryFeed {
        uint256 price;             // 18 decimals
        int256 orderbookImbalance; // basis points (-10000 to +10000)
        int256 fundingRateBps;     // basis points
        uint256 confidenceScore;   // 0 to 10000 (100.00%)
        uint256 lastUpdated;
    }

    // Mapping from pair symbol (e.g. "0G/USDT") to TelemetryFeed
    mapping(string => TelemetryFeed) public feeds;
    
    // Designated 0G Compute oracle updater
    address public oracleUpdater;

    event TelemetryUpdated(
        string indexed pair,
        uint256 price,
        int256 orderbookImbalance,
        int256 fundingRateBps,
        uint256 confidenceScore,
        uint256 timestamp
    );

    event OracleUpdaterChanged(address indexed oldUpdater, address indexed newUpdater);

    modifier onlyUpdater() {
        require(msg.sender == oracleUpdater || msg.sender == owner(), "QuantOracle: caller not oracle updater");
        _;
    }

    constructor() Ownable(msg.sender) {
        oracleUpdater = msg.sender;
    }

    function setOracleUpdater(address newUpdater) external onlyOwner {
        require(newUpdater != address(0), "QuantOracle: zero address");
        emit OracleUpdaterChanged(oracleUpdater, newUpdater);
        oracleUpdater = newUpdater;
    }

    /**
     * @notice Updates live market microstructure telemetry on-chain.
     */
    function updateTelemetry(
        string calldata pair,
        uint256 price,
        int256 orderbookImbalance,
        int256 fundingRateBps,
        uint256 confidenceScore
    ) external onlyUpdater {
        require(bytes(pair).length > 0, "QuantOracle: empty pair");
        require(price > 0, "QuantOracle: invalid price");
        require(confidenceScore <= 10000, "QuantOracle: confidence exceeds 100%");

        feeds[pair] = TelemetryFeed({
            price: price,
            orderbookImbalance: orderbookImbalance,
            fundingRateBps: fundingRateBps,
            confidenceScore: confidenceScore,
            lastUpdated: block.timestamp
        });

        emit TelemetryUpdated(
            pair,
            price,
            orderbookImbalance,
            fundingRateBps,
            confidenceScore,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves telemetry with freshness check.
     */
    function getTelemetry(string calldata pair) external view returns (
        uint256 price,
        int256 orderbookImbalance,
        int256 fundingRateBps,
        uint256 confidenceScore,
        uint256 lastUpdated,
        bool isFresh
    ) {
        TelemetryFeed memory f = feeds[pair];
        bool fresh = (block.timestamp - f.lastUpdated) <= 3600; // Fresh if updated within last 1 hour
        return (
            f.price,
            f.orderbookImbalance,
            f.fundingRateBps,
            f.confidenceScore,
            f.lastUpdated,
            fresh
        );
    }
}
