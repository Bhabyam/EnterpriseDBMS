import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaUserTie, FaSearch, FaFilter, FaBuilding, FaChevronLeft, FaChevronRight, FaEnvelope, FaPhone } from "react-icons/fa";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedPosition, setSelectedPosition] = useState("All Positions");

  const [sortKey, setSortKey] = useState("employee_id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/employees/")
      .then((res) => setEmployees(res.data.data || []))
      .catch(console.error);
  }, []);

  // 🔹 DERIVE OPTIONS
  const branches = useMemo(() => {
    const unique = new Set(employees.map((e) => e.branch_name));
    return ["All Branches", ...Array.from(unique)];
  }, [employees]);

  const positions = useMemo(() => {
    const unique = new Set(employees.map((e) => e.position));
    return ["All Positions", ...Array.from(unique)];
  }, [employees]);

  // 🔍 FILTER + SORT
  const filteredEmployees = useMemo(() => {
    let data = [...employees];

    data = data.filter((e) => {
      const matchesSearch = `${e.employee_id} ${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = selectedBranch === "All Branches" || e.branch_name === selectedBranch;
      const matchesPosition = selectedPosition === "All Positions" || e.position === selectedPosition;
      return matchesSearch && matchesBranch && matchesPosition;
    });

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === "name") {
        valA = `${a.first_name} ${a.last_name}`.toLowerCase();
        valB = `${b.first_name} ${b.last_name}`.toLowerCase();
      }
      if (sortKey === "salary") {
        valA = Number(a.salary);
        valB = Number(b.salary);
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [employees, search, selectedBranch, selectedPosition, sortKey, sortOrder]);

  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    avgSalary: filteredEmployees.length ? filteredEmployees.reduce((acc, e) => acc + Number(e.salary), 0) / filteredEmployees.length : 0,
    topRole: [...new Set(filteredEmployees.map(e => e.position))].length
  }), [filteredEmployees]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
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
      <div className="max-w-[1600px] mx-auto animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Employee Registry</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Human resources directory</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              Staff Count: {stats.total}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <MetricCard title="Total Employees" value={stats.total} icon={FaUserTie} color="indigo" />
          <MetricCard title="Avg. Monthly Salary" value={`₹${Math.round(stats.avgSalary).toLocaleString("en-IN")}`} color="emerald" />
          <MetricCard title="Unique Roles" value={stats.topRole} color="amber" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by ID or Name..."
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
                  value={selectedPosition}
                  onChange={(e) => { setSelectedPosition(e.target.value); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  {positions.map((p, i) => <option key={i} value={p}>{p}</option>)}
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
                  <th className={thClass} onClick={() => handleSort("employee_id")}>ID {sortKey === "employee_id" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass} onClick={() => handleSort("name")}>Name {sortKey === "name" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass}>Location</th>
                  <th className={thClass} onClick={() => handleSort("position")}>Role {sortKey === "position" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass}>Contact Info</th>
                  <th className={thClass} onClick={() => handleSort("salary")}>Compensation {sortKey === "salary" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedEmployees.map((e) => (
                  <tr key={e.employee_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                    <td className="px-6 py-5 font-black text-xs text-indigo-500">#{e.employee_id}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 dark:text-white">{e.first_name} {e.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Member</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{e.branch_name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                        {e.position}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <FaEnvelope className="text-[10px]" /> {e.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <FaPhone className="text-[10px]" /> {e.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-800 dark:text-white">₹{Number(e.salary).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Total of {filteredEmployees.length} staff members listed
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