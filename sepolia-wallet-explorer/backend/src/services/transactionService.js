const blockScanner = require('./blockScanner');
const rpcService = require('./rpcService');

/**
 * Fetches transactions and their corresponding receipts for a given address in a block range.
 */
const fetchWalletTransactions = async ({ address, startBlock, endBlock, onProgress }) => {
  // 1. Scan blocks to find matching transactions
  const transactions = await blockScanner.scanBlocksForAddress({ address, startBlock, endBlock, onProgress });

  // 2. Fetch receipts for each found transaction
  const enrichedTransactions = await Promise.all(transactions.map(async (tx) => {
    try {
      const receipt = await rpcService.getTransactionReceipt(tx.hash);
      
      let status = 'UNKNOWN';
      let receiptData = {
        gasUsed: null,
        effectiveGasPrice: null,
        contractAddress: null,
        logs: []
      };

      if (receipt) {
        if (receipt.status === 1) status = 'SUCCESS';
        else if (receipt.status === 0) status = 'FAILED';

        receiptData = {
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
          // Ethers v6 maps effectiveGasPrice from the raw receipt to gasPrice on the Receipt object
          effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : null,
          contractAddress: receipt.contractAddress || null,
          logs: receipt.logs || []
        };
      } else {
        // Handle null receipt safely (e.g. if node doesn't have it yet or it's dropped)
        status = 'NULL_RECEIPT';
      }

      return {
        ...tx,
        status,
        receipt: receiptData
      };
    } catch (err) {
      console.error(`Error fetching receipt for ${tx.hash}:`, err.message);
      return {
        ...tx,
        status: 'ERROR',
        receipt: {
          gasUsed: null,
          effectiveGasPrice: null,
          contractAddress: null,
          logs: []
        }
      };
    }
  }));

  return enrichedTransactions;
};

module.exports = {
  fetchWalletTransactions
};
