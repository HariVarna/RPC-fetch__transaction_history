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
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">
      <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-700/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 border-collapse">
            <thead className="bg-gray-900/80 text-gray-400 font-semibold border-b border-gray-700/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">
                  <span className="text-gray-500 font-normal cursor-help" title="Click eye on any row to view full details">?</span>
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-300">Transaction Hash</th>
                <th className="py-3.5 px-3">Method</th>
                <th className="py-3.5 px-3">Block</th>
                <th className="py-3.5 px-3">Age</th>
                <th className="py-3.5 px-4">From</th>
                <th className="py-3.5 px-2 text-center w-14"></th>
                <th className="py-3.5 px-4">To</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">Txn Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40 font-mono">
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
                    className="hover:bg-gray-700/30 transition-colors group"
                  >
                    {/* Quick view eye icon */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-gray-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-gray-700/50 cursor-pointer"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>

                    {/* Transaction Hash */}
                    <td className="py-3 px-4 font-normal">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={etherscanTxUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                          title={tx.hash}
                        >
                          {truncateHash(tx.hash)}
                        </a>
                        <button
                          onClick={() => copyToClipboard(tx.hash, `tx-${idx}`)}
                          className="text-gray-500 hover:text-gray-300 p-0.5 rounded cursor-pointer"
                          title="Copy Tx Hash"
                        >
                          {copiedKey === `tx-${idx}` ? (
                            <span className="text-[10px] text-green-400 font-sans">✓</span>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Method Badge */}
                    <td className="py-3 px-3 font-sans">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-900/90 text-gray-300 border border-gray-700/60 max-w-[110px] truncate text-center" title={method}>
                        {method}
                      </span>
                    </td>

                    {/* Block */}
                    <td className="py-3 px-3">
                      <a 
                        href={etherscanBlockUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {tx.blockNumber}
                      </a>
                    </td>

                    {/* Age */}
                    <td className="py-3 px-3 text-gray-400 font-sans whitespace-nowrap" title={tx.timestamp}>
                      {age}
                    </td>

                    {/* From */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className={isOut ? 'text-gray-300' : 'text-blue-400 hover:underline cursor-pointer'} 
                          title={tx.from}
                        >
                          {truncateAddress(tx.from)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.from, `from-${idx}`)}
                          className="text-gray-500 hover:text-gray-300 p-0.5 rounded cursor-pointer"
                          title="Copy From Address"
                        >
                          {copiedKey === `from-${idx}` ? (
                            <span className="text-[10px] text-green-400 font-sans">✓</span>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* IN / OUT Badge */}
                    <td className="py-3 px-2 text-center font-sans">
                      {isOut ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          IN
                        </span>
                      )}
                    </td>

                    {/* To */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {tx.to ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span 
                              className={!isOut ? 'text-gray-300' : 'text-blue-400 hover:underline cursor-pointer'} 
                              title={tx.to}
                            >
                              {truncateAddress(tx.to)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(tx.to, `to-${idx}`)}
                              className="text-gray-500 hover:text-gray-300 p-0.5 rounded cursor-pointer"
                              title="Copy To Address"
                            >
                              {copiedKey === `to-${idx}` ? (
                                <span className="text-[10px] text-green-400 font-sans">✓</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="italic text-gray-500 font-sans text-xs">Contract Creation</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-semibold text-gray-200 font-sans">
                      {amount}
                    </td>

                    {/* Txn Fee */}
                    <td className="py-3 px-4 text-right text-gray-400 text-[11px]">
                      {fee}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with CSV Export */}
        <div className="py-3 px-6 bg-gray-900/60 border-t border-gray-700/40 flex items-center justify-between text-xs text-gray-400">
          <span>Showing {transactions.length} transaction{transactions.length === 1 ? '' : 's'} in range</span>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline font-sans cursor-pointer"
          >
            <span>[ Download: <strong className="font-semibold">CSV Export</strong> 📥 ]</span>
          </button>
        </div>
      </div>

      {/* Modal Detail Drawer when eye icon clicked */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Transaction Details</span>
                {selectedTx.status === 'SUCCESS' ? (
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Success</span>
                ) : (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Failed</span>
                )}
              </h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5 font-medium">Transaction Hash</span>
                <span className="font-mono text-gray-200 break-all bg-gray-900/60 p-2 rounded border border-gray-700/40 block">{selectedTx.hash}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Block Height</span>
                  <span className="font-mono text-blue-400">{selectedTx.blockNumber} (Tx Index: {selectedTx.transactionIndex})</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Timestamp</span>
                  <span className="text-gray-200">{selectedTx.timestamp}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5 font-medium">From</span>
                <span className="font-mono text-gray-200 break-all bg-gray-900/60 p-2 rounded border border-gray-700/40 block">{selectedTx.from}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5 font-medium">To</span>
                <span className="font-mono text-gray-200 break-all bg-gray-900/60 p-2 rounded border border-gray-700/40 block">{selectedTx.to || 'Contract Creation'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-700/40">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Value</span>
                  <span className="font-semibold text-white text-sm">{formatEthValue(selectedTx.value)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Gas Used</span>
                  <span className="text-gray-200">{selectedTx.receipt?.gasUsed || selectedTx.gas}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Txn Fee</span>
                  <span className="text-emerald-400 font-semibold">{calculateTxnFee(selectedTx)} ETH</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-700/60">
              <a
                href={`https://sepolia.etherscan.io/tx/${selectedTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5"
              >
                <span>View on Sepolia Etherscan ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
