const db = require("../models/db");

exports.getWishlist = async (req, res) => {
  const userId = req.user.id;

  const [rows] = await db.query(
    `SELECT w.id,p.name,p.price,p.image
     FROM wishlist w
     JOIN products p ON p.id=w.product_id
     WHERE w.user_id=?`,
    [userId]
  );

  res.json(rows);
};

exports.addWishlist = async (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.id;

  await db.query(
    "INSERT INTO wishlist (user_id,product_id) VALUES (?,?)",
    [userId, product_id]
  );

  res.json({ message: "Added to wishlist" });
};

exports.deleteWishlist = async (req, res) => {
  await db.query("DELETE FROM wishlist WHERE id=?", [
    req.params.id
  ]);

  res.json({ message: "Removed wishlist" });
};