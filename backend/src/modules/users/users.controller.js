const asyncHandler = require('../../utilities/asyncHandler');
const ApiResponse = require('../../utilities/ApiResponse');

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user, 'User profile retrieved successfully.');
});

module.exports = {
  getMe,
};
