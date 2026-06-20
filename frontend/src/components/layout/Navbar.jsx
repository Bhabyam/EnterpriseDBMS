import { useContext, useState, useEffect, useRef } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSun, FiMoon } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get Page Title from Path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "Dashboard";
    
    const segment = path.split("/").filter(Boolean).pop();
    if (!segment) return "Retail Hub";
    
    return segment
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="h-16 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors duration-300">

      <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
        {getPageTitle()}
      </h2>

      <div className="flex items-center gap-6">
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer shadow-md hover:scale-105 transition-all"
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>

          {open && (
            <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-4 z-50 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">

              <div className="text-center mb-4 pt-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold mb-3">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <p className="font-bold text-slate-800 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {user?.role}
                </p>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-800 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 text-center text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm"
                >
                  Sign out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
