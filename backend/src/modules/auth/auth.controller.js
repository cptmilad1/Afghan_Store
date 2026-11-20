const asyncHandler = require('../../utilities/asyncHandler');
const ApiResponse = require('../../utilities/ApiResponse');
const { registerUser, loginUser } = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  return ApiResponse.success(res, result, 'Registration successful.', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  return ApiResponse.success(res, result, 'Login successful.');
});

module.exports = {
  register,
  login,
};
