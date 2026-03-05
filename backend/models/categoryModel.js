const { query } = require('../utils/db');

const listCategories = async () => {
  const result = await query(
    `SELECT id, name, slug, created_at
     FROM categories
     ORDER BY name ASC`
  );

  return result.rows;
};

module.exports = {
  listCategories,
};
