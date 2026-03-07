const express = require("express");
const router = express.Router();
const review = require("../controllers/reviewController");

router.get("/:productId", review.getReviews);
router.post("/", review.createReview);
router.put("/:id", review.updateReview);
router.delete("/:id", review.deleteReview);

module.exports = router;