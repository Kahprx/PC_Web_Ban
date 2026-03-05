const { query } = require('../utils/db');

const listOrders = async ({ userId = null, page = 1, limit = 10 }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (userId) {
    conditions.push(`o.user_id = $${idx}`);
    values.push(userId);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM orders o
     ${whereClause}`,
    values
  );

  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT
      o.id,
      o.user_id,
      u.full_name,
      u.email,
      o.total_amount,
      o.status,
      o.shipping_address,
      o.payment_method,
      o.created_at,
      o.updated_at
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total,
    page,
    limit,
  };
};

const getOrderById = async (orderId, userId = null) => {
  const values = [orderId];
  let where = 'WHERE o.id = $1';

  if (userId) {
    values.push(userId);
    where += ' AND o.user_id = $2';
  }

  const orderResult = await query(
    `SELECT
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.shipping_address,
      o.payment_method,
      o.created_at,
      o.updated_at
     FROM orders o
     ${where}
     LIMIT 1`,
    values
  );

  const order = orderResult.rows[0] || null;

  if (!order) return null;

  const itemsResult = await query(
    `SELECT
      oi.id,
      oi.product_id,
      p.name AS product_name,
      p.image_url,
      oi.quantity,
      oi.unit_price,
      oi.line_total
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows,
  };
};

const getProductForOrder = async (client, productId) => {
  const result = await client.query(
    `SELECT id, name, price, stock_qty
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );

  return result.rows[0] || null;
};

const createOrderRecord = async (client, { userId, totalAmount, shippingAddress, paymentMethod }) => {
  const result = await client.query(
    `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, user_id, total_amount, shipping_address, payment_method, status, created_at`,
    [userId, totalAmount, shippingAddress, paymentMethod]
  );

  return result.rows[0];
};

const createOrderItemRecord = async (client, { orderId, productId, quantity, unitPrice, lineTotal }) => {
  const result = await client.query(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [orderId, productId, quantity, unitPrice, lineTotal]
  );

  return result.rows[0];
};

const decreaseProductStock = async (client, { productId, quantity }) => {
  await client.query(
    `UPDATE products
     SET stock_qty = stock_qty - $2
     WHERE id = $1`,
    [productId, quantity]
  );
};

const getOrderStatistics = async () => {
  const overviewResult = await query(
    `SELECT
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_revenue,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders
     FROM orders`
  );

  const chartResult = await query(
    `SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total_amount), 0)::numeric(14,2) AS revenue
     FROM orders
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at) ASC`
  );

  return {
    overview: overviewResult.rows[0],
    chart: chartResult.rows,
  };
};

module.exports = {
  listOrders,
  getOrderById,
  getProductForOrder,
  createOrderRecord,
  createOrderItemRecord,
  decreaseProductStock,
  getOrderStatistics,
};
