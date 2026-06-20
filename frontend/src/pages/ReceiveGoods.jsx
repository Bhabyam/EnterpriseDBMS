import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBoxOpen, FaSearch, FaCheckCircle, FaExclamationTriangle, FaClock, FaBuilding, FaArrowRight } from "react-icons/fa";
import DashboardLayout from "../components/layout/DashboardLayout";

const BASE = "http://127.0.0.1:5000/api";

export default function ReceiveGoods() {
  const [poList, setPoList] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPO, setSelectedPO] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  
  const dropdownRef = useRef();

  useEffect(() => {
    fetchPOList();
  }, []);

  const fetchPOList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE}/purchase_orders_id`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setPoList(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch PO list", error);
      setPoList([]);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPO = poList.filter(p => String(p.po_id).includes(search));

  const handleReceive = async () => {
    setErr(""); setMsg("");
    if (!selectedPO) return setErr("Please select a purchase order first.");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE}/receive_goods`, 
        { po_id: selectedPO.po_id },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setMsg("Goods received successfully! Inventory has been updated.");
      setSelectedPO(null); setSearch(""); fetchPOList();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to receive goods.");
    } finally { setLoading(false); }
  };

  const dropdownClass = "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto animate-fade-in";
  const itemClass = "px-6 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex justify-between items-center";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 pb-20 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaBoxOpen className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Receive Goods</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Inventory intake & audit terminal</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {/* Status Messages */}
          {err && (
            <div className="mb-10 p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-4 text-rose-600 dark:text-rose-400 animate-fade-in">
              <FaExclamationTriangle className="text-xl flex-shrink-0" />
              <p className="font-black text-xs uppercase tracking-tight">{err}</p>
            </div>
          )}
          
          {msg && (
            <div className="mb-10 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4 text-emerald-600 dark:text-emerald-400 animate-fade-in">
              <FaCheckCircle className="text-xl flex-shrink-0" />
              <p className="font-black text-xs uppercase tracking-tight">{msg}</p>
            </div>
          )}

          <div ref={dropdownRef} className="mb-12 relative group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
              Purchase Order Reference
            </label>
            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                placeholder="Search Pending PO ID..."
                value={search}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              />
            </div>

            {showDropdown && (
              <div className={dropdownClass}>
                {filteredPO.length > 0 ? filteredPO.map(p => (
                  <div key={p.po_id} className={itemClass} onClick={() => { setSelectedPO(p); setSearch(`PO-${p.po_id}`); setShowDropdown(false); }}>
                    <div className="flex flex-col">
                      <span className="font-black text-indigo-500 uppercase tracking-tighter">PO-{p.po_id}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Procurement Ref</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FaBuilding className="text-[8px]" />
                        Branch #{p.branch_id}
                      </span>
                      <FaArrowRight className="text-slate-200" />
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-12 text-center">
                    <FaBoxOpen className="mx-auto text-4xl text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-400 font-bold italic text-sm">No pending deliveries matching "{search}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedPO && (
            <div className="mb-12 p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-800/30 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Identified Order</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100 dark:border-indigo-800">
                      <FaBoxOpen />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-xl tracking-tight uppercase">PO-{selectedPO.po_id}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Verification Required</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Target Destination</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-800">
                      <FaBuilding />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-xl tracking-tight uppercase">Branch #{selectedPO.branch_id}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Current Inventory Zone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            disabled={!selectedPO || loading}
            className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3
              ${!selectedPO || loading 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30"
              }`}
            onClick={handleReceive}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Syncing Inventory...</span>
              </>
            ) : (
              <>
                <FaCheckCircle /> Authorize Good Receipt
              </>
            )}
          </button>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
          <FaClock className="text-xs" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Last inventory heartbeat: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}