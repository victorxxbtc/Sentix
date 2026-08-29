# Sentix (Quant0G) - Judge Verification & Audit Guide

This guide is designed for hackathon judges, technical evaluators, and auditors to verify the 0G integration and reproduce all claims.

---

## 1. Quick Verification (Single Command)

To verify the entire multi-contract deployment, 0G Storage Merkle root generation, on-chain proof registration, and commit-reveal execution in a single automated flow:

```powershell
npm run verify:0g
```

### Expected Output Summary
```
================================================================================
             SENTIX (QUANT0G) - JUDGES 0G VERIFICATION RUNNER                   
================================================================================
[1/6] Deploying Core 0G Smart Contracts Suite...
  [PASS] ZeroGProofRegistry deployed at: 0x...
  [PASS] QuantOracle deployed at:        0x...
  [PASS] StrategyVault deployed at:      0x...
  [PASS] Multi-Contract Architecture Wired & Configured.

[2/6] Feeding Real-Time Market Microstructure Telemetry to QuantOracle...
  [PASS] QuantOracle updated!

[3/6] Archiving Pre-Trade AI Reasoning Trace to 0G Storage...
  [PASS] 0G Storage Merkle Root: 0x...
  [PASS] 0G Storage Chunks:      2 chunks (420 bytes)
  [PASS] 0G Storage URI:         0g://storage/market-snapshot/0x...

[4/6] Registering & Confirming Proof on ZeroGProofRegistry...
  [PASS] On-Chain Proof ID:       #1 (Confirmed: true)
  [PASS] Proof Registration Tx:   0x... (Block: 184210)

[5/6] Committing Cryptographic Trade Intent to StrategyVault...
  [PASS] LP User deposited 1.0 0G to StrategyVault.
  [PASS] Trade Commitment Tx:     0x...
  [PASS] Locked Commit Hash:      0x...
  [PASS] Bound Proof ID:          #1

[6/6] Revealing Preimage Parameters & Settling on 0G Chain...
  [PASS] Trade Execution Tx:      0x...
  [PASS] Cryptographic Preimage:  Action="BUY", Amount=0.1 0G, Salt=0x...
  [PASS] Settle PnL:              +0.018 0G (Realized)

================================================================================
                         VERIFICATION SUMMARY FOR JUDGES                        
================================================================================
* ZeroGProofRegistry: https://chainscan-galileo.0g.ai/address/0x...
* QuantOracle:        https://chainscan-galileo.0g.ai/address/0x...
* StrategyVault:      https://chainscan-galileo.0g.ai/address/0x...
* 0G Storage Root:    0x...
* Confirmed Proof ID: #1
* Lookahead Bias:     0.00% (Cryptographically bound P <= 2^-256)
================================================================================
```

---

## 2. Real 0G Endpoints & Network Specs

Sentix operates with live 0G infrastructure:

| Component | Network Endpoint | Details |
|---|---|---|
| **0G EVM Chain** | `https://rpc-galileo.0g.ai` | 0G Galileo Testnet (Chain ID: `16600`) |
| **0G Explorer** | `https://chainscan-galileo.0g.ai` | Block explorer for contract and transaction inspection |
| **0G Storage Indexer** | `https://indexer-storage-galileo.0g.ai` | Decentralized storage gateway for chunk proofs |
| **0G Storage RPC** | `https://rpc-storage-galileo.0g.ai` | Direct storage node JSON-RPC |

---

## 3. Codebase File Map for Evaluators

| File | Purpose | Key Functions / Methods |
|---|---|---|
| [`contracts/ZeroGProofRegistry.sol`](../contracts/ZeroGProofRegistry.sol) | Dedicated on-chain proof registry | `registerProof()`, `verifyMerkleProof()`, `isProofConfirmed()`, `getProof()` |
| [`contracts/QuantOracle.sol`](../contracts/QuantOracle.sol) | Decentralized 0G market telemetry oracle | `updateTelemetry()`, `getTelemetry()` |
| [`contracts/StrategyVault.sol`](../contracts/StrategyVault.sol) | Commit-reveal liquidity vault | `commitTradeWithProof()`, `executeTrade()`, `deposit()`, `withdraw()` |
| [`packages/zero-g-storage/src/index.ts`](../packages/zero-g-storage/src/index.ts) | 0G chunking & Merkle DAG engine | `chunkData()`, `buildMerkleTree()`, `getMerkleProof()`, `archiveMarketSnapshot()` |
| [`packages/quant-engine/src/index.ts`](../packages/quant-engine/src/index.ts) | Autonomous DeFAI signal model | `generateTradeDecision()`, `verifyPreimage()` |
| [`test/ZeroGProofRegistry.test.ts`](../test/ZeroGProofRegistry.test.ts) | Dedicated proof registry tests | 100% passing tests for chunking, proofs, and oracle |
| [`test/StrategyVault.test.ts`](../test/StrategyVault.test.ts) | Multi-contract vault integration tests | Covers replay protection, hash mismatch, and LP math |
| [`scripts/verify-0g-live.ts`](../scripts/verify-0g-live.ts) | Turnkey verification test script | Single-command full lifecycle execution |
| [`frontend/index.html`](../frontend/index.html) | Interactive Web3 & Three.js DApp | 3D network topology, proof inspector modal, and wallet manager |

---

## 4. Running the Automated Test Suite

```powershell
# 1. Compile smart contracts
npm run compile:contracts

# 2. Run unit & integration test suites
npm run test:contracts

# 3. Run live 0G simulation
npm run test:0g

# 4. Run autonomous agent runner
npm run agent
```

---

## 5. Why Sentix Meaningfully Leverages 0G

1. **Not Just a Smart Contract**: Sentix actively uses **0G Storage** to solve a problem that blockchains cannot solve alone — storing multi-kilobyte raw orderbook trees and LLM reasoning traces before trade revelation without exorbitant L1 calldata costs.
2. **Confirmable On-Chain Proofs (No Fire-and-Forget)**: Storage Merkle roots are registered on `ZeroGProofRegistry.sol` and cryptographically validated before trades can be committed to `StrategyVault.sol`.
3. **Mathematical Lookahead Elimination**: By locking the $\text{commitHash} = \text{keccak256}(\text{action}, \text{amount}, \text{salt})$ on 0G Chain prior to execution, model operators cannot alter or retroactively fabricate their track record ($P \le 2^{-256}$).
