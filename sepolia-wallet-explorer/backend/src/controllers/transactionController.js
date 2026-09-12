const transactionService = require('../services/transactionService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');

const MAX_BLOCK_RANGE = 100; // Define a reasonable maximum block range

const getTransactions = async (req, res) => {
  const { address, startBlock, endBlock } = req.query;

  // 1. Validate required query parameters
  if (!address) return res.status(400).json({ error: 'address query parameter is required' });
  if (startBlock === undefined) return res.status(400).json({ error: 'startBlock query parameter is required' });
  if (endBlock === undefined) return res.status(400).json({ error: 'endBlock query parameter is required' });

  // 2. Validate Ethereum address
  const { valid, error, normalizedAddress } = validateAndNormalizeAddress(address);
  if (!valid) return res.status(400).json({ error: `Invalid address: ${error}` });

  // 3. Validate block numbers
  const start = parseInt(startBlock, 10);
  const end = parseInt(endBlock, 10);

  if (isNaN(start) || start < 0) {
    return res.status(400).json({ error: 'startBlock must be a valid number >= 0' });
  }
  if (isNaN(end) || end < start) {
    return res.status(400).json({ error: 'endBlock must be a valid number >= startBlock' });
  }

  // 4. Enforce block range limit
  if (end - start + 1 > MAX_BLOCK_RANGE) {
    return res.status(400).json({ error: `Block range cannot exceed ${MAX_BLOCK_RANGE} blocks per request` });
  }

  try {
    // 5. Fetch transactions
    const transactions = await transactionService.fetchWalletTransactions({
      address: normalizedAddress,
      startBlock: start,
      endBlock: end
    });

    // 6. Return standard formatted response
    return res.json({
      address: normalizedAddress,
      network: 'Sepolia',
      startBlock: start,
      endBlock: end,
      transactionCount: transactions.length,
      transactions
    });
  } catch (err) {
    console.error('API Error in /transactions:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve transactions', details: err.message });
  }
};

module.exports = {
  getTransactions
};
