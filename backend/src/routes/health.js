const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development',
    },
  });
});

module.exports = router;