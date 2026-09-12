const transactionService = require('../services/transactionService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');
const { sanitize, safeLogger } = require('../utils/sanitizer');

const DEFAULT_MAX_BLOCK_RANGE = 50;
const MAX_BLOCK_NUMBER = 100000000;
const REQUEST_TIMEOUT_MS = 30000;

const getTransactions = async (req, res) => {
  const { address, startBlock, endBlock } = req.query;

  // 1. Prevent array/object injection or missing query parameters
  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'address query parameter must be a non-empty string' });
  }
  if (typeof startBlock !== 'string' || !startBlock.trim()) {
    return res.status(400).json({ error: 'startBlock query parameter must be a non-empty string' });
  }
  if (typeof endBlock !== 'string' || !endBlock.trim()) {
    return res.status(400).json({ error: 'endBlock query parameter must be a non-empty string' });
  }

  // 2. Validate Ethereum address format
  const { valid, error, normalizedAddress } = validateAndNormalizeAddress(address.trim());
  if (!valid) {
    return res.status(400).json({ error: `Invalid address: ${error}` });
  }

  // 3. Strict Integer Validation (prevent hex, float, exponents, NaN, negative)
  const trimmedStart = startBlock.trim();
  const trimmedEnd = endBlock.trim();

  if (!/^\d+$/.test(trimmedStart)) {
    return res.status(400).json({ error: 'startBlock must be a valid non-negative integer' });
  }
  if (!/^\d+$/.test(trimmedEnd)) {
    return res.status(400).json({ error: 'endBlock must be a valid non-negative integer' });
  }

  const start = Number(trimmedStart);
  const end = Number(trimmedEnd);

  if (!Number.isSafeInteger(start) || start < 0 || start > MAX_BLOCK_NUMBER) {
    return res.status(400).json({ error: `startBlock must be a safe integer between 0 and ${MAX_BLOCK_NUMBER}` });
  }
  if (!Number.isSafeInteger(end) || end < 0 || end > MAX_BLOCK_NUMBER) {
    return res.status(400).json({ error: `endBlock must be a safe integer between 0 and ${MAX_BLOCK_NUMBER}` });
  }
  if (end < start) {
    return res.status(400).json({ error: 'endBlock must be greater than or equal to startBlock' });
  }

  // 4. Enforce block range limit to prevent RPC denial of service
  const maxRange = parseInt(process.env.MAX_BLOCK_RANGE, 10) || DEFAULT_MAX_BLOCK_RANGE;
  const requestedRange = end - start + 1;
  if (requestedRange > maxRange) {
    return res.status(400).json({
      error: `Block range of ${requestedRange} exceeds maximum allowed limit of ${maxRange} blocks per request`
    });
  }

  // 5. Timeout protection wrapper
  let isCompleted = false;
  const timeoutTimer = setTimeout(() => {
    if (!isCompleted && !res.headersSent) {
      isCompleted = true;
      safeLogger.warn(`Request timeout for address ${normalizedAddress} on blocks ${start}-${end}`);
      res.status(504).json({ error: 'Request timed out while scanning blocks. Please try a smaller block range.' });
    }
  }, REQUEST_TIMEOUT_MS);

  try {
    const transactions = await transactionService.fetchWalletTransactions({
      address: normalizedAddress,
      startBlock: start,
      endBlock: end
    });

    if (isCompleted || res.headersSent) return;
    isCompleted = true;
    clearTimeout(timeoutTimer);

    return res.json({
      address: normalizedAddress,
      network: 'Sepolia',
      startBlock: start,
      endBlock: end,
      transactionCount: transactions.length,
      transactions
    });
  } catch (err) {
    if (isCompleted || res.headersSent) return;
    isCompleted = true;
    clearTimeout(timeoutTimer);

    safeLogger.error('API Error in /transactions:', err.message);

    const sanitizedMessage = sanitize(err.message);
    const statusCode = err.message.includes('rate limit') || err.status === 429 ? 429 : 500;

    return res.status(statusCode).json({
      error: 'Failed to retrieve transactions',
      details: sanitizedMessage
    });
  }
};

module.exports = {
  getTransactions
};
