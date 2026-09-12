const ethereumService = require('../services/ethereumService');

const getTransactions = async (req, res) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Basic validation of ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    // Call service to get transactions (to be implemented later as requested)
    const transactions = await ethereumService.fetchTransactionsForAddress(address);

    return res.json({ 
      address,
      transactions,
      message: 'Transaction scanning will be implemented in the next phase.'
    });
  } catch (error) {
    console.error(`Error fetching transactions for ${address}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

module.exports = {
  getTransactions
};
