import React from 'react';

const WalletSummary = ({ data }) => {
  if (!data) return null;

  const balanceEth = data.account?.balance 
    ? `${Number(data.account.balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ETH`
    : '0.0000 ETH';

  const etherscanUrl = `https://sepolia.etherscan.io/address/${data.address}`;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 font-mono">
      {/* 2D Flat Account Overview Box */}
      <div className="bg-black border-2 border-white p-5 sm:p-6 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-widest bg-white text-black px-2 py-0.5 font-bold">
                Sepolia Account
              </span>
              <span className="text-[11px] uppercase tracking-widest border border-white text-white px-2 py-0.5">
                ● Live RPC
              </span>
            </div>
            <h2 className="text-base sm:text-lg text-white font-mono break-all" title={data.address}>
              {data.address}
            </h2>
          </div>
          
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-transparent text-white border border-white hover:bg-white hover:text-black transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View on Etherscan</span>
            <span>↗</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-black p-4 border border-neutral-800">
            <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              ETH Balance
            </span>
            <span className="text-xl font-bold text-white">
              {balanceEth}
            </span>
          </div>

          <div className="bg-black p-4 border border-neutral-800">
            <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Outgoing Nonce
            </span>
            <span className="text-xl font-bold text-white">
              {data.account?.nonce !== undefined ? data.account.nonce.toLocaleString() : '0'}
            </span>
          </div>

          <div className="bg-black p-4 border border-neutral-800">
            <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Block Range
            </span>
            <span className="text-sm font-bold text-neutral-200">
              {data.startBlock} → {data.endBlock}
            </span>
          </div>

          <div className="bg-black p-4 border border-neutral-800">
            <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Txns Found
            </span>
            <span className="text-xl font-bold text-white">
              {data.transactionCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;
