import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaUndo, FaSearch, FaFilter, FaBuilding, FaChevronLeft, FaChevronRight, FaTimes, FaBoxOpen, FaInfoCircle, FaFileInvoice, FaCalculator } from "react-icons/fa";

export default function ReturnHistory() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [sortKey, setSortKey] = useState("return_id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const params = isAdmin ? {} : { branch_id: user.branch_id };
    API.get("/api/returns", { params })
      .then(res => setReturns(res.data.data || []))
      .catch(console.error);
  }, [isAdmin, user.branch_id]);

  const branches = useMemo(() => {
    const unique = new Set(returns.map(r => r.branch_name));
    return ["All Branches", ...Array.from(unique)];
  }, [returns]);

  const filtered = useMemo(() => {
    let data = [...returns];
    data = data.filter(r => {
      const text = `${r.return_id} ${r.order_id} ${r.customer_name} ${r.reason}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesBranch = selectedBranch === "All Branches" || r.branch_name === selectedBranch;
      return matchesSearch && matchesBranch;
    });

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (["return_id", "order_id", "refund_amount"].includes(sortKey)) { valA = Number(valA); valB = Number(valB); }
      if (sortKey === "return_date") { valA = new Date(valA); valB = new Date(valB); }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [returns, search, selectedBranch, sortKey, sortOrder]);

  const stats = useMemo(() => {
    const totalRefund = filtered.reduce((sum, r) => sum + Number(r.refund_amount), 0);
    const avgRefund = filtered.length > 0 ? (totalRefund / filtered.length) : 0;
    
    const reasonCounts = filtered.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {});
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    return { count: filtered.length, totalRefund, avgRefund, topReason };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortOrder("asc"); }
  };

  const handleView = async (id) => {
    const res = await API.get(`/api/returns/${id}`);
    setSelectedReturn(res.data.data);
    setShowModal(true);
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
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Return Management</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Reversals & refund logistics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
              Avg. Refund: ₹{stats.avgRefund.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              Total Refunds: ₹{stats.totalRefund.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <MetricCard title="Total Returns" value={stats.count} icon={FaUndo} color="rose" />
          <MetricCard title="Refund Value" value={`₹${stats.totalRefund.toLocaleString("en-IN")}`} color="emerald" />
          <MetricCard title="Common Reason" value={stats.topReason} icon={FaInfoCircle} color="indigo" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Return ID, Order Ref or Customer..."
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
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                >
                  <option value={10}>10 Items</option>
                  <option value={25}>25 Items</option>
                  <option value={50}>50 Items</option>
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
                  <th className={thClass} onClick={() => handleSort("return_id")}>RET ID {sortKey === "return_id" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("order_id")}>Order Ref {sortKey === "order_id" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("customer_name")}>Customer {sortKey === "customer_name" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass}>Reason</th>
                  <th className={thClass} onClick={() => handleSort("return_date")}>Processed {sortKey === "return_date" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("refund_amount")}>Refunded {sortKey === "refund_amount" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginated.map((r) => (
                  <tr key={r.return_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                    <td className="px-6 py-5 font-black text-xs text-indigo-500">#{r.return_id}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 dark:text-white uppercase text-xs">ORD-{r.order_id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 dark:text-white text-xs">{r.customer_name}</div>
                      {isAdmin && <div className="text-[9px] text-slate-400 font-black uppercase tracking-tight">{r.branch_name}</div>}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                        {r.reason}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(r.return_date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase">{new Date(r.return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-800 dark:text-white">₹{Number(r.refund_amount).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleView(r.return_id)} className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all">
                          <FaInfoCircle className="text-xs" />
                        </button>
                        <button onClick={() => navigate(`/orders/${r.order_id}`)} className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all">
                          <FaFileInvoice className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center mt-12 gap-6 pb-10">
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

      {/* COMPACT GLASS UI MODAL */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-3xl border border-white/30 dark:border-white/10 overflow-hidden animate-fade-in">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Return Details</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Ref: #{selectedReturn.summary.return_id}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-5 rounded-2xl bg-white/20 dark:bg-slate-800/30 border border-white/20 dark:border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Ref</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">ORD-{selectedReturn.summary.order_id}</p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Refund</p>
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400 tracking-tighter">₹{Number(selectedReturn.summary.total_refund).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Returned Items</p>
                <div className="rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden bg-white/10 dark:bg-slate-900/40 backdrop-blur-md">
                  <table className="w-full text-xs">
                    <thead className="bg-white/20 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-black text-slate-400 uppercase tracking-widest">Product</th>
                        <th className="px-6 py-3 text-center font-black text-slate-400 uppercase tracking-widest">Qty</th>
                        <th className="px-6 py-3 text-left font-black text-slate-400 uppercase tracking-widest">Condition</th>
                        <th className="px-6 py-3 text-right font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedReturn.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300">{i.product_name}</td>
                          <td className="px-6 py-3 text-center font-black text-slate-800 dark:text-white">{i.quantity}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                              i.item_condition === 'Unused' ? 'bg-emerald-500/10 text-emerald-500' :
                              i.item_condition === 'Opened' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-rose-500/10 text-rose-500'
                            }`}>{i.item_condition}</span>
                          </td>
                          <td className="px-6 py-3 text-right font-black text-slate-800 dark:text-white">₹{Number(i.refund_amount).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex justify-between items-center gap-6">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">"{selectedReturn.summary.reason}"</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{new Date(selectedReturn.summary.return_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}