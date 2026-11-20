const { query } = require('../../config/db.config');

const getCategories = async ({ filters = {}, limit, offset, sort }) => {
  const clauses = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    clauses.push(`"${key}" = $${values.length + 1}`);
    values.push(value);
  });

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rowsQuery = `SELECT * FROM categories ${whereClause} ORDER BY ${sort || 'sort_order ASC'} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const totalQuery = `SELECT COUNT(*)::int AS total FROM categories ${whereClause}`;

  const [{ rows: totalRows }, { rows }] = await Promise.all([
    query(totalQuery, values),
    query(rowsQuery, [...values, limit, offset]),
  ]);

  return { rows, total: totalRows[0]?.total || 0 };
};

const getCategoryById = async (id) => {
  const { rows } = await query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
};

const createCategory = async (payload) => {
  const { parent_id, name_prs, name_en, name_ps, slug, description, category_type, is_active, sort_order } = payload;
  const { rows } = await query(
    `INSERT INTO categories (parent_id, name_prs, name_en, name_ps, slug, description, category_type, is_active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [parent_id || null, name_prs, name_en, name_ps, slug, description || null, category_type || 'both', is_active ?? true, sort_order ?? 0]
  );
  return rows[0];
};

const updateCategory = async (id, payload) => {
  const assignments = [];
  const values = [];

  Object.entries(payload).forEach(([key, value]) => {
    assignments.push(`"${key}" = $${values.length + 1}`);
    values.push(value);
  });

  if (!assignments.length) {
    return null;
  }

  values.push(id);
  const queryText = `UPDATE categories SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`;
  const { rows } = await query(queryText, values);
  return rows[0] || null;
};

const deleteCategory = async (id) => {
  const { rows } = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
