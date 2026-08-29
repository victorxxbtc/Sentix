# Sentix (Quant0G) - 0G Mainnet Deployment & Verification Guide

This guide provides complete instructions for broadcasting and verifying the Sentix DeFAI multi-contract suite on **0G Mainnet** (`Chain ID: 16661`).

---

## 1. 0G Mainnet Network Specifications

| Parameter | 0G Mainnet Configuration |
|---|---|
| **Network Name** | 0G Mainnet |
| **Chain ID** | `16661` (`0x4115`) |
| **EVM RPC Endpoint** | `https://rpc.0g.ai` |
| **Fallback RPC** | `https://evmrpc.0g.ai` |
| **Block Explorer** | `https://chainscan.0g.ai` (or `https://scan.0g.ai`) |
| **0G Storage Indexer** | `https://indexer-storage.0g.ai` |
| **0G Storage RPC** | `https://rpc-storage.0g.ai` |
| **Currency Symbol** | `0G` |
| **Decimals** | `18` |

---

## 2. Pre-Flight Checklist

1. **Verify Environment Variables (`.env`)**:
   ```bash
   # Deployer private key with native 0G Mainnet tokens for gas
   PRIVATE_KEY=0x...

   # 0G Mainnet RPC
   ZERO_G_MAINNET_RPC=https://rpc.0g.ai
   ZERO_G_MAINNET_STORAGE_INDEXER=https://indexer-storage.0g.ai

   # OpenRouter Live Inference
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

2. **Verify Account Balance on 0G Mainnet**:
   Ensure your deployer account has sufficient 0G tokens to pay for gas:
   ```bash
   node scripts/check-wallet-0g.js
   ```

---

## 3. Deployment Commands

### Compile Smart Contracts
```bash
npm run compile:contracts
```

### Deploy to 0G Mainnet
```bash
npm run deploy:mainnet
```

### Deployment Flow:
1. Deploys [`ZeroGProofRegistry.sol`](../contracts/ZeroGProofRegistry.sol) to 0G Mainnet.
2. Deploys [`QuantOracle.sol`](../contracts/QuantOracle.sol) to 0G Mainnet.
3. Deploys [`StrategyVault.sol`](../contracts/StrategyVault.sol) to 0G Mainnet.
4. Executes on-chain wiring (`vault.setProofRegistry(...)` and `vault.setQuantOracle(...)`).
5. Saves deployed addresses and explorer links to `config/mainnet-deployment.json`.

---

## 4. Frontend Dual-Network Integration

The interactive DApp terminal at **[http://localhost:3001](http://localhost:3001)** includes a dual-network selector:
- **0G Mainnet (16661)**: Interacts with 0G Mainnet contracts and storage nodes.
- **0G Galileo Testnet (16600)**: Interacts with testnet contracts for evaluation.

Switching between networks updates all contract ABIs, RPC connections, and 0G Storage indexer endpoints automatically.
