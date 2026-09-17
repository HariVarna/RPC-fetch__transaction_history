import React from 'react';

const AddressInput = ({ address, setAddress, startBlock, setStartBlock, endBlock, setEndBlock, handleSearch, loading }) => {
  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto mb-10 space-y-4">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Sepolia Ethereum Address (0x...)"
          disabled={loading}
          className="w-full px-6 py-4 rounded-xl bg-gray-800/80 backdrop-blur-sm border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-lg shadow-lg disabled:opacity-50"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1 ml-1">
            Start Block <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            value={startBlock}
            onChange={(e) => setStartBlock(e.target.value)}
            placeholder="e.g. 6000000 (blank for latest)"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all shadow-md disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1 ml-1">
            End Block <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            value={endBlock}
            onChange={(e) => setEndBlock(e.target.value)}
            placeholder="e.g. 6000010 (blank for latest)"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all shadow-md disabled:opacity-50"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 h-[50px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center min-w-[160px] cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Scanning...' : 'Fetch Transactions'}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Leave block range empty to automatically scan the most recent blocks on Sepolia.
      </p>
    </form>
  );
};

export default AddressInput;
