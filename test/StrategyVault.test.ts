import { expect } from "chai";
import { ethers } from "hardhat";
import { QuantTradingEngine } from "../packages/quant-engine/src";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";

describe("StrategyVault (0G DeFAI Multi-Contract Integration)", function () {
  this.timeout(120000);

  let vault: any;
  let registry: any;
  let oracle: any;
  let owner: any;
  let agent: any;
  let user: any;
  const quantEngine = new QuantTradingEngine();
  const storageClient = new ZeroGStorageClient();

  beforeEach(async () => {
    [owner, agent, user] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    const OracleFactory = await ethers.getContractFactory("QuantOracle");
    oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();

    const VaultFactory = await ethers.getContractFactory("StrategyVault");
    vault = await VaultFactory.deploy();
    await vault.waitForDeployment();

    await vault.setTradingAgent(agent.address);
    await vault.setProofRegistry(await registry.getAddress());
    await vault.setQuantOracle(await oracle.getAddress());
    await registry.setSubmitterAuthorization(agent.address, true);
  });

  describe("Deployment & Multi-Contract Configuration", () => {
    it("should set deployer as initial owner and configure connected contracts", async () => {
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.aiTradingAgent()).to.equal(agent.address);
      expect(await vault.proofRegistry()).to.equal(await registry.getAddress());
      expect(await vault.quantOracle()).to.equal(await oracle.getAddress());
    });

    it("should allow owner to update trading agent address", async () => {
      await vault.connect(owner).setTradingAgent(user.address);
      expect(await vault.aiTradingAgent()).to.equal(user.address);
    });

    it("should reject agent update from non-owner", async () => {
      await expect(
        vault.connect(user).setTradingAgent(user.address)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });

  describe("Deposits and Withdrawals", () => {
    it("should accept deposits and track user balance and TVL", async () => {
      const depositAmount = ethers.parseEther("1.5");
      await vault.connect(user).deposit({ value: depositAmount });

      expect(await vault.userBalances(user.address)).to.equal(depositAmount);
      expect(await vault.totalVaultDeposits()).to.equal(depositAmount);
    });

    it("should reject deposit of zero value", async () => {
      await expect(vault.connect(user).deposit({ value: 0 })).to.be.revertedWith(
        "StrategyVault: deposit must be > 0"
      );
    });

    it("should allow users to withdraw their balance", async () => {
      const depositAmount = ethers.parseEther("2.0");
      await vault.connect(user).deposit({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("1.0");
      await vault.connect(user).withdraw(withdrawAmount);

      expect(await vault.userBalances(user.address)).to.equal(ethers.parseEther("1.0"));
      expect(await vault.totalVaultDeposits()).to.equal(ethers.parseEther("1.0"));
    });

    it("should reject withdrawal exceeding balance", async () => {
      const depositAmount = ethers.parseEther("1.0");
      await vault.connect(user).deposit({ value: depositAmount });

      await expect(
        vault.connect(user).withdraw(ethers.parseEther("2.0"))
      ).to.be.revertedWith("StrategyVault: insufficient balance");
    });
  });

  describe("Confirmable Commit-Reveal Trading Workflow with ZeroGProofRegistry", () => {
    it("should confirm proof on ZeroGProofRegistry and commit trade with verified proof ID", async () => {
      const sampleTelemetry = {
        pair: "0G/USDT",
        bidImbalance: 1800,
        reasoning: "Confirmed liquidity breakout on 0G DEX.",
      };
      const archiveResult = await storageClient.archiveMarketSnapshot(sampleTelemetry);

      // Register proof on ZeroGProofRegistry
      const regTx = await registry.connect(agent).registerProof(
        archiveResult.storageRoot,
        archiveResult.chunkCount,
        archiveResult.dataUri
      );
      await regTx.wait();

      const proofId = await registry.rootToProofId(archiveResult.storageRoot);
      expect(proofId).to.be.gt(0);

      // Generate trade commitment
      const tradeDecision = {
        action: "BUY",
        amount: "0.5",
        targetPair: "0G/USDT",
        confidence: 91,
        expectedAlphaBps: 180,
        reasoning: "Orderbook bid imbalance surge.",
        timestamp: Date.now(),
      };
      const commitPkg = quantEngine.createTradeCommitment(tradeDecision);

      // Commit trade linking confirmed storage proof
      const commitTx = await vault.connect(agent).commitTradeWithProof(
        commitPkg.commitHash,
        archiveResult.storageRoot,
        proofId
      );
      const commitReceipt = await commitTx.wait();
      expect(commitReceipt.status).to.equal(1);

      const commitment = await vault.commitments(1);
      expect(commitment.commitHash).to.equal(commitPkg.commitHash);
      expect(commitment.storageRoot).to.equal(archiveResult.storageRoot);
      expect(commitment.proofId).to.equal(proofId);
      expect(commitment.executed).to.be.false;
    });

    it("should reject commitTradeWithProof if storageRoot is not confirmed on ZeroGProofRegistry", async () => {
      const unconfirmedRoot = ethers.hexlify(ethers.randomBytes(32));
      const unconfirmedCommit = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        vault.connect(agent).commitTradeWithProof(unconfirmedCommit, unconfirmedRoot, 999)
      ).to.be.revertedWith("StrategyVault: storage root not confirmed in ZeroGProofRegistry");
    });

    it("should execute committed trade with valid preimage verification and update TVL", async () => {
      // User deposits funds into vault first
      await vault.connect(user).deposit({ value: ethers.parseEther("5.0") });

      const sampleTelemetry = { pair: "ETH/0G", bidImbalance: 1200 };
      const archiveResult = await storageClient.archiveMarketSnapshot(sampleTelemetry);

      await registry.connect(agent).registerProof(
        archiveResult.storageRoot,
        archiveResult.chunkCount,
        archiveResult.dataUri
      );
      const proofId = await registry.rootToProofId(archiveResult.storageRoot);

      const tradeDecision = {
        action: "BUY",
        amount: "0.25",
        targetPair: "ETH/0G",
        confidence: 88,
        expectedAlphaBps: 120,
        reasoning: "Cross-chain liquidity bridge trigger.",
        timestamp: Date.now(),
      };
      const commitPkg = quantEngine.createTradeCommitment(tradeDecision);

      await vault.connect(agent).commitTradeWithProof(
        commitPkg.commitHash,
        archiveResult.storageRoot,
        proofId
      );

      // Mine block to allow reveal
      await ethers.provider.send("evm_mine", []);

      // Execute trade with exact preimage parameters
      const amountWei = ethers.parseEther("0.25");
      const reportedProfit = ethers.parseEther("0.05"); // 0.05 0G profit

      const execTx = await vault.connect(agent).executeTrade(
        1,
        "BUY",
        amountWei,
        commitPkg.salt,
        reportedProfit
      );
      const execReceipt = await execTx.wait();
      expect(execReceipt.status).to.equal(1);

      const commitment = await vault.commitments(1);
      expect(commitment.executed).to.be.true;

      // TVL reflects deposits
      expect(await vault.totalVaultDeposits()).to.equal(ethers.parseEther("5.0"));
    });

    it("should reject trade execution if preimage parameters do not match commit hash", async () => {
      const sampleTelemetry = { pair: "BTC/0G" };
      const archiveResult = await storageClient.archiveMarketSnapshot(sampleTelemetry);

      await registry.connect(agent).registerProof(
        archiveResult.storageRoot,
        archiveResult.chunkCount,
        archiveResult.dataUri
      );
      const proofId = await registry.rootToProofId(archiveResult.storageRoot);

      const tradeDecision = {
        action: "SELL",
        amount: "0.5",
        targetPair: "BTC/0G",
        confidence: 94,
        expectedAlphaBps: 200,
        reasoning: "Funding rate arbitrage.",
        timestamp: Date.now(),
      };
      const commitPkg = quantEngine.createTradeCommitment(tradeDecision);

      await vault.connect(agent).commitTradeWithProof(
        commitPkg.commitHash,
        archiveResult.storageRoot,
        proofId
      );

      // Attempt to reveal with TAMPERED action ("BUY" instead of "SELL")
      const amountWei = ethers.parseEther("0.5");
      const tamperedSalt = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        vault.connect(agent).executeTrade(1, "BUY", amountWei, tamperedSalt, 0)
      ).to.be.revertedWith("StrategyVault: commitment hash mismatch");
    });
  });
});
