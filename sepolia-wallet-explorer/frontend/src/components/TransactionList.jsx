import React, { useState } from 'react';
import TransactionTable from './TransactionTable';
import TransactionCard from './TransactionCard';

const TransactionList = ({ data, walletAddress }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  if (!data) return null;

  if (data.transactions.length === 0) {
    const etherscanUrl = `https://sepolia.etherscan.io/address/${data.address}`;
    return (
      <div className="w-full max-w-6xl mx-auto p-8 text-center bg-gray-800/40 border border-gray-700/50 rounded-2xl animate-in fade-in duration-500 shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 border border-gray-700/50 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">No Transactions in Scanned Range</h3>
        <p className="text-gray-400 text-sm max-w-lg mx-auto mb-5 leading-relaxed">
          No transactions occurred for this address in the scanned blocks ({data.startBlock} → {data.endBlock}).
        </p>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 max-w-lg mx-auto text-left text-xs text-gray-400 space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">1.</span>
            <span>If you know the block where your transaction took place, enter it in <strong>Start Block</strong> and <strong>End Block</strong> above.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">2.</span>
            <span>Or click below to view the entire historical archive indexed by Etherscan since block 0.</span>
          </div>
        </div>

        <a
          href={etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <span>View All Lifetime Transactions on Etherscan</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Transactions ({data.transactions.length})
        </h3>
        <div className="flex items-center gap-1 bg-gray-800/80 p-1 rounded-lg border border-gray-700/50 text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Cards View
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <TransactionTable transactions={data.transactions} walletAddress={walletAddress} />
      ) : (
        <div className="space-y-4">
          {data.transactions.map((tx) => (
            <TransactionCard key={tx.hash} tx={tx} walletAddress={walletAddress} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
