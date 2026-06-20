import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaBox, FaExclamationTriangle, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Inventory() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isInvStaff = role === "Inventory Staff";
  const canSelectBranch = isAdmin || isInvStaff;

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [hasInitializedBranch, setHasInitializedBranch] = useState(false);

  useEffect(() => {
    if (!hasInitializedBranch && stock.length > 0 && user?.branch_id) {
      if (isInvStaff) {
        const match = stock.find((p) => p.branch_id === user.branch_id);
        if (match) {
          setSelectedBranch(match.branch_name);
          setHasInitializedBranch(true);
        }
      } else {
        setHasInitializedBranch(true);
      }
    }
  }, [stock, isInvStaff, user, hasInitializedBranch]);

  const [sortKey, setSortKey] = useState("product_id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/inventory/")
      .then((res) => setStock(res.data?.data || []))
      .catch(console.error);
  }, []);

  // 🔹 DERIVE BRANCHES FROM DATA
  const branches = useMemo(() => {
    const unique = new Set(stock.map((p) => p.branch_name).filter(Boolean));
    return ["All Branches", ...Array.from(unique)];
  }, [stock]);

  // 🔍 FILTER + SEARCH
  const filteredStock = useMemo(() => {
    let data = [...stock];
    if (filter === "low") data = data.filter((p) => Number(p.quantity) < 10);
    if (search) {
      const term = search.toLowerCase();
      data = data.filter(p => 
        p.product_name?.toLowerCase().includes(term) ||
        p.brand_name?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term) ||
        (canSelectBranch && p.branch_name?.toLowerCase().includes(term))
      );
    }
    if (canSelectBranch && selectedBranch !== "All Branches") data = data.filter((p) => p.branch_name === selectedBranch);
    return data;
  }, [stock, search, filter, selectedBranch, canSelectBranch]);

  // 🔄 SORT
  const sortedStock = useMemo(() => {
    let data = [...filteredStock];
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (["price", "quantity", "product_id"].includes(sortKey)) {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredStock, sortKey, sortOrder]);

  const stats = useMemo(() => ({
    totalItems: sortedStock.length,
    lowStock: sortedStock.filter(p => Number(p.quantity) < 10).length,
    totalValue: sortedStock.reduce((acc, p) => acc + (Number(p.price) * Number(p.quantity)), 0)
  }), [sortedStock]);

  const totalPages = Math.ceil(sortedStock.length / rowsPerPage);
  const paginatedStock = sortedStock.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Stock Monitor</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Real-time inventory intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              Branch: {canSelectBranch ? selectedBranch : (stock[0]?.branch_name || "Assigned Branch")}
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <MetricCard title="Total Stock Items" value={stats.totalItems} icon={FaBox} color="indigo" />
          <MetricCard title="Low Stock Alerts" value={stats.lowStock} icon={FaExclamationTriangle} color="rose" change={stats.lowStock > 0 ? `${stats.lowStock} Critical` : null} />
          <MetricCard title="Total Inventory Value" value={`₹${stats.totalValue.toLocaleString("en-IN")}`} color="emerald" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by product, brand, or branch..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="low">Low Stock</option>
                </select>
              </div>

              {canSelectBranch && (
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                  className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  {branches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              )}

              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                {[10, 25, 50].map(v => <option key={v} value={v}>{v} Rows</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className={thClass} onClick={() => handleSort("product_id")}>ID {sortKey === "product_id" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  {canSelectBranch && <th className={thClass} onClick={() => handleSort("branch_name")}>Branch {sortKey === "branch_name" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>}
                  <th className={thClass} onClick={() => handleSort("product_name")}>Product {sortKey === "product_name" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass} onClick={() => handleSort("brand_name")}>Brand {sortKey === "brand_name" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass} onClick={() => handleSort("category_name")}>Category {sortKey === "category_name" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass} onClick={() => handleSort("price")}>Price {sortKey === "price" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                  <th className={thClass} onClick={() => handleSort("quantity")}>Quantity {sortKey === "quantity" && (sortOrder === "asc" ? "\u2191" : "\u2193")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedStock.map((p) => {
                  const isLow = Number(p.quantity) < 10;
                  return (
                    <tr key={`${p.product_id}-${p.branch_name}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                      <td className="px-6 py-4 font-black text-xs text-indigo-500">#{p.product_id}</td>
                      {canSelectBranch && <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{p.branch_name}</td>}
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{p.product_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{p.brand_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                          {p.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800 dark:text-white">₹{Number(p.price).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-4 py-1 rounded-xl font-black text-sm ${isLow ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
                          {p.quantity}
                          {isLow && <FaExclamationTriangle className="ml-2 animate-pulse" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {paginatedStock.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <FaBox className="text-4xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-bold italic">Loading inventory matching your filters...</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {Math.min(paginatedStock.length, rowsPerPage)} of {sortedStock.length} items
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
