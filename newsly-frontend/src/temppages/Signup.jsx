import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { API_BASE_URL } from "../config";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("newslyToken", data.token);
      localStorage.setItem("newslyUser", JSON.stringify(data.user));

      setSuccessMessage("Login successful. Redirecting...");
      setTimeout(() => {
        navigate("/mode");
      }, 700);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header showActions={false} />

      <div className="px-4 py-10">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">
              Login to continue to NewslyAI
            </p>
          </div>

          <form
            onSubmit={handleLogin}
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
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;