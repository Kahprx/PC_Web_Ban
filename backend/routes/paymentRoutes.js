const express = require("express");
const router = express.Router();
const payment = require("../controllers/paymentController");

router.post("/", payment.createPayment);
router.get("/status/:id", payment.paymentStatus);

module.exports = router;