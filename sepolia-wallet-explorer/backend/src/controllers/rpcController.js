const rpcService = require('../services/rpcService');
const { safeLogger, sanitize } = require('../utils/sanitizer');

const getRpcStatus = async (req, res) => {
  try {
    const network = req.query.network || 'sepolia';
    const status = await rpcService.checkRpcHealth(network);
    return res.json(status);
  } catch (error) {
    safeLogger.error('RPC Status Error:', error.message);
    
    // Distinguish between missing config and network errors
    const statusCode = error.message.includes('missing in environment variables') ? 500 : 503;
    
    return res.status(statusCode).json({ 
      connected: false, 
      error: sanitize(error.message) 
    });
  }
};

module.exports = {
  getRpcStatus
};
