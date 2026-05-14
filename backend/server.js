require('dotenv').config();
require('express-async-errors');

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initializeFirebaseAdmin } = require('./src/config/firebase');
const { initSocket } = require('./src/services/socket');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

initializeFirebaseAdmin();

const authRoutes = require('./src/routes/auth');
const parcelsRoutes = require('./src/routes/parcels');
const carriersRoutes = require('./src/routes/carriers');
const relayRoutes = require('./src/routes/relay');
const paymentsRoutes = require('./src/routes/payments');
const aiRoutes = require('./src/routes/ai');
const healthRoutes = require('./src/routes/health');

const { globalLimiter, authLimiter, aiLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
initSocket(server);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
// capture raw body for webhook verification
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf && buf.length ? buf.toString('utf8') : '';
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Apply global rate limiter
app.use(globalLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/parcels', parcelsRoutes);
app.use('/api/carriers', carriersRoutes);
app.use('/api/relay', relayRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

if (require.main === module) {
  server.listen(port, () => {
    console.log(`KhatKhat backend listening on port ${port}`);
  });
}

module.exports = { app, server };