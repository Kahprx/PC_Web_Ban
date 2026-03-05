const { query } = require('../utils/db');

const findUserByEmail = async (email) => {
  const result = await query(
    `SELECT id, full_name, email, password_hash, role, is_active, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await query(
    `SELECT id, full_name, email, role, is_active, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
};

const createUser = async ({ fullName, email, passwordHash, role = 'user' }) => {
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, is_active, created_at`,
    [fullName, email, passwordHash, role]
  );

  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
