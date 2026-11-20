const { query } = require('../config/db.config');
const ApiError = require('./ApiError');
const asyncHandler = require('./asyncHandler');
const ApiResponse = require('./ApiResponse');

const id = (value, label = 'id') => {
  const v = String(value ?? '');
  if (!/^[1-9]\d*$/.test(v)) throw new ApiError(400, `Invalid ${label}.`);
  return v; // Keep BIGINT identifiers as strings to avoid JS precision loss.
};
const page = (req) => {
  const p = Number(req.query.page || 1), l = Number(req.query.limit || 20);
  if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 100) throw new ApiError(400, 'Invalid pagination. page must be >= 1 and limit must be 1..100.');
  return { limit: l, offset: (p - 1) * l, page: p };
};
const send = (res, data, message = 'Success', status = 200) => ApiResponse.success(res, data, message, status);
const requireBody = (body, fields) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw new ApiError(400, `Required fields: ${missing.join(', ')}`);
};
const pick = (body, fields) => Object.fromEntries(fields.filter((f) => Object.prototype.hasOwnProperty.call(body || {}, f)).map((f) => [f, body[f]]));
const getSellerProfile = async (userId, client = { query }) => {
  const { rows } = await client.query("SELECT * FROM seller_profiles WHERE user_id = $1 AND approval_status = 'approved'", [userId]);
  if (!rows[0]) throw new ApiError(403, 'An approved seller profile is required.');
  return rows[0];
};
const getCourierProfile = async (userId, client = { query }) => {
  const { rows } = await client.query("SELECT * FROM courier_profiles WHERE user_id = $1 AND availability_status <> 'suspended'", [userId]);
  if (!rows[0]) throw new ApiError(403, 'Courier profile is not available.');
  return rows[0];
};
const ensureCategory = async (categoryId, type) => {
  const { rows } = await query('SELECT id, category_type FROM categories WHERE id = $1 AND is_active = TRUE', [categoryId]);
  if (!rows[0] || ![type, 'both'].includes(rows[0].category_type)) throw new ApiError(400, 'Selected category is inactive or incompatible with this listing.');
};
const listWithWhere = async ({ table, select = '*', where = '', values = [], order = 'created_at DESC', limit = 20, offset = 0 }) => {
  const { rows } = await query(`SELECT ${select} FROM ${table} ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, offset]);
  const count = await query(`SELECT COUNT(*)::int AS total FROM ${table} ${where}`, values);
  return { items: rows, total: count.rows[0].total };
};
module.exports = { id, page, send, requireBody, pick, getSellerProfile, getCourierProfile, ensureCategory, listWithWhere, asyncHandler, query, ApiError };
