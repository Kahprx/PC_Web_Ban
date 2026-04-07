const { query } = require("../utils/db");

const ALLOWED_ROLES = new Set(["user", "bot", "admin"]);

const normalizeRole = (role) => {
  const normalized = String(role || "").trim().toLowerCase();

  if (ALLOWED_ROLES.has(normalized)) return normalized;
  if (normalized === "assistant" || normalized === "system") return "bot";
  if (normalized === "support" || normalized === "staff") return "admin";
  return "user";
};

const ensureRoleConstraint = async () => {
  await query("ALTER TABLE support_chat_messages DROP CONSTRAINT IF EXISTS support_chat_messages_role_check");
  await query(`
    ALTER TABLE support_chat_messages
    ADD CONSTRAINT support_chat_messages_role_check
    CHECK (role IN ('user', 'bot', 'admin'))
  `);
};

const createSessionIfMissing = async (sessionId) => {
  await query(
    `
      INSERT INTO support_chat_sessions (session_id)
      VALUES ($1)
      ON CONFLICT (session_id) DO NOTHING
    `,
    [sessionId]
  );
};

const listMessagesBySession = async (sessionId, limit = 120) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 120, 500));
  const result = await query(
    `
      SELECT
        id,
        session_id,
        role,
        user_name,
        user_email,
        message,
        created_at
      FROM support_chat_messages
      WHERE session_id = $1
      ORDER BY id ASC
      LIMIT $2
    `,
    [sessionId, safeLimit]
  );

  return result.rows;
};

const listChatSessionsForAdmin = async ({ page = 1, limit = 20, search = "" } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safeSearch = String(search || "").trim();
  const searchKeyword = safeSearch ? `%${safeSearch}%` : "";
  const offset = (safePage - 1) * safeLimit;

  const countResult = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM support_chat_sessions s
      WHERE
        ($1 = '' OR s.session_id ILIKE $2 OR EXISTS (
          SELECT 1
          FROM support_chat_messages m
          WHERE m.session_id = s.session_id
            AND (m.message ILIKE $2 OR COALESCE(m.user_name, '') ILIKE $2 OR COALESCE(m.user_email, '') ILIKE $2)
        ))
    `,
    [safeSearch, searchKeyword]
  );

  const listResult = await query(
    `
      SELECT
        s.session_id,
        s.created_at,
        COALESCE(last_msg.message, '') AS last_message,
        COALESCE(last_msg.created_at, s.created_at) AS last_message_at,
        COALESCE(last_user.user_name, '') AS user_name,
        COALESCE(last_user.user_email, '') AS user_email,
        COALESCE(msg_count.total_messages, 0)::int AS total_messages
      FROM support_chat_sessions s
      LEFT JOIN LATERAL (
        SELECT m.message, m.created_at
        FROM support_chat_messages m
        WHERE m.session_id = s.session_id
        ORDER BY m.id DESC
        LIMIT 1
      ) AS last_msg ON TRUE
      LEFT JOIN LATERAL (
        SELECT m.user_name, m.user_email
        FROM support_chat_messages m
        WHERE m.session_id = s.session_id
          AND m.role = 'user'
          AND (COALESCE(m.user_name, '') <> '' OR COALESCE(m.user_email, '') <> '')
        ORDER BY m.id DESC
        LIMIT 1
      ) AS last_user ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total_messages
        FROM support_chat_messages m
        WHERE m.session_id = s.session_id
      ) AS msg_count ON TRUE
      WHERE
        ($1 = '' OR s.session_id ILIKE $2 OR EXISTS (
          SELECT 1
          FROM support_chat_messages m
          WHERE m.session_id = s.session_id
            AND (m.message ILIKE $2 OR COALESCE(m.user_name, '') ILIKE $2 OR COALESCE(m.user_email, '') ILIKE $2)
        ))
      ORDER BY COALESCE(last_msg.created_at, s.created_at) DESC
      LIMIT $3 OFFSET $4
    `,
    [safeSearch, searchKeyword, safeLimit, offset]
  );

  return {
    items: listResult.rows,
    total: Number(countResult.rows?.[0]?.total || 0),
    page: safePage,
    limit: safeLimit,
  };
};

const createMessage = async ({ sessionId, role, userName = null, userEmail = null, message }) => {
  const safeRole = normalizeRole(role);

  const insertMessage = async () =>
    query(
      `
        INSERT INTO support_chat_messages (
          session_id,
          role,
          user_name,
          user_email,
          message
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          session_id,
          role,
          user_name,
          user_email,
          message,
          created_at
      `,
      [sessionId, safeRole, userName, userEmail, message]
    );

  try {
    const result = await insertMessage();
    return result.rows[0] || null;
  } catch (error) {
    const isRoleConstraintError =
      String(error?.code || "") === "23514" &&
      String(error?.constraint || "").toLowerCase() === "support_chat_messages_role_check";

    if (!isRoleConstraintError) throw error;

    await ensureRoleConstraint();
    const retryResult = await insertMessage();
    return retryResult.rows[0] || null;
  }
};

module.exports = {
  createSessionIfMissing,
  listMessagesBySession,
  listChatSessionsForAdmin,
  createMessage,
};
