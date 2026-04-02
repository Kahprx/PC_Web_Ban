const { query } = require('../utils/db');

const SORT_FIELDS = {
  created_at: 'p.created_at',
  price: 'p.price',
  name: 'p.name',
};
const PRODUCT_TEXT_SQL = `LOWER(CONCAT_WS(' ', p.name, COALESCE(p.description, ''), COALESCE(p.slug, '')))`;
const PRODUCT_MAX_HZ_SQL = `COALESCE((SELECT MAX((m)[1]::int) FROM regexp_matches(${PRODUCT_TEXT_SQL}, '([0-9]{2,3})\\s*hz', 'g') AS m), 0)`;
const containsAny = (patterns = []) => `(${patterns.map((pattern) => `${PRODUCT_TEXT_SQL} LIKE '${pattern}'`).join(' OR ')})`;
const FOCUS_FILTER_SQL = {
  'monitor-oled': containsAny(['%oled%', '%qd-oled%', '%woled%']),
  'monitor-240hz': `(${PRODUCT_MAX_HZ_SQL} >= 240)`,
  'monitor-graphic': containsAny([
    '%do hoa%',
    '%designer%',
    '%design%',
    '%sang tao%',
    '%creator%',
    '%chuan mau%',
    '%adobe%',
    '%dcip3%',
    '%dci-p3%',
    '%thunderbolt%',
    '%macbook%',
    '%proart%',
    '%benq pd%',
  ]),
  'monitor-mainstream': `((${PRODUCT_MAX_HZ_SQL} BETWEEN 1 AND 120) OR ${containsAny([
    '%pho thong%',
    '%van phong%',
    '%office%',
    '%eye-care%',
    '%co ban%',
    '%gia re%',
  ])})`,
  'monitor-fhd': containsAny(['%full hd%', '%fhd%', '%1080p%', '%1920x1080%']),
  'monitor-ips': containsAny(['%ips%', '%nano ips%', '%fast ips%']),

  'keyboard-he': `( ${containsAny([
    '%rapid trigger%',
    '%hall effect%',
    '%magnetic switch%',
    '%switch tu%',
    '%switch he%',
  ])} OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])he([^a-z0-9]|$)' )`,
  'keyboard-wireless': containsAny(['%khong day%', '%wireless%', '%bluetooth%', '%2.4g%']),
  'keyboard-layout-75': containsAny(['%75%%', '%75 layout%', '%84 phim%']),
  'keyboard-tkl': containsAny(['%tkl%', '%87 phim%', '%tenkeyless%']),

  'mouse-wireless': containsAny(['%khong day%', '%wireless%', '%2.4g%', '%dongle%']),
  'mouse-ultralight': containsAny(['%sieu nhe%', '%ultralight%', '%47g%', '%49g%', '%55g%', '%60g%']),
  'mouse-esport': containsAny(['%esport%', '%fps%', '%4k polling%', '%8k polling%', '%pro%']),

  'laptop-gaming': containsAny(['%gaming%', '%rtx%', '%geforce%']),
  'laptop-creator': containsAny(['%do hoa%', '%creator%', '%studio%', '%render%', '%adobe%']),

  'pc-rtx50': containsAny(['%rtx 50%']),
  'pc-rtx40': containsAny(['%rtx 40%']),
  'pc-ryzen': containsAny(['%ryzen%', '%amd%']),

  'audio-iem': containsAny(['%iem%', '%in-ear%']),
  'audio-wireless': containsAny(['%khong day%', '%wireless%', '%bluetooth%', '%tws%']),
  'audio-gaming': containsAny(['%gaming%', '%mic%', '%surround%', '%7.1%']),

  'gear-mouse': containsAny(['%chuot%', '%mouse%', '%paw3395%', '%dpi%', '%dongle%']),
  'gear-keyboard': containsAny(['%ban phim%', '%keyboard%', '%rapid trigger%', '%switch%', '%tkl%']),
  'gear-audio': containsAny(['%tai nghe%', '%headphone%', '%iem%', '%in-ear%', '%dac%']),
  'gear-wireless': containsAny(['%khong day%', '%wireless%', '%bluetooth%', '%2.4g%', '%dongle%']),
};

const CATEGORY_GROUP_SLUGS = {
  'gaming-gear': ['gaming-gear', 'chuot', 'ban-phim', 'tai-nghe'],
};

let hasProductCodeColumnCache = null;
let hasProductImagesTableCache = null;

const hasProductCodeColumn = async () => {
  if (typeof hasProductCodeColumnCache === 'boolean') {
    return hasProductCodeColumnCache;
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'products'
         AND column_name = 'product_code'
     ) AS exists`
  );

  hasProductCodeColumnCache = Boolean(result.rows[0]?.exists);
  return hasProductCodeColumnCache;
};

const hasProductImagesTable = async () => {
  if (typeof hasProductImagesTableCache === 'boolean') {
    return hasProductImagesTableCache;
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'product_images'
     ) AS exists`
  );

  hasProductImagesTableCache = Boolean(result.rows[0]?.exists);
  return hasProductImagesTableCache;
};

const listProducts = async ({
  search = '',
  categoryId = null,
  categoryIds = [],
  categoryGroup = null,
  focusFilterId = null,
  status = null,
  minPrice = null,
  maxPrice = null,
  page = 1,
  limit = 12,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const supportsProductCode = await hasProductCodeColumn();
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

  if (!categoryId && Array.isArray(categoryIds) && categoryIds.length > 0) {
    conditions.push(`p.category_id = ANY($${idx})`);
    values.push(categoryIds.map((item) => Number(item)));
    idx += 1;
  }

  const groupSlugs = CATEGORY_GROUP_SLUGS[String(categoryGroup || '').trim().toLowerCase()] || [];
  if (!categoryId && (!Array.isArray(categoryIds) || categoryIds.length === 0) && groupSlugs.length > 0) {
    conditions.push(`p.category_id IN (SELECT id FROM categories WHERE slug = ANY($${idx}))`);
    values.push(groupSlugs);
    idx += 1;
  }

  if (focusFilterId) {
    const focusCondition = FOCUS_FILTER_SQL[String(focusFilterId).trim().toLowerCase()];
    if (focusCondition) {
      conditions.push(focusCondition);
    }
  }

  if (status) {
    conditions.push(`p.status = $${idx}`);
    values.push(status);
    idx += 1;
  }

  if (Number.isFinite(minPrice)) {
    conditions.push(`p.price >= $${idx}`);
    values.push(Number(minPrice));
    idx += 1;
  }

  if (Number.isFinite(maxPrice)) {
    conditions.push(`p.price <= $${idx}`);
    values.push(Number(maxPrice));
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
       ${supportsProductCode ? 'p.product_code' : 'NULL::varchar AS product_code'},
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
  const productResult = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );

  const product = productResult.rows[0] || null;
  if (!product) return null;

  const supportsProductImages = await hasProductImagesTable();
  if (!supportsProductImages) {
    product.gallery = product.image_url ? [product.image_url] : [];
    return product;
  }

  const galleryResult = await query(
    `SELECT url
     FROM product_images
     WHERE product_id = $1
     ORDER BY id ASC`,
    [id]
  );

  const gallery = galleryResult.rows
    .map((row) => String(row.url || '').trim())
    .filter(Boolean);

  if (gallery.length === 0 && product.image_url) {
    product.gallery = [product.image_url];
  } else if (gallery.length > 0 && product.image_url && !gallery.includes(product.image_url)) {
    product.gallery = [product.image_url, ...gallery];
  } else {
    product.gallery = gallery;
  }

  return product;
};

const findProductBySlug = async (slug) => {
  const result = await query('SELECT id, slug FROM products WHERE slug = $1 LIMIT 1', [slug]);
  return result.rows[0] || null;
};

const createProduct = async ({
  categoryId,
  productCode,
  name,
  slug,
  description,
  price,
  stockQty,
  imageUrl,
  status,
}) => {
  const supportsProductCode = await hasProductCodeColumn();

  const columns = ['category_id'];
  const values = [categoryId || null];

  if (supportsProductCode) {
    columns.push('product_code');
    values.push(productCode || null);
  }

  columns.push('name', 'slug', 'description', 'price', 'stock_qty', 'image_url', 'status');
  values.push(
    name,
    slug,
    description || null,
    price,
    stockQty ?? 0,
    imageUrl || null,
    status || 'active'
  );

  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const result = await query(
    `INSERT INTO products (${columns.join(', ')})
     VALUES (${placeholders})
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const updateProduct = async (
  id,
  {
    categoryId,
    productCode,
    name,
    slug,
    description,
    price,
    stockQty,
    imageUrl,
    status,
  }
) => {
  const supportsProductCode = await hasProductCodeColumn();
  const values = [id, categoryId || null];
  const assignments = ['category_id = $2'];

  if (supportsProductCode) {
    assignments.push(`product_code = $${values.length + 1}`);
    values.push(productCode || null);
  }

  assignments.push(`name = $${values.length + 1}`);
  values.push(name);
  assignments.push(`slug = $${values.length + 1}`);
  values.push(slug);
  assignments.push(`description = $${values.length + 1}`);
  values.push(description || null);
  assignments.push(`price = $${values.length + 1}`);
  values.push(price);
  assignments.push(`stock_qty = $${values.length + 1}`);
  values.push(stockQty ?? 0);
  assignments.push(`image_url = $${values.length + 1}`);
  values.push(imageUrl || null);
  assignments.push(`status = $${values.length + 1}`);
  values.push(status || 'active');

  const result = await query(
    `UPDATE products
     SET ${assignments.join(',\n       ')}
     WHERE id = $1
     RETURNING *`,
    values
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
