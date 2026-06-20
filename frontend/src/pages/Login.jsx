import { useState, useEffect, useContext, useRef } from "react";
import { loginUser } from "../services/authService";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaBuilding, FaUserTag, FaSignInAlt, FaUserPlus } from "react-icons/fa";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loginUserRef = useRef(null);
  const loginPassRef = useRef(null);
  const regUserRef = useRef(null);
  const regEmailRef = useRef(null);
  const regPassRef = useRef(null);
  const regRoleRef = useRef(null);
  const regBranchRef = useRef(null);

  useEffect(() => {
    if (tab === "login") loginUserRef.current?.focus();
    else regUserRef.current?.focus();
  }, [tab]);

  // Force light mode for login page
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "1",
    branch_id: ""
  });

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  const handleEnter = (e, nextRef, submitFn = null) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef && nextRef.current) nextRef.current.focus();
      else if (submitFn) submitFn();
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setError("Username and password are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(loginForm);
      login(data);
      const role = data.user.role;
      localStorage.setItem("role", role);

      const routes = {
        Admin: "/dashboard/admin",
        Manager: "/dashboard/manager",
        Cashier: "/dashboard/cashier",
        "Sales Executive": "/dashboard/sales",
        "Support Staff": "/dashboard/support",
        "Inventory Staff": "/dashboard/inventory",
      };
      navigate(routes[role] || "/dashboard/admin");
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!regForm.username || !regForm.email || !regForm.password) {
      setError("Username, email and password are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const body = { ...regForm, role_id: parseInt(regForm.role_id) };
      if (regForm.role_id !== "1") body.branch_id = parseInt(regForm.branch_id);
      
      await API.post("/auth/register", body);
      setSuccess("Account created! Redirecting to sign in...");
      setTimeout(() => switchTab("login"), 2000);
    } catch (e) {
      setError(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50" />

      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
          
          <div className="p-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-[1.25rem] bg-indigo-600 text-white text-3xl font-black shadow-xl shadow-indigo-200 mb-4 transform hover:scale-105 transition-transform">
                EH
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Enterprise Hub</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Management Portal v2.0</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button
                onClick={() => switchTab("login")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === "login" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <FaSignInAlt /> Login
              </button>
              <button
                onClick={() => switchTab("register")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === "register" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <FaUserPlus /> Register
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-tight flex items-center gap-3 animate-shake">
                <FaExclamationTriangle className="text-sm" /> {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-tight">
                {success}
              </div>
            )}

            <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-5">
              {tab === "login" ? (
                <>
                  <div className="relative group">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={loginUserRef}
                      placeholder="Username"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={loginForm.username}
                      onKeyDown={(e) => handleEnter(e, loginPassRef)}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    />
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={loginPassRef}
                      type="password"
                      placeholder="Password"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={loginForm.password}
                      onKeyDown={(e) => handleEnter(e, null, handleLogin)}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative group">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={regUserRef}
                      placeholder="Username"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={regForm.username}
                      onKeyDown={(e) => handleEnter(e, regEmailRef)}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toLowerCase() })}
                    />
                  </div>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={regEmailRef}
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={regForm.email}
                      onKeyDown={(e) => handleEnter(e, regPassRef)}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={regPassRef}
                      type="password"
                      placeholder="Password"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={regForm.password}
                      onKeyDown={(e) => handleEnter(e, regRoleRef)}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                  </div>
                  <div className="relative group">
                    <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                      ref={regRoleRef}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 appearance-none"
                      value={regForm.role_id}
                      onKeyDown={(e) => handleEnter(e, regBranchRef)}
                      onChange={(e) => setRegForm({ ...regForm, role_id: e.target.value, branch_id: "" })}
                    >
                      <option value="1">Admin</option>
                      <option value="2">Manager</option>
                      <option value="5">Cashier</option>
                      <option value="3">Sales Executive</option>
                      <option value="4">Inventory Staff</option>
                      <option value="6">Support Staff</option>
                    </select>
                  </div>
                  <div className="relative group">
                    <FaBuilding className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${regForm.role_id === "1" ? "text-slate-100" : "text-slate-300 group-focus-within:text-indigo-500"}`} />
                    <input
                      ref={regBranchRef}
                      type="number"
                      placeholder="Branch ID"
                      disabled={regForm.role_id === "1"}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 disabled:opacity-30"
                      value={regForm.branch_id}
                      onKeyDown={(e) => handleEnter(e, null, handleRegister)}
                      onChange={(e) => setRegForm({ ...regForm, branch_id: e.target.value })}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${tab === "login" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"}`}
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {tab === "login" ? (loading ? "Authenticating..." : "Enter System") : (loading ? "Creating..." : "Create Account")}
              </button>
            </form>
          </div>

          <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Secured by EnterpriseShield™ 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add these to your tailwind config or use raw CSS for keyframes if needed
// For now, I'll assume they're simple transitions.
const FaExclamationTriangle = ({ className }) => <span className={className}>⚠️</span>;