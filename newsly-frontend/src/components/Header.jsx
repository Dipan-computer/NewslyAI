import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";
import socket from "../socket";
import {
  getNotifications,
  markAllNotificationsRead,
  clearNotifications,
  deleteNotification,
  markNotificationRead,
  addNotification,
} from "../Utils/NotificationHelper";

function NotificationCard({
  item,
  onRead,
  onDelete,
  getEmoji,
  getAccentClass,
}) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(0);

  const maxSwipe = -140;
  const deleteThreshold = -110;

  const handleStart = (x) => {
    startX.current = x;
    setDragging(true);
  };

  const handleMove = (x) => {
    if (!dragging || isDeleting) return;
    const diff = x - startX.current;
    if (diff < 0) setTranslateX(Math.max(diff, maxSwipe));
  };

  const handleEnd = () => {
    setDragging(false);

    if (translateX <= deleteThreshold) {
      setIsDeleting(true);
      setTranslateX(-220);
      setTimeout(() => onDelete(), 180);
    } else {
      setTranslateX(0);
    }
  };

  useEffect(() => {
    const up = () => dragging && handleEnd();
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [dragging, translateX]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-rose-500/20">
        <span className="text-xs text-rose-200">Swipe to delete</span>
      </div>

      <div
        className={`relative p-3 rounded-xl border transition ${
          isDeleting ? "opacity-0" : ""
        } ${getAccentClass(item.type)} ${item.read ? "opacity-75" : ""}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
      >
        <div className="flex gap-3">
          <button onClick={onRead} className="text-lg shrink-0">
            {getEmoji(item.type)}
          </button>

          <div onClick={onRead} className="flex-1 text-left cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              {!item.read && (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400" />
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">{item.message}</p>
            <p className="text-[10px] text-slate-400 mt-2">{item.time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({
  notifications,
  unreadCount,
  handleMarkAllRead,
  handleClearAll,
  handleNotificationClick,
  handleDeleteNotification,
  getEmoji,
  getAccentClass,
  closePanel,
  navigate,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <p className="text-[11px] text-slate-400">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                : "All caught up 🎉"}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-medium text-blue-300 transition hover:text-blue-200"
              >
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                className="text-[10px] font-medium text-rose-300 transition hover:text-rose-200"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[52vh] overflow-y-auto p-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-3xl">📭</div>
            <p className="mt-2 text-sm font-medium text-slate-200">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New updates will appear here when something important happens.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onRead={() => handleNotificationClick(item.id)}
                onDelete={() => handleDeleteNotification(item.id)}
                getEmoji={getEmoji}
                getAccentClass={getAccentClass}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-white/5 px-4 py-3">
        <button
          onClick={() => {
            closePanel();
            navigate("/explore");
          }}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        >
          View more updates
        </button>
      </div>
    </div>
  );
}

function Header({ showActions = true }) {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const audioRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const sync = () => setNotifications(getNotifications());

  const playSound = () => {
    try {
      const ctx =
        audioRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();

      audioRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 880;
      gain.gain.value = 0.05;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  useEffect(() => {
    sync();
  }, []);

  useEffect(() => {
    const handler = (data) => {
      addNotification(data);
      playSound();
    };

    socket.on("news-notification", handler);
    return () => socket.off("news-notification", handler);
  }, []);

  useEffect(() => {
    const listener = () => sync();
    window.addEventListener("newsly-notification-added", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("newsly-notification-added", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getEmoji = (type) => {
    return (
      {
        breaking: "🚨",
        student: "🎓",
        saved: "🔖",
        success: "✅",
        warning: "⚠️",
        profile: "👤",
        mode: "🧭",
        welcome: "✨",
        general: "🌍",
      }[type] || "🔔"
    );
  };

  const getAccentClass = (type) => {
    return (
      {
        breaking: "bg-red-500/10 border-red-400/20",
        student: "bg-purple-500/10 border-purple-400/20",
        saved: "bg-blue-500/10 border-blue-400/20",
        success: "bg-green-500/10 border-green-400/20",
        warning: "bg-yellow-500/10 border-yellow-400/20",
        profile: "bg-pink-500/10 border-pink-400/20",
        mode: "bg-cyan-500/10 border-cyan-400/20",
        welcome: "bg-emerald-500/10 border-emerald-400/20",
        general: "bg-sky-500/10 border-sky-400/20",
      }[type] || "bg-white/5 border-white/10"
    );
  };

  const handleNotificationClick = (id) => {
    markNotificationRead(id);
    sync();
  };

  const handleDeleteNotification = (id) => {
    deleteNotification(id);
    sync();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    sync();
  };

  const handleClearAll = () => {
    clearNotifications();
    sync();
  };

  const closePanel = () => setShowNotifications(false);

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate("/")}
          className="group relative text-lg font-semibold transition"
        >
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NewslyAI
          </span>
          <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 group-hover:w-full" />
        </button>

        {showActions ? (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => navigate("/explore")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:scale-105 hover:bg-white/10 hover:text-white"
              title="Search"
            >
              🔎
            </button>

            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                sync();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:scale-105 hover:bg-white/10 hover:text-white"
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <>
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white shadow-md">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                </>
              )}
            </button>

            <UserMenu />

            {showNotifications &&
              (isMobile ? (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                    onClick={closePanel}
                  />
                  <div className="fixed left-1/2 top-20 z-50 w-[92vw] max-w-[360px] -translate-x-1/2">
                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      handleMarkAllRead={handleMarkAllRead}
                      handleClearAll={handleClearAll}
                      handleNotificationClick={handleNotificationClick}
                      handleDeleteNotification={handleDeleteNotification}
                      getEmoji={getEmoji}
                      getAccentClass={getAccentClass}
                      closePanel={closePanel}
                      navigate={navigate}
                    />
                  </div>
                </>
              ) : (
                <div className="absolute right-0 top-12 z-50 w-80">
                  <NotificationPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    handleMarkAllRead={handleMarkAllRead}
                    handleClearAll={handleClearAll}
                    handleNotificationClick={handleNotificationClick}
                    handleDeleteNotification={handleDeleteNotification}
                    getEmoji={getEmoji}
                    getAccentClass={getAccentClass}
                    closePanel={closePanel}
                    navigate={navigate}
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="rounded-full border border-blue-400/20 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-blue-400"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-white/10"
            >
              Signup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;