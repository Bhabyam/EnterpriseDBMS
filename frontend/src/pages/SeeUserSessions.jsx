import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaUserShield, FaSearch, FaFilter, FaBuilding, FaChevronLeft, FaChevronRight, FaClock, FaSignOutAlt, FaDesktop, FaCheckCircle } from "react-icons/fa";

export default function UserSessions() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedRole, setSelectedRole] = useState("All");

  const [sortKey, setSortKey] = useState("login_time");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    API.get("/api/user_sessions/")
      .then((res) => setSessions(res.data.data || []))
      .catch(console.error);
  }, []);

  const branches = useMemo(() => {
    const unique = new Set(sessions.map((s) => s.branch_name).filter(Boolean));
    return ["All Branches", ...Array.from(unique)];
  }, [sessions]);

  const roles = useMemo(() => {
    const unique = new Set(sessions.map((s) => s.role_name).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let data = [...sessions];
    data = data.filter((s) => {
      const matchesSearch = `${s.username} ${s.role_name} ${s.branch_name}`.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = selectedBranch === "All Branches" || s.branch_name === selectedBranch;
      const matchesRole = selectedRole === "All" || s.role_name === selectedRole;
      return matchesSearch && matchesBranch && matchesRole;
    });

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (["login_time", "logout_time"].includes(sortKey)) {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [sessions, search, selectedBranch, selectedRole, sortKey, sortOrder]);

  const stats = useMemo(() => {
    const activeCount = filteredSessions.filter(s => !s.logout_time).length;
    const totalCount = filteredSessions.length;
    return { activeCount, totalCount };
  }, [filteredSessions]);

  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortOrder("asc"); }
  };

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const thClass = "px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none";

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Access Logs</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Enterprise authentication registry</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {stats.activeCount} Live Sessions
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <MetricCard title="Total Auth Events" value={stats.totalCount} icon={FaUserShield} color="indigo" />
          <MetricCard title="Active Connections" value={stats.activeCount} icon={FaCheckCircle} color="emerald" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter by Username, Role or Branch..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative">
                <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  {branches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="relative">
                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className={thClass} onClick={() => handleSort("username")}>Operator {sortKey === "username" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("role_name")}>Role {sortKey === "role_name" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("branch_name")}>Branch {sortKey === "branch_name" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("login_time")}>Auth In {sortKey === "login_time" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("logout_time")}>Auth Out {sortKey === "logout_time" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Station</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedSessions.map((s) => (
                  <tr key={s.session_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">{s.username}</div>
                      <div className="text-[9px] font-black text-indigo-500 mt-0.5">#{s.session_id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                        {s.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">{s.branch_name || "N/A"}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <FaClock className="text-indigo-400 text-[10px]" />
                        {s.login_time ? new Date(s.login_time).toLocaleString() : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {s.logout_time ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <FaSignOutAlt className="text-rose-400 text-[10px]" />
                          {new Date(s.logout_time).toLocaleString()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Connected</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                        <FaDesktop className="text-[10px]" />
                        {s.device_info || "Generic Client"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Monitoring {filteredSessions.length} enterprise auth sessions
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 transition-all shadow-sm"
            >
              <FaChevronLeft />
            </button>
            <div className="flex gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                    currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 transition-all shadow-sm"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}