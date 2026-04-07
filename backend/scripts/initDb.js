require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");

const SQL_DIR = path.join(__dirname, "..", "sql");

const readSql = (filename) => fs.readFileSync(path.join(SQL_DIR, filename), "utf8").replace(/^\uFEFF/, "");

const args = new Set(process.argv.slice(2));
const shouldReset = args.has("--reset");
const shouldSchema = args.has("--schema");
const shouldSeed = args.has("--seed");

const run = async (label, filename) => {
  const sql = readSql(filename);
  await query(sql);
  console.log(`OK: ${label} (${filename})`);
};

async function main() {
  if (!shouldReset && !shouldSchema && !shouldSeed) {
    console.log("Usage:");
    console.log("  node scripts/initDb.js --schema");
    console.log("  node scripts/initDb.js --seed");
    console.log("  node scripts/initDb.js --reset --schema --seed");
    process.exit(0);
  }

  try {
    if (shouldReset) {
      const resetSql = `
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
      `;
      await query(resetSql);
      console.log("OK: reset schema public");
    }

    if (shouldSchema) {
      await run("create schema", "schema.sql");
    }

    if (shouldSeed) {
      await run("seed data", "seed.sql");
    }

    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Database initialization failed.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
