import React from 'react';
import TransactionCard from './TransactionCard';

const TransactionList = ({ data, walletAddress }) => {
  if (!data) return null;

  if (data.transactions.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center bg-gray-800/30 border border-gray-700/30 rounded-2xl animate-in fade-in duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M8 16l-4-4 4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">No Transactions Found</h3>
        <p className="text-gray-500">
          No incoming or outgoing transactions were found for this address in the specified block range.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {data.transactions.map((tx) => (
        <TransactionCard key={tx.hash} tx={tx} walletAddress={walletAddress} />
      ))}
    </div>
  );
};

export default TransactionList;
