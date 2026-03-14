import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve("../.env") });

export default {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
    avalancheFuji: {
      url: process.env.FUJI_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 43113
    }
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    enabled: false
  }
};