const rpcService = require('../services/rpcService');

const getRpcStatus = async (req, res) => {
  try {
    const status = await rpcService.checkRpcHealth();
    return res.json(status);
  } catch (error) {
    console.error('RPC Status Error:', error.message);
    
    // Distinguish between missing config and network errors
    const statusCode = error.message.includes('missing in environment variables') ? 500 : 503;
    
    return res.status(statusCode).json({ 
      connected: false, 
      error: error.message 
    });
  }
};

module.exports = {
  getRpcStatus
};
