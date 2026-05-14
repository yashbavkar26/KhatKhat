const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.json({ success: true, data: { status: 'ok' } });
});

module.exports = router;