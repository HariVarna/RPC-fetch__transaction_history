import React from 'react';

const WalletSummary = ({ data }) => {
  if (!data) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Scan Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Wallet Address</span>
          <span className="font-mono text-sm text-gray-200 truncate block" title={data.address}>
            {data.address}
          </span>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Network</span>
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {data.network}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Block Range</span>
          <span className="font-mono text-sm text-blue-300">
            {data.startBlock} → {data.endBlock}
          </span>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Transactions Found</span>
          <span className="text-lg font-semibold text-purple-400">
            {data.transactionCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;
