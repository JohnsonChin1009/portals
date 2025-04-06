import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: '0.8.28',
  paths: {
    sources: './contracts', // Path to your contracts
    tests: './test', // Path to your test files
    cache: './cache', // Path to cache directory
    artifacts: './artifacts', // Path to artifacts directory
  },
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: "A86MIV2WAJMYVGT25YK892SH7S67K8P7XH",
    },
  },
};

export default config;