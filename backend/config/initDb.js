const fs = require("fs");
const path = require("path");
const { query } = require("./db");

const SQL_DIR = path.join(__dirname, "..", "sql");

const runSqlFile = async (filename) => {
  const sql = fs.readFileSync(path.join(SQL_DIR, filename), "utf8").replace(/^\uFEFF/, "");
  await query(sql);
};

const initDb = async ({ reset = false, seed = false } = {}) => {
  if (reset) {
    await query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
    `);
  }

  await runSqlFile("schema.sql");

  if (seed) {
    await runSqlFile("seed.sql");
  }
};

module.exports = initDb;
