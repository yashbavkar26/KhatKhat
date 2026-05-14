function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 404,
  });
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || error.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Map common Firebase Auth errors
  if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || (error.message && error.message.toLowerCase().includes('invalid or expired token'))) {
    statusCode = 401;
  }
  if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission-denied'))) {
    statusCode = 403;
  }

  // Razorpay SDK errors
  if (error.name && error.name.toLowerCase().includes('razorpay')) {
    statusCode = 502;
  }

  // Google Maps quota or API errors
  if (error.message && (error.message.includes('OVER_QUERY_LIMIT') || error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('daily limit'))) {
    statusCode = 429;
  }

  if (!isProduction) console.error(error);

  const safeMessage = isProduction && statusCode === 500 ? 'Internal server error' : error.message || 'Something went wrong';

  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
    code: statusCode,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};