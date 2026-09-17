import React from 'react';

const WalletSummary = ({ data }) => {
  if (!data) return null;

  const balanceEth = data.account?.balance 
    ? `${Number(data.account.balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ETH`
    : '0.0000 ETH';

  const etherscanUrl = `https://sepolia.etherscan.io/address/${data.address}`;

  return (
    <div className="w-full max-w-6xl mx-auto mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Account Overview Card */}
      <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-700/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Sepolia Account
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
            <h2 className="text-lg font-mono text-gray-200 mt-2 break-all" title={data.address}>
              {data.address}
            </h2>
          </div>
          
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 hover:text-blue-300 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View on Etherscan</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              ETH Balance
            </span>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
              {balanceEth}
            </span>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Total Outgoing Txns
            </span>
            <span className="text-lg font-bold text-purple-400">
              {data.account?.nonce !== undefined ? data.account.nonce.toLocaleString() : '0'}
            </span>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Scanned Range
            </span>
            <span className="font-mono text-sm text-blue-300">
              {data.startBlock} → {data.endBlock}
            </span>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Txns in Range
            </span>
            <span className="text-lg font-bold text-amber-400">
              {data.transactionCount}
            </span>
          </div>
        </div>

        {/* Notice for Large Block Ranges */}
        {data.isWindowClamped && (
          <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-100 mb-0.5">
                  Large Range Auto-Windowed ({data.originalStartBlock?.toLocaleString()} → {data.originalEndBlock?.toLocaleString()})
                </p>
                <p className="text-blue-300/80">
                  {data.rangeNotice || `Scanned the 50 most recent blocks in your requested range (${data.startBlock} → ${data.endBlock}) to ensure instant response without node timeouts.`}
                </p>
              </div>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${data.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 font-medium whitespace-nowrap self-start sm:self-auto transition-colors"
            >
              Full Range on Etherscan ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSummary;
