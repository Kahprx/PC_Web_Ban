const { query } = require('../utils/db');

const SORT_FIELDS = {
  created_at: 'p.created_at',
  price: 'p.price',
  name: 'p.name',
};
const PRODUCT_TEXT_SQL = `LOWER(CONCAT_WS(' ', p.name, COALESCE(p.description, ''), COALESCE(p.slug, '')))`;
const PRODUCT_NAME_SQL = `LOWER(COALESCE(p.name, ''))`;
const PRODUCT_DESC_SQL = `LOWER(COALESCE(p.description, ''))`;
const PRODUCT_MAX_HZ_SQL = `COALESCE((SELECT MAX((m)[1]::int) FROM regexp_matches(${PRODUCT_TEXT_SQL}, '([0-9]{2,3})\\s*hz', 'g') AS m), 0)`;
const IS_LINH_KIEN_CATEGORY_SQL = `(p.category_id IN (SELECT id FROM categories WHERE slug = 'linh-kien'))`;
const containsAny = (patterns = []) => `(${patterns.map((pattern) => `${PRODUCT_TEXT_SQL} LIKE '${pattern}'`).join(' OR ')})`;
const hasPartMarker = (part) => `(${PRODUCT_DESC_SQL} LIKE '%part: ${part}%')`;
const hasLaptopTypeMarker = (type) => `(${PRODUCT_DESC_SQL} LIKE '%laptop_type: ${type}%')`;
const HAS_ANY_PART_MARKER_SQL = `(
  ${hasPartMarker('cpu')}
  OR ${hasPartMarker('mainboard')}
  OR ${hasPartMarker('gpu')}
  OR ${hasPartMarker('ram')}
  OR ${hasPartMarker('ssd')}
  OR ${hasPartMarker('hdd')}
  OR ${hasPartMarker('cooler')}
  OR ${hasPartMarker('fan')}
  OR ${hasPartMarker('psu')}
  OR ${hasPartMarker('case')}
)`;
const HAS_ANY_LAPTOP_TYPE_MARKER_SQL = `(
  ${hasLaptopTypeMarker('gaming')}
  OR ${hasLaptopTypeMarker('creator')}
  OR ${hasLaptopTypeMarker('mainstream')}
)`;

const LINH_KIEN_CPU_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('cpu')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])(cpu|intel\\s+core|ryzen)([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%bo vi xu ly%'
      )
    )
  )
)`;

const LINH_KIEN_MAINBOARD_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('mainboard')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} LIKE '%mainboard%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%bo mach chu%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%motherboard%'
      )
      AND ${PRODUCT_TEXT_SQL} NOT LIKE '%laptop%'
      AND ${PRODUCT_TEXT_SQL} NOT LIKE '%macbook%'
      AND ${PRODUCT_TEXT_SQL} NOT LIKE '%pc gaming%'
      AND ${PRODUCT_TEXT_SQL} NOT LIKE '%bo pc%'
      AND ${PRODUCT_TEXT_SQL} NOT LIKE '%build pc%'
    )
  )
)`;

const LINH_KIEN_GPU_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('gpu')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])(vga|gpu|card\\s*man\\s*hinh|geforce|radeon)([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])gtx\\s*[0-9]{3,4}([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])rtx\\s*[0-9]{3,4}([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])rx\\s*[0-9]{3,4}([^a-z0-9]|$)'
      )
    )
  )
)`;

const LINH_KIEN_MAINBOARD_SIGNAL_SQL = `(
  ${hasPartMarker('mainboard')}
  OR ${PRODUCT_TEXT_SQL} LIKE '%mainboard%'
  OR ${PRODUCT_TEXT_SQL} LIKE '%motherboard%'
  OR ${PRODUCT_TEXT_SQL} LIKE '%bo mach chu%'
  OR ${PRODUCT_TEXT_SQL} LIKE '%chipset%'
  OR ${PRODUCT_TEXT_SQL} LIKE '%socket%'
)`;

const LINH_KIEN_RAM_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND NOT ${LINH_KIEN_MAINBOARD_SIGNAL_SQL}
  AND (
    ${hasPartMarker('ram')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])ram([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%ddr3%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%ddr4%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%ddr5%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%sodimm%'
      )
    )
  )
)`;

const LINH_KIEN_SSD_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('ssd')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])ssd([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])nvme([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])m\\.2([^a-z0-9]|$)'
      )
    )
  )
)`;

const LINH_KIEN_HDD_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('hdd')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])hdd([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%hard drive%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%o cung hdd%'
      )
    )
  )
)`;

const LINH_KIEN_COOLER_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('cooler')}
    OR ${hasPartMarker('fan')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} LIKE '%tan nhiet%'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])(heatsink|aio)([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])fan([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%radiator%'
      )
    )
  )
)`;

const LINH_KIEN_FAN_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('fan')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])fan([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%cooling fan%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%fan case%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%fan radiator%'
      )
    )
  )
)`;

const LINH_KIEN_PSU_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('psu')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])(nguon|psu)([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%80+ bronze%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%80+ gold%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%80+ platinum%'
      )
    )
  )
)`;

const LINH_KIEN_CASE_SQL = `(
  ${IS_LINH_KIEN_CATEGORY_SQL}
  AND (
    ${hasPartMarker('case')}
    OR (
      NOT ${HAS_ANY_PART_MARKER_SQL}
      AND (
        ${PRODUCT_TEXT_SQL} ~ '(^|[^a-z0-9])case([^a-z0-9]|$)'
        OR ${PRODUCT_TEXT_SQL} LIKE '%vo case%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%mid tower%'
        OR ${PRODUCT_TEXT_SQL} LIKE '%full tower%'
      )
    )
  )
)`;

const LINH_KIEN_CORE_SQL = `(
  ${LINH_KIEN_CPU_SQL}
  OR ${LINH_KIEN_MAINBOARD_SQL}
  OR ${LINH_KIEN_GPU_SQL}
  OR ${LINH_KIEN_RAM_SQL}
  OR ${LINH_KIEN_SSD_SQL}
  OR ${LINH_KIEN_HDD_SQL}
  OR ${LINH_KIEN_COOLER_SQL}
  OR ${LINH_KIEN_FAN_SQL}
  OR ${LINH_KIEN_PSU_SQL}
  OR ${LINH_KIEN_CASE_SQL}
)`;
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

  'laptop-gaming': `(
    ${hasLaptopTypeMarker('gaming')}
    OR (
      NOT ${HAS_ANY_LAPTOP_TYPE_MARKER_SQL}
      AND ${containsAny(['%gaming%', '%rtx%', '%geforce%'])}
    )
  )`,
  'laptop-creator': `(
    ${hasLaptopTypeMarker('creator')}
    OR (
      NOT ${HAS_ANY_LAPTOP_TYPE_MARKER_SQL}
      AND ${containsAny(['%do hoa%', '%creator%', '%studio%', '%render%', '%adobe%'])}
    )
  )`,
  'laptop-mainstream': `(
    ${hasLaptopTypeMarker('mainstream')}
    OR (
      NOT ${HAS_ANY_LAPTOP_TYPE_MARKER_SQL}
      AND ${containsAny(['%van phong%', '%office%', '%hoc tap%', '%pho thong%', '%sinh vien%'])}
    )
  )`,

  'macbook-air': containsAny(['%macbook air%', '%macbook_type: air%']),
  'macbook-pro': containsAny(['%macbook pro%', '%macbook_type: pro%']),
  'macbook-m1': containsAny(['%apple m1%', '% m1 %', '%chip: apple m1%']),
  'macbook-m2': containsAny(['%apple m2%', '% m2 %', '%chip: apple m2%']),
  'macbook-m3': containsAny(['%apple m3%', '% m3 %', '%chip: apple m3%']),

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

  'linh-kien-cpu': LINH_KIEN_CPU_SQL,
  'linh-kien-mainboard': LINH_KIEN_MAINBOARD_SQL,
  'linh-kien-gpu': LINH_KIEN_GPU_SQL,
  'linh-kien-vga': LINH_KIEN_GPU_SQL,
  'linh-kien-ram': LINH_KIEN_RAM_SQL,
  'linh-kien-ssd': LINH_KIEN_SSD_SQL,
  'linh-kien-hdd': LINH_KIEN_HDD_SQL,
  'linh-kien-cooler': LINH_KIEN_COOLER_SQL,
  'linh-kien-fan': LINH_KIEN_FAN_SQL,
  'linh-kien-psu': LINH_KIEN_PSU_SQL,
  'linh-kien-case': LINH_KIEN_CASE_SQL,
  'linh-kien-core': LINH_KIEN_CORE_SQL,
};

const CATEGORY_GROUP_SLUGS = {
  'gaming-gear': ['gaming-gear', 'chuot', 'ban-phim', 'tai-nghe', 'pad'],
  gear: ['gaming-gear', 'chuot', 'ban-phim', 'tai-nghe', 'pad'],
  'linh-kien': ['linh-kien'],
  'linh-kien-pc': ['linh-kien'],
  'pc-linh-kien': ['linh-kien'],
  'man-hinh': ['man-hinh'],
  monitor: ['man-hinh'],
  'ban-phim': ['ban-phim'],
  keyboard: ['ban-phim'],
  chuot: ['chuot'],
  mouse: ['chuot'],
  'tai-nghe': ['tai-nghe'],
  audio: ['tai-nghe'],
  laptop: ['laptop'],
  macbook: ['macbook'],
  'pc-gaming': ['pc-gaming', 'pc'],
  pc: ['pc-gaming', 'pc'],
};

let hasProductCodeColumnCache = null;
let hasProductImagesTableCache = null;
let hasProductSpecsTableCache = null;

const specKeyByLabel = {
  CPU: 'cpu',
  MAINBOARD: 'mainboard',
  RAM: 'ram',
  VGA: 'vga',
  SSD: 'ssd',
  HDD: 'hdd',
  PSU: 'psu',
  CASE: 'case',
  COOLER: 'cooler',
};

const inferSpecFromText = (field, text) => {
  if (!text) return '';

  if (field === 'cpu') {
    const match = text.match(/(Intel\s+Core\s+i[3579][^\|\n,;]*|AMD\s+Ryzen\s+[3579][^\|\n,;]*|Ryzen\s+[3579][^\|\n,;]*)/i);
    return match ? match[1].trim() : '';
  }

  if (field === 'mainboard') {
    const match = text.match(/((?:ASUS|MSI|GIGABYTE|ASROCK|COLORFUL)?\s*(?:X\d{2,3}|Z\d{2,3}|B\d{2,3}|AMD\s*B\d{2,3}))/i);
    return match ? match[1].trim() : '';
  }

  if (field === 'ram') {
    const match = text.match(/(DDR[345](?:\s*\d+\s*GB)?)/i);
    return match ? match[1].replace(/\s+/g, ' ').trim() : '';
  }

  if (field === 'vga') {
    const match = text.match(/(GTX\s*1650|RTX\s*[2-5]0[6-9]0(?:\s*(?:TI|SUPER))?|RTX\s*50[7-9]0(?:\s*(?:TI|SUPER))?|RX\s*[67]\d{3}(?:\s*(?:XT|XTX|GRE))?|RX\s*79\d{2}(?:\s*(?:XT|XTX|GRE))?)/i);
    return match ? match[1].replace(/\s+/g, ' ').trim() : '';
  }

  if (field === 'ssd' || field === 'hdd') {
    const match = text.match(/(128GB|256GB|512GB|1TB|2TB|4TB)/i);
    return match ? match[1].trim() : '';
  }

  if (field === 'psu') {
    const match = text.match(/(350W|450W|550W|650W|750W|850W|1000W|1250W)/i);
    return match ? match[1].trim() : '';
  }

  if (field === 'case') {
    const match = text.match(/(ASUS|MSI|GIGABYTE|ASROCK|COLORFUL|NZXT|CORSAIR|LIAN LI|THERMALTAKE|DEEPCOOL|COOLER MASTER|ANTEC|MONTECH|FRACTAL DESIGN|INWIN|XIGMATEK|HYTE)/i);
    return match ? match[1].trim() : '';
  }

  return '';
};

const parseSpecsFromDescription = (product) => {
  const description = String(product?.description || '');
  const name = String(product?.name || '');
  const text = `${description} | ${name}`.trim();
  const next = { ...product };

  Object.entries(specKeyByLabel).forEach(([label, field]) => {
    const regex = new RegExp(`${label}\\s*:\\s*([^|\\n;]+)`, 'i');
    const labelMatch = description.match(regex);
    const valueFromLabel = labelMatch ? String(labelMatch[1] || '').trim() : '';
    const inferred = inferSpecFromText(field, text);
    next[field] = valueFromLabel || inferred || null;
  });

  return next;
};

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

const hasProductSpecsTable = async () => {
  if (typeof hasProductSpecsTableCache === 'boolean') {
    return hasProductSpecsTableCache;
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'product_specs'
     ) AS exists`
  );

  hasProductSpecsTableCache = Boolean(result.rows[0]?.exists);
  return hasProductSpecsTableCache;
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
  const normalizedCategoryGroup = String(categoryGroup || '').trim().toLowerCase();

  if (search) {
    const searchFields = [`p.name ILIKE $${idx}`, `COALESCE(p.description, '') ILIKE $${idx}`];
    if (supportsProductCode) {
      searchFields.push(`COALESCE(p.product_code, '') ILIKE $${idx}`);
    }

    conditions.push(`(${searchFields.join(' OR ')})`);
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

  const groupSlugs = CATEGORY_GROUP_SLUGS[normalizedCategoryGroup] || [];
  if (!categoryId && (!Array.isArray(categoryIds) || categoryIds.length === 0) && groupSlugs.length > 0) {
    conditions.push(`p.category_id IN (SELECT id FROM categories WHERE slug = ANY($${idx}))`);
    values.push(groupSlugs);
    idx += 1;
  }

  const categoryGroupFocusCondition = FOCUS_FILTER_SQL[normalizedCategoryGroup];
  if (
    !categoryId &&
    (!Array.isArray(categoryIds) || categoryIds.length === 0) &&
    !focusFilterId &&
    categoryGroupFocusCondition
  ) {
    conditions.push(categoryGroupFocusCondition);
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
    items: dataResult.rows.map((item) => parseSpecsFromDescription(item)),
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
    return parseSpecsFromDescription(product);
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

  const supportsProductSpecs = await hasProductSpecsTable();
  if (supportsProductSpecs) {
    const specsResult = await query(
      `SELECT spec_key, spec_value
       FROM product_specs
       WHERE product_id = $1
       ORDER BY id ASC`,
      [id]
    );

    product.spec_details = specsResult.rows
      .map((row) => ({
        key: String(row.spec_key || '').trim(),
        value: String(row.spec_value || '').trim(),
      }))
      .filter((item) => item.key && item.value);
  } else {
    product.spec_details = [];
  }

  return parseSpecsFromDescription(product);
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

