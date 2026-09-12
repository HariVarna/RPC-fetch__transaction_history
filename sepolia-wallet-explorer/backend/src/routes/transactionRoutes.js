const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { createRateLimiter } = require('../middleware/rateLimiter');

// Rate limit: 30 requests per minute per IP
const transactionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many transaction scan requests. Please wait a moment before trying again.'
});

// Handles GET /api/transactions
router.get('/', transactionLimiter, transactionController.getTransactions);

module.exports = router;
