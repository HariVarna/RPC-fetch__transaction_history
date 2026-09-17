import React from 'react';

const ScanProgress = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black border-2 border-white text-center font-mono space-y-3">
      <div className="inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
        <span className="inline-block w-3 h-3 bg-white animate-ping"></span>
        <span>Scanning Blockchain...</span>
      </div>
      <p className="text-neutral-400 text-xs">
        Connecting to Sepolia JSON-RPC node • Retrieving blocks & execution receipts
      </p>
    </div>
  );
};

export default ScanProgress;
