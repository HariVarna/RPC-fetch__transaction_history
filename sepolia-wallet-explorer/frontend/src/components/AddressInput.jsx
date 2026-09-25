import React from 'react';

const NETWORKS = [
  { id: 'sepolia', name: 'Ethereum Sepolia', badge: 'Sepolia Testnet', icon: '🟣' },
  { id: 'robinhood', name: 'Robinhood Chain', badge: 'Mainnet (Arbitrum Orbit)', icon: '🟢' },
  { id: 'robinhood_testnet', name: 'Robinhood Testnet', badge: 'Testnet (46630)', icon: '🟡' }
];

const AddressInput = ({ 
  address, 
  setAddress, 
  startBlock, 
  setStartBlock, 
  endBlock, 
  setEndBlock, 
  network, 
  setNetwork, 
  handleSearch, 
  loading 
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Network Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 bg-neutral-950 border-2 border-white font-mono">
        <span className="text-xs uppercase tracking-widest text-neutral-400 px-2 font-bold flex items-center gap-1.5">
          <span>Active Chain:</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {NETWORKS.map((net) => {
            const isActive = network === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => setNetwork(net.id)}
                disabled={loading}
                className={`px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  isActive
                    ? 'bg-white text-black border-2 border-white'
                    : 'bg-black text-neutral-300 border border-neutral-700 hover:border-white hover:text-white'
                }`}
              >
                <span>{net.icon}</span>
                <span>{net.name}</span>
                <span className={`text-[10px] hidden md:inline px-1 py-0.2 ${isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                  {net.id === 'robinhood' ? 'L2' : 'Testnet'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={`Enter ${network.includes('robinhood') ? 'Robinhood Chain' : 'Sepolia'} Address (0x...)`}
            disabled={loading}
            className="w-full px-5 py-3.5 bg-black text-white placeholder-neutral-500 border-2 border-white rounded-none focus:outline-none focus:ring-0 focus:border-white transition-colors text-base font-mono disabled:opacity-50"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider font-mono text-neutral-400 mb-1">
              Start Block <span className="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={startBlock}
              onChange={(e) => setStartBlock(e.target.value)}
              placeholder="e.g. 100000"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black text-white placeholder-neutral-600 border border-neutral-700 focus:border-white focus:outline-none transition-colors font-mono text-sm disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider font-mono text-neutral-400 mb-1">
              End Block <span className="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={endBlock}
              onChange={(e) => setEndBlock(e.target.value)}
              placeholder="e.g. 100050"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black text-white placeholder-neutral-600 border border-neutral-700 focus:border-white focus:outline-none transition-colors font-mono text-sm disabled:opacity-50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-2.5 h-[42px] bg-white text-black hover:bg-black hover:text-white border-2 border-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center min-w-[160px] cursor-pointer disabled:cursor-not-allowed font-mono"
            >
              {loading ? 'Scanning...' : 'Fetch Txns'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 font-mono gap-2">
          <span>Leave block range empty to fetch all historical transactions.</span>
          <div className="flex items-center gap-2">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => setAddress('0x0000000000000000000000000000000000000000')}
              className="text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Null Address
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddressInput;
