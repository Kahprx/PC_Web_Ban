const db = require("../models/db");

exports.getComments = async (req, res) => {
  const productId = req.params.productId;

  const [rows] = await db.query(
    "SELECT * FROM comments WHERE product_id=?",
    [productId]
  );

  res.json(rows);
};

exports.createComment = async (req, res) => {
  const { product_id, content } = req.body;
  const userId = req.user.id;

  await db.query(
    "INSERT INTO comments (user_id,product_id,content) VALUES (?,?,?)",
    [userId, product_id, content]
  );

  res.json({ message: "Comment added" });
};

exports.updateComment = async (req, res) => {
  const { content } = req.body;

  await db.query(
    "UPDATE comments SET content=? WHERE id=?",
    [content, req.params.id]
  );

  res.json({ message: "Comment updated" });
};

exports.deleteComment = async (req, res) => {
  await db.query("DELETE FROM comments WHERE id=?", [
    req.params.id
  ]);

  res.json({ message: "Comment deleted" });
};