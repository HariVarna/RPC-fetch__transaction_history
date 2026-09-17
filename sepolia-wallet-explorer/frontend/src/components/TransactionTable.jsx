import React, { useState } from 'react';
import { ethers } from 'ethers';

const TransactionTable = ({ transactions, walletAddress }) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const truncateAddress = (addr) => {
    if (!addr) return 'Contract Creation';
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 12)}...`;
  };

  const getMethodName = (tx) => {
    if (!tx.to) return 'Create Contract';
    const input = tx.input || '0x';
    if (input === '0x' || input === '0x00') return 'Transfer';

    const selector = input.slice(0, 10).toLowerCase();
    switch (selector) {
      case '0xa9059cbb': return 'Transfer';
      case '0x095ea7b3': return 'Approve';
      case '0x23b872dd': return 'Transfer From';
      case '0x6a627842': return 'Mint';
      case '0x3593564c': return 'Execute';
      case '0x6a761202': return 'Exec Transact...';
      default: return selector;
    }
  };

  const formatRelativeAge = (timestampStr, blockTimestamp) => {
    const timestampMs = blockTimestamp 
      ? blockTimestamp * 1000 
      : (timestampStr ? new Date(timestampStr).getTime() : Date.now());
    
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - timestampMs) / 1000));

    if (diffSec < 60) return `${diffSec} secs ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatEthValue = (weiString) => {
    try {
      if (!weiString || weiString === '0') return '0 ETH';
      const eth = ethers.formatEther(weiString);
      const num = parseFloat(eth);
      if (num === 0) return '0 ETH';
      if (num < 0.0001) return '< 0.0001 ETH';
      return `${parseFloat(num.toFixed(6))} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  const calculateTxnFee = (tx) => {
    try {
      if (!tx.receipt?.gasUsed) return '0.000000';
      const gasUsed = BigInt(tx.receipt.gasUsed);
      const effectiveGasPrice = tx.receipt.effectiveGasPrice 
        ? BigInt(tx.receipt.effectiveGasPrice) 
        : (tx.gasPrice ? BigInt(tx.gasPrice) : 0n);
      
      const feeWei = gasUsed * effectiveGasPrice;
      const feeEth = ethers.formatEther(feeWei);
      return parseFloat(Number(feeEth).toFixed(8)).toString();
    } catch {
      return '-';
    }
  };

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    const headers = ['Txn Hash', 'Block', 'Age', 'From', 'Direction', 'To', 'Value (ETH)', 'Txn Fee (ETH)', 'Status'];
    const rows = transactions.map(tx => {
      const isOut = tx.from?.toLowerCase() === walletAddress?.toLowerCase();
      return [
        tx.hash,
        tx.blockNumber,
        tx.timestamp,
        tx.from,
        isOut ? 'OUT' : 'IN',
        tx.to || 'Contract Creation',
        ethers.formatEther(tx.value || '0'),
        calculateTxnFee(tx),
        tx.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sepolia_tx_${walletAddress.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 font-mono">
      <div className="bg-black rounded-none border-2 border-white shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-200 border-collapse">
            <thead className="bg-neutral-950 text-neutral-400 font-bold border-b-2 border-white uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <span className="text-neutral-500 font-normal">👁</span>
                </th>
                <th className="py-3 px-4 text-white">Txn Hash</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Block</th>
                <th className="py-3 px-3">Age</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-2 text-center w-14"></th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Txn Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {transactions.map((tx, idx) => {
                const isOut = tx.from?.toLowerCase() === walletAddress?.toLowerCase();
                const method = getMethodName(tx);
                const age = formatRelativeAge(tx.timestamp, tx.blockTimestamp);
                const fee = calculateTxnFee(tx);
                const amount = formatEthValue(tx.value);
                const etherscanTxUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
                const etherscanBlockUrl = `https://sepolia.etherscan.io/block/${tx.blockNumber}`;

                return (
                  <tr 
                    key={tx.hash || idx} 
                    className="hover:bg-neutral-900 transition-colors"
                  >
                    {/* Quick view eye icon */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
                        title="View details"
                      >
                        👁
                      </button>
                    </td>

                    {/* Transaction Hash */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={etherscanTxUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white hover:underline font-bold"
                          title={tx.hash}
                        >
                          {truncateHash(tx.hash)}
                        </a>
                        <button
                          onClick={() => copyToClipboard(tx.hash, `tx-${idx}`)}
                          className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                          title="Copy Tx Hash"
                        >
                          {copiedKey === `tx-${idx}` ? '✓' : '⧉'}
                        </button>
                      </div>
                    </td>

                    {/* Method Badge */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-none bg-neutral-900 text-white border border-neutral-700 max-w-[110px] truncate text-center uppercase" title={method}>
                        {method}
                      </span>
                    </td>

                    {/* Block */}
                    <td className="py-3 px-3">
                      <a 
                        href={etherscanBlockUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:underline"
                      >
                        {tx.blockNumber}
                      </a>
                    </td>

                    {/* Age */}
                    <td className="py-3 px-3 text-neutral-400 whitespace-nowrap" title={tx.timestamp}>
                      {age}
                    </td>

                    {/* From */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className={isOut ? 'text-neutral-400' : 'text-white font-medium hover:underline cursor-pointer'} 
                          title={tx.from}
                        >
                          {truncateAddress(tx.from)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.from, `from-${idx}`)}
                          className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                          title="Copy From Address"
                        >
                          {copiedKey === `from-${idx}` ? '✓' : '⧉'}
                        </button>
                      </div>
                    </td>

                    {/* IN / OUT Badge (Stark 2D Monochrome) */}
                    <td className="py-3 px-2 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black border border-white text-white bg-black">
                          OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-white text-black">
                          IN
                        </span>
                      )}
                    </td>

                    {/* To */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {tx.to ? (
                          <>
                            <span 
                              className={!isOut ? 'text-neutral-400' : 'text-white font-medium hover:underline cursor-pointer'} 
                              title={tx.to}
                            >
                              {truncateAddress(tx.to)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(tx.to, `to-${idx}`)}
                              className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                              title="Copy To Address"
                            >
                              {copiedKey === `to-${idx}` ? '✓' : '⧉'}
                            </button>
                          </>
                        ) : (
                          <span className="italic text-neutral-500 text-xs">Contract Creation</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {amount}
                    </td>

                    {/* Txn Fee */}
                    <td className="py-3 px-4 text-right text-neutral-400 text-[11px]">
                      {fee}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with CSV Export */}
        <div className="py-3 px-6 bg-black border-t-2 border-white flex items-center justify-between text-xs text-neutral-400">
          <span>{transactions.length} transaction{transactions.length === 1 ? '' : 's'} recorded</span>
          <button
            onClick={exportCSV}
            className="text-white hover:underline font-bold uppercase cursor-pointer"
          >
            [ Download CSV Export 📥 ]
          </button>
        </div>
      </div>

      {/* Flat 2D Modal Detail Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black border-2 border-white max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                <span>Transaction Details</span>
                {selectedTx.status === 'SUCCESS' ? (
                  <span className="text-[10px] bg-white text-black px-1.5 py-0.5 font-bold">SUCCESS</span>
                ) : (
                  <span className="text-[10px] border border-white text-white px-1.5 py-0.5 font-bold">FAILED</span>
                )}
              </h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-white hover:bg-neutral-800 px-2 py-1 font-bold text-sm border border-white"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 uppercase block mb-1">Transaction Hash</span>
                <span className="text-white break-all bg-neutral-950 p-2.5 border border-neutral-800 block">{selectedTx.hash}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Block Height</span>
                  <span className="text-white font-bold">{selectedTx.blockNumber} (Idx: {selectedTx.transactionIndex})</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Timestamp</span>
                  <span className="text-white">{selectedTx.timestamp}</span>
                </div>
              </div>
              <div>
                <span className="text-neutral-500 uppercase block mb-1">From</span>
                <span className="text-white break-all bg-neutral-950 p-2.5 border border-neutral-800 block">{selectedTx.from}</span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase block mb-1">To</span>
                <span className="text-white break-all bg-neutral-950 p-2.5 border border-neutral-800 block">{selectedTx.to || 'Contract Creation'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-800">
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Value</span>
                  <span className="font-bold text-white text-sm">{formatEthValue(selectedTx.value)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Gas Used</span>
                  <span className="text-white">{selectedTx.receipt?.gasUsed || selectedTx.gas}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Txn Fee</span>
                  <span className="text-white font-bold">{calculateTxnFee(selectedTx)} ETH</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <a
                href={`https://sepolia.etherscan.io/tx/${selectedTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white border border-white transition-colors"
              >
                View on Sepolia Etherscan ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
