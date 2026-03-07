const express = require("express");
const router = express.Router();
const cart = require("../controllers/cartController");

router.get("/", cart.getCart);
router.post("/add", cart.addToCart);
router.put("/update/:id", cart.updateCart);
router.delete("/:id", cart.deleteCartItem);
router.delete("/clear", cart.clearCart);

module.exports = router;