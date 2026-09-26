const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  let token = null;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check Authorization header (Bearer token)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'creator_calendar_jwt_secret_secure_key_987654321');
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

module.exports = {
  requireAuth
};
