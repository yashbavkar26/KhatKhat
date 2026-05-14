const { auth, db } = require('../services/firebase');

async function verifyToken(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      phone: decoded.phone_number || null,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

async function attachUser(req, res, next) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    req.user = {
      ...req.user,
      ...userDoc.data(),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return next();
  };
}

module.exports = {
  verifyToken,
  attachUser,
  requireRole,
};