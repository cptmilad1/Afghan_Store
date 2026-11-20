const ApiResponse = require('../utilities/ApiResponse');
const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = Number(err.statusCode || err.status) || 500;
  let message = err.isOperational ? err.message : 'Internal server error.';
  if (err.name === 'MulterError') { status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the 5 MB limit.' : 'Invalid file upload.'; }
  if (err.message === 'Origin is not allowed by CORS.') { status = 403; message = err.message; }
  let details = err.details || null;
  if (err.code === '23505') { status = 409; message = 'A record with this unique value already exists.'; }
  else if (err.code === '23503') { status = 400; message = 'A referenced record does not exist or is still in use.'; }
  else if (err.code === '23514' || err.code === '22P02' || err.code === '22001') { status = 400; message = 'Submitted data violates a database constraint.'; }
  if (process.env.NODE_ENV !== 'production' && !err.isOperational) details = { stack: err.stack };
  return ApiResponse.error(res, status, message, details);
};
module.exports = errorMiddleware;
