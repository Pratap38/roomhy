import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  buildBookingFormLink,
  clearOwnerRuntimeSession,
  fetchBookingRequestsForOwner,
  fetchConversation,
  formatDate,
  getOwnerRuntimeSession,
  getSocketUrl,
  normalizeBooking
} from "../../utils/propertyowner";

const normalizeMessage = (message) => ({
  ...message,
  key: message._id || message.id || `${message.sender_login_id}-${message.created_at || message.createdAt || Math.random()}`,
  text: message.message || message.text || "",
  createdAt: message.created_at || message.createdAt || new Date().toISOString()
});

export default function Ownerchat() {
  useHtmlPage({
    title: "Owner Chat - Roomhy",
    bodyClass: "text-slate-800 h-screen overflow-hidden flex flex-col",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/ownerchat.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [owner, setOwner] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [bookings, currentChat, messages, mobileChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
  }, []);

  useEffect(() => {
    if (!owner?.loginId) return;
    let cancelled = false;
    const loadChats = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const bookingList = await fetchBookingRequestsForOwner(owner.loginId);
        const accepted = bookingList
          .map(normalizeBooking)
          .filter((item) => ["approved", "accepted", "visited", "booked"].includes(String(item.status).toLowerCase()));
        if (!cancelled) {
          setBookings(accepted);
          if (!currentChat && accepted[0]) {
            setCurrentChat(accepted[0]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.body || err?.message || "Failed to load conversations.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadChats();
    return () => {
      cancelled = true;
    };
  }, [owner?.loginId]);

  useEffect(() => {
    if (!owner?.loginId) return;
    const socket = io(getSocketUrl(), { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.emit("join_room", {
      login_id: owner.loginId,
      role: "owner",
      name: owner.name || "Owner"
    });
    socket.on("receive_message", (message) => {
      const incoming = normalizeMessage(message);
      if (!currentChat) return;
      const userId = currentChat.userId || currentChat.user_id;
      if (String(incoming.sender_login_id || "").toUpperCase() === String(userId || "").toUpperCase() || String(incoming.room_id || "").toUpperCase() === String(owner.loginId || "").toUpperCase()) {
        setMessages((prev) => [...prev, incoming]);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [owner?.loginId, owner?.name, currentChat]);

  useEffect(() => {
    if (!owner?.loginId || !currentChat?.userId) return;
    let cancelled = false;
    const loadConversation = async () => {
      try {
        const list = await fetchConversation(owner.loginId, currentChat.userId);
        if (!cancelled) {
          setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.body || err?.message || "Failed to load conversation.");
        }
      }
    };
    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [owner?.loginId, currentChat?.userId]);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) =>
      [booking.userName, booking.userId, booking.email, booking.propertyName].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [bookings, search]);

  const sendMessage = () => {
    if (!draft.trim() || !currentChat || !socketRef.current || !owner?.loginId) return;
    const userId = currentChat.userId || currentChat.user_id;
    socketRef.current.emit("send_message", {
      room_id: userId,
      receiver_login_id: userId,
      message: draft.trim()
    });
    setMessages((prev) => [
      ...prev,
      normalizeMessage({
        sender_login_id: owner.loginId,
        sender_name: owner.name || "Owner",
        message: draft.trim(),
        created_at: new Date().toISOString(),
        room_id: userId
      })
    ]);
    setDraft("");
  };

  const sendBookingForm = () => {
    if (!currentChat) return;
    const link = buildBookingFormLink(currentChat);
    setDraft(`Here's your booking form: ${link}`);
  };

  const sendReaction = (type) => {
    const messageMap = {
      BOOK: "Proceeding to booking.",
      LIKE: "Owner liked your enquiry. Please continue with booking.",
      DISLIKE: "Owner is unable to proceed with this enquiry."
    };
    setDraft(messageMap[type] || "");
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Conversations"
      navVariant="chat"
      headerVariant="compact"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      mainClassName="flex-1 overflow-y-auto p-0"
    >
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        <div className={`w-full md:w-[360px] bg-white border-r border-gray-200 flex flex-col ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <input type="text" placeholder="Search tenants..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
              <i data-lucide="search" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"></i>
            </div>
          </div>
          <div id="chat-list" className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading ? <div className="p-8 text-center text-xs text-gray-400">Loading conversations...</div> : null}
            {!loading && visibleBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No accepted conversations yet.<br />Accept requests to start chatting.</div>
            ) : null}
            {visibleBookings.map((booking) => {
              const active = currentChat?.key === booking.key;
              return (
                <button
                  key={booking.key}
                  type="button"
                  onClick={() => {
                    setCurrentChat(booking);
                    setMobileChatOpen(true);
                  }}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all border border-transparent ${active ? "active-chat-item bg-slate-50" : ""}`}
                >
                  <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    {String(booking.userName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{booking.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{booking.propertyName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div id="chat-canvas" className={`flex-1 flex-col bg-slate-50 relative min-w-0 ${mobileChatOpen ? "flex" : "hidden md:flex"}`}>
          {!currentChat ? (
            <div id="no-chat-selected" className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <i data-lucide="message-square" className="w-10 h-10 text-purple-300"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-700">Select a conversation</h3>
              <p className="text-sm text-gray-400 max-w-xs mt-1">Select a tenant from the sidebar to start messaging and manage bookings.</p>
            </div>
          ) : (
            <div id="chat-active" className="flex-1 flex flex-col h-full">
              <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button id="back-to-contacts" type="button" className="md:hidden text-gray-400 p-1" onClick={() => setMobileChatOpen(false)}>
                    <i data-lucide="arrow-left" className="w-5 h-5"></i>
                  </button>
                  <div id="active-chat-avatar" className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    {String(currentChat.userName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 id="active-chat-name" className="font-bold text-gray-800 leading-tight">{currentChat.userName}</h3>
                    <p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button id="booking-form-btn" type="button" onClick={sendBookingForm} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium hover:text-gray-900 flex items-center gap-1">
                    <i data-lucide="file-text" className="w-4 h-4"></i>
                    <span className="hidden sm:inline">Booking Form</span>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><i data-lucide="phone" className="w-5 h-5"></i></button>
                  <button type="button" className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><i data-lucide="more-vertical" className="w-5 h-5"></i></button>
                </div>
              </div>

              <div id="messages" className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}
                {messages.map((message) => {
                  const mine = String(message.sender_login_id || "").toUpperCase() === String(owner?.loginId || "").toUpperCase();
                  return (
                    <div key={message.key} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xl rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-purple-600 text-white" : "bg-white text-gray-800 border border-gray-200"}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-[10px] mt-2 ${mine ? "text-purple-100" : "text-gray-400"}`}>{formatDate(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef}></div>
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 flex flex-col gap-2">
                    <div id="reaction-bar" className="flex items-center gap-2 pb-1">
                      <button id="book-input-btn" type="button" onClick={() => sendReaction("BOOK")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-all">
                        <i data-lucide="bookmark" className="w-3 h-3"></i>
                        BOOK
                      </button>
                      <button id="like-input-btn" type="button" onClick={() => sendReaction("LIKE")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-100 hover:bg-green-100 transition-all">
                        <i data-lucide="thumbs-up" className="w-3 h-3"></i>
                        LIKE
                      </button>
                      <button id="dislike-input-btn" type="button" onClick={() => sendReaction("DISLIKE")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 hover:bg-red-100 transition-all">
                        <i data-lucide="thumbs-down" className="w-3 h-3"></i>
                        DISLIKE
                      </button>
                    </div>
                    <div className="relative flex-1">
                      <textarea id="message-text" rows="1" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all"></textarea>
                      <button id="send-btn" type="button" onClick={sendMessage} className="absolute right-2 bottom-2 w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all">
                        <i data-lucide="send" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
