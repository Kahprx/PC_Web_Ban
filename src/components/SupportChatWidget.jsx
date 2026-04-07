import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createSupportChatSessionApi,
  fetchSupportChatMessagesApi,
  sendSupportChatMessageApi,
} from "../services/supportChatService";
import { notifyError } from "../utils/notify";
import "./SupportChatWidget.css";

const SESSION_STORAGE_KEY = "pc_store_support_chat_session";

const readStoredSessionId = () => {
  if (typeof window === "undefined") return "";
  return String(localStorage.getItem(SESSION_STORAGE_KEY) || "").trim();
};

const writeStoredSessionId = (sessionId) => {
  if (typeof window === "undefined") return;
  if (!sessionId) return;
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
};

export default function SupportChatWidget() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => readStoredSessionId());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  const displayName = useMemo(
    () => String(session?.name || session?.full_name || "").trim(),
    [session?.full_name, session?.name]
  );
  const displayEmail = useMemo(() => String(session?.email || "").trim(), [session?.email]);

  const ensureSession = async () => {
    const currentSessionId = String(sessionId || "").trim();
    if (currentSessionId) return currentSessionId;

    const result = await createSupportChatSessionApi("");
    const nextSessionId = String(result?.data?.sessionId || "").trim();
    if (nextSessionId) {
      setSessionId(nextSessionId);
      writeStoredSessionId(nextSessionId);
    }
    return nextSessionId;
  };

  const loadHistory = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoadingHistory(true);
      const sid = await ensureSession();
      if (!sid) return;
      const result = await fetchSupportChatMessagesApi(sid);
      setMessages(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      notifyError(error, "Không tải được lịch sử chat hỗ trợ");
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  };

  useEffect(() => {
    ensureSession().catch(() => {
      // Tự tạo lại khi mở widget.
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    loadHistory();

    const timer = setInterval(() => {
      loadHistory({ silent: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [open]);

  const handleSend = async (event) => {
    event.preventDefault();
    const message = String(inputValue || "").trim();
    if (!message || sending) return;

    try {
      setSending(true);
      const sid = await ensureSession();
      if (!sid) return;

      const result = await sendSupportChatMessageApi({
        sessionId: sid,
        message,
        name: displayName,
        email: displayEmail,
      });

      const nextMessages = [];
      if (result?.data?.userMessage) nextMessages.push(result.data.userMessage);
      if (result?.data?.botMessage) nextMessages.push(result.data.botMessage);

      if (nextMessages.length > 0) {
        setMessages((prev) => [...prev, ...nextMessages]);
      }
      setInputValue("");
    } catch (error) {
      notifyError(error, "Không gửi được tin nhắn hỗ trợ");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-chat">
      {open ? (
        <section className="support-chat-panel" aria-label="Hỗ trợ trực tuyến">
          <header className="support-chat-head">
            <div className="support-chat-brand">
              <span className="support-chat-avatar" aria-hidden="true">
                <span className="support-chat-avatar-eye support-chat-avatar-eye-left" />
                <span className="support-chat-avatar-eye support-chat-avatar-eye-right" />
                <span className="support-chat-avatar-mouth" />
              </span>
              <div>
                <strong>KAH Support</strong>
                <small>Online - phản hồi nhanh</small>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chat">
              x
            </button>
          </header>

          <div className="support-chat-body">
            {loadingHistory ? <p className="support-chat-state">Đang tải hội thoại...</p> : null}
            {!loadingHistory && messages.length === 0 ? (
              <p className="support-chat-state">Xin chào, bạn cần tư vấn cấu hình hay hỗ trợ đơn hàng?</p>
            ) : null}

            {messages.map((item) => (
              <article
                key={`chat-msg-${item.id}`}
                className={`support-chat-msg ${
                  item.role === "user" ? "is-user" : item.role === "admin" ? "is-admin" : "is-bot"
                }`}
              >
                <p>{item.message}</p>
              </article>
            ))}
          </div>

          <form className="support-chat-input-wrap" onSubmit={handleSend}>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Nhập tin nhắn hỗ trợ..."
              maxLength={500}
            />
            <button type="submit" disabled={sending}>
              {sending ? "..." : "Gửi"}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="support-chat-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Mở chat hỗ trợ"
      >
        <span className="support-chat-fab-icon" aria-hidden="true">
          <span className="support-chat-fab-dot support-chat-fab-dot-1" />
          <span className="support-chat-fab-dot support-chat-fab-dot-2" />
          <span className="support-chat-fab-dot support-chat-fab-dot-3" />
        </span>
        <span>Hỗ trợ</span>
      </button>
    </div>
  );
}
