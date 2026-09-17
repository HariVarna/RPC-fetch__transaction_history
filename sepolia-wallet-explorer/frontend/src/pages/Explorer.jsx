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

    if (startBlock === '' || endBlock === '') {
      setError('Both Start Block and End Block are required');
      setData(null);
      return;
    }

    const start = Number(startBlock);
    const end = Number(endBlock);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0) {
      setError('Start Block and End Block must be valid non-negative integers');
      setData(null);
      return;
    }

    if (start > end) {
      setError('Start Block cannot be greater than End Block');
      setData(null);
      return;
    }

    if (end - start + 1 > 50) {
      setError(`Block range cannot exceed 50 blocks (requested: ${end - start + 1} blocks)`);
      setData(null);
      return;
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
      <header className="max-w-3xl w-full text-center mt-12 mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 drop-shadow-sm">
          Sepolia Explorer
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Deep-scan the Sepolia blockchain using pure JSON-RPC. Discover transactions without relying on centralized indexers.
        </p>
      </header>

      <main className="w-full">
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
