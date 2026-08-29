const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env");
    return;
  }

  const rpcUrls = [
    process.env.ZERO_G_MAINNET_RPC || "https://rpc.0g.ai",
    "https://evmrpc.0g.ai"
  ];

  console.log("==================================================");
  console.log("[Sentix] Checking 0G Mainnet Connectivity");
  console.log("==================================================");

  let connected = false;

  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`Connecting to: ${rpcUrl}...`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      const network = await provider.getNetwork();
      console.log(`[PASS] Connected! Chain ID: ${network.chainId}`);
      console.log(`Deployer Address: ${wallet.address}`);

      const balance = await provider.getBalance(wallet.address);
      console.log(`0G Mainnet Balance: ${ethers.formatEther(balance)} 0G`);
      console.log(`Mainnet Explorer: https://chainscan.0g.ai/address/${wallet.address}`);
      connected = true;
      break;
    } catch (err) {
      console.warn(`[Warning] Could not connect to ${rpcUrl}: ${err.message}`);
    }
  }

  if (!connected) {
    console.log("[Info] 0G Mainnet RPC endpoints are currently pre-genesis / resolving. Galileo Testnet is active at Chain ID 16600.");
  }
}

main().catch(console.error);
