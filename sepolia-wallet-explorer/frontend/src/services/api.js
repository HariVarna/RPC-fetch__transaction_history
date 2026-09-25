const API_BASE_URL = 'http://localhost:3001/api';

export const fetchWalletTransactions = async (address, startBlock, endBlock, network = 'sepolia') => {
  try {
    const url = new URL(`${API_BASE_URL}/transactions`);
    if (address) url.searchParams.append('address', address.trim());
    if (startBlock !== '' && startBlock !== undefined && startBlock !== null) {
      url.searchParams.append('startBlock', startBlock.toString().trim());
    }
    if (endBlock !== '' && endBlock !== undefined && endBlock !== null) {
      url.searchParams.append('endBlock', endBlock.toString().trim());
    }
    if (network) {
      url.searchParams.append('network', network);
    }

    const response = await fetch(url.toString());
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Server error (${response.status})`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify the backend is running on port 3001.');
    }
    throw error;
  }
};
