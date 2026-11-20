const { query } = require('../../config/db.config');

const findUserByIdentifier = async (identifier) => {
  const value = String(identifier || '').trim();
  const { rows } = await query(
    `SELECT u.*, r.role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1 OR u.phone = $2
     LIMIT 1`,
    [value, value]
  );

  return rows[0] || null;
};

const findRoleByName = async (roleName) => {
  const { rows } = await query('SELECT * FROM roles WHERE role_name = $1 LIMIT 1', [roleName]);
  return rows[0] || null;
};

const createUser = async (userData) => {
  const { role_id, full_name, email, phone, password_hash, preferred_language } = userData;
  const { rows } = await query(
    `INSERT INTO users (role_id, full_name, email, phone, password_hash, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, role_id, full_name, email, phone, preferred_language, account_status, email_verified, phone_verified, created_at, updated_at`,
    [role_id, full_name, email || null, phone || null, password_hash, preferred_language || 'prs']
  );

  return rows[0];
};

const updateLastLogin = async (userId) => {
  await query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
};

module.exports = {
  findUserByIdentifier,
  findRoleByName,
  createUser,
  updateLastLogin,
};
