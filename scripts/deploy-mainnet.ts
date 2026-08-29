import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("================================================================================");
  console.log("             SENTIX (QUANT0G) - 0G MAINNET PRODUCTION DEPLOYMENT                ");
  console.log("================================================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`[Deployer Address] ${deployer.address}`);
  console.log(`[Network Chain ID] ${network.chainId}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[Deployer Balance] ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    console.warn("\n[WARNING] Deployer balance is 0.0 0G.");
    console.warn("Please ensure your wallet has native 0G tokens on Mainnet before broadcasting transactions.");
    console.warn(`Target Address: ${deployer.address}\n`);
  }

  // 1. Deploy ZeroGProofRegistry
  console.log("\n[1/3] Deploying ZeroGProofRegistry on 0G Mainnet...");
  const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`  [PASS] ZeroGProofRegistry: ${registryAddress}`);
  console.log(`  [Explorer] https://chainscan.0g.ai/address/${registryAddress}`);

  // 2. Deploy QuantOracle
  console.log("\n[2/3] Deploying QuantOracle on 0G Mainnet...");
  const OracleFactory = await ethers.getContractFactory("QuantOracle");
  const oracle = await OracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`  [PASS] QuantOracle:        ${oracleAddress}`);
  console.log(`  [Explorer] https://chainscan.0g.ai/address/${oracleAddress}`);

  // 3. Deploy StrategyVault
  console.log("\n[3/3] Deploying StrategyVault on 0G Mainnet...");
  const VaultFactory = await ethers.getContractFactory("StrategyVault");
  const vault = await VaultFactory.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`  [PASS] StrategyVault:      ${vaultAddress}`);
  console.log(`  [Explorer] https://chainscan.0g.ai/address/${vaultAddress}`);

  // 4. Wire Multi-Contract Integration
  console.log("\n[Wiring Contracts] Connecting Registry & Oracle to StrategyVault...");
  const wireTx1 = await vault.setProofRegistry(registryAddress);
  await wireTx1.wait();
  const wireTx2 = await vault.setQuantOracle(oracleAddress);
  await wireTx2.wait();
  console.log("  [PASS] Contracts Connected Successfully on 0G Mainnet.");

  // Save deployment artifact
  const deploymentData = {
    network: "0G Mainnet",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ZeroGProofRegistry: registryAddress,
      QuantOracle: oracleAddress,
      StrategyVault: vaultAddress,
    },
    explorers: {
      ZeroGProofRegistry: `https://chainscan.0g.ai/address/${registryAddress}`,
      QuantOracle: `https://chainscan.0g.ai/address/${oracleAddress}`,
      StrategyVault: `https://chainscan.0g.ai/address/${vaultAddress}`,
    },
  };

  const outDir = path.join(__dirname, "..", "config");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "mainnet-deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n================================================================================");
  console.log("                   0G MAINNET DEPLOYMENT COMPLETE                               ");
  console.log("================================================================================");
  console.log(`ZeroGProofRegistry: ${registryAddress}`);
  console.log(`QuantOracle:        ${oracleAddress}`);
  console.log(`StrategyVault:      ${vaultAddress}`);
  console.log(`Saved deployment:   config/mainnet-deployment.json`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
