const { query } = require('../utils/db');

const SORT_FIELDS = {
  created_at: 'p.created_at',
  price: 'p.price',
  name: 'p.name',
};

const listProducts = async ({
  search = '',
  categoryId = null,
  status = null,
  page = 1,
  limit = 12,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const conditions = ['1 = 1'];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${idx} OR COALESCE(p.description, '') ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx += 1;
  }

  if (categoryId) {
    conditions.push(`p.category_id = $${idx}`);
    values.push(Number(categoryId));
    idx += 1;
  }

  if (status) {
    conditions.push(`p.status = $${idx}`);
    values.push(status);
    idx += 1;
  }

  const safeSortField = SORT_FIELDS[sortBy] || SORT_FIELDS.created_at;
  const safeSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM products p
     WHERE ${conditions.join(' AND ')}`,
    values
  );

  const offset = (page - 1) * limit;

  const dataResult = await query(
    `SELECT
       p.id,
       p.category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       p.name,
       p.slug,
       p.description,
       p.price,
       p.stock_qty,
       p.image_url,
       p.status,
       p.created_at,
       p.updated_at
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${safeSortField} ${safeSortOrder}
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return {
    items: dataResult.rows,
    total: countResult.rows[0].total,
    page,
    limit,
  };
};

const findProductById = async (id) => {
  const result = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
};

const findProductBySlug = async (slug) => {
  const result = await query('SELECT id, slug FROM products WHERE slug = $1 LIMIT 1', [slug]);
  return result.rows[0] || null;
};

const createProduct = async ({
  categoryId,
  name,
  slug,
  description,
  price,
  stockQty,
  imageUrl,
  status,
}) => {
  const result = await query(
    `INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      categoryId || null,
      name,
      slug,
      description || null,
      price,
      stockQty ?? 0,
      imageUrl || null,
      status || 'active',
    ]
  );

  return result.rows[0];
};

const updateProduct = async (id, {
  categoryId,
  name,
  slug,
  description,
  price,
  stockQty,
  imageUrl,
  status,
}) => {
  const result = await query(
    `UPDATE products
     SET
       category_id = $2,
       name = $3,
       slug = $4,
       description = $5,
       price = $6,
       stock_qty = $7,
       image_url = $8,
       status = $9
     WHERE id = $1
     RETURNING *`,
    [
      id,
      categoryId || null,
      name,
      slug,
      description || null,
      price,
      stockQty ?? 0,
      imageUrl || null,
      status || 'active',
    ]
  );

  return result.rows[0] || null;
};

const deleteProduct = async (id) => {
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  listProducts,
  findProductById,
  findProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
