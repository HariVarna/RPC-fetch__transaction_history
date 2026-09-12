const transactionService = require('../services/transactionService');

const getTransactions = async (req, res) => {
  const { address } = req.params;
  // Use query params for block range, default to a small safe range if not provided
  const startBlock = parseInt(req.query.startBlock || 6000000);
  const endBlock = parseInt(req.query.endBlock || 6000000);

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const transactions = await transactionService.fetchWalletTransactions({
      address,
      startBlock,
      endBlock
    });

    return res.json({ 
      address,
      startBlock,
      endBlock,
      transactions
    });
  } catch (error) {
    console.error(`Error fetching transactions for ${address}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
};

module.exports = {
  getTransactions
};
