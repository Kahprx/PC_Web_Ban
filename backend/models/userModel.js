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

const listUsers = async ({ search = "", role = null, isActive = null, page = 1, limit = 20 }) => {
  const conditions = ["1 = 1"];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx += 1;
  }

  if (role) {
    conditions.push(`u.role = $${idx}`);
    values.push(role);
    idx += 1;
  }

  if (isActive !== null) {
    conditions.push(`u.is_active = $${idx}`);
    values.push(Boolean(isActive));
    idx += 1;
  }

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     WHERE ${conditions.join(" AND ")}`,
    values
  );

  const offset = (page - 1) * limit;
  const dataResult = await query(
    `SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_active,
      u.created_at,
      u.updated_at
     FROM users u
     WHERE ${conditions.join(" AND ")}
     ORDER BY u.created_at DESC
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

const updateUserRole = async (id, role) => {
  const result = await query(
    `UPDATE users
     SET role = $2
     WHERE id = $1
     RETURNING id, full_name, email, role, is_active, created_at, updated_at`,
    [id, role]
  );

  return result.rows[0] || null;
};

const updateUserActive = async (id, isActive) => {
  const result = await query(
    `UPDATE users
     SET is_active = $2
     WHERE id = $1
     RETURNING id, full_name, email, role, is_active, created_at, updated_at`,
    [id, Boolean(isActive)]
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
  listUsers,
  updateUserRole,
  updateUserActive,
};
