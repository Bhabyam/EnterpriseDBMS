import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">

      <Sidebar role={user?.role} />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <div className="p-6 flex-1 overflow-y-auto 
                        bg-gray-50 text-gray-900">
          {children}
        </div>

      </div>
    </div>
  );
}