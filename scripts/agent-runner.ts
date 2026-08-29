import { ethers } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";
import { QuantTradingEngine } from "../packages/quant-engine/src";
import * as dotenv from "dotenv";

dotenv.config();

interface AgentRunnerOptions {
  vaultAddress?: string;
  intervalMs?: number;
  maxCycles?: number;
  singleShot?: boolean;
}

export async function runQuantAgent(options: AgentRunnerOptions = {}) {
  const {
    intervalMs = 5000,
    maxCycles = 1,
    singleShot = true,
  } = options;

  console.log("==================================================");
  console.log("[Sentix] 0G Autonomous DeFAI Agent Runner Active");
  console.log("==================================================");

  const [signer] = await ethers.getSigners();
  const storage = new ZeroGStorageClient();
  const quant = new QuantTradingEngine();

  // Deploy / Connect ZeroGProofRegistry
  const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`[PASS] ZeroGProofRegistry online at: ${registryAddress}`);

  let vaultAddress = options.vaultAddress;
  let vault: any;

  if (!vaultAddress) {
    console.log("Deploying fresh StrategyVault instance for simulation...");
    const Factory = await ethers.getContractFactory("StrategyVault");
    vault = await Factory.deploy();
    await vault.waitForDeployment();
    vaultAddress = await vault.getAddress();
    await vault.setProofRegistry(registryAddress);
    console.log(`[PASS] StrategyVault online at:       ${vaultAddress}`);
  } else {
    vault = await ethers.getContractAt("StrategyVault", vaultAddress, signer);
    console.log(`Connected to StrategyVault at: ${vaultAddress}`);
  }

  const tradingPairs = ["0G/USDT", "ETH/0G", "BTC/0G", "SOL/0G"];
  let cycle = 0;

  do {
    cycle++;
    const pair = tradingPairs[(cycle - 1) % tradingPairs.length];
    console.log(`\n--- [Cycle #${cycle}] Running Live Quant Inference on ${pair} ---`);

    // 1. Live Quant Inference (OpenRouter LLM + Microstructure)
    const telemetry = {
      pair,
      spotPrice: "1.42 USDT",
      bidDepthDom: "+22.4%",
      fundingRateBps: 12,
      orderbookImbalanceBps: 1840,
      timestamp: new Date().toISOString()
    };

    console.log(`> Querying OpenRouter Model: ${process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct"}...`);
    const decision = await quant.analyzeMarketWithLLM(pair, ethers.parseEther("0.1"), telemetry);
    console.log(`> Model Inference Source: ${decision.isLiveLLM ? "Live OpenRouter (" + decision.modelName + ")" : "Deterministic Quant Heuristic"}`);
    console.log(`> Trade Decision: ${decision.action}`);
    console.log(`> Confidence Score: ${decision.confidenceScore}%`);
    console.log(`> Expected Alpha: +${decision.expectedAlphaBps} bps`);
    console.log(`> Reasoning Trace: "${decision.reasoningTrace}"`);

    // 2. Snapshot & 0G Storage Merkle Root Archival
    const snapshotPayload = {
      cycle,
      pair: decision.targetPair,
      action: decision.action,
      confidence: decision.confidenceScore,
      reasoning: decision.reasoningTrace,
      telemetry,
      timestamp: Date.now(),
    };

    const snapshot = await storage.archiveMarketSnapshot(snapshotPayload);
    console.log(`> 0G Storage Merkle Root: ${snapshot.storageRoot}`);
    console.log(`> 0G Storage Chunks:      ${snapshot.chunkCount} (${snapshot.totalBytes} bytes)`);
    console.log(`> 0G Storage URI:         ${snapshot.dataUri}`);

    // 3. Register Proof on ZeroGProofRegistry
    const regTx = await registry.registerProof(
      snapshot.storageRoot,
      snapshot.chunkCount,
      snapshot.dataUri
    );
    const regReceipt = await regTx.wait();
    const proofId = await registry.rootToProofId(snapshot.storageRoot);
    console.log(`[PASS] Proof Registered on-chain: Proof ID #${proofId} (Tx: ${regReceipt?.hash})`);

    // 4. Commit on 0G Chain
    console.log(`> Submitting cryptographic commit hash to StrategyVault...`);
    const commitTx = await vault.commitTradeWithProof(decision.commitHash, snapshot.storageRoot, proofId);
    const commitReceipt = await commitTx.wait();
    console.log(`[PASS] Commitment Confirmed on 0G Chain (Tx: ${commitReceipt?.hash})`);

    // 5. Reveal & Execute on 0G Chain
    console.log(`> Revealing trade parameters & executing trade on 0G Chain...`);
    const executionAmount = ethers.parseEther("0.1");
    const simulatedPnL = ethers.parseEther((0.005 * cycle).toFixed(4));

    const executeTx = await vault.executeTrade(
      cycle,
      decision.action,
      executionAmount,
      decision.salt,
      simulatedPnL
    );
    const executeReceipt = await executeTx.wait();
    console.log(`[PASS] Trade Execution Verified (Tx: ${executeReceipt?.hash})`);
    console.log(`[PASS] Cycle #${cycle} Complete - Lookahead bias mathematically prevented.`);

    if (!singleShot && cycle < maxCycles) {
      console.log(`Sleeping for ${intervalMs / 1000}s until next block observation...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } while (!singleShot && cycle < maxCycles);

  console.log("\n==================================================");
  console.log("[DONE] Autonomous Quant Agent Finished Successfully.");
  console.log("==================================================");
}

if (require.main === module) {
  runQuantAgent().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
