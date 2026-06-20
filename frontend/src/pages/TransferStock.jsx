import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { FaTrash, FaPlus, FaChevronDown, FaExchangeAlt, FaBuilding, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

export default function TransferStock() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role;
  const userBranchId = user?.branch_id;
  const isManagerOrAdmin = userRole === "Manager" || userRole === "Admin";

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");

  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const fromRef = useRef();
  const toRef = useRef();

  const reasonOptions = [
    "Stock Rebalancing",
    "Overstock redistribution",
    "Inter-branch transfer",
    "Emergency restock",
    "Demand shift"
  ];

  const [items, setItems] = useState([
    { product_id: "", quantity: "", reason: "" }
  ]);

  const [productSearch, setProductSearch] = useState([""]);
  const [showProduct, setShowProduct] = useState([false]);
  const productRefs = useRef([]);

  const [reasonSearch, setReasonSearch] = useState([""]);
  const [showReason, setShowReason] = useState([false]);
  const reasonRefs = useRef([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // CLOSE DROPDOWNS
  useEffect(() => {
    const handler = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) setShowFrom(false);
      if (toRef.current && !toRef.current.contains(e.target)) setShowTo(false);

      productRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target)) {
          setShowProduct(p => { const x = [...p]; x[i] = false; return x; });
        }
      });

      reasonRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target)) {
          setShowReason(p => { const x = [...p]; x[i] = false; return x; });
        }
      });
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // FETCH BRANCHES
  useEffect(() => {
    API.get("/api/dashboard/branches")
      .then(res => {
        const branchList = res.data?.data || [];
        setBranches(branchList);
        if (!isManagerOrAdmin && userBranchId) {
          const myBranch = branchList.find(b => b.branch_id === userBranchId);
          if (myBranch) { setFromBranch(myBranch.branch_id); setFromSearch(myBranch.branch_name); }
        }
      })
      .catch(e => { console.error("Fetch branches error:", e); setErr("Failed to load branches"); });
  }, [isManagerOrAdmin, userBranchId]);

  // FETCH PRODUCTS
  useEffect(() => {
    if (!fromBranch) { setProducts([]); return; }
    API.get(`/api/branch_products/${fromBranch}`)
      .then(res => setProducts(res.data?.data || []))
      .catch(e => {
        console.error("Fetch products error:", e);
        setErr(e.response?.status === 403 ? "Permission denied for this branch" : "Failed to load products");
      });
  }, [fromBranch]);

  const filteredFrom = branches.filter(b => (b.branch_name || "").toLowerCase().includes(fromSearch.toLowerCase()));
  const filteredTo = branches.filter(b => (b.branch_name || "").toLowerCase().includes(toSearch.toLowerCase()));

  const addRow = () => {
    setItems([...items, { product_id: "", quantity: "", reason: "" }]);
    setProductSearch([...productSearch, ""]);
    setShowProduct([...showProduct, false]);
    setReasonSearch([...reasonSearch, ""]);
    setShowReason([...showReason, false]);
  };

  const removeRow = (i) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
    setProductSearch(productSearch.filter((_, idx) => idx !== i));
    setShowProduct(showProduct.filter((_, idx) => idx !== i));
    setReasonSearch(reasonSearch.filter((_, idx) => idx !== i));
    setShowReason(showReason.filter((_, idx) => idx !== i));
  };

  const updateItem = (i, field, value) => {
    const updated = [...items];
    if (field === "quantity") {
      const p = products.find(prod => prod.product_id === updated[i].product_id);
      let qty = parseInt(value);
      if (isNaN(qty)) qty = "";
      else {
        if (qty < 1) qty = 1;
        if (p && qty > p.quantity) {
          qty = p.quantity;
          setErr(`Max stock reached: ${p.quantity} for ${p.product_name}`);
          setTimeout(() => setErr(""), 3000);
        }
      }
      updated[i][field] = qty;
    } else { updated[i][field] = value; }
    setItems(updated);
  };

  const selectFromBranch = (id, name) => {
    if (Number(id) === Number(toBranch)) { setErr("Cannot transfer to the same branch"); return; }
    setFromBranch(id); setFromSearch(name); setShowFrom(false); setErr("");
  };

  const selectToBranch = (id, name) => {
    if (Number(id) === Number(fromBranch)) { setErr("Cannot transfer from the same branch"); return; }
    setToBranch(id); setToSearch(name); setShowTo(false); setErr("");
  };

  const handleSubmit = async () => {
    setErr(""); setMsg("");
    if (!fromBranch || !toBranch) return setErr("Select source & destination branches");
    if (items.some(i => !i.product_id || !i.quantity || !i.reason)) return setErr("Complete all rows before submission");

    setLoading(true);
    try {
      await API.post("/api/transfer_stock", {
        product_ids: items.map(i => Number(i.product_id)),
        quantities: items.map(i => Number(i.quantity)),
        reasons: items.map(i => i.reason),
        from_branch: Number(fromBranch),
        to_branch: Number(toBranch)
      });
      setMsg("Stock transfer successful!");
      setItems([{ product_id: "", quantity: "", reason: "" }]);
      setProductSearch([""]); setReasonSearch([""]);
      if (isManagerOrAdmin) { setFromBranch(""); setFromSearch(""); }
      setToBranch(""); setToSearch("");
    } catch (e) { setErr(e.response?.data?.error || "Transfer failed"); }
    finally { setLoading(false); }
  };

  const dropdownClass = "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[1000] max-h-[250px] overflow-y-auto overflow-x-hidden animate-fade-in";
  const itemClass = "px-5 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700/50 last:border-0";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaExchangeAlt className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Transfer Stock</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Inter-branch logistics management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 backdrop-blur-sm shadow-sm">
            <FaBuilding className="text-indigo-500" />
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              Operator: <span className="text-indigo-500">{user?.username}</span>
            </span>
          </div>
        </div>

        {err && (
          <div className="mb-8 p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-4 animate-shake">
            <FaExclamationTriangle className="text-xl" /> {err}
          </div>
        )}
        {msg && (
          <div className="mb-8 p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-4">
            <FaCheckCircle className="text-xl" /> {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: SOURCE & DESTINATION */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-visible">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Route Configuration</h3>
              
              {/* SOURCE */}
              <div className="relative mb-8" ref={fromRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Source Branch</label>
                <div className="relative group">
                  <input
                    className={`w-full pl-4 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 ${!isManagerOrAdmin ? "bg-slate-100 dark:bg-slate-900/80 cursor-not-allowed border-none" : "bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm"}`}
                    placeholder="Search Branch..."
                    value={fromSearch}
                    readOnly={!isManagerOrAdmin}
                    onFocus={() => isManagerOrAdmin && setShowFrom(true)}
                    onChange={(e) => { if (isManagerOrAdmin) { setFromSearch(e.target.value); setShowFrom(true); } }}
                  />
                  {isManagerOrAdmin && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" onClick={() => setShowFrom(!showFrom)}>
                      <FaChevronDown className={`transition-transform duration-300 ${showFrom ? "rotate-180" : ""}`} />
                    </div>
                  )}
                </div>
                {showFrom && isManagerOrAdmin && (
                  <div className={dropdownClass}>
                    {filteredFrom.length > 0 ? filteredFrom.map(b => (
                        <div key={b.branch_id} className={itemClass} onClick={() => selectFromBranch(b.branch_id, b.branch_name)}>
                          {b.branch_name}
                        </div>
                    )) : <div className="p-5 text-center text-slate-400 text-xs italic font-bold">No branches found</div>}
                  </div>
                )}
              </div>

              <div className="flex justify-center -my-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xl ring-8 ring-white dark:ring-slate-800">
                  <FaExchangeAlt className="rotate-90 lg:rotate-0 text-xs" />
                </div>
              </div>

              {/* DESTINATION */}
              <div className="relative mt-8" ref={toRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Destination Branch</label>
                <div className="relative group">
                  <input
                    className="w-full pl-4 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="Search Destination Branch..."
                    value={toSearch}
                    onFocus={() => setShowTo(true)}
                    onChange={(e) => { setToSearch(e.target.value); setShowTo(true); }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" onClick={() => setShowTo(!showTo)}>
                    <FaChevronDown className={`transition-transform duration-300 ${showTo ? "rotate-180" : ""}`} />
                  </div>
                </div>
                {showTo && (
                  <div className={dropdownClass}>
                    {filteredTo.length > 0 ? filteredTo.map(b => (
                      <div key={b.branch_id} className={itemClass} onClick={() => selectToBranch(b.branch_id, b.branch_name)}>
                        {b.branch_name}
                      </div>
                    )) : <div className="p-5 text-center text-slate-400 text-xs italic font-bold">No branches found</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: ITEM TABLE */}
          <div className="lg:col-span-8">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-visible">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Selection</h3>
                  <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                    {items.length} Row{items.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-6 pb-20">
                  {items.map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-4 items-start p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-700/50 transition-all hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-xl group relative">
                      {/* PRODUCT */}
                      <div className="flex-1 w-full relative" ref={el => productRefs.current[i] = el}>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Product</label>
                        <div className="relative">
                          <input
                            className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder={fromBranch ? "Search & Select..." : "Select Source First"}
                            value={productSearch[i] || ""}
                            onFocus={() => { if (fromBranch) { const s = [...showProduct]; s[i] = true; setShowProduct(s); } }}
                            onChange={(e) => { const val = e.target.value; const s = [...productSearch]; s[i] = val; setProductSearch(s); const sh = [...showProduct]; sh[i] = true; setShowProduct(sh); }}
                          />
                          {fromBranch && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" onClick={() => { const s = [...showProduct]; s[i] = !s[i]; setShowProduct(s); }}>
                              <FaChevronDown className={`text-[10px] transition-transform duration-200 ${showProduct[i] ? "rotate-180" : ""}`} />
                            </div>
                          )}
                        </div>
                        {showProduct[i] && (
                          <div className={dropdownClass}>
                            {products.length > 0 ? products
                              .filter(p => `${p.product_name} ${p.brand_name || ""}`.toLowerCase().includes((productSearch[i] || "").toLowerCase()))
                              .map(p => (
                                <div key={p.product_id} className={itemClass} onClick={() => {
                                  updateItem(i, "product_id", p.product_id);
                                  const s = [...productSearch]; s[i] = `${p.product_name}`; setProductSearch(s);
                                  const sh = [...showProduct]; sh[i] = false; setShowProduct(sh);
                                }}>
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <span className="font-black text-indigo-500 text-[9px] tracking-widest uppercase">#{p.product_id}</span>
                                      <span className="font-bold">{p.product_name}</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-tighter italic">Stock: {p.quantity}</span>
                                  </div>
                                </div>
                              )) : <div className="p-10 text-center text-slate-400 text-xs italic font-bold">No products available in this branch</div>}
                          </div>
                        )}
                      </div>

                      {/* QTY */}
                      <div className="w-full md:w-24">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block text-center">Qty</label>
                        <input
                          type="number"
                          className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center font-black text-sm text-slate-800 dark:text-white"
                          min="1" placeholder="0" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)}
                        />
                      </div>

                      {/* REASON */}
                      <div className="flex-1 w-full relative" ref={el => reasonRefs.current[i] = el}>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reason</label>
                        <div className="relative">
                          <input
                            className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="Reason..." value={reasonSearch[i] || item.reason}
                            onFocus={() => { const s = [...showReason]; s[i] = true; setShowReason(s); }}
                            onChange={(e) => { const val = e.target.value; const s = [...reasonSearch]; s[i] = val; setReasonSearch(s); updateItem(i, "reason", val); const sh = [...showReason]; sh[i] = true; setShowReason(sh); }}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" onClick={() => { const s = [...showReason]; s[i] = !s[i]; setShowReason(s); }}>
                            <FaChevronDown className={`text-[10px] transition-transform duration-200 ${showReason[i] ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                        {showReason[i] && (
                          <div className={dropdownClass}>
                            {reasonOptions.map(r => (
                              <div key={r} className={itemClass} onClick={() => { updateItem(i, "reason", r); const s = [...reasonSearch]; s[i] = r; setReasonSearch(s); const sh = [...showReason]; sh[i] = false; setShowReason(sh); }}>{r}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* REMOVE */}
                      <button className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-200 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90" onClick={() => removeRow(i)}>
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-5 mt-10">
                  <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 transition-all font-black uppercase text-[10px] tracking-widest group" onClick={addRow}>
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-colors">
                      <FaPlus className="text-[8px]" />
                    </div>
                    Add Another Item
                  </button>

                  <button className="flex-[1.5] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaExchangeAlt className="text-sm" />}
                    {loading ? "Processing Transfer..." : "Execute Stock Transfer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
