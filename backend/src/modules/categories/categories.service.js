const ApiError = require('../../utilities/ApiError');
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('./categories.repository');

const listCategories = async ({ page = 1, limit = 20, sort = 'sort_order:asc', filters = {} }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) throw new ApiError(400, 'Page must be a positive integer.');
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new ApiError(400, 'Limit must be between 1 and 100.');

  const offset = (parsedPage - 1) * parsedLimit;
  const sortField = String(sort).split(':')[0] || 'sort_order';
  const sortDir = String(sort).split(':')[1] || 'asc';
  const validSortFields = ['id', 'name_en', 'sort_order', 'created_at'];
  if (!validSortFields.includes(sortField)) throw new ApiError(400, `Unsupported sort field: ${sortField}`);
  if (!['asc', 'desc'].includes(sortDir.toLowerCase())) throw new ApiError(400, 'Sort direction must be asc or desc.');

  const validFilters = ['id', 'parent_id', 'slug', 'category_type', 'is_active'];
  const safeFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (validFilters.includes(key) && value !== undefined && value !== null && value !== '') {
      safeFilters[key] = value;
    }
  });

  const { rows, total } = await getCategories({
    filters: safeFilters,
    limit: parsedLimit,
    offset,
    sort: `"${sortField}" ${sortDir.toUpperCase()}`,
  });

  return {
    items: rows,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

const getCategory = async (id) => {
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) throw new ApiError(400, 'Category ID must be a positive integer.');

  const category = await getCategoryById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found.');
  return category;
};

const createCategoryRecord = async (payload) => {
  const safePayload = {
    parent_id: payload.parent_id !== undefined && payload.parent_id !== null && payload.parent_id !== '' ? Number(payload.parent_id) : null,
    name_prs: String(payload.name_prs || '').trim(),
    name_en: String(payload.name_en || '').trim(),
    name_ps: String(payload.name_ps || '').trim(),
    slug: String(payload.slug || '').trim(),
    description: payload.description ? String(payload.description).trim() : null,
    category_type: payload.category_type || 'both',
    is_active: payload.is_active === undefined ? true : Boolean(payload.is_active),
    sort_order: payload.sort_order !== undefined && payload.sort_order !== null ? Number(payload.sort_order) : 0,
  };

  if (!safePayload.name_prs || !safePayload.name_en || !safePayload.name_ps || !safePayload.slug) {
    throw new ApiError(400, 'Category name fields and slug are required.');
  }
  if (!['product', 'service', 'both'].includes(safePayload.category_type)) {
    throw new ApiError(400, 'Category type must be product, service, or both.');
  }

  return createCategory(safePayload);
};

const updateCategoryRecord = async (id, payload) => {
  const current = await getCategory(id);
  const safePayload = {};

  const keys = ['parent_id', 'name_prs', 'name_en', 'name_ps', 'slug', 'description', 'category_type', 'is_active', 'sort_order'];
  keys.forEach((key) => {
    if (payload[key] !== undefined) {
      if (key === 'parent_id') safePayload[key] = payload[key] !== null && payload[key] !== '' ? Number(payload[key]) : null;
      else if (key === 'description') safePayload[key] = payload[key] ? String(payload[key]).trim() : null;
      else if (key === 'is_active') safePayload[key] = Boolean(payload[key]);
      else if (key === 'sort_order') safePayload[key] = Number(payload[key]);
      else safePayload[key] = String(payload[key]).trim();
    }
  });

  if (!Object.keys(safePayload).length) throw new ApiError(400, 'No valid fields supplied for update.');
  if (safePayload.category_type && !['product', 'service', 'both'].includes(safePayload.category_type)) throw new ApiError(400, 'Category type must be product, service, or both.');

  const updated = await updateCategory(current.id, safePayload);
  if (!updated) throw new ApiError(404, 'Category not found.');
  return updated;
};

const deleteCategoryRecord = async (id) => {
  const category = await getCategory(id);
  const deleted = await deleteCategory(category.id);
  if (!deleted) throw new ApiError(404, 'Category not found.');
  return deleted;
};

module.exports = {
  listCategories,
  getCategory,
  createCategoryRecord,
  updateCategoryRecord,
  deleteCategoryRecord,
};
