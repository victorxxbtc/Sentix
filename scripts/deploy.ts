import { ethers } from "hardhat";

async function main() {
  console.log("================================================================================");
  console.log("             SENTIX (QUANT0G) - 0G GALILEO TESTNET DEPLOYMENT                   ");
  console.log("================================================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`[Deployer Address] ${deployer.address}`);
  console.log(`[Network Chain ID] ${network.chainId}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[Deployer Balance] ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    console.warn("\n[WARNING] Deployer balance is 0.0 0G. Please fund your wallet via the 0G Galileo Testnet Faucet before on-chain deployment.");
    console.warn(`0G Faucet URL: https://faucet.0g.ai`);
    console.warn(`Target Address: ${deployer.address}\n`);
  }

  // 1. Deploy ZeroGProofRegistry
  console.log("\n[1/3] Deploying ZeroGProofRegistry...");
  const RegistryFactory = await ethers.getContractFactory("ZeroGProofRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`  [PASS] ZeroGProofRegistry: ${registryAddress}`);
  console.log(`  [Explorer] https://chainscan-galileo.0g.ai/address/${registryAddress}`);

  // 2. Deploy QuantOracle
  console.log("\n[2/3] Deploying QuantOracle...");
  const OracleFactory = await ethers.getContractFactory("QuantOracle");
  const oracle = await OracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`  [PASS] QuantOracle:        ${oracleAddress}`);
  console.log(`  [Explorer] https://chainscan-galileo.0g.ai/address/${oracleAddress}`);

  // 3. Deploy StrategyVault
  console.log("\n[3/3] Deploying StrategyVault...");
  const VaultFactory = await ethers.getContractFactory("StrategyVault");
  const vault = await VaultFactory.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`  [PASS] StrategyVault:      ${vaultAddress}`);
  console.log(`  [Explorer] https://chainscan-galileo.0g.ai/address/${vaultAddress}`);

  // 4. Wire Multi-Contract Integration
  console.log("\n[Wiring Contracts] Connecting Registry & Oracle to StrategyVault...");
  await vault.setProofRegistry(registryAddress);
  await vault.setQuantOracle(oracleAddress);
  console.log("  [PASS] Contracts Connected Successfully.");

  console.log("\n================================================================================");
  console.log("                   0G GALILEO TESTNET DEPLOYMENT COMPLETE                       ");
  console.log("================================================================================");
  console.log(`ZeroGProofRegistry: ${registryAddress}`);
  console.log(`QuantOracle:        ${oracleAddress}`);
  console.log(`StrategyVault:      ${vaultAddress}`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
