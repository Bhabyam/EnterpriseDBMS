import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaSearch, FaFilter, FaBuilding, FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle, FaTimesCircle, FaTruckLoading } from "react-icons/fa";

const statusConfig = {
  Delivered: { color: "emerald", icon: FaCheckCircle, label: "Delivered" },
  Confirmed: { color: "indigo", icon: FaCheckCircle, label: "Confirmed" },
  Pending: { color: "amber", icon: FaClock, label: "Pending" },
  Cancelled: { color: "rose", icon: FaTimesCircle, label: "Cancelled" },
};

export default function PurchaseOrdersHistory() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [sortKey, setSortKey] = useState("po_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const navigate = useNavigate();

  useEffect(() => {
    API.get("/api/purchase_orders/")
      .then(res => setOrders(res.data?.data || []))
      .catch(console.error);
  }, []);

  const branches = useMemo(() => {
    const unique = new Set(orders.map(o => o.branch_name));
    return ["All Branches", ...Array.from(unique)];
  }, [orders]);

  const filtered = useMemo(() => {
    let data = [...orders];
    data = data.filter(o => {
      const text = `${o.po_id} ${o.supplier_name} ${o.branch_name}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
    if (isAdmin && selectedBranch !== "All Branches") data = data.filter(o => o.branch_name === selectedBranch);
    if (selectedStatus !== "All") data = data.filter(o => o.status === selectedStatus);

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (["po_id", "total_amount", "paid", "remaining"].includes(sortKey)) { valA = Number(valA); valB = Number(valB); }
      else if (sortKey === "order_date") { valA = new Date(valA); valB = new Date(valB); }
      else { valA = (valA || "").toString().toLowerCase(); valB = (valB || "").toString().toLowerCase(); }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [orders, search, selectedBranch, selectedStatus, sortKey, sortOrder, isAdmin]);

  const stats = useMemo(() => {
    const counts = { All: 0, Delivered: 0, Pending: 0, Investment: 0 };
    filtered.forEach(o => {
      counts.All++;
      if (o.status === "Delivered") counts.Delivered++;
      if (o.status === "Pending") counts.Pending++;
      counts.Investment += Number(o.total_amount);
    });
    return counts;
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Purchase Orders</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Manage vendor orders</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              Total Investment: ₹{stats.Investment.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Total Orders" value={stats.All} icon={FaShoppingCart} color="indigo" />
          <MetricCard title="Delivered" value={stats.Delivered} icon={FaCheckCircle} color="emerald" />
          <MetricCard title="Processing" value={stats.Pending} icon={FaTruckLoading} color="amber" />
          <MetricCard title="Total Investment" value={`₹${stats.Investment.toLocaleString("en-IN")}`} color="indigo" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Supplier or Branch..."
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
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  <option value="All">All Statuses</option>
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
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
                  <th className={thClass}>PO ID</th>
                  <th className={thClass}>Supplier</th>
                  {isAdmin && <th className={thClass}>Branch</th>}
                  <th className={thClass} onClick={() => handleSort("order_date")}>Date {sortKey === "order_date" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("total_amount")}>Total Amount {sortKey === "total_amount" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass}>Paid</th>
                  <th className={thClass}>Due</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginated.map((o) => {
                  const config = statusConfig[o.status] || { color: "slate", icon: FaClock };
                  const StatusIcon = config.icon;
                  return (
                    <tr key={o.po_id} onClick={() => navigate(`/purchase_orders/${o.po_id}`)} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200 cursor-pointer">
                      <td className="px-6 py-5 font-black text-xs text-indigo-500">#{o.po_id}</td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">{o.supplier_name}</div>
                      </td>
                      {isAdmin && <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{o.branch_name}</td>}
                      <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(o.order_date).toLocaleDateString()}</td>
                      <td className="px-6 py-5 font-black text-slate-800 dark:text-white">₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5 font-bold text-emerald-500 text-xs">₹{Number(o.paid).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5 font-bold text-rose-500 text-xs">₹{Number(o.remaining).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          o.status === "Delivered" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          o.status === "Pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                          o.status === "Cancelled" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                          "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        }`}>
                          <StatusIcon className="text-[8px]" />
                          {o.status}
                        </span>
                      </td>
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
            Monitoring {filtered.length} total procurement transactions
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