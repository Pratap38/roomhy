import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUser, getWebsiteUserEmail, getWebsiteUserId, getWebsiteUserName } from "../../utils/websiteSession";
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
    const fromUser = normalizeWebsiteUserId(user?.loginId || user?.id || "");
    if (fromUser) return fromUser;
    const fromEmail = generateWebsiteUserIdFromEmail(user?.email || "");
    if (fromEmail) return fromEmail;
    return "";
  }, []);

  const connectSocket = useCallback((loginId, name) => {
    if (!loginId) return;
    if (!window.io) return;
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
      const latestLoginId = normalizeWebsiteUserId(latestUser?.loginId || latestUser?.id || "") || loginId;
      socket.emit("join_room", {
        login_id: latestLoginId,
        role: "website_user",
        name: latestUser?.firstName || latestUser?.name || name || "Website User",
        aliases: getWebsiteUserAliases(latestUser, activeChatRef.current)
      });
    };
    socket.on("connect", joinRoom);
    socket.on("reconnect", joinRoom);
    socket.on("receive_message", (message) => {
      const activeChat = activeChatRef.current;
      const latestUser = currentUserRef.current;
      if (!activeChat || !latestUser) return;
      const senderId = String(message?.sender_login_id || "").trim().toLowerCase();
      const expectedSenderId = String(activeChat.owner_id || "").trim().toLowerCase();
      if (senderId === expectedSenderId) {
        setMessages((prev) => [...prev, message]);
      }
    });
    socketRef.current = socket;
  }, [apiUrl, activeChat]);

  const loadChats = useCallback(async (user) => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const userId = resolveWebsiteUserId(user) || getWebsiteUserId() || "";
      const email = user.email || getWebsiteUserEmail();
      const url = `${apiUrl}/api/booking/requests?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email || userId)}`;
      const response = await fetch(url);
      const result = await response.json();
      const allBookings = result.data || [];
      const accepted = allBookings.filter((b) => {
        const status = String(b.status || b.booking_status || b.request_status || "").toLowerCase();
        return status === "accepted" || status === "approved" || status === "confirmed" || status === "booked";
      });
      const mapped = accepted.map((booking) => ({
        id: booking._id || booking.id,
        owner_id: booking.owner_id || booking.ownerLoginId || booking.ownerId || booking.owner_login_id || "",
        owner_name: booking.owner_name || booking.ownerName || "Property Owner",
        property_name: booking.property_name || booking.propertyName || "Property",
        user_email: booking.user_email || booking.email || email || "",
        booking
      })).filter((chat) => chat.owner_id);
      setChats(mapped);
    } catch (error) {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [apiUrl, resolveWebsiteUserId]);

  const loadMessages = useCallback(async (chat) => {
    if (!chat || !currentUser) return;
    const userId = resolveWebsiteUserId(currentUser);
    const ownerId = String(chat.owner_id || "").trim().toUpperCase();
    if (!userId || !ownerId) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversation?user1=${encodeURIComponent(userId)}&user2=${encodeURIComponent(ownerId)}`);
      const data = response.ok ? await response.json() : [];
      const messageList = Array.isArray(data) ? data : [];
      setMessages(messageList);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [apiUrl, currentUser, resolveWebsiteUserId]);

  useEffect(() => {
    const user = getWebsiteUser();
    if (!user) {
      alert("Please login to continue");
      window.location.href = "signup";
      return;
    }
    const normalizedId = resolveWebsiteUserId(user);
    const normalizedUser = { ...user, loginId: normalizedId, id: normalizedId };
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
  }, [activeChat, connectSocket]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat, loadMessages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat || !currentUser) return;
    const ownerId = String(activeChat.owner_id || "").trim().toUpperCase();
    const userId = resolveWebsiteUserId(currentUser);
    if (!userId || !OWNER_LOGIN_ID_REGEX.test(ownerId)) {
      alert("Invalid chat participants.");
      return;
    }
    if (/\d{10,}/.test(messageText)) {
      alert("Please do not share mobile numbers in chat.");
      return;
    }
    if (!socketRef.current) {
      connectSocket(userId, currentUser.firstName || currentUser.name || "Website User");
    }
    // Send message via socket
    socketRef.current?.emit("send_message", { to_login_id: ownerId, message: messageText });
    
    // Add message to local state immediately
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
    
    // Add reaction to local state immediately
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
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth"
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "referrer", content: "no-referrer-when-downgrade" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css", crossorigin: "anonymous", referrerpolicy: "no-referrer" },
      { rel: "stylesheet", href: "/website/assets/css/websitechat.css" }
    ],
    styles: [
      "body { font-family: 'Inter', sans-serif; }",
      ".glass-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }",
      ".chat-hero { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }",
      ".custom-scrollbar::-webkit-scrollbar { width: 5px; }",
      ".custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }",
      ".message-bubble { max-width: 90%; position: relative; transition: all 0.2s; word-wrap: break-word; overflow-wrap: break-word; }",
      "@media (min-width: 640px) { .message-bubble { max-width: 80%; } }",
      ".message-bubble.sent { background: #4f46e5; color: white; border-radius: 18px 18px 4px 18px; padding: 10px 12px; font-size: 13px; line-height: 1.4; }",
      ".message-bubble.received { background: #f1f5f9; color: #1e293b; border-radius: 18px 18px 18px 4px; padding: 10px 12px; font-size: 13px; line-height: 1.4; }",
      "@media (min-width: 640px) { .message-bubble.sent { padding: 12px 16px; font-size: 14px; } .message-bubble.received { padding: 12px 16px; font-size: 14px; } }",
      ".popup-modal { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; }",
      ".popup-modal.active { display: flex; }",
      ".popup-content { background: white; border-radius: 20px; padding: 2rem; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: slideUp 0.3s ease-out; }",
      "@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }",
      ".popup-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 32px; }",
      ".popup-icon.success { background: #ecfdf5; }",
      ".popup-icon.danger { background: #fef2f2; }",
      ".popup-title { font-size: 1.25rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; color: #1f2937; }",
      ".popup-message { text-align: center; color: #6b7280; margin-bottom: 1.5rem; font-size: 0.95rem; }",
      ".popup-buttons { display: flex; gap: 1rem; justify-content: center; }",
      ".popup-btn { padding: 0.75rem 1.5rem; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-size: 0.95rem; }",
      ".popup-btn-primary { background: #4f46e5; color: white; }",
      ".popup-btn-primary:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3); }",
      ".popup-btn-secondary { background: #f3f4f6; color: #6b7280; }",
      ".popup-btn-secondary:hover { background: #e5e7eb; }"
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.socket.io/4.7.5/socket.io.min.js" }
    ],
    inlineScripts: [
      "tailwind.config = { theme: { extend: { keyframes: { kenburns: { '0%': { transform: 'scale(1) translate(0, 0)' }, '100%': { transform: 'scale(1.1) translate(-2%, 2%)' } } }, animation: { kenburns: 'kenburns 30s ease-in-out infinite alternate' } } } };"
    ]
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <a href="/website/index" className="flex-shrink-0">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
              </a>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden lg:flex items-center space-x-6">
                <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
                <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
              </nav>
              <a href="/website/fast-bidding" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold hover:shadow-lg transition-all flex items-center gap-1">
                <i data-lucide="zap" className="w-4 h-4"></i> <span className="hidden sm:inline">Fast Bidding</span>
              </a>
              <a href="/website/list" className="flex-shrink-0 flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-10 h-10 sm:w-auto sm:h-auto sm:px-4">
                <span className="text-3xl font-bold">+</span>
              </a>
              <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-20 md:py-28 text-white">
        <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
          <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
          <div className="absolute inset-0 w-full h-full bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h1 className="text-1l md:text-4xl font-bold text-shadow mb-6" style={{ color: "#fffcf2" }}>
            SEARCH.CONNECT.SUCCEED
          </h1>
          <div className="relative w-full max-w-2xl mx-auto">
            <input type="text" id="hero-search-input" placeholder="Search for 'PG near me' or 'Hostel in Kota'" className="w-full p-4 pl-5 pr-14 rounded-lg bg-white text-gray-900 border-transparent focus:ring-4 focus:ring-cyan-300/50 focus:outline-none placeholder-gray-500 shadow-lg" />
            <button type="submit" id="hero-search-btn" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <i data-lucide="search" className="w-5 h-5 text-white"></i>
            </button>
          </div>
        </div>
      </section>

      <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>

      <div id="mobile-menu" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
        <div className="flex justify-end p-4 flex-shrink-0">
          <button id="menu-close" className="p-2">
            <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
          </button>
        </div>

        <div id="menu-logged-in" className="hidden flex flex-col h-full">
          <div className="flex justify-between items-center px-6 py-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                <i data-lucide="user" className="w-6 h-6 text-white"></i>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">Hi,welcome</span>
                <p className="text-xs text-gray-500" id="userIdDisplay"></p>
              </div>
            </div>
            <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
          </div>
        </div>

        <div id="menu-logged-out" className="flex flex-col h-full">
          <div className="flex-grow p-4 space-y-1 overflow-y-auto">
            <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
              </div>
              <span>About Us</span>
            </a>
            <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
              </div>
              <span>Contact Us</span>
            </a>
          </div>
          <div className="p-4 space-y-3 border-t flex-shrink-0">
            <a href="/website/login" className="block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              <i data-lucide="log-in" className="w-4 h-4 inline mr-2"></i>
              Login
            </a>
            <a href="/website/signup" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
              <i data-lucide="user-plus" className="w-4 h-4 inline mr-2"></i>
              Sign Up
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-8 mb-20 flex-1 w-full">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex h-[500px] sm:h-[600px] md:h-[700px] border border-slate-100">
          <div className="flex w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col" id="contacts-panel">
            <div className="p-6 border-b border-slate-200 bg-white">
              <h3 className="font-bold text-slate-800 text-lg">My Chats</h3>
              <div className="relative mt-2 sm:mt-4">
                <input type="text" placeholder="Search..." className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm bg-slate-100 rounded-lg sm:rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none" />
                <i data-lucide="search" className="w-3 sm:w-4 h-3 sm:h-4 absolute left-2.5 sm:left-3 top-2.5 text-slate-400"></i>
              </div>
            </div>
            <div id="chat-list" className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1 sm:space-y-2">
              {loadingChats && (
                <div className="animate-pulse flex flex-col gap-3 sm:gap-4 p-2 sm:p-4">
                  <div className="h-10 sm:h-12 bg-slate-200 rounded-lg sm:rounded-xl w-full"></div>
                  <div className="h-10 sm:h-12 bg-slate-200 rounded-lg sm:rounded-xl w-full"></div>
                </div>
              )}
              {!loadingChats && chats.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">No accepted bookings yet.</div>
              )}
              {!loadingChats && chats.map((chat) => (
                <div key={chat.id} className="p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 cursor-pointer" onClick={() => setActiveChat(chat)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {(chat.owner_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{chat.owner_name || "Owner"}</div>
                      <div className="text-[10px] text-slate-400 truncate">{chat.property_name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white relative" id="chat-canvas">
            {!activeChat && (
              <div id="no-chat-selected" className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-indigo-50/20">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-100">
                  <i data-lucide="message-circle" className="w-12 h-12 text-indigo-400"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Your Conversations</h2>
                <p className="text-slate-500 max-w-xs mt-2">Select an owner from the sidebar to start chatting about your booking.</p>
              </div>
            )}

            {activeChat && (
              <div id="chat-active" className="flex-1 flex flex-col h-full">
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button id="back-btn" className="md:hidden text-slate-400" onClick={() => setActiveChat(null)}>
                      <i data-lucide="arrow-left" className="w-6 h-6"></i>
                    </button>
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm sm:text-base" id="active-chat-avatar">
                      {(activeChat.owner_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight truncate" id="active-chat-name">{activeChat.owner_name || "Owner"}</h3>
                      <p className="text-[9px] sm:text-[10px] text-indigo-600 font-mono truncate" id="active-chat-id">{activeChat.property_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><i data-lucide="phone" className="w-4 sm:w-5 h-4 sm:h-5"></i></button>
                    <button className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><i data-lucide="more-vertical" className="w-4 sm:w-5 h-4 sm:h-5"></i></button>
                  </div>
                </div>

                <div id="messages" className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                  {loadingMessages && (
                    <div className="p-4 text-center text-xs text-slate-400">Loading messages...</div>
                  )}
                  {!loadingMessages && messages.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">No messages yet. Start the conversation!</div>
                  )}
                  {!loadingMessages && messages.map((msg) => {
                    const userId = resolveWebsiteUserId(currentUser);
                    const isMine = String(msg.sender_login_id || "").trim().toLowerCase() === String(userId).toLowerCase();
                    const timestamp = msg.created_at ? new Date(msg.created_at) : new Date();
                    const time = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={msg._id || `${msg.sender_login_id}-${time}`} className={`message-container flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`message-bubble shadow-sm ${isMine ? "sent" : "received"}`}>
                          <p className="text-xs sm:text-sm leading-relaxed">{msg.message}</p>
                          <div className="flex items-center justify-end gap-1 sm:gap-2 mt-1 sm:mt-2">
                            <span className="text-[7px] sm:text-[9px] opacity-60">{time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 sm:p-6 border-t border-slate-100">
                  <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <button onClick={() => setShowLikePopup(true)} className="flex items-center gap-0.5 px-2 sm:px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] sm:text-[11px] font-bold border border-indigo-100 hover:bg-indigo-100 transition-all">
                        <i data-lucide="thumbs-up" className="w-3 h-3"></i> LIKE
                      </button>
                      <button onClick={() => setShowDislikePopup(true)} className="flex items-center gap-0.5 px-2 sm:px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[9px] sm:text-[11px] font-bold border border-rose-100 hover:bg-rose-100 transition-all">
                        <i data-lucide="thumbs-down" className="w-3 h-3"></i> DISLIKE
                      </button>
                    </div>
                    <div className="relative flex items-center">
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
                        className="w-full pl-4 sm:pl-5 pr-12 sm:pr-14 py-2 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all custom-scrollbar"
                      ></textarea>
                      <button id="send-btn" onClick={sendMessage} className="absolute right-2 w-9 sm:w-11 h-9 sm:h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">
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

      <footer className="footer container mx-auto px-4 sm:px-6 mt-16">
        <div className="footer-main">
          <div className="footer-logo">
            <img src="https://placehold.co/180x40/0f172a/ffffff?text=Roomhy+Logo" alt="Roomhy Logo" />
            <p className="mt-4">Discover Your Next Home, Together. Zero Brokerage, Student-First Approach.</p>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="/website/about">About Us</a></li>
              <li><a href="/website/ourproperty">Properties</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="/website/contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Top Cities</h4>
            <ul>
              <li><a href="/website/ourproperty?city=kota">Kota</a></li>
              <li><a href="/website/ourproperty?city=sikar">Sikar</a></li>
              <li><a href="/website/ourproperty?city=indore">Indore</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Support & Legal</h4>
            <div className="space-y-2">
              <p><i className="fas fa-phone"></i> +91 99830 05030</p>
              <p><i className="fas fa-envelope"></i> hello@roomhy.com</p>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              <li><a href="/website/terms">Terms & Conditions</a></li>
              <li><a href="/website/privacy">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-social lg:col-span-1">
            <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" title="X"><i className="fab fa-x-twitter"></i></a>
            <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 <strong>Roomhy</strong>. All Rights Reserved. Made for students, with love.</p>
        </div>
      </footer>
    </div>
  );
}


