
const db = require("../models/db");

exports.createPayment = async (req, res) => {
  const { order_id, method } = req.body;

  await db.query(
    `INSERT INTO payments (order_id,method,status)
     VALUES (?,?,?)`,
    [order_id, method, "pending"]
  );

  res.json({ message: "Payment created" });
};

exports.paymentStatus = async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM payments WHERE id=?",
    [req.params.id]
  );

  res.json(rows[0]);
};