const transactionService = require('../services/transactionService');
const { validateAndNormalizeAddress } = require('../utils/addressValidator');
const { safeLogger, sanitize } = require('../utils/sanitizer');

const getTransactions = async (req, res) => {
  const { address } = req.params;
  const startBlock = parseInt(req.query.startBlock || 6000000, 10);
  const endBlock = parseInt(req.query.endBlock || 6000000, 10);

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const { valid, error, normalizedAddress } = validateAndNormalizeAddress(address);
  if (!valid) {
    return res.status(400).json({ error: `Invalid address: ${error}` });
  }

  if (isNaN(startBlock) || isNaN(endBlock) || startBlock < 0 || endBlock < startBlock) {
    return res.status(400).json({ error: 'Invalid block range' });
  }

  if (endBlock - startBlock + 1 > 50) {
    return res.status(400).json({ error: 'Block range cannot exceed 50 blocks' });
  }

  try {
    const transactions = await transactionService.fetchWalletTransactions({
      address: normalizedAddress,
      startBlock,
      endBlock
    });

    return res.json({ 
      address: normalizedAddress,
      startBlock,
      endBlock,
      transactions
    });
  } catch (error) {
    safeLogger.error(`Error fetching transactions for ${normalizedAddress}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch transactions', details: sanitize(error.message) });
  }
};

module.exports = {
  getTransactions
};
