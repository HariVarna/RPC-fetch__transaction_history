const blockScanner = require('./blockScanner');
const rpcService = require('./rpcService');
const { safeLogger, sanitize } = require('../utils/sanitizer');

/**
 * Tries to fetch transaction history across large or unrestricted block ranges using public block explorers.
 */
const fetchIndexedTransactions = async (address, startBlock, endBlock, network = 'sepolia') => {
  try {
    const config = rpcService.getNetworkConfig(network);
    if (!config.blockscoutApi) return null;

    let url = `${config.blockscoutApi}?module=account&action=txlist&address=${address}&sort=desc`;
    if (startBlock !== undefined && startBlock !== null && startBlock !== '') {
      url += `&startblock=${startBlock}`;
    }
    if (endBlock !== undefined && endBlock !== null && endBlock !== '') {
      url += `&endblock=${endBlock}`;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map(tx => ({
        hash: tx.hash,
        blockNumber: Number(tx.blockNumber),
        transactionIndex: Number(tx.transactionIndex || tx.index || 0),
        from: tx.from,
        to: tx.to || null,
        value: tx.value || '0',
        gas: tx.gas || '0',
        gasPrice: tx.gasPrice || '0',
        nonce: Number(tx.nonce || 0),
        type: tx.type ? Number(tx.type) : 2,
        input: tx.input || '0x',
        timestamp: tx.timeStamp ? new Date(Number(tx.timeStamp) * 1000).toISOString() : new Date().toISOString(),
        blockTimestamp: tx.timeStamp ? Number(tx.timeStamp) : 0,
        status: (tx.isError === '0' || tx.txreceipt_status === '1') ? 'SUCCESS' : 'FAILED',
        receipt: {
          gasUsed: tx.gasUsed || null,
          effectiveGasPrice: tx.gasPrice || null,
          contractAddress: tx.contractAddress || null,
          logs: []
        }
      }));
    }
    return null;
  } catch (err) {
    safeLogger.warn(`Indexed history fetch skipped for ${network}, falling back to JSON-RPC scanner:`, err.message);
    return null;
  }
};

/**
 * Fetches transactions and their corresponding receipts for a given address.
 */
const fetchWalletTransactions = async ({ address, startBlock, endBlock, network = 'sepolia', onProgress, forceRpcScan = false }) => {
  const isLargeOrAll = !startBlock || !endBlock || (Number(endBlock) - Number(startBlock) + 1 > 50);

  // 1. If large range or no range given, try comprehensive transaction discovery
  if (!forceRpcScan && isLargeOrAll) {
    const indexed = await fetchIndexedTransactions(address, startBlock, endBlock, network);
    if (indexed !== null) {
      return indexed;
    }
  }

  // 2. Scan blocks via direct JSON-RPC to find matching transactions
  const effectiveStart = startBlock !== undefined && startBlock !== null ? Number(startBlock) : 0;
  const effectiveEnd = endBlock !== undefined && endBlock !== null ? Number(endBlock) : effectiveStart;

  const transactions = await blockScanner.scanBlocksForAddress({ 
    address, 
    startBlock: effectiveStart, 
    endBlock: effectiveEnd, 
    network,
    onProgress 
  });

  // 3. Fetch receipts for each found transaction via JSON-RPC
  const enrichedTransactions = await Promise.all(transactions.map(async (tx) => {
    try {
      const receipt = await rpcService.getTransactionReceipt(tx.hash, 8000, network);
      
      let status = 'UNKNOWN';
      let receiptData = {
        gasUsed: null,
        effectiveGasPrice: null,
        contractAddress: null,
        logs: []
      };

      if (receipt && typeof receipt === 'object') {
        if (receipt.status === 1 || receipt.status === '0x1') status = 'SUCCESS';
        else if (receipt.status === 0 || receipt.status === '0x0') status = 'FAILED';

        receiptData = {
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
          effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : null,
          contractAddress: receipt.contractAddress || null,
          logs: Array.isArray(receipt.logs) ? receipt.logs : []
        };
      } else {
        status = 'NULL_RECEIPT';
      }

      return {
        ...tx,
        status,
        receipt: receiptData
      };
    } catch (err) {
      safeLogger.error(`Error fetching receipt for ${tx.hash}:`, sanitize(err.message));
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
  fetchWalletTransactions,
  fetchIndexedTransactions
};
