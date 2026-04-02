require('dotenv').config();

const app = require('./app');
const { query } = require('./utils/db');

const PORT = Number(process.env.PORT || 4000);

const startServer = async () => {
  try {
    await query('SELECT 1');
    await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(24)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code ON products(product_code) WHERE product_code IS NOT NULL');
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL
      )
    `);
    await query('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_product_url ON product_images(product_id, url)');
    app.listen(PORT, () => {
      console.log(`PC Store backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Cannot start server. PostgreSQL connection failed.', error.message);
    process.exit(1);
  }
};

startServer();
