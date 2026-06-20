import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { FaUndo, FaSearch, FaFilter, FaCheckCircle, FaExclamationTriangle, FaTrash, FaCalculator, FaInfoCircle, FaFileInvoice } from "react-icons/fa";

export default function ProcessReturn() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderFromURL = params.get("order_id");

  const user = JSON.parse(localStorage.getItem("user"));
  const branchId = user?.branch_id;

  // Data State
  const [orderList, setOrderList] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Selection State
  const [orderSearch, setOrderSearch] = useState(orderFromURL || "");
  const [selectedOrderId, setSelectedOrderId] = useState(orderFromURL || null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Reason State
  const [reasonSearch, setReasonSearch] = useState("");
  const [reasonType, setReasonType] = useState("");
  const [customReason, setCustomReason] = useState("");

  // UI State
  const [showOrders, setShowOrders] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [reasonIndex, setReasonIndex] = useState(0);

  const orderRef = useRef(null);
  const reasonRef = useRef(null);

  const REASONS = ["Defective Product", "Wrong Item Delivered", "Late Delivery", "Changed Mind", "Other"];

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (branchId) {
      API.get(`/api/orders/`).then(res => setOrderList(res.data.data || []));
    }
  }, [branchId]);

  useEffect(() => {
    if (!selectedOrderId) return;
    API.get(`/api/orders/${selectedOrderId}?branch_id=${branchId}`)
      .then(res => {
        setProducts(res.data.data.items || []);
        setSelectedItems([]);
      })
      .catch(() => alert("Error fetching order details."));
  }, [selectedOrderId, branchId]);

  /* ================= HELPERS ================= */
  const closeAll = () => { setShowOrders(false); setShowReason(false); };
  
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest(".dropdown-root")) closeAll(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollIntoView = (container, index) => {
    const el = container?.children[index];
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const filteredOrders = orderList.filter(o => o?.order_id?.toString().includes(orderSearch)).slice(0, 10);
  const filteredReasons = REASONS.filter(r => r.toLowerCase().includes(reasonSearch.toLowerCase()));

  const handleKeyNav = (e, list, index, setIndex, ref, selectFn) => {
    if (!list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); const n = Math.min(index + 1, list.length - 1); setIndex(n); scrollIntoView(ref.current, n); }
    else if (e.key === "ArrowUp") { e.preventDefault(); const p = Math.max(index - 1, 0); setIndex(p); scrollIntoView(ref.current, p); }
    else if (e.key === "Enter") { e.preventDefault(); selectFn(list[index]); }
  };

  const toggleProduct = (p, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, { product_id: p.product_id, name: p.name, maxQty: p.quantity, subTotal: p.sub_total, quantity: 1, condition: "Unused" }]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.product_id !== p.product_id));
    }
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product_id === id) {
        let val = value;
        if (field === "quantity") val = Math.min(Math.max(1, parseInt(value) || 1), item.maxQty);
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const totalRefund = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const unitValue = item.subTotal / item.maxQty;
      let factor = 1;
      if (item.condition === "Opened") factor = 0.7;
      else if (item.condition === "Damaged") factor = 0.3;
      return acc + (unitValue * item.quantity * factor);
    }, 0).toFixed(2);
  }, [selectedItems]);

  const process_return = async () => {
    if (!selectedOrderId || selectedItems.length === 0) return alert("Select products to return");
    if (!reasonType) return alert("Select a reason");
    const uId = parseInt(user?.user_id || user?.id);
    const oId = parseInt(selectedOrderId);
    const bId = parseInt(branchId);
    if (isNaN(uId) || isNaN(oId)) return alert("Error: User context missing.");
    const payload = { user_id: uId, order_id: oId, branch_id: bId, reason: reasonType === "Other" ? customReason : reasonType, product_ids: selectedItems.map(i => parseInt(i.product_id)), quantities: selectedItems.map(i => parseInt(i.quantity)), conditions: selectedItems.map(i => i.condition), refund_amounts: null };
    try {
      const res = await API.post("/api/process_return/process_return", payload);
      alert(res.data.message);
      window.location.reload();
    } catch (err) { alert("Return Failed: " + (err.response?.data?.error || "Server Error")); }
  };

  const dropdownClass = "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-fade-in";
  const itemClass = "px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700/50 last:border-0";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-500/30">
              <FaUndo className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Return Processor</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Claims & reversals terminal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SOURCE & REASON */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-slate-700/50 p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.1)]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Claim Context</h3>
              
              <div className="relative dropdown-root mb-8 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Order Reference</label>
                <div className="relative">
                  <FaFileInvoice className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-xs" />
                  <input
                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                    placeholder="Search Order ID..." value={orderSearch} onFocus={() => setShowOrders(true)}
                    onChange={(e) => { setOrderSearch(e.target.value); setShowOrders(true); setOrderIndex(0); }}
                    onKeyDown={(e) => handleKeyNav(e, filteredOrders, orderIndex, setOrderIndex, orderRef, (o) => { setSelectedOrderId(o.order_id); setOrderSearch(o.order_id.toString()); setShowOrders(false); })}
                  />
                </div>
                {showOrders && filteredOrders.length > 0 && (
                  <div ref={orderRef} className={dropdownClass}>
                    {filteredOrders.map((o, i) => (
                      <div key={o.order_id} className={`${itemClass} ${i === orderIndex ? "bg-indigo-50 text-indigo-600" : ""}`}
                        onMouseDown={() => { setSelectedOrderId(o.order_id); setOrderSearch(o.order_id.toString()); setShowOrders(false); }}>
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase">#{o.invoice_number}</span>
                          <span className="text-xs">{o.customer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative dropdown-root group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Return Logic</label>
                <div className="relative">
                  <FaInfoCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-xs" />
                  <input
                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                    placeholder="Select Reason..." value={reasonSearch} onFocus={() => setShowReason(true)}
                    onChange={(e) => { setReasonSearch(e.target.value); setShowReason(true); setReasonIndex(0); }}
                    onKeyDown={(e) => handleKeyNav(e, filteredReasons, reasonIndex, setReasonIndex, reasonRef, (r) => { setReasonType(r); setReasonSearch(r); setShowReason(false); })}
                  />
                </div>
                {showReason && (
                  <div ref={reasonRef} className={dropdownClass}>
                    {filteredReasons.map((r, i) => (
                      <div key={r} className={`${itemClass} ${i === reasonIndex ? "bg-rose-50 text-rose-600" : ""}`}
                        onMouseDown={() => { setReasonType(r); setReasonSearch(r); setShowReason(false); }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>

              {reasonType === "Other" && (
                <textarea className="w-full mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold text-xs" placeholder="Describe the reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} />
              )}
            </div>
          </div>

          {/* ITEM SELECTION */}
          <div className="lg:col-span-8">
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-slate-700/50 p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.1)]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Claimable Items</h3>

              <div className="space-y-4">
                {products.length > 0 ? products.map((p, idx) => {
                  const selected = selectedItems.find(i => i.product_id === p.product_id);
                  return (
                    <div key={p.product_id} className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2rem] border transition-all ${selected ? "bg-white dark:bg-slate-900 border-indigo-200 shadow-xl" : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-900/50"}`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selected ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-300 border border-slate-100"}`} onClick={() => toggleProduct(p, !selected)}>
                          {selected ? <FaCheckCircle /> : <div className="w-4 h-4 rounded border-2 border-current" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Returnable: {p.quantity}</p>
                        </div>
                      </div>

                      {selected && (
                        <div className="flex items-center gap-4 w-full md:w-auto animate-fade-in">
                          <div className="w-24">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Qty</label>
                            <input type="number" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-black text-center text-xs" value={selected.quantity} onChange={(e) => updateItem(p.product_id, "quantity", e.target.value)} />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Condition</label>
                            <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-bold text-xs" value={selected.condition} onChange={(e) => updateItem(p.product_id, "condition", e.target.value)}>
                              <option value="Unused">Unused (100% Refund)</option>
                              <option value="Opened">Opened (70% Refund)</option>
                              <option value="Damaged">Damaged (30% Refund)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center">
                    <div className="inline-flex p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-300">
                      <FaFileInvoice className="text-4xl" />
                    </div>
                    <p className="text-slate-400 font-bold italic">Select an Order ID to begin processing...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-12 border-t border-slate-100 dark:border-slate-700 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Reversal</p>
                  <h3 className="text-4xl font-black text-emerald-600 tracking-tighter uppercase">₹{totalRefund}</h3>
                </div>
                <button className="py-6 px-12 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-rose-500/40 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-30" onClick={process_return} disabled={selectedItems.length === 0}>
                  <FaCalculator /> Authorize Return
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}