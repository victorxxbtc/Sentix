import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env");
    return;
  }

  const rpcUrl = process.env.ZERO_G_TESTNET_RPC || "https://rpc-galileo.0g.ai";
  console.log(`Connecting to 0G Galileo Testnet RPC: ${rpcUrl}...`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Wallet Address: ${wallet.address}`);

  try {
    const network = await provider.getNetwork();
    console.log(`Chain ID:       ${network.chainId}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`0G Balance:     ${ethers.formatEther(balance)} 0G`);
    console.log(`Explorer:       https://chainscan-galileo.0g.ai/address/${wallet.address}`);
  } catch (err: any) {
    console.error("Error querying 0G RPC:", err.message);
  }
}

main().catch(console.error);
