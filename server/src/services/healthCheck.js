// 1. API Health Check Endpoint
// File: src/services/healthCheck.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/api/health-check', (req, res) => {
  const status = {
    server: 'up',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.status(200).json(status);
});

module.exports = router;
 