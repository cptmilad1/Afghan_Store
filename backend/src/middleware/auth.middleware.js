const jwt = require('jsonwebtoken');
const { query } = require('../config/db.config');
const ApiError = require('../utilities/ApiError');
const config = require('../config/env');
const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication token is required.');
    const decoded = jwt.verify(header.slice(7), config.jwt.secret);
    if (!decoded.id) throw new ApiError(401, 'Invalid authentication token.');
    const { rows } = await query(`SELECT u.id, u.role_id, u.full_name, u.email, u.phone, u.preferred_language, u.account_status, r.role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`, [String(decoded.id)]);
    if (!rows[0]) throw new ApiError(401, 'Authenticated user not found.');
    if (rows[0].account_status !== 'active') throw new ApiError(403, 'User account is not active.');
    req.user = rows[0];
    next();
  } catch (error) { next(error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? new ApiError(401, 'Invalid or expired authentication token.') : error); }
};
module.exports = authMiddleware;
