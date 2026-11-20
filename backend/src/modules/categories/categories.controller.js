const asyncHandler = require('../../utilities/asyncHandler');
const ApiResponse = require('../../utilities/ApiResponse');
const { listCategories, getCategory, createCategoryRecord, updateCategoryRecord, deleteCategoryRecord } = require('./categories.service');

const listCategoriesController = asyncHandler(async (req, res) => {
  const result = await listCategories({
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
    filters: req.query,
  });
  return ApiResponse.success(res, result, 'Categories retrieved successfully.');
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await getCategory(req.params.id);
  return ApiResponse.success(res, category, 'Category retrieved successfully.');
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await createCategoryRecord(req.body);
  return ApiResponse.success(res, category, 'Category created successfully.', 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await updateCategoryRecord(req.params.id, req.body);
  return ApiResponse.success(res, category, 'Category updated successfully.');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await deleteCategoryRecord(req.params.id);
  return ApiResponse.success(res, category, 'Category deleted successfully.');
});

module.exports = {
  listCategories: listCategoriesController,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
