# Sentix (Quant0G)

> **Verifiable DeFAI Quantitative Strategy Vault & Cryptographic Lookahead-Proof Trading Engine powered by 0G Chain, 0G Storage, and 0G Compute.**

[![0G Mainnet](https://img.shields.io/badge/0G_Mainnet-Live_16661-059669?style=flat-square)](https://chainscan.0g.ai)
[![0G Testnet](https://img.shields.io/badge/0G_Galileo-Testnet_16600-0891b2?style=flat-square)](https://chainscan-galileo.0g.ai)
[![0G Storage](https://img.shields.io/badge/0G_Storage-Decentralized_Merkle_Archive-0d9488?style=flat-square)](https://indexer-storage.0g.ai)
[![Judges Audit](https://img.shields.io/badge/Judges_Guide-docs%2FJUDGES__VERIFICATION.md-emerald?style=flat-square)](docs/JUDGES_VERIFICATION.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 0G Mainnet Production Deployments (Chain ID: 16661)

| Contract | Mainnet Address | 0G Block Explorer Link |
|---|---|---|
| **`ZeroGProofRegistry`** | `0x7D76068fBEB346582dD3F872C0B7a0B9866Be15f` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x7D76068fBEB346582dD3F872C0B7a0B9866Be15f) |
| **`QuantOracle`** | `0x447F975D0B2CDefD5536Ec5A72afc43838c903dD` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x447F975D0B2CDefD5536Ec5A72afc43838c903dD) |
| **`StrategyVault`** | `0x0E20ebE8Ac89fcc53142c9e054b9f5dF9495482A` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x0E20ebE8Ac89fcc53142c9e054b9f5dF9495482A) |

---

## 0G Galileo Testnet Deployments (Chain ID: 16600)

| Contract | Testnet Address | 0G Block Explorer Link |
|---|---|---|
| **`ZeroGProofRegistry`** | `0x7D76068fBEB346582dD3F872C0B7a0B9866Be15f` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0x7D76068fBEB346582dD3F872C0B7a0B9866Be15f) |
| **`QuantOracle`** | `0x447F975D0B2CDefD5536Ec5A72afc43838c903dD` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0x447F975D0B2CDefD5536Ec5A72afc43838c903dD) |
| **`StrategyVault`** | `0x0E20ebE8Ac89fcc53142c9e054b9f5dF9495482A` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0x0E20ebE8Ac89fcc53142c9e054b9f5dF9495482A) |

---

## 0G Network Infrastructure

| Parameter | 0G Aristotle Mainnet | 0G Galileo Testnet |
| :--- | :--- | :--- |
| **Chain ID** | `16661` (Hex: `0x4115`) | `16600` (Hex: `0x40d8`) |
| **RPC Endpoint** | `https://evmrpc.0g.ai` | `https://evmrpc-testnet.0g.ai` |
| **Block Explorer** | `https://chainscan.0g.ai` | `https://chainscan-galileo.0g.ai` |
| **Storage Indexer** | `https://indexer-storage-turbo.0g.ai` | `https://indexer-storage-testnet-turbo.0g.ai` |

---

## Executive Summary

Decentralized algorithmic trading vaults face a critical credibility crisis: **unverifiable backfitting and lookahead bias**. Traditional AI trading bots can post-rationalize execution results, falsify reasoning traces, and retroactively claim winning strategies while hiding catastrophic drawdowns.

**Sentix (Quant0G)** solves this fundamental dilemma by enforcing a **cryptographically binding two-phase commit-reveal execution architecture** anchored directly into the **0G decentralized AI operating system**:

1. **0G Compute Engine (`packages/quant-engine`)**: Autonomous quantitative agents evaluate orderbook depth imbalances, cross-exchange funding rates, and on-chain telemetry using live OpenRouter LLMs (`meta-llama/llama-3.3-70b-instruct`) to generate deterministic trade signals with cryptographic salts.
2. **0G Storage Network (`packages/zero-g-storage`)**: Before exposing the trade parameters, the complete AI reasoning tree, confidence score, and pre-trade market snapshot are chunked into 1KB segments, hashed into a Merkle DAG, and archived to 0G Storage (`https://indexer-storage.0g.ai`).
3. **0G Proof Registry (`contracts/ZeroGProofRegistry.sol`)**: Storage Merkle roots are registered on-chain with verifiable chunk counts and queryable receipts, eliminating fire-and-forget proof submissions.
4. **0G Chain Settlement (`contracts/StrategyVault.sol`)**: Locks the trade commitment (`keccak256(action, amount, salt)`) on-chain. When revealed in subsequent blocks, the contract verifies the cryptographic preimage before settling LP funds. Any parameter tampering or retrospective backfitting is rejected by the EVM ($P \le 2^{-256}$).

---

## Quick Start & Judge Verification

```bash
# 1. Run all unit and multi-contract integration tests
npm run test:contracts

# 2. Run live 0G commit-reveal simulation
npm run test:0g

# 3. Run autonomous live AI agent loop
npm run agent

# 4. Deploy to 0G Mainnet
npm run deploy:mainnet

# 5. Launch interactive Web3 Terminal
npm run dev
# Accessible at http://localhost:3000
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
