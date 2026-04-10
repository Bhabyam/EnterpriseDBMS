import { useState, useEffect, useContext } from "react";
import { loginUser } from "../services/authService";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [validBranches, setValidBranches] = useState([]);

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });

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

  // ✅ LOGIN
  const handleLogin = async () => {
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

      console.log(role, 2);

      if (role === "Admin") navigate("/dashboard/admin");
      else if (role === "Manager") navigate("/dashboard/manager");
      else if (role === "Cashier") navigate("/dashboard/cashier");
      else if (role === "Sales Executive") navigate("/dashboard/sales");
      else if (role === "Support Staff") navigate("/dashboard/support");
      else if (role === "Inventory Staff") navigate("/dashboard/inventory");
      else navigate("/dashboard/admin");

    } catch (e) {
        setError(e.message || "Login failed");
    } finally {
        setLoading(false);
    }
  };

  // ✅ REGISTER
  const handleRegister = async () => {
    if (!regForm.username || !regForm.email || !regForm.password) {
      setError("Username, email and password are required");
      return;
    }

    if (!/^[a-z][a-z0-9_]{2,}$/.test(regForm.username)) {
      setError("Username must be lowercase, start with a letter");
      return;
    }

    if (regForm.role_id !== "1") {
      if (!regForm.branch_id) {
        setError("Branch ID is required");
        return;
      }

      if (!validBranches.includes(Number(regForm.branch_id))) {
        setError("Invalid Branch ID");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const body = {
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
        role_id: parseInt(regForm.role_id),
      };

      if (regForm.role_id !== "1") {
        body.branch_id = parseInt(regForm.branch_id);
      }

      await API.post("/auth/register", body);

      setSuccess("Account created! You can now sign in.");

      setRegForm({
        username: "",
        email: "",
        password: "",
        role_id: "1",
        branch_id: ""
      });

      setTimeout(() => switchTab("login"), 1500);

    } catch (e) {
      setError(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">

        {/* Card */}
        <div className="w-[400px] backdrop-blur-xl bg-white/40 shadow-2xl rounded-3xl p-8 border border-white/30">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-bold shadow-md">
            R
            </div>
            <h1 className="text-2xl font-semibold mt-3 text-gray-800">RetailMS</h1>
            <p className="text-gray-500 text-sm">Enterprise Management System</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-xl p-1 mb-6">
            <button
            className={`flex-1 py-2 rounded-lg transition ${
                tab === "login"
                ? "bg-white shadow text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => switchTab("login")}
            >
            Sign in
            </button>

            <button
            className={`flex-1 py-2 rounded-lg transition ${
                tab === "register"
                ? "bg-white shadow text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => switchTab("register")}
            >
            Register
            </button>
        </div>

        {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
        {success && <div className="text-green-500 text-sm mb-3">{success}</div>}

        {/* LOGIN */}
        {tab === "login" && (
            <>
            <div className="mb-4">
                <label className="text-sm text-gray-600">Username</label>
                <input
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={loginForm.username}
                onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                }
                />
            </div>

            <div className="mb-5">
                <label className="text-sm text-gray-600">Password</label>
                <input
                type="password"
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={loginForm.password}
                onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                }
                />
            </div>

            <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md hover:opacity-90 transition"
                disabled={loading}
            >
                {loading ? "Signing in..." : "Sign in"}
            </button>
            </>
        )}

        {/* REGISTER */}
        {tab === "register" && (
            <>
            <input
                placeholder="Username"
                className="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={regForm.username}
                onChange={(e) =>
                setRegForm({
                    ...regForm,
                    username: e.target.value.toLowerCase()
                })
                }
            />

            <input
                placeholder="Email"
                className="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={regForm.email}
                onChange={(e) =>
                setRegForm({ ...regForm, email: e.target.value })
                }
            />

            <input
                type="password"
                placeholder="Password"
                className="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={regForm.password}
                onChange={(e) =>
                setRegForm({ ...regForm, password: e.target.value })
                }
            />

            <select
                className="w-full p-3 mb-3 rounded-xl border border-gray-300"
                value={regForm.role_id}
                onChange={(e) =>
                setRegForm({
                    ...regForm,
                    role_id: e.target.value,
                    branch_id: ""
                })
                }
            >
                <option value="1">Admin</option>
                <option value="2">Manager</option>
                <option value="3">Sales Executive</option>
                <option value="4">Inventory Staff</option>
                <option value="5">Cashier</option>
                <option value="6">Support Staff</option>
            </select>

            <input
                type="number"
                placeholder="Branch ID"
                className="w-full p-3 mb-4 rounded-xl border border-gray-300"
                disabled={regForm.role_id === "1"}
                value={regForm.branch_id}
                onChange={(e) =>
                setRegForm({ ...regForm, branch_id: e.target.value })
                }
            />

            <button
                onClick={handleRegister}
                className="w-full py-3 rounded-xl bg-green-500 text-white font-medium shadow-md hover:opacity-90"
                disabled={loading}
            >
                {loading ? "Creating account..." : "Create account"}
            </button>
            </>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
            RetailMS © 2025
        </p>
        </div>
    </div>
    );
}