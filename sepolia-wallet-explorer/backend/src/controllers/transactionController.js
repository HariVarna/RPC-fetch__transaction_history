const { ethers } = require('ethers');
const transactionService = require('../services/transactionService');
const rpcService = require('../services/rpcService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');
const { sanitize, safeLogger } = require('../utils/sanitizer');

const DEFAULT_MAX_BLOCK_RANGE = 50;
const DEFAULT_FALLBACK_WINDOW = 5;
const MAX_BLOCK_NUMBER = 100000000;
const REQUEST_TIMEOUT_MS = 60000;

const getTransactions = async (req, res) => {
  const { address, startBlock, endBlock, network: rawNetwork } = req.query;
  const networkConfig = rpcService.getNetworkConfig(rawNetwork || 'sepolia');
  const networkKey = networkConfig.id;

  // 1. Prevent array/object injection or missing address
  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'address query parameter must be a non-empty string' });
  }

  // 2. Validate Ethereum address format
  const { valid, error, normalizedAddress } = validateAndNormalizeAddress(address.trim());
  if (!valid) {
    return res.status(400).json({ error: `Invalid address: ${error}` });
  }

  // 3. Resolve and validate block range (optional parameters support)
  const maxRange = parseInt(process.env.MAX_BLOCK_RANGE, 10) || DEFAULT_MAX_BLOCK_RANGE;
  let start;
  let end;

  const hasStart = typeof startBlock === 'string' && startBlock.trim() !== '';
  const hasEnd = typeof endBlock === 'string' && endBlock.trim() !== '';

  try {
    const provider = rpcService.getProvider(networkKey);
    if (!hasStart || !hasEnd) {
      const latestBlockBig = await rpcService.withTimeout(provider.getBlockNumber(), 8000, `eth_blockNumber (${networkConfig.name})`);
      const latestBlock = Number(latestBlockBig);

      if (!hasStart && !hasEnd) {
        end = latestBlock;
        start = Math.max(0, latestBlock - (DEFAULT_FALLBACK_WINDOW - 1));
      } else if (hasStart && !hasEnd) {
        const trimmedStart = startBlock.trim();
        if (!/^\d+$/.test(trimmedStart)) {
          return res.status(400).json({ error: 'startBlock must be a valid non-negative integer' });
        }
        start = Number(trimmedStart);
        end = Math.min(start + maxRange - 1, latestBlock);
      } else if (!hasStart && hasEnd) {
        const trimmedEnd = endBlock.trim();
        if (!/^\d+$/.test(trimmedEnd)) {
          return res.status(400).json({ error: 'endBlock must be a valid non-negative integer' });
        }
        end = Number(trimmedEnd);
        start = Math.max(0, end - maxRange + 1);
      }
    } else {
      const trimmedStart = startBlock.trim();
      const trimmedEnd = endBlock.trim();

      if (!/^\d+$/.test(trimmedStart)) {
        return res.status(400).json({ error: 'startBlock must be a valid non-negative integer' });
      }
      if (!/^\d+$/.test(trimmedEnd)) {
        return res.status(400).json({ error: 'endBlock must be a valid non-negative integer' });
      }

      start = Number(trimmedStart);
      end = Number(trimmedEnd);
    }
  } catch (rpcErr) {
    safeLogger.error(`Failed to resolve latest block from ${networkConfig.name} RPC:`, rpcErr.message);
    const detailMsg = sanitize(rpcErr.message);
    return res.status(503).json({
      error: `Unable to query latest block height from ${networkConfig.name} RPC provider (${detailMsg}). Please check your RPC connection or specify startBlock and endBlock explicitly.`,
      details: detailMsg
    });
  }

  // Integer boundary checks
  if (!Number.isSafeInteger(start) || start < 0 || start > MAX_BLOCK_NUMBER) {
    return res.status(400).json({ error: `startBlock must be a safe integer between 0 and ${MAX_BLOCK_NUMBER}` });
  }
  if (!Number.isSafeInteger(end) || end < 0 || end > MAX_BLOCK_NUMBER) {
    return res.status(400).json({ error: `endBlock must be a safe integer between 0 and ${MAX_BLOCK_NUMBER}` });
  }
  if (end < start) {
    return res.status(400).json({ error: 'endBlock must be greater than or equal to startBlock' });
  }

  const requestedRange = end - start + 1;
  const originalStart = start;
  const originalEnd = end;
  let isWindowClamped = false;
  let rangeNotice = null;

  // If custom range exceeds max allowed batch, scan the upper window ending at endBlock
  if (requestedRange > maxRange) {
    start = Math.max(start, end - maxRange + 1);
    isWindowClamped = true;
    rangeNotice = `Requested range spans ${requestedRange.toLocaleString()} blocks. Scanned ${maxRange} blocks (${start.toLocaleString()} → ${end.toLocaleString()}) to prevent RPC timeout.`;
  }

  // 5. Timeout protection wrapper
  let isCompleted = false;
  const timeoutTimer = setTimeout(() => {
    if (!isCompleted && !res.headersSent) {
      isCompleted = true;
      safeLogger.warn(`Request timeout for address ${normalizedAddress} on ${networkConfig.name} blocks ${start}-${end}`);
      res.status(504).json({ error: 'Request timed out while scanning blocks. Please try a smaller block range.' });
    }
  }, REQUEST_TIMEOUT_MS);

  try {
    const provider = rpcService.getProvider(networkKey);
    const [transactions, balanceWei, nonce] = await Promise.all([
      transactionService.fetchWalletTransactions({
        address: normalizedAddress,
        startBlock: hasStart ? start : (hasEnd ? start : null),
        endBlock: hasEnd ? end : (hasStart ? end : null),
        network: networkKey
      }),
      provider.getBalance(normalizedAddress).catch(() => 0n),
      provider.getTransactionCount(normalizedAddress).catch(() => 0)
    ]);

    if (isCompleted || res.headersSent) return;
    isCompleted = true;
    clearTimeout(timeoutTimer);

    return res.json({
      address: normalizedAddress,
      network: networkConfig.name,
      networkId: networkConfig.id,
      chainId: networkConfig.chainId.toString(),
      explorerUrl: networkConfig.explorerUrl,
      currency: networkConfig.currency,
      startBlock: hasStart ? start : (transactions.length > 0 ? Math.min(...transactions.map(t => t.blockNumber)) : 0),
      endBlock: hasEnd ? end : (transactions.length > 0 ? Math.max(...transactions.map(t => t.blockNumber)) : end),
      originalStartBlock: originalStart,
      originalEndBlock: originalEnd,
      isWindowClamped,
      rangeNotice,
      account: {
        balance: ethers.formatEther(balanceWei),
        balanceWei: balanceWei.toString(),
        nonce: Number(nonce)
      },
      transactionCount: transactions.length,
      transactions
    });
  } catch (err) {
    if (isCompleted || res.headersSent) return;
    isCompleted = true;
    clearTimeout(timeoutTimer);

    safeLogger.error(`API Error in /transactions (${networkConfig.name}):`, err.message);

    const sanitizedMessage = sanitize(err.message);
    const statusCode = err.message.includes('rate limit') || err.status === 429 ? 429 : 500;

    return res.status(statusCode).json({
      error: `Failed to retrieve transactions on ${networkConfig.name}`,
      details: sanitizedMessage
    });
  }
};

module.exports = {
  getTransactions
};
