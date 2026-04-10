import { createContext, useState, useEffect } from "react";
import { logoutUser } from "../services/authService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser({
        token,
        ...JSON.parse(userData),
      });
    }
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser({
      token: data.access_token,
      ...data.user,
    });
  };

  const logout = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));

      if (userData?.session_id) {
        await logoutUser(userData.session_id);
      }
    } catch (e) {
      console.log("Logout API error:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}