const { ethers } = require('ethers');
const { safeLogger, sanitize } = require('../utils/sanitizer');

const DEFAULT_RPC_TIMEOUT_MS = 10000;

const NETWORKS = {
  sepolia: {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111n,
    envKey: 'SEPOLIA_RPC_URL',
    defaultRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    blockscoutApi: 'https://eth-sepolia.blockscout.com/api'
  },
  robinhood: {
    id: 'robinhood',
    name: 'Robinhood Chain',
    chainId: 4663n,
    envKey: 'ROBINHOOD_RPC_URL',
    defaultRpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    currency: 'ETH',
    blockscoutApi: 'https://robinhoodchain.blockscout.com/api'
  },
  robinhood_testnet: {
    id: 'robinhood_testnet',
    name: 'Robinhood Chain Testnet',
    chainId: 46630n,
    envKey: 'ROBINHOOD_TESTNET_RPC_URL',
    defaultRpcUrl: 'https://rpc.testnet.chain.robinhood.com',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
    currency: 'ETH',
    blockscoutApi: 'https://explorer.testnet.chain.robinhood.com/api'
  }
};

const providersCache = new Map();

const normalizeNetwork = (net) => {
  if (!net || typeof net !== 'string') return 'sepolia';
  const lower = net.trim().toLowerCase();
  if (lower === 'robinhood' || lower === 'robinhood_mainnet' || lower === 'rh') return 'robinhood';
  if (lower === 'robinhood_testnet' || lower === 'rh_testnet' || lower === 'rhtestnet') return 'robinhood_testnet';
  return 'sepolia';
};

const getNetworkConfig = (networkKey = 'sepolia') => {
  const normKey = normalizeNetwork(networkKey);
  return NETWORKS[normKey] || NETWORKS.sepolia;
};

const getProvider = (networkKey = 'sepolia') => {
  const config = getNetworkConfig(networkKey);
  
  if (!process.env[config.envKey]) {
    require('dotenv').config();
  }
  
  const rpcUrl = process.env[config.envKey] || config.defaultRpcUrl;
  
  const cacheKey = `${config.id}:${rpcUrl}`;
  if (providersCache.has(cacheKey)) {
    return providersCache.get(cacheKey);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  providersCache.set(cacheKey, provider);
  return provider;
};

/**
 * Wraps any promise with a timeout rejection to prevent hanging RPC requests.
 */
const withTimeout = (promise, ms = DEFAULT_RPC_TIMEOUT_MS, operationName = 'RPC call') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${operationName} timed out after ${ms}ms`);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
};

const checkRpcHealth = async (networkKey = 'sepolia') => {
  try {
    const config = getNetworkConfig(networkKey);
    const provider = getProvider(networkKey);

    const networkPromise = provider.getNetwork();
    const blockPromise = provider.getBlockNumber();

    const [network, latestBlock] = await withTimeout(
      Promise.all([networkPromise, blockPromise]),
      6000,
      `RPC health check (${config.name})`
    );

    // Validate Chain ID
    if (network.chainId !== config.chainId) {
      safeLogger.warn(`Chain ID mismatch for ${config.name}. Expected ${config.chainId}, got ${network.chainId}`);
    }

    return {
      connected: true,
      chainId: network.chainId.toString(),
      network: config.name,
      networkId: config.id,
      explorerUrl: config.explorerUrl,
      latestBlock: latestBlock.toString()
    };
  } catch (error) {
    safeLogger.error(`RPC Health Check Error (${networkKey}):`, error.message);
    if (error.code === 'BAD_DATA' || error.code === 'SERVER_ERROR' || error.code === 'NETWORK_ERROR') {
      throw new Error(`Invalid RPC response from provider: ${sanitize(error.message)}`);
    }
    throw new Error(`RPC check failed: ${sanitize(error.message)}`);
  }
};

const getBlock = async (blockNumber, prefetch = true, timeoutMs = DEFAULT_RPC_TIMEOUT_MS, networkKey = 'sepolia') => {
  try {
    const provider = getProvider(networkKey);
    return await withTimeout(
      provider.getBlock(blockNumber, prefetch),
      timeoutMs,
      `eth_getBlockByNumber(${blockNumber})`
    );
  } catch (error) {
    throw new Error(`Failed to fetch block ${blockNumber}: ${sanitize(error.message)}`);
  }
};

const getTransactionReceipt = async (hash, timeoutMs = 8000, networkKey = 'sepolia') => {
  try {
    const provider = getProvider(networkKey);
    return await withTimeout(
      provider.getTransactionReceipt(hash),
      timeoutMs,
      `eth_getTransactionReceipt(${hash})`
    );
  } catch (error) {
    throw new Error(`Failed to fetch receipt for ${hash}: ${sanitize(error.message)}`);
  }
};

module.exports = {
  NETWORKS,
  normalizeNetwork,
  getNetworkConfig,
  getProvider,
  checkRpcHealth,
  getBlock,
  getTransactionReceipt,
  withTimeout
};
