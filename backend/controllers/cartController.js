const db = require("../models/db");

exports.getCart = async (req, res) => {
  const userId = req.user.id;

  const [rows] = await db.query(
    `SELECT c.id,p.name,p.price,p.image,c.quantity
     FROM cart_items c
     JOIN products p ON p.id=c.product_id
     WHERE c.user_id=?`,
    [userId]
  );

  res.json(rows);
};

exports.addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.id;

  await db.query(
    `INSERT INTO cart_items (user_id,product_id,quantity)
     VALUES (?,?,?)`,
    [userId, product_id, quantity]
  );

  res.json({ message: "Added to cart" });
};

exports.updateCart = async (req, res) => {
  const { quantity } = req.body;

  await db.query(
    "UPDATE cart_items SET quantity=? WHERE id=?",
    [quantity, req.params.id]
  );

  res.json({ message: "Cart updated" });
};

exports.deleteCartItem = async (req, res) => {
  await db.query("DELETE FROM cart_items WHERE id=?", [
    req.params.id
  ]);

  res.json({ message: "Item removed" });
};

exports.clearCart = async (req, res) => {
  const userId = req.user.id;

  await db.query(
    "DELETE FROM cart_items WHERE user_id=?",
    [userId]
  );

  res.json({ message: "Cart cleared" });
};