import React, { useState } from 'react';
import TransactionTable from './TransactionTable';
import TransactionCard from './TransactionCard';

const TransactionList = ({ data, walletAddress, network }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  if (!data) return null;

  const explorerBase = data.explorerUrl || (network?.includes('robinhood') ? 'https://robinhoodchain.blockscout.com' : 'https://sepolia.etherscan.io');
  const explorerUrl = `${explorerBase}/address/${data.address}`;
  const explorerName = network?.includes('robinhood') ? 'Robinhood Explorer' : 'Etherscan';

  if (data.transactions.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8 text-center bg-black border-2 border-white font-mono space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-white text-white text-xl font-bold mb-2">
          ∅
        </div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Transactions in Scanned Range</h3>
        <p className="text-neutral-400 text-xs max-w-lg mx-auto leading-relaxed">
          No transactions occurred for this address on {data.network || 'this chain'} in the scanned blocks ({data.startBlock} → {data.endBlock}).
        </p>

        <div className="bg-black border border-neutral-800 p-4 max-w-lg mx-auto text-left text-xs text-neutral-400 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-white font-bold">[1]</span>
            <span>If you know the specific block, enter it in <strong>Start Block</strong> and <strong>End Block</strong> above.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white font-bold">[2]</span>
            <span>Or click below to inspect the full account records on {explorerName}.</span>
          </div>
        </div>

        <div className="pt-2">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white border-2 border-white transition-all cursor-pointer"
          >
            <span>View All Transactions on {explorerName} ↗</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 font-mono">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          [ {data.network || 'Chain'} Transactions: {data.transactions.length} ]
        </h3>
        <div className="flex items-center gap-1 bg-black p-0.5 border border-white text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 font-bold uppercase transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-neutral-900'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 font-bold uppercase transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-neutral-900'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <TransactionTable transactions={data.transactions} walletAddress={walletAddress} explorerUrl={explorerBase} currency={data.currency} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.transactions.map((tx) => (
            <TransactionCard key={tx.hash} tx={tx} walletAddress={walletAddress} currency={data.currency} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
