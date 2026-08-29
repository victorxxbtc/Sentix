# Sentix (Quant0G) - Hackathon Submission Package

> **Category / Tracks**: 0G AI & DeFAI Track | 0G Storage Track | Best DeFi Application

---

## 1. Devpost Submission Copy

### Project Title
**Sentix (Quant0G)** — Verifiable DeFAI Quantitative Strategy Vault

### Elevator Pitch (Tagline)
A cryptographic commit-reveal trading vault that immutably anchors AI reasoning traces to 0G Storage before on-chain execution, mathematically eliminating lookahead bias and model backfitting.

---

### Inspiration
In traditional quantitative finance and emerging DeFAI protocols, automated trading bots suffer from a major transparency paradox: **unverifiable backfitting**.
- Bad actors fabricate simulated track records.
- Off-chain AI bots can cherry-pick successful historical executions while post-rationalizing losing trades.
- Users depositing into liquidity vaults have zero mathematical proof that an AI agent's decision preceded the market movement.

We asked: **What if an AI trading model was cryptographically forbidden from executing any trade unless its full reasoning tree was immutably locked in decentralized storage before the block timestamp of the trade?**

Sentix turns this concept into reality using the 0G ecosystem.

---

### What It Does
Sentix is an autonomous DeFAI trading copilot and transparent liquidity pool built natively for 0G:

1. **Autonomous Market Microstructure Analysis (0G Compute)**:
   The quant engine evaluates continuous orderbook depth imbalances, cross-exchange funding rates, and volume surges to generate deterministic trading signals ($(\text{Action}, \text{Amount}, \text{Salt})$).

2. **Immutable Pre-Trade Reasoning Archive (0G Storage)**:
   Before revealing its intent, the AI agent stores its complete reasoning trace, confidence scores, and raw market snapshots on 0G Storage, generating a cryptographic Merkle root ($\text{storageRoot}$).

3. **Cryptographic Commit-Reveal Settlement (0G Chain - `StrategyVault.sol`)**:
   - **Phase 1 (Commit)**: The agent posts $\text{commitHash} = \text{keccak256}(\text{action}, \text{amount}, \text{salt})$ along with the $\text{storageRoot}$ to the vault contract.
   - **Phase 2 (Reveal & Execute)**: In subsequent blocks, the agent reveals the preimage parameters. The smart contract validates that $\text{keccak256}(\text{action}, \text{amount}, \text{salt}) == \text{commitHash}$ before settling LP capital. Any altered parameters are immediately reverted on-chain.

4. **Interactive 3D WebGL Dashboard (Three.js)**:
   Users can monitor the 0G consensus core, distributed 0G storage clusters, live trade telemetry, and inspect the exact cryptographic reasoning preimage for every historical trade in a dedicated proof modal.

---

### How We Built It
- **0G Galileo Testnet (Chain ID `16600`)**: Deployed `StrategyVault.sol` with OpenZeppelin `ReentrancyGuard` and role-based access control.
- **0G Storage Integration (`packages/zero-g-storage`)**: Built a deterministic Merkle hashing and archiving layer representing 0G decentralized storage.
- **Quant Model Engine (`packages/quant-engine`)**: Implemented high-frequency orderbook imbalance and confidence scoring algorithms.
- **Interactive Three.js Engine (`frontend/index.html`)**: Engineered a custom WebGL 3D network topology visualization with `OrbitControls` and Raycaster event picking.
- **Test Automation**: Developed a 14-test Hardhat test suite validating all edge cases, access control, and anti-tampering guards.

---

### Accomplishments That We're Proud Of
- **100% Passing Test Coverage**: 14/14 Hardhat unit & integration tests covering deployment, LP math, and replay attack prevention.
- **Mathematical Lookahead Guarantee**: Formulated and verified on-chain cryptographic proof ensuring lookahead probability $\leq 2^{-256}$.
- **Seamless 0G Synergy**: Unified 0G Chain, 0G Storage, and 0G Compute into a single cohesive, high-performance financial protocol.
- **Interactive 3D Visual Experience**: Created a Three.js 3D WebGL visual interface that makes complex cryptographic proofs intuitive and accessible.

---

## 2. 2-Minute Demo Video Script & Storyboard

| Timestamp | Visual Screen | Voiceover Script |
|---|---|---|
| **0:00 - 0:20** | **Problem Intro**: Red market charts & "Black Box AI" graphic. | *"DeFAI is booming, but it has a fatal flaw: black-box trading bots with unverifiable track records. How do you know an AI agent didn't fake its predictions after the price already moved? Enter Sentix on 0G."* |
| **0:20 - 0:45** | **Three.js Dashboard**: Rotating 3D 0G Consensus Core and storage shards in `frontend/index.html`. | *"Sentix is the first verifiable quant strategy vault. Our Three.js WebGL interface visualizes the 0G network topology in real time. Liquidity providers deposit 0G tokens into our non-custodial StrategyVault."* |
| **0:45 - 1:15** | **Live Commit-Reveal Cycle**: Pressing "Run Quant Cycle" and watching the 3D pulse + terminal log. | *"Watch the magic happen: In Phase 1, our AI quant engine generates a trade signal, archives its full reasoning trace to 0G Storage, and commits a cryptographic hash on 0G Chain. The parameters are locked before execution."* |
| **1:15 - 1:40** | **Proof Modal Inspection**: Opening the 0G Reasoning Proof Modal showing the Merkle root, salt, and LLM trace. | *"In Phase 2, the agent reveals the trade. The smart contract validates the Keccak256 hash on-chain before executing. Anyone can click 'Inspect Proof' to verify the exact 0G Storage Merkle root and LLM reasoning chain."* |
| **1:40 - 2:00** | **Terminal & Summary**: Showing `npm run test:contracts` (14/14 passing) and 0G Galileo explorer link. | *"With 14 passing automated test suites and live 0G testnet compatibility, Sentix brings trustless, lookahead-free AI finance to the 0G ecosystem. Thank you."* |

---

## 3. Judging Criteria Matrix

| Criterion | Weight | How Sentix Delivers |
|---|---|---|
| **0G Technology Synergy** | 35% | Leverages 0G Chain for commit-reveal settlement and 0G Storage for immutable reasoning & market data archives. |
| **Technical Execution** | 30% | 14/14 passing smart contract unit tests, robust TypeScript architecture, mathematical anti-tampering verification. |
| **Innovation & Problem Fit** | 20% | Solves the core credibility problem in algorithmic trading (lookahead bias and retroactive backfitting). |
| **Design & User Experience** | 15% | Interactive Three.js WebGL 3D network topology, real-time telemetry, and one-click proof verification modal. |
