const { query } = require('../utils/db');

const runQuery = async (client, sql, params = []) => {
  if (client?.query) {
    return client.query(sql, params);
  }
  return query(sql, params);
};

const createPayment = async ({ orderId, method, status = 'pending' }, client = null) => {
  const result = await runQuery(
    client,
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

const getLatestPaymentByOrderId = async (orderId) => {
  const result = await query(
    `SELECT id, order_id, method, status, created_at, updated_at
     FROM payments
     WHERE order_id = $1
     ORDER BY updated_at DESC NULLS LAST, id DESC
     LIMIT 1`,
    [orderId]
  );

  return result.rows[0] || null;
};

const upsertPaymentByOrderId = async ({ orderId, method, status = 'pending' }) => {
  const existing = await getLatestPaymentByOrderId(orderId);
  if (!existing) {
    return createPayment({ orderId, method, status });
  }

  const nextMethod = String(method || existing.method || 'banking');
  const nextStatus = String(status || existing.status || 'pending');

  const result = await query(
    `UPDATE payments
     SET method = $2,
         status = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [existing.id, nextMethod, nextStatus]
  );

  return result.rows[0] || null;
};

const updatePaymentStatusByOrderId = async ({ orderId, method, status }) => {
  const existing = await getLatestPaymentByOrderId(orderId);
  if (!existing) {
    return createPayment({
      orderId,
      method: String(method || 'banking'),
      status: String(status || 'pending'),
    });
  }

  const result = await query(
    `UPDATE payments
     SET method = COALESCE($2, method),
         status = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [existing.id, method ? String(method) : null, String(status || existing.status)]
  );

  return result.rows[0] || null;
};

module.exports = {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getLatestPaymentByOrderId,
  upsertPaymentByOrderId,
  updatePaymentStatusByOrderId,
};
