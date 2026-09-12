const { getProvider } = require('./rpcService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');

/**
 * Scans a specific range of blocks for transactions involving a wallet address.
 * 
 * @param {Object} params
 * @param {string} params.address - The Ethereum address to scan for.
 * @param {number} params.startBlock - The starting block number (inclusive).
 * @param {number} params.endBlock - The ending block number (inclusive).
 * @param {Function} [params.onProgress] - Optional callback for progress reporting.
 * @returns {Promise<Array>} Array of matching transactions.
 */
const scanBlocksForAddress = async ({ address, startBlock, endBlock, onProgress }) => {
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

  const provider = getProvider();
  const matchingTransactions = [];
  const totalBlocks = endBlock - startBlock + 1;

  // 3. Scan Each Block
  for (let i = 0; i < totalBlocks; i++) {
    const currentBlock = startBlock + i;
    
    try {
      // Retrieve the complete block with transactions (pass true for prefetch)
      const block = await provider.getBlock(currentBlock, true);
      
      if (!block) {
        throw new Error(`Block ${currentBlock} not found or returned null`);
      }

      // 4. Inspect every transaction
      const transactions = block.prefetchedTransactions || [];

      for (const tx of transactions) {
        // Handle contract creation transactions where "to" is null
        const from = tx.from ? tx.from.toLowerCase() : null;
        const to = tx.to ? tx.to.toLowerCase() : null;

        // Match case-insensitively
        if (from === normalizedAddress || to === normalizedAddress) {
          matchingTransactions.push({
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
            timestamp: block.timestamp
          });
        }
      }

      // 5. Progress Reporting
      if (onProgress) {
        onProgress({
          currentBlock,
          startBlock,
          endBlock,
          percentageComplete: Math.round(((i + 1) / totalBlocks) * 100),
          matchingTransactionsCount: matchingTransactions.length
        });
      }
    } catch (err) {
      throw new Error(`Error scanning block ${currentBlock}: ${err.message}`);
    }
  }

  return matchingTransactions;
};

module.exports = {
  scanBlocksForAddress
};
