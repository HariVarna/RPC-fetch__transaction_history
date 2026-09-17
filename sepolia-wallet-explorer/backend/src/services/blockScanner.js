const { getProvider, withTimeout } = require('./rpcService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');
const { sanitize } = require('../utils/sanitizer');

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 5000;
const BLOCK_FETCH_TIMEOUT_MS = 10000;

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
 * Fetches a block with timeout, exponential backoff, and rate limit handling.
 */
const fetchBlockWithRetry = async (provider, blockNumber, options = {}) => {
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : DEFAULT_MAX_RETRIES;
  const baseDelay = options.baseDelay || DEFAULT_BASE_DELAY_MS;
  const maxDelay = options.maxDelay || DEFAULT_MAX_DELAY_MS;
  const timeoutMs = options.timeoutMs || BLOCK_FETCH_TIMEOUT_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let block;
      if (typeof provider.send === 'function') {
        const hexBlock = '0x' + blockNumber.toString(16);
        const raw = await (withTimeout 
          ? withTimeout(provider.send('eth_getBlockByNumber', [hexBlock, true]), timeoutMs, `eth_getBlockByNumber(${blockNumber})`) 
          : provider.send('eth_getBlockByNumber', [hexBlock, true]));
        
        if (!raw) {
          throw new Error(`Block ${blockNumber} not found or returned null`);
        }
        
        block = {
          number: typeof raw.number === 'string' ? parseInt(raw.number, 16) : raw.number,
          timestamp: typeof raw.timestamp === 'string' ? parseInt(raw.timestamp, 16) : raw.timestamp,
          prefetchedTransactions: (raw.transactions || []).map((t, idx) => ({
            hash: t.hash,
            blockNumber: typeof t.blockNumber === 'string' ? parseInt(t.blockNumber, 16) : (t.blockNumber || blockNumber),
            index: typeof t.transactionIndex === 'string' ? parseInt(t.transactionIndex, 16) : (t.index !== undefined ? t.index : idx),
            from: t.from,
            to: t.to,
            value: typeof t.value === 'string' ? (t.value.startsWith('0x') ? BigInt(t.value).toString() : t.value) : (t.value ? t.value.toString() : '0'),
            gasLimit: typeof t.gas === 'string' ? (t.gas.startsWith('0x') ? BigInt(t.gas).toString() : t.gas) : (t.gasLimit ? t.gasLimit.toString() : '0'),
            gasPrice: typeof t.gasPrice === 'string' ? (t.gasPrice.startsWith('0x') ? BigInt(t.gasPrice).toString() : t.gasPrice) : (t.gasPrice ? t.gasPrice.toString() : '0'),
            nonce: typeof t.nonce === 'string' ? (t.nonce.startsWith('0x') ? parseInt(t.nonce, 16) : t.nonce) : t.nonce,
            type: typeof t.type === 'string' ? (t.type.startsWith('0x') ? parseInt(t.type, 16) : t.type) : t.type,
            data: t.input || t.data || '0x'
          }))
        };
      } else {
        const blockPromise = provider.getBlock(blockNumber, true);
        block = await (withTimeout ? withTimeout(blockPromise, timeoutMs, `eth_getBlockByNumber(${blockNumber})`) : blockPromise);
      }
      
      if (!block) {
        throw new Error(`Block ${blockNumber} not found or returned null`);
      }
      if (typeof block !== 'object' || block.number === undefined || block.number === null) {
        throw new Error(`Block ${blockNumber} returned malformed response`);
      }

      return block;
    } catch (err) {
      const sanitizedErr = sanitize(err.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch block ${blockNumber} after ${maxRetries + 1} attempts: ${sanitizedErr}`);
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
        options.onRetry({ blockNumber, attempt: attempt + 1, delay, error: sanitizedErr });
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
        if (!tx || typeof tx !== 'object' || !tx.hash) continue;
        // Handle contract creation transactions where "to" is null
        const from = tx.from ? String(tx.from).toLowerCase() : null;
        const to = tx.to ? String(tx.to).toLowerCase() : null;

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
