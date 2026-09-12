const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/transactions/:address', walletController.getTransactions);

module.exports = router;
