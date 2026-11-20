const ApiError = require('../utilities/ApiError');

const requireRoles = (...roles) => (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    const roleNames = roles.map((role) => String(role).toLowerCase());
    const userRole = String(req.user.role_name || '').toLowerCase();

    if (!roleNames.includes(userRole)) {
      throw new ApiError(403, 'Insufficient role permissions.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireRoles };
