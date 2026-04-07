const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();

const fs = require('fs');
const { Client } = require('pg');
const app = require('./app');
const { query } = require('./utils/db');
const { ensureCatalogCoverage } = require('./config/ensureCatalogCoverage');

const PORT = Number(process.env.PORT || 4000);
const PORT_FALLBACK_TRIES = Number(process.env.PORT_FALLBACK_TRIES || 20);
const STARTUP_DB_RETRIES = Number(process.env.STARTUP_DB_RETRIES || 15);
const STARTUP_DB_RETRY_DELAY_MS = Number(process.env.STARTUP_DB_RETRY_DELAY_MS || 1500);
const DB_NAME = String(process.env.DB_NAME || 'pc_store');
const RUNTIME_DIR = path.resolve(__dirname, '.runtime');
const RUNTIME_PORT_FILE = path.resolve(RUNTIME_DIR, 'backend.port');
const SCHEMA_SQL_FILE = path.resolve(__dirname, 'sql', 'schema.sql');
const SEED_SQL_FILE = path.resolve(__dirname, 'sql', 'seed.sql');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureDatabaseExists = async (databaseName) => {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Invalid database name: ${databaseName}`);
  }

  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  await adminClient.connect();
  try {
    const existsResult = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1',
      [databaseName]
    );
    if (existsResult.rowCount > 0) {
      return;
    }

    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Created missing database "${databaseName}".`);
  } finally {
    await adminClient.end();
  }
};

const waitForDatabase = async () => {
  let lastError = null;
  let ensuredDatabase = false;

  for (let attempt = 1; attempt <= STARTUP_DB_RETRIES; attempt += 1) {
    try {
      await query('SELECT 1');
      if (attempt > 1) {
        console.log(`PostgreSQL connected after ${attempt} attempts.`);
      }
      return;
    } catch (error) {
      lastError = error;

      const isMissingDatabase =
        !ensuredDatabase &&
        (error.code === '3D000' || /database .* does not exist/i.test(String(error.message || '')));

      if (isMissingDatabase) {
        try {
          await ensureDatabaseExists(DB_NAME);
          ensuredDatabase = true;
          continue;
        } catch (createError) {
          lastError = createError;
          console.warn(`Create database failed: ${createError.message}`);
        }
      }

      console.warn(
        `PostgreSQL not ready (attempt ${attempt}/${STARTUP_DB_RETRIES}): ${error.message}`
      );
      if (attempt < STARTUP_DB_RETRIES) {
        await sleep(STARTUP_DB_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError || new Error('PostgreSQL connection failed.');
};

const ensureSchemaReady = async () => {
  const usersRegclass = await query("SELECT to_regclass('public.users') AS table_name");
  const usersExists = Boolean(usersRegclass?.rows?.[0]?.table_name);
  if (usersExists) return;

  if (!fs.existsSync(SCHEMA_SQL_FILE)) {
    throw new Error(`Missing schema SQL file: ${SCHEMA_SQL_FILE}`);
  }

  const schemaSql = fs.readFileSync(SCHEMA_SQL_FILE, 'utf8').replace(/^\uFEFF/, '');
  await query(schemaSql);
  console.log('Bootstrapped schema from backend/sql/schema.sql');
};

const ensureSeedReady = async () => {
  const categoriesRegclass = await query("SELECT to_regclass('public.categories') AS table_name");
  const categoriesExists = Boolean(categoriesRegclass?.rows?.[0]?.table_name);
  if (!categoriesExists) return;

  const countResult = await query('SELECT COUNT(*)::int AS total FROM categories');
  const total = Number(countResult?.rows?.[0]?.total || 0);
  if (total > 0) return;

  if (!fs.existsSync(SEED_SQL_FILE)) return;
  const seedSql = fs.readFileSync(SEED_SQL_FILE, 'utf8').replace(/^\uFEFF/, '');
  if (!seedSql.trim()) return;

  await query(seedSql);
  console.log('Seeded initial data from backend/sql/seed.sql');
};

const listenWithFallback = (targetPort, maxFallbackTries) =>
  new Promise((resolve, reject) => {
    const tryListen = (offset) => {
      const nextPort = targetPort + offset;
      const server = app.listen(nextPort, () => {
        if (offset > 0) {
          console.warn(`Port ${targetPort} is busy. Backend moved to port ${nextPort}.`);
        }
        resolve({ server, port: nextPort });
      });

      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && offset < maxFallbackTries) {
          tryListen(offset + 1);
          return;
        }
        reject(error);
      });
    };

    tryListen(0);
  });

const startServer = async () => {
  try {
    await waitForDatabase();
    await ensureSchemaReady();
    await ensureSeedReady();
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE");
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS default_shipping_address TEXT");
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS delivery_note TEXT");
    await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(24)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code ON products(product_code) WHERE product_code IS NOT NULL');
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        method VARCHAR(50) NOT NULL DEFAULT 'cod',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await query('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_product_url ON product_images(product_id, url)');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(50)');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');
    await query(`UPDATE payments SET method = COALESCE(NULLIF(method, ''), 'cod') WHERE method IS NULL OR method = ''`);
    await query('CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
    await query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await query('DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments');
    await query(`
      CREATE TRIGGER trg_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at()
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS support_chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS support_chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL REFERENCES support_chat_sessions(session_id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'bot', 'admin')),
        user_name VARCHAR(120),
        user_email VARCHAR(160),
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await query('ALTER TABLE support_chat_messages DROP CONSTRAINT IF EXISTS support_chat_messages_role_check');
    await query(`
      ALTER TABLE support_chat_messages
      ADD CONSTRAINT support_chat_messages_role_check
      CHECK (role IN ('user', 'bot', 'admin'))
    `);
    await query(
      'CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session ON support_chat_messages(session_id, id)'
    );
    const autoCatalogFillEnabled =
      String(process.env.ENABLE_AUTO_CATALOG_FILL || 'false').toLowerCase() === 'true';
    if (autoCatalogFillEnabled) {
      const coverage = await ensureCatalogCoverage();
      if (Number(coverage?.inserted || 0) > 0) {
        console.log(`Catalog coverage patched: +${coverage.inserted} linh-kien products.`);
      }
    }
    const { server, port } = await listenWithFallback(PORT, PORT_FALLBACK_TRIES);
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(RUNTIME_PORT_FILE, `${port}\n`, 'utf8');
    console.log(`PC Store backend running on http://localhost:${port}`);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Cannot start server. Ports ${PORT}..${PORT + PORT_FALLBACK_TRIES} are already in use.`
        );
      } else {
        console.error('Cannot start server due to listen error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Cannot start server. PostgreSQL connection failed.', error.message);
    process.exit(1);
  }
};

startServer();
