import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    zeroGTestnet: {
      url: process.env.ZERO_G_TESTNET_RPC || "https://rpc-galileo.0g.ai",
      accounts: [PRIVATE_KEY],
      chainId: 16600,
      timeout: 60000,
    },
    zeroGMainnet: {
      url: process.env.ZERO_G_MAINNET_RPC || "https://evmrpc.0g.ai",
      accounts: [PRIVATE_KEY],
      chainId: 16661,
      timeout: 60000,
    },
  },
};

export default config;
