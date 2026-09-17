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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center">
      <header className="max-w-4xl w-full text-center mt-8 mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-300 mb-3 drop-shadow-sm">
          Sepolia Explorer
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
          Deep-scan the Sepolia blockchain using pure JSON-RPC. Discover transactions, inspect execution receipts, and monitor balances.
        </p>
      </header>

      <main className="w-full max-w-6xl">
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
    </div>
  );
};

export default Explorer;
