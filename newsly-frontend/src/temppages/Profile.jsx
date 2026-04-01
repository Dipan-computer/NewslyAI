import { useState } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("newslyUser")) || {
    name: "User",
    email: "user@example.com",
  };

  const [user, setUser] = useState(storedUser);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(storedUser.name);

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name: name.trim() || "User",
    };

    localStorage.setItem("newslyUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="mx-auto max-w-3xl px-3 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">👤 Profile</h2>
          <p className="text-xs text-slate-400">Manage your account details</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-5">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
              {getInitials(user.name)}
            </div>

            <div>
              <h3 className="text-base font-semibold">{user.name}</h3>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>

          {!isEditing ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Full Name</p>
                  <p className="mt-1 text-sm text-white">{user.name}</p>
                </div>

                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="mt-1 text-sm text-white">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="mb-2 text-xs text-slate-400">Full Name</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#020817] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="rounded-lg bg-white/5 p-4">
                  <p className="mb-2 text-xs text-slate-400">Email</p>
                  <div className="w-full rounded-md border border-white/10 bg-[#020817] px-3 py-2 text-sm text-slate-400">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  Save Changes
                </button>

                <button
                  onClick={handleCancel}
                  className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

export default Profile;