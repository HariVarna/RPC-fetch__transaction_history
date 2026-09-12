const { ethers } = require('ethers');

const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL is missing in environment variables');
  }
  return new ethers.JsonRpcProvider(rpcUrl);
};

const checkRpcHealth = async () => {
  try {
    const provider = getProvider();
    
    // Set a 5-second timeout for the RPC health check
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RPC connection timed out')), 5000)
    );

    const networkPromise = provider.getNetwork();
    const blockPromise = provider.getBlockNumber();

    const [network, latestBlock] = await Promise.race([
      Promise.all([networkPromise, blockPromise]),
      timeoutPromise
    ]);

    // Validate Chain ID. Sepolia chain ID is 11155111.
    // In ethers v6, chainId is a BigInt.
    if (network.chainId !== 11155111n) {
      throw new Error(`Wrong network connected. Expected Sepolia (11155111), got ${network.chainId}`);
    }

    return {
      connected: true,
      chainId: network.chainId.toString(),
      network: 'Sepolia',
      latestBlock: latestBlock.toString()
    };
  } catch (error) {
    console.error("Full RPC Error:", error);
    // If ethers.js threw an error about an invalid response, capture it cleanly
    if (error.code === 'BAD_DATA' || error.code === 'SERVER_ERROR' || error.code === 'NETWORK_ERROR') {
      throw new Error(`Invalid RPC response from provider: ${error.message}`);
    }
    throw new Error(`RPC check failed: ${error.message}`);
  }
};

module.exports = {
  getProvider,
  checkRpcHealth
};
