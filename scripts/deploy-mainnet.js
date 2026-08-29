const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("================================================================================");
  console.log("             SENTIX (QUANT0G) - 0G MAINNET PRODUCTION DEPLOYMENT                ");
  console.log("================================================================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not defined in .env");
  }

  const rpcUrl = process.env.ZERO_G_MAINNET_RPC || "https://evmrpc.0g.ai";
  console.log(`[0G Mainnet RPC] ${rpcUrl}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  console.log(`[Connected Chain ID] ${network.chainId}`);
  console.log(`[Deployer Address]   ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`[Deployer Balance]   ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    throw new Error("Deployer balance is 0.0 0G on Mainnet. Please fund the deployer address.");
  }

  // Load contract artifacts
  const registryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ZeroGProofRegistry.sol/ZeroGProofRegistry.json"), "utf8")
  );
  const oracleArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/QuantOracle.sol/QuantOracle.json"), "utf8")
  );
  const vaultArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/StrategyVault.sol/StrategyVault.json"), "utf8")
  );

  // 1. Deploy ZeroGProofRegistry
  console.log("\n[1/3] Deploying ZeroGProofRegistry on 0G Mainnet...");
  const RegistryFactory = new ethers.ContractFactory(registryArtifact.abi, registryArtifact.bytecode, wallet);
  const registry = await RegistryFactory.deploy();
  console.log(`  Tx Hash: ${registry.deploymentTransaction()?.hash}`);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`  [PASS] ZeroGProofRegistry: ${registryAddress}`);
  console.log(`  [Explorer] https://chainscan.0g.ai/address/${registryAddress}`);

  // 2. Deploy QuantOracle
  console.log("\n[2/3] Deploying QuantOracle on 0G Mainnet...");
  const OracleFactory = new ethers.ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
  const oracle = await OracleFactory.deploy();
  console.log(`  Tx Hash: ${oracle.deploymentTransaction()?.hash}`);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`  [PASS] QuantOracle:        ${oracleAddress}`);
  console.log(`  [Explorer] https://chainscan.0g.ai/address/${oracleAddress}`);

  // 3. Deploy StrategyVault
  console.log("\n[3/3] Deploying StrategyVault on 0G Mainnet...");
  const VaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vault = await VaultFactory.deploy();
  console.log(`  Tx Hash: ${vault.deploymentTransaction()?.hash}`);
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
    deployer: wallet.address,
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
