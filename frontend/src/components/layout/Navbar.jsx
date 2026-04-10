import { useContext, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">

      <h2 className="text-lg font-semibold text-gray-800">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">

        {/* Profile */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-purple-500 flex items-center justify-center text-white cursor-pointer"
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg p-4 z-50">

              <div className="text-center mb-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-purple-500 flex items-center justify-center text-white text-lg">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <p className="mt-2 font-semibold">
                  {user?.username}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.role}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-center text-red-500 font-medium hover:underline"
              >
                Sign out
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}