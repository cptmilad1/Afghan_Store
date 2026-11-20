const { query, param, body } = require('express-validator');

const listCategoriesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('sort').optional().matches(/^[a-zA-Z_]+:(asc|desc)$/i).withMessage('Sort must be in format field:asc|desc.'),
  query('category_type').optional().isIn(['product', 'service', 'both']).withMessage('category_type must be product, service, or both.'),
];

const getByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer.'),
];

const createCategoryValidation = [
  body('name_prs').trim().notEmpty().withMessage('Dari category name is required.'),
  body('name_en').trim().notEmpty().withMessage('English category name is required.'),
  body('name_ps').trim().notEmpty().withMessage('Pashto category name is required.'),
  body('slug').trim().notEmpty().withMessage('Slug is required.'),
  body('category_type').optional().isIn(['product', 'service', 'both']).withMessage('category_type must be product, service, or both.'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer.'),
];

const updateCategoryValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer.'),
  body('name_prs').optional().trim().notEmpty().withMessage('Dari category name cannot be empty.'),
  body('name_en').optional().trim().notEmpty().withMessage('English category name cannot be empty.'),
  body('name_ps').optional().trim().notEmpty().withMessage('Pashto category name cannot be empty.'),
  body('slug').optional().trim().notEmpty().withMessage('Slug cannot be empty.'),
  body('category_type').optional().isIn(['product', 'service', 'both']).withMessage('category_type must be product, service, or both.'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer.'),
];

module.exports = {
  listCategoriesValidation,
  getByIdValidation,
  createCategoryValidation,
  updateCategoryValidation,
};
