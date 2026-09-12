import { useState } from 'react';
import { fetchWalletTransactions } from './services/api';
import './index.css';

function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address) return;
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = await fetchWalletTransactions(address);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center">
      <header className="max-w-3xl w-full text-center mt-12 mb-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
          Sepolia Wallet Explorer
        </h1>
        <p className="text-gray-400 text-lg">
          Discover transaction history using pure JSON-RPC. No Etherscan APIs.
        </p>
      </header>

      <main className="max-w-3xl w-full">
        <form onSubmit={handleSearch} className="flex gap-4 mb-12 relative">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Sepolia Ethereum Address (0x...)"
            className="flex-1 px-6 py-4 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-lg shadow-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 mb-8">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {data && (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Scan Results</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-400">Address</span>
                <span className="font-mono text-sm">{data.address}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400 font-medium">Connected</span>
              </div>
              <div className="py-4 bg-blue-900/20 border border-blue-500/30 rounded-lg px-6 mt-6">
                <p className="text-blue-200 text-center">
                  {data.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
