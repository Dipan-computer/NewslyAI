import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { API_BASE_URL } from "../config";

function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmNewPassword
    ) {
      setErrorMessage("Please fill all fields.");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    if (formData.newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("newslyToken");

      if (!token) {
        setErrorMessage("Please login again to continue.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to change password.");
        return;
      }

      setSuccessMessage(data.message || "Password updated successfully.");

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 900);
    } catch (error) {
      console.error("Change password error:", error);
      setErrorMessage("Something went wrong while updating password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="px-4 py-10">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Change Password</h2>
            <p className="mt-2 text-sm text-slate-400">
              Update your account password securely
            </p>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl"
          >
            <div className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Current Password
                </label>

                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {showCurrentPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {showNewPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {showConfirmNewPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-70"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;