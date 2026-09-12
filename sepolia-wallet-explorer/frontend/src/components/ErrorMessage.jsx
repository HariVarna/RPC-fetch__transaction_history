import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="w-full max-w-3xl mx-auto p-4 mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-red-400 font-semibold">Error</h3>
        <p className="text-red-300/80 text-sm mt-0.5">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
