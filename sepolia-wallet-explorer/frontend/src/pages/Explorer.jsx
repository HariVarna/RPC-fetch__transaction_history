import React, { useState } from 'react';
import AddressInput from '../components/AddressInput';
import WalletSummary from '../components/WalletSummary';
import TransactionList from '../components/TransactionList';
import ScanProgress from '../components/ScanProgress';
import ErrorMessage from '../components/ErrorMessage';
import { fetchWalletTransactions } from '../services/api';

const Explorer = () => {
  const [address, setAddress] = useState('');
  const [startBlock, setStartBlock] = useState('');
  const [endBlock, setEndBlock] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      setError('Ethereum address is required');
      setData(null);
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      setError('Invalid Ethereum address format. Must be a 42-character hexadecimal string starting with 0x.');
      setData(null);
      return;
    }

    const hasStart = startBlock !== '' && startBlock !== undefined && startBlock !== null;
    const hasEnd = endBlock !== '' && endBlock !== undefined && endBlock !== null;

    let start = null;
    let end = null;

    if (hasStart || hasEnd) {
      if (hasStart) {
        start = Number(startBlock);
        if (!Number.isInteger(start) || start < 0) {
          setError('Start Block must be a valid non-negative integer');
          setData(null);
          return;
        }
      }

      if (hasEnd) {
        end = Number(endBlock);
        if (!Number.isInteger(end) || end < 0) {
          setError('End Block must be a valid non-negative integer');
          setData(null);
          return;
        }
      }

      if (hasStart && hasEnd) {
        if (start > end) {
          setError('Start Block cannot be greater than End Block');
          setData(null);
          return;
        }
      }
    }
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = await fetchWalletTransactions(trimmedAddress, start, end);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center">
      <header className="max-w-4xl w-full text-center mt-6 mb-8 pb-6 border-b border-white/20">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded border border-white text-xs font-mono uppercase tracking-widest bg-black text-white">
          Sepolia Blockchain / JSON-RPC Explorer
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase mb-3">
          Sepolia Explorer
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto font-sans">
          Pure JSON-RPC transaction scanner and wallet intelligence. Direct blockchain inspection with zero centralized indexing.
        </p>
      </header>

      <main className="w-full max-w-6xl space-y-6">
        <AddressInput 
          address={address}
          setAddress={setAddress}
          startBlock={startBlock}
          setStartBlock={setStartBlock}
          endBlock={endBlock}
          setEndBlock={setEndBlock}
          handleSearch={handleSearch}
          loading={loading}
        />

        <ErrorMessage message={error} />
        
        <ScanProgress loading={loading} />

        {!loading && data && (
          <>
            <WalletSummary data={data} />
            <TransactionList data={data} walletAddress={address} />
          </>
        )}
      </main>

      <footer className="mt-16 pt-6 border-t border-white/10 w-full max-w-6xl text-center text-xs text-neutral-500 font-mono">
        Sepolia JSON-RPC 2.0 • 2D Monochrome Theme
      </footer>
    </div>
  );
};

export default Explorer;
