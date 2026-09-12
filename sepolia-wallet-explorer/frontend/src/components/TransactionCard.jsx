import React from 'react';
import { ethers } from 'ethers';

const TransactionCard = ({ tx, walletAddress }) => {
  const isOutgoing = tx.from?.toLowerCase() === walletAddress?.toLowerCase();
  const direction = isOutgoing ? 'OUTGOING' : 'INCOMING';

  const formatEth = (weiString) => {
    try {
      if (!weiString || weiString === '0') return '0 ETH';
      const eth = ethers.formatEther(weiString);
      const parts = eth.split('.');
      if (parts.length === 1) return `${parts[0]} ETH`;
      const decimals = parts[1].slice(0, 8).replace(/0+$/, '');
      return decimals ? `${parts[0]}.${decimals} ETH` : `${parts[0]} ETH`;
    } catch {
      return 'Unknown';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      // Handle Unix timestamp in seconds (number or numeric string)
      if (typeof dateValue === 'number' || (/^\d+$/.test(dateValue) && !isNaN(Number(dateValue)))) {
        const ms = Number(dateValue) > 1e11 ? Number(dateValue) : Number(dateValue) * 1000;
        return new Date(ms).toLocaleString();
      }
      // Handle ISO timestamp string
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600 transition-colors shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 text-xs font-bold rounded-full ${
            isOutgoing 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {direction}
          </div>
          <span className="text-gray-400 text-sm font-mono truncate max-w-[150px] md:max-w-xs" title={tx.hash}>
            {tx.hash}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tx.status === 'SUCCESS' && <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg> Success</span>}
          {tx.status === 'FAILED' && <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg> Failed</span>}
          {tx.status === 'NULL_RECEIPT' && <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">Receipt Pending</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">From</span>
          <span className="font-mono text-gray-300 break-all">{tx.from}</span>
        </div>
        <div>
          <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">To</span>
          <span className="font-mono text-gray-300 break-all">{tx.to || <span className="italic text-gray-500">Contract Creation</span>}</span>
        </div>
        <div>
          <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Amount</span>
          <span className="font-semibold text-white text-base">{formatEth(tx.value)}</span>
        </div>
        <div>
          <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Timestamp</span>
          <span className="text-gray-300">{formatDate(tx.timestamp)}</span>
        </div>
        
        <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-gray-700/30">
          <div>
             <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Block / Index</span>
             <span className="text-gray-300 font-mono">{tx.blockNumber} <span className="text-gray-500 text-xs">(idx: {tx.transactionIndex})</span></span>
          </div>
          <div>
             <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Gas Used</span>
             <span className="text-gray-300">{tx.receipt?.gasUsed ? parseInt(tx.receipt.gasUsed).toLocaleString() : 'N/A'}</span>
          </div>
          <div>
             <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Gas Price</span>
             <span className="text-gray-300">
               {tx.receipt?.effectiveGasPrice 
                 ? `${(Number(tx.receipt.effectiveGasPrice) / 1e9).toFixed(2)} Gwei` 
                 : (tx.gasPrice ? `${(Number(tx.gasPrice) / 1e9).toFixed(2)} Gwei` : 'N/A')}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
