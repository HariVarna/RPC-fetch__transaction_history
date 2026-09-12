const { getProvider } = require('./rpcService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 5000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if an error indicates rate limiting.
 */
const isRateLimitError = (error) => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code;
  const status = error.status || error.statusCode;
  return (
    status === 429 ||
    code === 429 ||
    code === 'TO_MANY_REQUESTS' ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('exceeded')
  );
};

/**
 * Fetches a block with exponential backoff and rate limit handling.
 */
const fetchBlockWithRetry = async (provider, blockNumber, options = {}) => {
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : DEFAULT_MAX_RETRIES;
  const baseDelay = options.baseDelay || DEFAULT_BASE_DELAY_MS;
  const maxDelay = options.maxDelay || DEFAULT_MAX_DELAY_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block) {
        throw new Error(`Block ${blockNumber} not found or returned null`);
      }
      return block;
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch block ${blockNumber} after ${maxRetries + 1} attempts: ${err.message}`);
      }

      let delay;
      if (isRateLimitError(err)) {
        // Extended exponential backoff for rate limits with jitter
        delay = Math.min(1500 * Math.pow(2, attempt) + Math.floor(Math.random() * 300), maxDelay * 2);
      } else {
        // Standard exponential backoff with jitter
        delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 200), maxDelay);
      }

      if (options.onRetry) {
        options.onRetry({ blockNumber, attempt: attempt + 1, delay, error: err.message });
      }

      await sleep(delay);
    }
  }
};

/**
 * Scans a specific range of blocks for transactions involving a wallet address,
 * using controlled concurrent batching, retries with exponential backoff, and strict ordering.
 * 
 * @param {Object} params
 * @param {string} params.address - The Ethereum address to scan for.
 * @param {number} params.startBlock - The starting block number (inclusive).
 * @param {number} params.endBlock - The ending block number (inclusive).
 * @param {number} [params.concurrency] - Optional concurrency override.
 * @param {Function} [params.onProgress] - Optional callback for progress reporting.
 * @param {Object} [params.retryOptions] - Optional retry settings (maxRetries, baseDelay, maxDelay, onRetry).
 * @returns {Promise<Array>} Array of matching transactions.
 */
const scanBlocksForAddress = async ({ address, startBlock, endBlock, concurrency, onProgress, retryOptions = {} }) => {
  // 1. Address Validation
  const { valid, normalizedAddress, error } = validateAndNormalizeAddress(address);
  if (!valid) {
    throw new Error(`Invalid address: ${error}`);
  }

  // 2. Validate Block Range
  if (typeof startBlock !== 'number' || typeof endBlock !== 'number') {
    throw new Error('startBlock and endBlock must be specified as numbers');
  }

  if (startBlock < 0 || endBlock < 0) {
    throw new Error('Block numbers must be positive integers');
  }

  if (startBlock > endBlock) {
    throw new Error('startBlock cannot be greater than endBlock');
  }

  // Determine concurrency limit: explicit param > env variable > default (5)
  const envConcurrency = parseInt(process.env.RPC_CONCURRENCY, 10);
  const activeConcurrency = Math.max(1, concurrency || (isNaN(envConcurrency) ? DEFAULT_CONCURRENCY : envConcurrency));

  const provider = getProvider();
  const matchingTransactions = [];
  const seenTxHashes = new Set();
  const totalBlocks = endBlock - startBlock + 1;
  let processedBlocks = 0;

  // 3. Process in batches with controlled concurrency
  for (let batchStart = startBlock; batchStart <= endBlock; batchStart += activeConcurrency) {
    const batchEnd = Math.min(batchStart + activeConcurrency - 1, endBlock);
    const batchBlockNumbers = [];
    for (let b = batchStart; b <= batchEnd; b++) {
      batchBlockNumbers.push(b);
    }

    // Fetch batch concurrently with individual block retries
    const batchBlocks = await Promise.all(
      batchBlockNumbers.map(blockNum => fetchBlockWithRetry(provider, blockNum, retryOptions))
    );

    // 4. Ensure batch blocks are ordered by blockNumber ascending
    batchBlocks.sort((a, b) => Number(a.number) - Number(b.number));

    // 5. Extract matching transactions for each block in order
    for (const block of batchBlocks) {
      const transactions = block.prefetchedTransactions || [];
      const blockTimestamp = block.timestamp;
      const timestamp = new Date(blockTimestamp * 1000).toISOString();

      const blockMatches = [];

      for (const tx of transactions) {
        // Handle contract creation transactions where "to" is null
        const from = tx.from ? tx.from.toLowerCase() : null;
        const to = tx.to ? tx.to.toLowerCase() : null;

        // Match case-insensitively
        if (from === normalizedAddress || to === normalizedAddress) {
          blockMatches.push({
            hash: tx.hash,
            blockNumber: tx.blockNumber,
            transactionIndex: tx.index,
            from: tx.from, // original casing
            to: tx.to,     // original casing or null
            value: tx.value ? tx.value.toString() : '0',
            gas: tx.gasLimit ? tx.gasLimit.toString() : '0',
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
            nonce: tx.nonce,
            type: tx.type,
            input: tx.data,
            timestamp,
            blockTimestamp
          });
        }
      }

      // Ensure transactions within the block are ordered by transactionIndex ascending
      blockMatches.sort((a, b) => a.transactionIndex - b.transactionIndex);

      // Append and avoid duplicates
      for (const match of blockMatches) {
        const lowerHash = match.hash.toLowerCase();
        if (!seenTxHashes.has(lowerHash)) {
          seenTxHashes.add(lowerHash);
          matchingTransactions.push(match);
        }
      }

      processedBlocks++;

      // Progress reporting
      if (onProgress) {
        onProgress({
          currentBlock: block.number,
          startBlock,
          endBlock,
          processedBlocks,
          totalBlocks,
          percentageComplete: Math.round((processedBlocks / totalBlocks) * 100),
          matchingTransactionsCount: matchingTransactions.length
        });
      }
    }
  }

  return matchingTransactions;
};

module.exports = {
  scanBlocksForAddress,
  fetchBlockWithRetry,
  isRateLimitError
};
