const { query } = require('../utils/db');

const createPayment = async ({ orderId, method, status = 'pending' }) => {
  const result = await query(
    `INSERT INTO payments (order_id, method, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderId, method, status]
  );

  return result.rows[0];
};

const getPaymentById = async (id) => {
  const result = await query(
    `SELECT id, order_id, method, status, created_at, updated_at
     FROM payments
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
};

const updatePaymentStatus = async (id, status) => {
  const result = await query(
    `UPDATE payments
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );

  return result.rows[0] || null;
};

module.exports = {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
};
