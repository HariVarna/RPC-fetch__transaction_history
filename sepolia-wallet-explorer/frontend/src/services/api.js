const API_BASE_URL = 'http://localhost:3001/api';

export const fetchWalletTransactions = async (address) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${address}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch transactions');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};
