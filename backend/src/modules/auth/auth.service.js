const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const ApiError = require('../../utilities/ApiError');
const { findUserByIdentifier, findRoleByName, createUser, updateLastLogin } = require('./auth.repository');

const publicUser = (u) => ({ id: String(u.id), full_name: u.full_name, email: u.email, phone: u.phone, role: u.role_name, preferred_language: u.preferred_language, account_status: u.account_status });
const makeToken = (u) => jwt.sign({ id: String(u.id) }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const registerUser = async ({ full_name, email, phone, password, preferred_language }) => {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const normalizedPhone = phone ? String(phone).trim() : null;
  if (!normalizedEmail && !normalizedPhone) throw new ApiError(400, 'Either email or phone is required.');
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters long.');
  if (await findUserByIdentifier(normalizedEmail || normalizedPhone)) throw new ApiError(409, 'An account with this email or phone already exists.');
  const roleRecord = await findRoleByName('customer');
  if (!roleRecord) throw new ApiError(500, 'Customer role is missing. Run seed.sql first.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ role_id: roleRecord.id, full_name: String(full_name).trim(), email: normalizedEmail, phone: normalizedPhone, password_hash: passwordHash, preferred_language: preferred_language || 'prs' });
  user.role_name = 'customer';
  return { token: makeToken(user), user: publicUser(user) };
};
const loginUser = async ({ identifier, password }) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new ApiError(401, 'Invalid email/phone or password.');
  if (user.account_status !== 'active') throw new ApiError(403, 'This account is not active.');
  await updateLastLogin(user.id);
  return { token: makeToken(user), user: publicUser(user) };
};
module.exports = { registerUser, loginUser };
