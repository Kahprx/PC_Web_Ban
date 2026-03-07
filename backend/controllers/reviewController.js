const db = require("../models/db");

exports.getReviews = async (req, res) => {
  const productId = req.params.productId;

  const [rows] = await db.query(
    "SELECT * FROM reviews WHERE product_id=?",
    [productId]
  );

  res.json(rows);
};

exports.createReview = async (req, res) => {
  const { rating, comment, product_id } = req.body;
  const userId = req.user.id;

  await db.query(
    `INSERT INTO reviews (user_id,product_id,rating,comment)
     VALUES (?,?,?,?)`,
    [userId, product_id, rating, comment]
  );

  res.json({ message: "Review added" });
};

exports.updateReview = async (req, res) => {
  const { rating, comment } = req.body;

  await db.query(
    "UPDATE reviews SET rating=?,comment=? WHERE id=?",
    [rating, comment, req.params.id]
  );

  res.json({ message: "Review updated" });
};

exports.deleteReview = async (req, res) => {
  await db.query("DELETE FROM reviews WHERE id=?", [
    req.params.id
  ]);

  res.json({ message: "Review deleted" });
};