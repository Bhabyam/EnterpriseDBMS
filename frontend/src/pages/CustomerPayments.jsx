import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaWallet, FaSearch, FaFilter, FaBuilding, FaChevronLeft, FaChevronRight, FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaUniversity } from "react-icons/fa";

const methodConfig = {
  Cash: { color: "emerald", icon: FaMoneyBillWave },
  UPI: { color: "indigo", icon: FaMobileAlt },
  Card: { color: "purple", icon: FaCreditCard },
  NetBanking: { color: "amber", icon: FaUniversity },
};

export default function CustomerPayments() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  const [sortKey, setSortKey] = useState("payment_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    API.get("/api/payments/")
      .then(res => setPayments(res.data?.data || []))
      .catch(console.error);
  }, []);

  const branches = useMemo(() => {
    const unique = new Set(payments.map(p => p.branch_name));
    return ["All Branches", ...Array.from(unique)];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let data = [...payments];

    data = data.filter(p => {
      const text = `${p.payment_id} ${p.order_id} ${p.payment_method} ${p.transaction_id} ${p.branch_name}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });

    if (methodFilter !== "All") data = data.filter(p => p.payment_method === methodFilter);
    if (isAdmin && selectedBranch !== "All Branches") data = data.filter(p => p.branch_name === selectedBranch);

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (["payment_id", "order_id", "amount"].includes(sortKey)) { valA = Number(valA); valB = Number(valB); }
      else if (sortKey === "payment_date") { valA = new Date(valA); valB = new Date(valB); }
      else { valA = (valA || "").toString().toLowerCase(); valB = (valB || "").toString().toLowerCase(); }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [payments, search, methodFilter, selectedBranch, sortKey, sortOrder, isAdmin]);

  const stats = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const methodCounts = { UPI: 0, Cash: 0 };
    filteredPayments.forEach(p => { if (methodCounts[p.payment_method] !== undefined) methodCounts[p.payment_method]++; });
    return { total: filteredPayments.length, totalAmount, ...methodCounts };
  }, [filteredPayments]);

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Payment Audit</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Revenue streams & transaction logs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              Collections: ₹{stats.totalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Total Payments" value={stats.total} icon={FaWallet} color="indigo" />
          <MetricCard title="Gross Collection" value={`₹${stats.totalAmount.toLocaleString("en-IN")}`} color="emerald" />
          <MetricCard title="UPI Usage" value={stats.UPI} icon={FaMobileAlt} color="indigo" />
          <MetricCard title="Cash Settlements" value={stats.Cash} icon={FaMoneyBillWave} color="amber" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Find TXN, Order ID or Method..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              {isAdmin && (
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
              )}

              <div className="relative">
                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  <option value="All">All Methods</option>
                  {Object.keys(methodConfig).map(m => <option key={m} value={m}>{m}</option>)}
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
                  <th className={thClass} onClick={() => handleSort("payment_id")}>TXN ID {sortKey === "payment_id" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("order_id")}>Order Ref {sortKey === "order_id" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("amount")}>Settlement {sortKey === "amount" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("payment_method")}>Mechanism {sortKey === "payment_method" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass}>Gateway Ref</th>
                  <th className={thClass} onClick={() => handleSort("payment_date")}>Timestamp {sortKey === "payment_date" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  {isAdmin && <th className={thClass}>Branch</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedPayments.map((p) => {
                  const config = methodConfig[p.payment_method] || { color: "slate", icon: FaWallet };
                  const MethodIcon = config.icon;
                  return (
                    <tr key={p.payment_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                      <td className="px-6 py-5 font-black text-xs text-indigo-500">#{p.payment_id}</td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">ORD-{p.order_id}</div>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-800 dark:text-white">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                          p.payment_method === "Cash" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          p.payment_method === "UPI" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" :
                          p.payment_method === "Card" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
                          "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        }`}>
                          <MethodIcon className="text-[10px]" />
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[150px] uppercase tracking-tighter">{p.transaction_id || "Direct Cash"}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(p.payment_date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(p.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      {isAdmin && <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{p.branch_name}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Auditing {filteredPayments.length} verified settlements
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