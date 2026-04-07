const express = require("express");
const {
  createSession,
  getMessages,
  sendMessage,
  getAdminSessions,
  getAdminSessionMessages,
  sendAdminMessage,
} = require("../controllers/supportChatController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/session", createSession);
router.get("/messages/:sessionId", getMessages);
router.post("/messages", sendMessage);
router.get("/admin/sessions", requireAuth, requireRole("admin"), getAdminSessions);
router.get("/admin/messages/:sessionId", requireAuth, requireRole("admin"), getAdminSessionMessages);
router.post("/admin/messages", requireAuth, requireRole("admin"), sendAdminMessage);

module.exports = router;
