import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUser, getWebsiteUserEmail, getWebsiteUserId } from "../../utils/websiteSession";
import { useHeroSlideshow, useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4}$/i;
const WEBSITE_USER_ID_REGEX = /^roomhyweb\d{6}$/i;

const normalizeWebsiteUserId = (rawId) => {
  const id = String(rawId || "").trim().toLowerCase();
  if (WEBSITE_USER_ID_REGEX.test(id)) return id;
  const digits = id.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  return "";
};

const generateWebsiteUserIdFromEmail = (email) => {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) return "";
  let hash = 0;
  for (let i = 0; i < safeEmail.length; i += 1) {
    hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

const getWebsiteUserAliases = (currentUser, activeChat) => {
  const aliases = new Set();
  const normalizedLoginId = normalizeWebsiteUserId(currentUser?.loginId || currentUser?.id || "");
  if (normalizedLoginId) aliases.add(normalizedLoginId);

  [
    currentUser?.id,
    currentUser?.user_id,
    currentUser?.signup_user_id,
    currentUser?.loginId,
    currentUser?._id,
    activeChat?.booking?.user_id,
    activeChat?.booking?.signup_user_id,
    activeChat?.booking?.website_user_id,
    activeChat?.booking?.userLoginId
  ].forEach((value) => {
    const alias = String(value || "").trim();
    if (alias) aliases.add(alias);
  });

  return Array.from(aliases).filter((alias) => alias !== normalizedLoginId);
};

const BOOKING_LINK_REGEX = /(https?:\/\/[^\s]+)/i;

const renderMessageBody = (text) => {
  const value = String(text || "");
  const match = value.match(BOOKING_LINK_REGEX);
  if (!match) {
    return <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{value}</p>;
  }

  const url = match[1];
  const before = value.slice(0, match.index || 0).trim();
  const after = value.slice((match.index || 0) + url.length).trim();

  return (
    <div className="space-y-2">
      {before ? <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{before}</p> : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 underline ring-1 ring-blue-100 hover:bg-blue-100 break-all"
      >
        <i data-lucide="link" className="w-4 h-4 flex-shrink-0"></i>
        <span className="break-all">Open booking form</span>
      </a>
      {after ? <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{after}</p> : null}
    </div>
  );
};

export default function WebsiteWebsitechat() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showLikePopup, setShowLikePopup] = useState(false);
  const [showDislikePopup, setShowDislikePopup] = useState(false);
  const socketRef = useRef(null);
  const currentUserRef = useRef(null);
  const activeChatRef = useRef(null);

  useLucideIcons([chats, activeChat, messages, showLikePopup, showDislikePopup]);

  const resolveWebsiteUserId = useCallback((user) => {
    const fromEmail = generateWebsiteUserIdFromEmail(user?.email || "");
    if (fromEmail) return fromEmail;
    return normalizeWebsiteUserId(user?.loginId || user?.id || "");
  }, []);

  const loadMessages = useCallback(async (chat, userOverride) => {
    const activeUser = userOverride || currentUserRef.current;
    if (!chat || !activeUser) return;
    const userId = resolveWebsiteUserId(activeUser);
    const ownerId = String(chat.owner_id || "").trim().toUpperCase();
    if (!userId || !ownerId) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversation?user1=${encodeURIComponent(userId)}&user2=${encodeURIComponent(ownerId)}`);
      const data = response.ok ? await response.json() : [];
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [apiUrl, resolveWebsiteUserId]);

  const connectSocket = useCallback((loginId, name) => {
    if (!loginId || !window.io) return;
    const aliases = getWebsiteUserAliases(currentUserRef.current, activeChatRef.current);
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_room", {
        login_id: loginId,
        role: "website_user",
        name: name || "Website User",
        aliases
      });
      return;
    }
    if (socketRef.current) {
      try { socketRef.current.removeAllListeners(); } catch (_) {}
      try { socketRef.current.disconnect(); } catch (_) {}
    }
    const socket = window.io(apiUrl, {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });
    const joinRoom = () => {
      const latestUser = currentUserRef.current;
      const resolvedLoginId = resolveWebsiteUserId(latestUser) || loginId;
      socket.emit("join_room", {
        login_id: resolvedLoginId,
        role: "website_user",
        name: latestUser?.firstName || latestUser?.name || name || "Website User",
        aliases: getWebsiteUserAliases(latestUser, activeChatRef.current)
      });
    };
    socket.on("connect", joinRoom);
    socket.on("reconnect", joinRoom);
    socket.on("receive_message", async (message) => {
      const active = activeChatRef.current;
      if (!active) return;
      const senderId = String(message?.sender_login_id || "").trim().toLowerCase();
      const expectedSenderId = String(active.owner_id || "").trim().toLowerCase();
      if (senderId === expectedSenderId) {
        await loadMessages(active, currentUserRef.current);
      }
    });
    socketRef.current = socket;
  }, [apiUrl, loadMessages, resolveWebsiteUserId]);

  const loadChats = useCallback(async (user) => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const userId = resolveWebsiteUserId(user) || getWebsiteUserId() || "";
      const email = user.email || getWebsiteUserEmail();
      const response = await fetch(`${apiUrl}/api/booking/requests?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email || userId)}`);
      const result = await response.json();
      const accepted = (result.data || []).filter((booking) => {
        const status = String(booking.status || booking.booking_status || booking.request_status || "").toLowerCase();
        return ["accepted", "approved", "confirmed", "booked"].includes(status);
      });
      const mapped = accepted
        .map((booking) => ({
          id: booking._id || booking.id,
          owner_id: booking.owner_id || booking.ownerLoginId || booking.ownerId || booking.owner_login_id || "",
          owner_name: booking.owner_name || booking.ownerName || "Property Owner",
          property_name: booking.property_name || booking.propertyName || "Property",
          user_email: booking.user_email || booking.email || email || "",
          booking
        }))
        .filter((chat) => chat.owner_id);
      setChats(mapped);
      if (!activeChatRef.current && mapped[0]) {
        setActiveChat(mapped[0]);
      }
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [apiUrl, resolveWebsiteUserId]);

  useEffect(() => {
    const user = getWebsiteUser();
    if (!user) {
      alert("Please login to continue");
      window.location.href = "signup";
      return;
    }
    const normalizedId = resolveWebsiteUserId(user);
    const normalizedUser = { ...user, loginId: normalizedId, id: normalizedId };
    currentUserRef.current = normalizedUser;
    setCurrentUser(normalizedUser);
    connectSocket(normalizedId, user.firstName || user.name || "Website User");
    loadChats(normalizedUser);
  }, [connectSocket, loadChats, resolveWebsiteUserId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeChatRef.current = activeChat;
    const loginId = normalizeWebsiteUserId(currentUserRef.current?.loginId || currentUserRef.current?.id || "");
    if (loginId) {
      connectSocket(loginId, currentUserRef.current?.firstName || currentUserRef.current?.name || "Website User");
    }
    if (activeChat) {
      loadMessages(activeChat, currentUserRef.current);
    }
  }, [activeChat, connectSocket, loadMessages]);

  const sendMessage = () => {
    if (!messageText.trim() || !activeChat || !currentUser) return;
    const ownerId = String(activeChat.owner_id || "").trim().toUpperCase();
    const userId = resolveWebsiteUserId(currentUser);
    if (!userId || !OWNER_LOGIN_ID_REGEX.test(ownerId)) {
      return;
    }
    if (/\d{10,}/.test(messageText)) {
      alert("Please do not share mobile numbers in chat.");
      return;
    }
    if (!socketRef.current) {
      connectSocket(userId, currentUser.firstName || currentUser.name || "Website User");
    }
    socketRef.current?.emit("send_message", { to_login_id: ownerId, message: messageText.trim() });
    setMessages((prev) => [
      ...prev,
      {
        _id: `${Date.now()}-local`,
        sender_login_id: userId,
        sender_name: currentUser.firstName || currentUser.name || "You",
        message: messageText.trim(),
        created_at: new Date().toISOString()
      }
    ]);
    setMessageText("");
  };

  const sendReaction = (type) => {
    if (!activeChat || !currentUser) return;
    const ownerId = String(activeChat.owner_id || "").trim().toUpperCase();
    const userId = resolveWebsiteUserId(currentUser);
    if (!socketRef.current) connectSocket(userId, currentUser.firstName || currentUser.name || "Website User");
    const reactionMessage = type === "like" ? "LIKE" : "DISLIKE";
    socketRef.current?.emit("send_message", { to_login_id: ownerId, message: reactionMessage });
    setMessages((prev) => [
      ...prev,
      {
        _id: `${Date.now()}-local`,
        sender_login_id: userId,
        sender_name: currentUser.firstName || currentUser.name || "You",
        message: reactionMessage,
        created_at: new Date().toISOString()
      }
    ]);
  };

  useHtmlPage({
    title: "Chat - Roomhy",
    bodyClass: "bg-gray-50 text-slate-800",
    htmlAttrs: { lang: "en", class: "scroll-smooth" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "referrer", content: "no-referrer-when-downgrade" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css", crossorigin: "anonymous", referrerpolicy: "no-referrer" },
      { rel: "stylesheet", href: "/website/assets/css/websitechat.css" }
    ],
    styles: [
      "body { font-family: 'Inter', sans-serif; }",
      "* { -webkit-tap-highlight-color: transparent; }",
      ".custom-scrollbar::-webkit-scrollbar { width: 4px; }",
      ".custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }",
      ".custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }",
      ".custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }",
      ".message-bubble { max-width: 85%; position: relative; transition: all 0.2s; word-wrap: break-word; overflow-wrap: break-word; }",
      "@media (min-width: 380px) { .message-bubble { max-width: 80%; } }",
      "@media (min-width: 640px) { .message-bubble { max-width: 75%; } }",
      "@media (min-width: 1024px) { .message-bubble { max-width: 60%; } }",
      ".message-bubble.sent { background: #4f46e5; color: white; border-radius: 16px 16px 2px 16px; padding: 8px 12px; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }",
      "@media (min-width: 640px) { .message-bubble.sent { padding: 10px 14px; font-size: 13px; border-radius: 18px 18px 4px 18px; } }",
      ".message-bubble.received { background: #f1f5f9; color: #1e293b; border-radius: 16px 16px 16px 2px; padding: 8px 12px; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }",
      "@media (min-width: 640px) { .message-bubble.received { padding: 10px 14px; font-size: 13px; border-radius: 18px 18px 18px 4px; } }",
      ".message-bubble a { color: #2563eb !important; text-decoration: underline; word-break: break-word; }",
      ".popup-modal { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; padding: 1rem; }",
      ".popup-modal.active { display: flex; }",
      ".popup-content { background: white; border-radius: 16px; padding: 1.5rem; max-width: 400px; width: 100%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); max-height: 90vh; overflow-y: auto; }",
      "@media (min-width: 640px) { .popup-content { padding: 2rem; border-radius: 20px; } }",
      ".popup-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 28px; }",
      "@media (min-width: 640px) { .popup-icon { width: 60px; height: 60px; font-size: 32px; } }",
      ".popup-icon.success { background: #ecfdf5; }",
      ".popup-icon.danger { background: #fef2f2; }",
      ".popup-title { font-size: 1.125rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; color: #1f2937; }",
      "@media (min-width: 640px) { .popup-title { font-size: 1.25rem; } }",
      ".popup-message { text-align: center; color: #6b7280; margin-bottom: 1.5rem; font-size: 0.875rem; line-height: 1.5; }",
      "@media (min-width: 640px) { .popup-message { font-size: 0.95rem; } }",
      ".popup-buttons { display: flex; flex-direction: column; gap: 0.75rem; justify-content: center; }",
      "@media (min-width: 380px) { .popup-buttons { flex-direction: row; gap: 1rem; } }",
      ".popup-btn { padding: 0.625rem 1.25rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 0.875rem; touch-action: manipulation; }",
      "@media (min-width: 640px) { .popup-btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.95rem; } }",
      ".popup-btn-primary { background: #4f46e5; color: white; }",
      ".popup-btn-primary:active { background: #4338ca; }",
      ".popup-btn-secondary { background: #f3f4f6; color: #6b7280; }",
      ".popup-btn-secondary:active { background: #e5e7eb; }",
      "@media (max-height: 600px) { .popup-content { padding: 1rem; } }"
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.socket.io/4.7.5/socket.io.min.js" }
    ]
  });

  return (
    <div className="html-page">
      <main className="max-w-7xl mx-auto px-0 sm:px-4 py-2 sm:py-8 mb-16 sm:mb-20 flex-1 w-full">
        <div className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden flex h-screen sm:h-[600px] md:h-[700px] border-y sm:border border-slate-100">
          <div className={`${activeChat ? "hidden md:flex" : "flex"} w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col min-w-0`} id="contacts-panel">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">My Chats</h3>
            </div>
            <div id="chat-list" className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1 sm:space-y-2">
              {loadingChats && <div className="p-4 text-center text-xs text-slate-400">Loading chats...</div>}
              {!loadingChats && chats.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No accepted bookings yet.</div>}
              {!loadingChats && chats.map((chat) => (
                <button key={chat.id} type="button" className="w-full text-left p-3 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-slate-100 hover:border-indigo-200 active:bg-indigo-50 transition-colors touch-manipulation" onClick={() => setActiveChat(chat)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                      {(chat.owner_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{chat.owner_name || "Owner"}</div>
                      <div className="text-[8px] sm:text-[10px] text-slate-400 truncate">{chat.property_name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col bg-white relative min-w-0`} id="chat-canvas">
            {!activeChat ? (
              <div id="no-chat-selected" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-indigo-50/20">
                <div className="w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg sm:shadow-xl shadow-indigo-100 flex-shrink-0">
                  <i data-lucide="message-circle" className="w-8 sm:w-12 h-8 sm:h-12 text-indigo-400"></i>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Your Conversations</h2>
                <p className="text-slate-500 max-w-xs mt-2 text-sm sm:text-base">Select an owner from the sidebar to start chatting about your booking.</p>
              </div>
            ) : (
              <div id="chat-active" className="flex-1 flex flex-col h-full">
                <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <button id="back-btn" className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 -ml-1.5 touch-manipulation active:bg-slate-100 rounded" onClick={() => setActiveChat(null)}>
                      <i data-lucide="arrow-left" className="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </button>
                    <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs sm:text-base flex-shrink-0" id="active-chat-avatar">
                      {(activeChat.owner_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-base leading-tight truncate" id="active-chat-name">{activeChat.owner_name || "Owner"}</h3>
                      <p className="text-[8px] sm:text-[10px] text-indigo-600 font-mono truncate" id="active-chat-id">{activeChat.property_name}</p>
                    </div>
                  </div>
                </div>

                <div id="messages" className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-2 sm:space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                  {loadingMessages && <div className="p-4 text-center text-xs text-slate-400">Loading messages...</div>}
                  {!loadingMessages && messages.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No messages yet. Start the conversation!</div>}
                  {!loadingMessages && messages.map((msg) => {
                    const userId = resolveWebsiteUserId(currentUser);
                    const isMine = String(msg.sender_login_id || "").trim().toLowerCase() === String(userId).toLowerCase();
                    const timestamp = msg.created_at ? new Date(msg.created_at) : new Date();
                    const time = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={msg._id || `${msg.sender_login_id}-${time}`} className={`message-container flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`message-bubble shadow-sm ${isMine ? "sent" : "received"}`}>
                          {renderMessageBody(msg.message)}
                          <div className="flex items-center justify-end gap-1 sm:gap-2 mt-1 sm:mt-2">
                            <span className="text-[7px] sm:text-[9px] opacity-60">{time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 sm:p-6 border-t border-slate-100 bg-white flex-shrink-0">
                  <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <button onClick={() => setShowLikePopup(true)} className="flex items-center gap-0.5 px-2 sm:px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] sm:text-[11px] font-bold border border-indigo-100 hover:bg-indigo-100 active:bg-indigo-200 transition-colors touch-manipulation">
                        <i data-lucide="thumbs-up" className="w-3 h-3"></i> LIKE
                      </button>
                      <button onClick={() => setShowDislikePopup(true)} className="flex items-center gap-0.5 px-2 sm:px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[9px] sm:text-[11px] font-bold border border-rose-100 hover:bg-rose-100 active:bg-rose-200 transition-colors touch-manipulation">
                        <i data-lucide="thumbs-down" className="w-3 h-3"></i> DISLIKE
                      </button>
                    </div>
                    <div className="relative flex items-end gap-1 sm:gap-2">
                      <textarea
                        id="message-text"
                        rows="1"
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full pl-3 sm:pl-5 pr-11 sm:pr-14 py-2.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all custom-scrollbar touch-manipulation"
                      ></textarea>
                      <button id="send-btn" onClick={sendMessage} className="absolute right-1.5 sm:right-2 flex-shrink-0 w-8 sm:w-11 h-8 sm:h-11 bg-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all touch-manipulation">
                        <i data-lucide="send" className="w-4 sm:w-5 h-4 sm:h-5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div id="like-popup" className={`popup-modal ${showLikePopup ? "active" : ""}`} onClick={() => setShowLikePopup(false)}>
        <div className="popup-content" onClick={(event) => event.stopPropagation()}>
          <div className="popup-icon success">👍</div>
          <div className="popup-title">Book Property?</div>
          <div className="popup-message">Click LIKE to confirm your interest in this property and receive the booking form.</div>
          <div className="popup-buttons">
            <button className="popup-btn popup-btn-secondary" onClick={() => setShowLikePopup(false)}>Cancel</button>
            <button className="popup-btn popup-btn-primary" onClick={() => { setShowLikePopup(false); sendReaction("like"); }}>Yes, Like</button>
          </div>
        </div>
      </div>

      <div id="dislike-popup" className={`popup-modal ${showDislikePopup ? "active" : ""}`} onClick={() => setShowDislikePopup(false)}>
        <div className="popup-content" onClick={(event) => event.stopPropagation()}>
          <div className="popup-icon danger">👎</div>
          <div className="popup-title">End Chat?</div>
          <div className="popup-message">Click DISLIKE to reject this property and close the chat permanently.</div>
          <div className="popup-buttons">
            <button className="popup-btn popup-btn-secondary" onClick={() => setShowDislikePopup(false)}>Cancel</button>
            <button className="popup-btn popup-btn-primary" style={{ background: "#dc2626", color: "white" }} onClick={() => { setShowDislikePopup(false); sendReaction("dislike"); }}>Yes, Dislike</button>
          </div>
        </div>
      </div>
    </div>
  );
}
