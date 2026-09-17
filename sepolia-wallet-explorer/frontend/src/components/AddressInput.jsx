import React from 'react';

const AddressInput = ({ address, setAddress, startBlock, setStartBlock, endBlock, setEndBlock, handleSearch, loading }) => {
  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Sepolia Ethereum Address (0x...)"
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
            placeholder="e.g. 11416538"
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
            placeholder="e.g. 11716213"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-black text-white placeholder-neutral-600 border border-neutral-700 focus:border-white focus:outline-none transition-colors font-mono text-sm disabled:opacity-50"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-2.5 h-[42px] bg-white text-black hover:bg-black hover:text-white border-2 border-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center min-w-[160px] cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Scanning...' : 'Fetch Txns'}
          </button>
        </div>
      </div>
      <p className="text-xs text-neutral-500 text-center font-mono">
        Leave block range empty to fetch all lifetime transactions for the account.
      </p>
    </form>
  );
};

export default AddressInput;
