import { ethers } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";
import { QuantTradingEngine } from "../packages/quant-engine/src";

async function main() {
  console.log("========================================================");
  console.log("[Sentix] Running Live DeFAI Commit-Reveal Test on 0G");
  console.log("========================================================");

  const [deployer, lpUser] = await ethers.getSigners();
  const storage = new ZeroGStorageClient();
  const quant = new QuantTradingEngine();

  // 1. Deploy ZeroGProofRegistry and StrategyVault
  const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`[PASS] ZeroGProofRegistry deployed: ${registryAddress}`);

  const VaultFactory = await ethers.getContractFactory("StrategyVault");
  const vault = await VaultFactory.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  await vault.setProofRegistry(registryAddress);
  console.log(`[PASS] StrategyVault deployed:      ${vaultAddress}`);

  // 2. LP Deposit
  const depositTx = await vault.connect(lpUser).deposit({ value: ethers.parseEther("1.0") });
  await depositTx.wait();
  console.log("[PASS] LP User deposited 1.0 0G to Vault");

  // 3. AI Agent Generates Trade Decision & Commit Hash
  const decision = await quant.analyzeMarketSentiment("0G/USDT");
  console.log(`\n[0G Compute AI] Trade Decision: ${decision.action} on ${decision.targetPair}`);
  console.log(`   - Alpha Expected: +${decision.expectedAlphaBps} bps`);
  console.log(`   - Model Reasoning: "${decision.reasoningTrace}"`);

  // 4. Archive Market Snapshot to 0G Storage
  const snapshot = await storage.archiveMarketSnapshot({
    pair: decision.targetPair,
    reasoning: decision.reasoningTrace,
    timestamp: Date.now(),
  });
  console.log(`[PASS] Market Snapshot Stored on 0G Storage (Root: ${snapshot.storageRoot})`);
  console.log(`[PASS] 0G Storage Chunks: ${snapshot.chunkCount} (${snapshot.totalBytes} bytes)`);

  // 5. Register Proof in ZeroGProofRegistry
  const regTx = await registry.registerProof(snapshot.storageRoot, snapshot.chunkCount, snapshot.dataUri);
  await regTx.wait();
  const proofId = await registry.rootToProofId(snapshot.storageRoot);
  console.log(`[PASS] Proof Registered on-chain (Proof ID #${proofId})`);

  // 6. Commit Trade Hash to 0G Chain
  const commitTx = await vault.commitTradeWithProof(decision.commitHash, snapshot.storageRoot, proofId);
  const commitReceipt = await commitTx.wait();
  console.log(`[PASS] Trade Intent Committed on 0G Chain (Tx: ${commitReceipt?.hash})`);

  // 7. Reveal & Execute Trade
  const amount = ethers.parseEther("0.1");
  const executeTx = await vault.executeTrade(1, decision.action, amount, decision.salt, ethers.parseEther("0.015"));
  const executeReceipt = await executeTx.wait();
  console.log(`[PASS] Trade Verified & Executed on 0G Chain (Tx: ${executeReceipt?.hash})`);
  console.log("\n[PASS] All commit-reveal and 0G storage verification checks passed.");
  console.log("========================================================");
}

main().catch(console.error);
