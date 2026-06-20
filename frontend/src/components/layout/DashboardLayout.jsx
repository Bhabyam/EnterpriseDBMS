import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300">

      <Sidebar role={user?.role} />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar />

        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a]">
          {children}
        </div>

      </div>
    </div>
  );
}