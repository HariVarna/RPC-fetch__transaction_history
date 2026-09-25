import React from 'react';
import { ethers } from 'ethers';

const TransactionCard = ({ tx, walletAddress, currency = 'ETH' }) => {
  const isOutgoing = tx.from?.toLowerCase() === walletAddress?.toLowerCase();
  const direction = isOutgoing ? 'OUTGOING' : 'INCOMING';

  const formatEth = (weiString) => {
    try {
      if (!weiString || weiString === '0') return `0 ${currency}`;
      const eth = ethers.formatEther(weiString);
      const parts = eth.split('.');
      if (parts.length === 1) return `${parts[0]} ${currency}`;
      const decimals = parts[1].slice(0, 8).replace(/0+$/, '');
      return decimals ? `${parts[0]}.${decimals} ${currency}` : `${parts[0]} ${currency}`;
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
    <div className="bg-black border border-neutral-700 p-4 font-mono text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold ${
            isOutgoing 
              ? 'border border-white text-white bg-black' 
              : 'bg-white text-black font-black'
          }`}>
            {direction}
          </span>
          <span className="text-white font-bold truncate max-w-[200px] md:max-w-md" title={tx.hash}>
            {tx.hash}
          </span>
        </div>
        <div>
          {tx.status === 'SUCCESS' && <span className="text-[10px] bg-white text-black px-1.5 py-0.5 font-bold">SUCCESS</span>}
          {tx.status === 'FAILED' && <span className="text-[10px] border border-white text-white px-1.5 py-0.5 font-bold">FAILED</span>}
          {tx.status === 'NULL_RECEIPT' && <span className="text-[10px] text-neutral-400 border border-neutral-600 px-1.5 py-0.5">PENDING</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 text-xs">
        <div>
          <span className="block text-neutral-500 mb-0.5 uppercase">From</span>
          <span className="text-neutral-200 break-all">{tx.from}</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-0.5 uppercase">To</span>
          <span className="text-neutral-200 break-all">{tx.to || 'Contract Creation'}</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-0.5 uppercase">Amount</span>
          <span className="font-bold text-white text-sm">{formatEth(tx.value)}</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-0.5 uppercase">Timestamp</span>
          <span className="text-neutral-300">{formatDate(tx.timestamp)}</span>
        </div>
        
        <div className="md:col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-[11px]">
          <div>
             <span className="block text-neutral-500 uppercase">Block</span>
             <span className="text-white font-bold">{tx.blockNumber} (idx: {tx.transactionIndex})</span>
          </div>
          <div>
             <span className="block text-neutral-500 uppercase">Gas Used</span>
             <span className="text-neutral-200">{tx.receipt?.gasUsed ? parseInt(tx.receipt.gasUsed).toLocaleString() : 'N/A'}</span>
          </div>
          <div>
             <span className="block text-neutral-500 uppercase">Gas Price</span>
             <span className="text-neutral-200">
               {tx.receipt?.effectiveGasPrice 
                 ? `${Number(ethers.formatUnits(tx.receipt.effectiveGasPrice, 'gwei')).toFixed(2)} Gwei` 
                 : (tx.gasPrice ? `${Number(ethers.formatUnits(tx.gasPrice, 'gwei')).toFixed(2)} Gwei` : 'N/A')}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
