import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";

describe("ZeroGProofRegistry & QuantOracle Integration", function () {
  this.timeout(120000);

  let registry: any;
  let oracle: any;
  let owner: any;
  let agent: any;
  let user: any;
  const storageClient = new ZeroGStorageClient();

  beforeEach(async () => {
    [owner, agent, user] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    const OracleFactory = await ethers.getContractFactory("QuantOracle");
    oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();

    // Authorize agent
    await registry.setSubmitterAuthorization(agent.address, true);
    await oracle.setOracleUpdater(agent.address);
  });

  describe("ZeroGProofRegistry Core Lifecycle", () => {
    it("should allow authorized agent to register and confirm a 0G Storage Merkle root", async () => {
      const sampleTelemetry = {
        pair: "0G/USDT",
        bidImbalance: 1450,
        reasoningTrace: "Orderbook bid depth increased by 34% on 0G DEX.",
        modelConfidence: 8940,
        timestamp: Date.now(),
      };

      const archiveResult = await storageClient.archiveMarketSnapshot(sampleTelemetry);

      const tx = await registry.connect(agent).registerProof(
        archiveResult.storageRoot,
        archiveResult.chunkCount,
        archiveResult.dataUri
      );
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const isConfirmed = await registry.isProofConfirmed(archiveResult.storageRoot);
      expect(isConfirmed).to.be.true;

      const proofId = await registry.rootToProofId(archiveResult.storageRoot);
      expect(proofId).to.equal(1n);

      const proofData = await registry.getProof(proofId);
      expect(proofData.storageRoot).to.equal(archiveResult.storageRoot);
      expect(proofData.chunkCount).to.equal(archiveResult.chunkCount);
      expect(proofData.dataUri).to.equal(archiveResult.dataUri);
      expect(proofData.submitter).to.equal(agent.address);
      expect(proofData.isConfirmed).to.be.true;
    });

    it("should reject proof registration from unauthorized callers", async () => {
      const sampleTelemetry = { pair: "ETH/0G" };
      const archiveResult = await storageClient.archiveMarketSnapshot(sampleTelemetry);

      await expect(
        registry.connect(user).registerProof(
          archiveResult.storageRoot,
          archiveResult.chunkCount,
          archiveResult.dataUri
        )
      ).to.be.revertedWith("ZeroGProofRegistry: caller not authorized");
    });

    it("should reject empty storage root or zero chunk counts", async () => {
      const emptyRoot = ethers.ZeroHash;

      await expect(
        registry.connect(agent).registerProof(emptyRoot, 5, "zg://chunk/0")
      ).to.be.revertedWith("ZeroGProofRegistry: empty storage root");

      const validRoot = ethers.hexlify(ethers.randomBytes(32));
      await expect(
        registry.connect(agent).registerProof(validRoot, 0, "zg://chunk/0")
      ).to.be.revertedWith("ZeroGProofRegistry: chunk count must be > 0");
    });

    it("should cryptographically verify Merkle inclusion proof for storage chunks", async () => {
      const testData = {
        signal: "BUY",
        depthSnapshot: [100, 200, 300, 400],
        modelHash: "0xabcdef1234567890",
      };

      const archive = await storageClient.archiveMarketSnapshot(testData);

      // Register root on-chain first
      await registry.connect(agent).registerProof(
        archive.storageRoot,
        archive.chunkCount,
        archive.dataUri
      );

      const leafIndex = 0;
      const inclusionProof = storageClient.getInclusionProof(archive.storageRoot, leafIndex);

      expect(inclusionProof).to.not.be.null;
      if (inclusionProof) {
        const isValid = await registry.verifyMerkleProof(
          archive.storageRoot,
          inclusionProof.proof,
          inclusionProof.leafHash
        );
        expect(isValid).to.be.true;
      }
    });
  });

  describe("QuantOracle Feed Updates", () => {
    it("should allow updater to submit telemetry and return fresh data", async () => {
      const tx = await oracle.connect(agent).updateTelemetry(
        "0G/USDT",
        ethers.parseEther("1.42"),
        1850, // +185 bps imbalance
        -12,  // -0.12% funding rate
        9240  // 92.4% model confidence
      );
      await tx.wait();

      const telemetry = await oracle.getTelemetry("0G/USDT");
      expect(telemetry.price).to.equal(ethers.parseEther("1.42"));
      expect(telemetry.orderbookImbalance).to.equal(1850n);
      expect(telemetry.fundingRateBps).to.equal(-12n);
      expect(telemetry.confidenceScore).to.equal(9240n);
      expect(telemetry.isFresh).to.be.true;
    });

    it("should reject updates from unauthorized accounts", async () => {
      await expect(
        oracle.connect(user).updateTelemetry("0G/USDT", ethers.parseEther("1.42"), 100, 0, 9000)
      ).to.be.revertedWith("QuantOracle: caller not oracle updater");
    });
  });
});
