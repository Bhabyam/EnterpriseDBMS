import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { FaExchangeAlt, FaPlus, FaTrash, FaHistory, FaArrowRight, FaCheckCircle, FaSync, FaBoxOpen, FaTimes, FaBuilding, FaSearch, FaInfoCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import SearchSelect from "../components/SearchSelect";

const EMPTY_ROW = { product_id: "", from_branch_id: "", quantity: "", reason: "Branch request", branchOptions: [], loadingBranches: false };

const renderProductOption = (opt) => (
  <div className="flex flex-col">
    <span className="font-bold text-slate-800 dark:text-white text-xs">{opt.label}</span>
    <div className="flex gap-2 mt-1">
      {opt.brand_name && <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase">{opt.brand_name}</span>}
      {opt.category_name && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 text-[9px] font-black uppercase">{opt.category_name}</span>}
    </div>
  </div>
);

const renderBranchOption = (opt) => (
  <div className="flex justify-between items-center w-full">
    <span className="font-bold text-slate-800 dark:text-white text-xs">{opt.label}</span>
    <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">{opt.quantity} Units</span>
  </div>
);

export default function StockMovementPage() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const branchId = user?.branch_id;

  const [activeTab, setActiveTab] = useState("request");
  const [historyTab, setHistoryTab] = useState("incoming");
  const [histPage, setHistPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ ...EMPTY_ROW }]);
  const [error, setError] = useState("");
  const rowsPerPage = 15;

  const loadHistory = useCallback(() => {
    axios.get("/api/inventory/movements", { headers }).then(r => setMovements(r.data?.data ?? [])).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    axios.get("/api/catalog/products", { headers }).then(r => setProducts(r.data?.data ?? [])).catch(() => axios.get("/api/products/", { headers }).then(r => setProducts(r.data?.data ?? [])));
    loadHistory();
  }, [token]);

  const productOptions = useMemo(() => products.map(p => ({
    value: String(p.product_id),
    label: p.product_name ?? p.name,
    brand_name: p.brand_name ?? "",
    category_name: p.category_name ?? "",
  })), [products]);

  const handleProductChange = async (i, sel) => {
    const n = [...items];
    n[i] = { ...n[i], product_id: sel?.value ?? "", from_branch_id: "", branchOptions: [], loadingBranches: !!sel };
    setItems(n);
    if (!sel) return;
    try {
      const r = await axios.get(`/api/inventory/abundant/${sel.value}`, { headers });
      const opts = (r.data?.data ?? []).map(b => ({ value: String(b.branch_id), label: b.branch_name, quantity: b.quantity }));
      setItems(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], branchOptions: opts, loadingBranches: false };
        return updated;
      });
    } catch {
      setItems(prev => { const u = [...prev]; u[i] = { ...u[i], loadingBranches: false }; return u; });
    }
  };

  const submitMovements = async () => {
    const filled = items.filter(it => it.product_id && it.from_branch_id && it.quantity);
    if (!filled.length) return setError("Please complete at least one request");
    setLoading(true);
    try {
      await axios.post("/api/inventory/move-batch", {
        movements: filled.map(it => ({
          product_id: parseInt(it.product_id),
          from_branch_id: parseInt(it.from_branch_id),
          to_branch_id: parseInt(branchId),
          quantity: parseInt(it.quantity),
          reason: it.reason || "Branch request",
        }))
      }, { headers });
      setItems([{ ...EMPTY_ROW }]);
      loadHistory();
      setActiveTab("history");
    } catch (err) { setError(err.response?.data?.message || "Failed to process transfer"); }
    finally { setLoading(false); }
  };

  const incoming = movements.filter(m => String(m.to_branch_id) === String(branchId));
  const outgoing = movements.filter(m => String(m.from_branch_id) === String(branchId));
  const histRows = historyTab === "outgoing" ? outgoing : incoming;
  const paginated = histRows.slice((histPage - 1) * rowsPerPage, histPage * rowsPerPage);

  const thClass = "px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest";

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaExchangeAlt className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Stock Movement</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Inter-branch logistics terminal</p>
            </div>
          </div>
          <div className="px-5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest shadow-sm">
            Current Branch: #{branchId}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab("request")} className={`flex items-center gap-3 px-8 py-4 rounded-3xl border transition-all ${activeTab === "request" ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50"}`}>
            <FaPlus className="text-xs" /> <span className="font-black text-xs uppercase tracking-widest">New Request</span>
          </button>
          <button onClick={() => setActiveTab("history")} className={`flex items-center gap-3 px-8 py-4 rounded-3xl border transition-all ${activeTab === "history" ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50"}`}>
            <FaHistory className="text-xs" /> <span className="font-black text-xs uppercase tracking-widest">Movement Log</span>
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === "history" ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>{movements.length}</span>
          </button>
        </div>

        {activeTab === "request" ? (
          <div className="space-y-8 animate-fade-in">
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
              <FaInfoCircle />
              <p className="text-[10px] font-black uppercase tracking-widest">Only branches with abundance (&gt;10 units) are available for source selection.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {items.map((item, i) => (
                <div key={i} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none relative group">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">#{i + 1}</div>
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="absolute top-8 right-8 p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"><FaTrash className="text-xs" /></button>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Stock Specification</label>
                      <SearchSelect options={productOptions} value={item.product_id} onChange={opt => handleProductChange(i, opt)} placeholder="Find Product..." renderOption={renderProductOption} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Source Node</label>
                      {!item.product_id ? (
                        <div className="py-3.5 px-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-xs font-bold italic">Select a product first...</div>
                      ) : item.loadingBranches ? (
                        <div className="py-3.5 px-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-3 text-xs font-bold text-slate-500"><FaSync className="animate-spin" /> Fetching availability...</div>
                      ) : (
                        <SearchSelect options={item.branchOptions} value={item.from_branch_id} onChange={opt => setItems(prev => { const u = [...prev]; u[i].from_branch_id = opt?.value ?? ""; return u; })} placeholder="Select Abundant Branch..." renderOption={renderBranchOption} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Transfer Quantity</label>
                      <input type="number" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-black text-xs" placeholder="0" value={item.quantity} onChange={e => setItems(prev => { const u = [...prev]; u[i].quantity = e.target.value; return u; })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Allocation Reason</label>
                      <input type="text" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold text-xs" placeholder="e.g. Replenishing critical low stock..." value={item.reason} onChange={e => setItems(prev => { const u = [...prev]; u[i].reason = e.target.value; return u; })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 mt-8">
              <button onClick={() => setItems([...items, { ...EMPTY_ROW }])} className="flex-1 py-5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"><FaPlus /> Add Line Item</button>
              <button disabled={loading} onClick={submitMovements} className="flex-[2] py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30">
                {loading ? <FaSync className="animate-spin" /> : <FaExchangeAlt />} {loading ? "Authorizing Transfer..." : "Finalize Stock Move"}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <MetricCard title="Total Received" value={incoming.length} icon={FaBoxOpen} color="emerald" />
              <MetricCard title="Total Dispatched" value={outgoing.length} icon={FaArrowRight} color="amber" />
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => setHistoryTab("incoming")} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${historyTab === "incoming" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"}`}>Incoming Intake</button>
              <button onClick={() => setHistoryTab("outgoing")} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${historyTab === "outgoing" ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"}`}>Outgoing Dispatch</button>
            </div>

            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                      <th className={thClass}>Product SPEC</th>
                      <th className={thClass}>Transit Route</th>
                      <th className={thClass}>Volume</th>
                      <th className={thClass}>Timestamp</th>
                      <th className={thClass}>Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {paginated.length === 0 ? (
                      <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">No movement history recorded in this node</td></tr>
                    ) : paginated.map((m) => (
                      <tr key={m.movement_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-tight">{m.product_name}</div>
                          <div className="text-[9px] font-black text-indigo-500 mt-0.5">#{m.movement_id}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{m.from_branch_name}</span>
                            <FaArrowRight className="text-[8px] text-slate-300" />
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{m.to_branch_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-black text-slate-800 dark:text-white text-sm">{m.quantity} Units</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(m.movement_date).toLocaleDateString()}</td>
                        <td className="px-6 py-5">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic truncate max-w-[200px] leading-relaxed">"{m.reason || "Inventory optimization"}"</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Auditing {histRows.length} verified transit operations</p>
              <div className="flex items-center gap-2">
                <button disabled={histPage === 1} onClick={() => setHistPage(p => Math.max(p - 1, 1))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 shadow-sm transition-all"><FaChevronLeft /></button>
                <div className="flex gap-1">{[...Array(totalPages)].map((_, i) => <button key={i} onClick={() => setHistPage(i+1)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${histPage === i+1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50"}`}>{i+1}</button>)}</div>
                <button disabled={histPage === totalPages} onClick={() => setHistPage(p => Math.min(p + 1, totalPages))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 shadow-sm transition-all"><FaChevronRight /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
