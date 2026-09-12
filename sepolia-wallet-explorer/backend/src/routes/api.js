const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const rpcController = require('../controllers/rpcController');

router.get('/rpc/status', rpcController.getRpcStatus);
router.get('/transactions/:address', walletController.getTransactions);

module.exports = router;
