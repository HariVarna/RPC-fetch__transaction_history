import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-black border-2 border-white text-white font-mono flex items-start gap-3">
      <span className="font-bold text-base px-2 py-0.5 bg-white text-black shrink-0">!</span>
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-white">Error</h3>
        <p className="text-neutral-300 text-xs mt-1">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
