import React from 'react';

const ScanProgress = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 p-6 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 border-r-2 border-r-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 border-l-2 border-l-transparent animate-spin-slow"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Scanning Blocks...</h3>
      <p className="text-gray-400 text-sm">
        Communicating with Ethereum JSON-RPC. This may take a moment depending on the block range.
      </p>
    </div>
  );
};

export default ScanProgress;
