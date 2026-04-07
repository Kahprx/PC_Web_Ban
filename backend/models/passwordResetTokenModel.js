const { query } = require("../utils/db");

const createPasswordResetToken = async ({ userId, token, expiresAt }) => {
  const result = await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expires_at, created_at`,
    [userId, token, expiresAt]
  );

  return result.rows[0] || null;
};

const findValidPasswordResetToken = async (token) => {
  const result = await query(
    `SELECT prt.id, prt.token, prt.expires_at, prt.created_at, u.id AS user_id, u.email
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1
       AND prt.expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  return result.rows[0] || null;
};

const consumePasswordResetToken = async (token) => {
  const result = await query(
    `DELETE FROM password_reset_tokens
     WHERE token = $1
     RETURNING id`,
    [token]
  );

  return result.rows.length > 0;
};

module.exports = {
  createPasswordResetToken,
  findValidPasswordResetToken,
  consumePasswordResetToken,
};
