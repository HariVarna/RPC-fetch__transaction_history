const { ethers } = require('ethers');
const { safeLogger, sanitize } = require('../utils/sanitizer');

let cachedProvider = null;
let cachedRpcUrl = null;

const DEFAULT_RPC_TIMEOUT_MS = 10000;

const getProvider = () => {
  if (!process.env.SEPOLIA_RPC_URL) {
    require('dotenv').config();
  }
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL is missing in environment variables. Please check your backend/.env configuration.');
  }
  if (!cachedProvider || cachedRpcUrl !== rpcUrl) {
    cachedProvider = new ethers.JsonRpcProvider(rpcUrl);
    cachedRpcUrl = rpcUrl;
  }
  return cachedProvider;
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

const checkRpcHealth = async () => {
  try {
    const provider = getProvider();

    const networkPromise = provider.getNetwork();
    const blockPromise = provider.getBlockNumber();

    const [network, latestBlock] = await withTimeout(
      Promise.all([networkPromise, blockPromise]),
      5000,
      'RPC health check'
    );

    // Validate Chain ID. Sepolia chain ID is 11155111.
    if (network.chainId !== 11155111n) {
      throw new Error(`Wrong network connected. Expected Sepolia (11155111), got ${network.chainId}`);
    }

    return {
      connected: true,
      chainId: network.chainId.toString(),
      network: 'Sepolia',
      latestBlock: latestBlock.toString()
    };
  } catch (error) {
    safeLogger.error("RPC Health Check Error:", error.message);
    if (error.code === 'BAD_DATA' || error.code === 'SERVER_ERROR' || error.code === 'NETWORK_ERROR') {
      throw new Error(`Invalid RPC response from provider: ${sanitize(error.message)}`);
    }
    throw new Error(`RPC check failed: ${sanitize(error.message)}`);
  }
};

const getBlock = async (blockNumber, prefetch = true, timeoutMs = DEFAULT_RPC_TIMEOUT_MS) => {
  try {
    const provider = getProvider();
    return await withTimeout(
      provider.getBlock(blockNumber, prefetch),
      timeoutMs,
      `eth_getBlockByNumber(${blockNumber})`
    );
  } catch (error) {
    throw new Error(`Failed to fetch block ${blockNumber}: ${sanitize(error.message)}`);
  }
};

const getTransactionReceipt = async (hash, timeoutMs = 8000) => {
  try {
    const provider = getProvider();
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
  getProvider,
  checkRpcHealth,
  getBlock,
  getTransactionReceipt,
  withTimeout
};

