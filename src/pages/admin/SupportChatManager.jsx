import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAdminSupportMessagesApi,
  fetchAdminSupportSessionsApi,
  sendAdminSupportMessageApi,
} from "../../services/supportChatService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./AdminPages.css";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN");
};

export default function SupportChatManager() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messageListRef = useRef(null);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.session_id === selectedSessionId) || null,
    [selectedSessionId, sessions]
  );

  useEffect(() => {
    if (!token) return;
    let alive = true;

    const timer = setTimeout(async () => {
      try {
        setLoadingSessions(true);
        const result = await fetchAdminSupportSessionsApi(token, {
          search,
          page: 1,
          limit: 50,
        });

        if (!alive) return;
        const rows = result?.data || [];
        setSessions(rows);
        setSelectedSessionId((prev) => {
          if (prev && rows.some((item) => item.session_id === prev)) return prev;
          return rows[0]?.session_id || "";
        });
      } catch (error) {
        if (!alive) return;
        notifyError(error, "Không tải được danh sách chat");
      } finally {
        if (alive) setLoadingSessions(false);
      }
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [search, token]);

  useEffect(() => {
    if (!token || !selectedSessionId) {
      setMessages([]);
      return;
    }

    let alive = true;

    const loadMessages = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoadingMessages(true);
        const result = await fetchAdminSupportMessagesApi(selectedSessionId, token);
        if (!alive) return;
        setMessages(result?.data || []);
      } catch (error) {
        if (!alive) return;
        notifyError(error, "Không tải được hội thoại");
      } finally {
        if (alive && !silent) setLoadingMessages(false);
      }
    };

    loadMessages();
    const interval = setInterval(() => loadMessages({ silent: true }), 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [selectedSessionId, token]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const message = String(messageInput || "").trim();
    if (!selectedSessionId || !message) return;

    try {
      setSending(true);
      await sendAdminSupportMessageApi({ sessionId: selectedSessionId, message }, token);
      setMessageInput("");
      const result = await fetchAdminSupportMessagesApi(selectedSessionId, token);
      setMessages(result?.data || []);
      notifySuccess("Đã gửi phản hồi cho khách hàng.");
    } catch (error) {
      notifyError(error, "Gửi phản hồi thất bại");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Support chat</p>
            <h1>Admin chat hỗ trợ khách hàng theo phiên.</h1>
            <p>Chọn hội thoại bên trái, trả lời trực tiếp bên phải.</p>
          </div>
        </div>
      </section>

      <section className="admin-support-chat">
        <aside className="admin-support-sidebar">
          <label className="admin-support-search">
            <span>Tìm phiên chat</span>
            <input
              type="text"
              placeholder="Session ID / email / nội dung..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="admin-support-session-list">
            {loadingSessions ? <p className="admin-table-empty">Đang tải danh sách chat...</p> : null}
            {!loadingSessions && sessions.length === 0 ? (
              <p className="admin-table-empty">Chưa có hội thoại nào.</p>
            ) : null}

            {!loadingSessions
              ? sessions.map((session) => (
                  <button
                    key={`session-${session.session_id}`}
                    type="button"
                    className={`admin-support-session-item ${
                      selectedSessionId === session.session_id ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedSessionId(session.session_id)}
                  >
                    <strong>{session.user_name || "Khách vãng lai"}</strong>
                    <small>{session.user_email || session.session_id}</small>
                    <p>{session.last_message || "Chưa có nội dung"}</p>
                    <em>{formatTime(session.last_message_at || session.created_at)}</em>
                  </button>
                ))
              : null}
          </div>
        </aside>

        <section className="admin-support-chat-panel">
          <header className="admin-support-chat-head">
            <h2>{selectedSession ? selectedSession.user_name || "Khách hàng" : "Hội thoại"}</h2>
            <p>{selectedSession ? selectedSession.user_email || selectedSession.session_id : "Chưa chọn phiên chat."}</p>
          </header>

          <div ref={messageListRef} className="admin-support-message-list">
            {loadingMessages ? <p className="admin-table-empty">Đang tải tin nhắn...</p> : null}

            {!loadingMessages && messages.length === 0 ? (
              <p className="admin-table-empty">Chọn phiên chat để xem nội dung.</p>
            ) : null}

            {!loadingMessages
              ? messages.map((item) => (
                  <article
                    key={`msg-${item.id}`}
                    className={`admin-support-message ${
                      item.role === "admin" ? "is-admin" : item.role === "user" ? "is-user" : "is-bot"
                    }`}
                  >
                    <strong>
                      {item.role === "admin"
                        ? "Admin"
                        : item.role === "user"
                        ? item.user_name || "Khách hàng"
                        : "Tự động"}
                    </strong>
                    <p>{item.message}</p>
                    <small>{formatTime(item.created_at)}</small>
                  </article>
                ))
              : null}
          </div>

          <form className="admin-support-compose" onSubmit={handleSend}>
            <input
              type="text"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              placeholder="Nhập phản hồi cho khách hàng..."
              disabled={!selectedSessionId || sending}
            />
            <button type="submit" className="admin-btn" disabled={!selectedSessionId || sending}>
              {sending ? "Đang gửi..." : "Gửi"}
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
