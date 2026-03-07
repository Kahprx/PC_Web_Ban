const express = require("express");
const router = express.Router();
const wishlist = require("../controllers/wishlistController");

router.get("/", wishlist.getWishlist);
router.post("/add", wishlist.addWishlist);
router.delete("/:id", wishlist.deleteWishlist);

module.exports = router;