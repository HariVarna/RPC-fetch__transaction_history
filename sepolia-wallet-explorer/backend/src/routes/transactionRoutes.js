const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Handles GET /api/transactions
router.get('/', transactionController.getTransactions);

module.exports = router;
