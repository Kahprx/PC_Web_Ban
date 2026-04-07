require("dotenv").config();

const { query, pool } = require("../utils/db");

async function main() {
  try {
    const versionResult = await query("SELECT version() AS version");
    const dbResult = await query("SELECT current_database() AS db, current_user AS user");

    console.log("Database connection: OK");
    console.log(`Database: ${dbResult.rows[0].db}`);
    console.log(`User: ${dbResult.rows[0].user}`);
    console.log(`PostgreSQL: ${versionResult.rows[0].version}`);
  } catch (error) {
    console.error("Database connection: FAILED");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
