import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserMenu() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("newslyUser")) || {
    name: "User",
    email: "user@example.com",
  };

  const getInitials = (name) => {
    if (!name) return "U";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0).toUpperCase() +
      parts[1].charAt(0).toUpperCase()
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("newslyToken");
    localStorage.removeItem("newslyUser");
    localStorage.removeItem("newslyMode");
    localStorage.removeItem("newslyLocation");

    setOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:scale-105"
      >
        {getInitials(user.name)}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                {getInitials(user.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name || "User"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user.email || "user@example.com"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">👤</span>
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/saved");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">🔖</span>
              <span>Saved Articles</span>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/change-password");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">🔒</span>
              <span>Change Password</span>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/mode");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">🧭</span>
              <span>Change Mode</span>
            </button>

            <div className="my-2 border-t border-white/10" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
            >
              <span className="text-base">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;