import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { FaUser, FaShoppingCart, FaPlus, FaTrash, FaSearch, FaCheckCircle, FaUserPlus, FaTag, FaCalculator, FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";

export default function PlaceOrder() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user?.branch_id;
  const userId = user?.user_id;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Customer State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [resolvedCust, setResolvedCust] = useState(null);

  // Visibility
  const [showFirst, setShowFirst] = useState(false);
  const [showLast, setShowLast] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Selection Nav
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [emailIndex, setEmailIndex] = useState(0);

  // Refs
  const firstRef = useRef(null);
  const lastRef = useRef(null);
  const emailRef = useRef(null);
  const productRefs = useRef([]);

  // Order Items
  const [items, setItems] = useState([
    { product_id: "", quantity: "", discount: 0, search: "", show: false, index: 0 }
  ]);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState("Regular");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Customers
        const custRes = await API.get("/api/customers");
        setCustomers(custRes.data.data || []);

        // Fetch Products with Fallbacks
        let prodData = [];
        
        // 1. Try branch products
        if (branchId) {
          try {
            const bRes = await API.get(`/api/branch_products/${branchId}`);
            if (bRes.data?.data?.length > 0) prodData = bRes.data.data;
          } catch (e) { console.log("Branch prod fetch failed, trying inventory..."); }
        }

        // 2. Try inventory if still empty
        if (prodData.length === 0) {
          try {
            const iRes = await API.get("/api/inventory/");
            if (iRes.data?.data?.length > 0) prodData = iRes.data.data;
          } catch (e) { console.log("Inventory fetch failed, trying products..."); }
        }

        // 3. Try products if still empty
        if (prodData.length === 0) {
          try {
            const pRes = await API.get("/api/products/");
            if (pRes.data?.data?.length > 0) prodData = pRes.data.data;
          } catch (e) { console.log("Final product fetch failed."); }
        }

        if (prodData.length === 0) {
          setError("No products available in the system.");
        }
        
        setProducts(prodData);
      } catch (err) {
        setError("System connectivity issue. Please check your network.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId]);

  const closeAll = () => {
    setShowFirst(false); setShowLast(false); setShowEmail(false);
    setItems((prev) => prev.map((i) => ({ ...i, show: false })));
  };

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest(".dropdown-root")) closeAll(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollIntoView = (container, index) => {
    const el = container?.children[index];
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  // Filters
  const distinctFirst = [...new Set(customers.map((c) => c.first_name))].filter((n) => (n || "").toLowerCase().includes((firstName || "").toLowerCase())).slice(0, 10);
  const filteredLast = customers.filter((c) => (c.first_name || "").toLowerCase() === (firstName || "").toLowerCase()).map((c) => c.last_name).filter((v, i, a) => a.indexOf(v) === i).filter((n) => (n || "").toLowerCase().includes((lastName || "").toLowerCase())).slice(0, 10);
  const filteredEmails = customers.filter((c) => (c.first_name || "").toLowerCase() === (firstName || "").toLowerCase() && (c.last_name || "").toLowerCase() === (lastName || "").toLowerCase()).filter((c) => (c.email || "").toLowerCase().includes((email || "").toLowerCase())).slice(0, 10);
  
  const getFilteredProducts = (search) => {
    const term = (search || "").toLowerCase();
    return products.filter((p) => {
      const name = p.product_name || p.name || "";
      const brand = p.brand_name || "";
      const category = p.category_name || "";
      return name.toLowerCase().includes(term) || 
             brand.toLowerCase().includes(term) || 
             category.toLowerCase().includes(term);
    }).slice(0, 10);
  };

  const handleKey = (e, list, index, setIndex, ref, selectFn) => {
    if (!list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); const n = Math.min(index + 1, list.length - 1); setIndex(n); scrollIntoView(ref.current, n); }
    if (e.key === "ArrowUp") { e.preventDefault(); const p = Math.max(index - 1, 0); setIndex(p); scrollIntoView(ref.current, p); }
    if (e.key === "Enter") { e.preventDefault(); selectFn(list[index]); }
  };

  const selectFirst = (n) => { setFirstName(n); setShowFirst(false); setShowLast(true); setLastIndex(0); };
  const selectLast = (n) => { setLastName(n); setShowLast(false); setShowEmail(true); setEmailIndex(0); };
  const selectEmail = (c) => { setEmail(c.email); setResolvedCust(c); closeAll(); };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      if (field === "quantity") {
        const p = products.find((p) => String(p.product_id) === String(newItems[index].product_id));
        let qty = parseInt(value);
        if (isNaN(qty)) qty = "";
        if (qty < 1 && qty !== "") qty = 1;
        if (qty > (p?.quantity || Infinity)) qty = p.quantity;
        newItems[index].quantity = qty;
      } else if (field === "discount") {
        let d = parseFloat(value);
        if (isNaN(d)) d = 0;
        newItems[index].discount = Math.min(100, Math.max(0, d));
      } else { 
        newItems[index][field] = value; 
      }
      return newItems;
    });
  };

  const handleProductKey = (e, idx, list) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      setItems((prev) => {
        const newItems = [...prev];
        let i = newItems[idx].index || 0;
        if (e.key === "ArrowDown") { e.preventDefault(); i = Math.min(i + 1, list.length - 1); }
        if (e.key === "ArrowUp") { e.preventDefault(); i = Math.max(i - 1, 0); }
        if (e.key === "Enter") {
          e.preventDefault(); const p = list[i];
          if (p) { 
            newItems[idx].product_id = p.product_id; 
            newItems[idx].search = p.product_name || p.name; 
            newItems[idx].show = false; 
          }
        }
        newItems[idx].index = i;
        scrollIntoView(productRefs.current[idx], i);
        return newItems;
      });
    }
  };

  const addItem = () => setItems([...items, { product_id: "", quantity: "", discount: 0, search: "", show: false, index: 0 }]);
  const removeItem = (i) => setItems(items.length > 1 ? items.filter((_, x) => x !== i) : items);

  const total = items.reduce((sum, item) => {
    const p = products.find((p) => String(p.product_id) === String(item.product_id));
    if (!p || !item.quantity) return sum;
    return sum + p.price * item.quantity * (1 - item.discount / 100);
  }, 0);

  const placeOrder = async () => {
    if (!resolvedCust) return alert("Select customer first from dropdown");
    const payload = {
      user_id: userId, customer_id: resolvedCust.customer_id, branch_id: branchId,
      product_ids: items.map(i => parseInt(i.product_id)).filter(id => !isNaN(id)),
      quantities: items.map(i => parseInt(i.quantity)).filter(q => !isNaN(q)),
      discounts: items.map(i => parseFloat(i.discount)).filter(d => !isNaN(d))
    };
    if (payload.product_ids.length === 0) return alert("Please select at least one valid product");
    
    try {
      await API.post("/api/place_order", payload);
      alert("Order placed successfully ✅");
      setItems([{ product_id: "", quantity: "", discount: 0, search: "", show: false, index: 0 }]);
      setResolvedCust(null); setFirstName(""); setLastName(""); setEmail("");
    } catch (error) { 
      alert(error.response?.data?.error || "Error placing order"); 
    }
  };

  const dropdownClass = "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-fade-in";
  const itemClass = "px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700/50 last:border-0";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaShoppingCart className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Checkout Terminal</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Point of Sale System</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {loading && <div className="text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-[0.2em]">Syncing Products...</div>}
            {error && <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2"><FaExclamationTriangle /> {error}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CUSTOMER INFO */}
          <div className="lg:col-span-12">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FaUser className="text-indigo-500" /> Customer Information
                </h3>
                {resolvedCust && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase border border-emerald-100 dark:border-emerald-800/30 animate-fade-in">
                    <FaCheckCircle /> Identified: #{resolvedCust.customer_id}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative dropdown-root group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">First Name</label>
                  <input
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                    value={firstName} onFocus={() => { closeAll(); setShowFirst(true); }}
                    onChange={(e) => { setFirstName(e.target.value); setShowFirst(true); setFirstIndex(0); }}
                    onKeyDown={(e) => handleKey(e, distinctFirst, firstIndex, setFirstIndex, firstRef, selectFirst)}
                  />
                  {showFirst && distinctFirst.length > 0 && (
                    <div ref={firstRef} className={dropdownClass}>
                      {distinctFirst.map((n, i) => (
                        <div key={i} className={`${itemClass} ${i === firstIndex ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : ""}`} onMouseDown={() => selectFirst(n)}>{n}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative dropdown-root group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Last Name</label>
                  <input
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                    value={lastName} onFocus={() => { closeAll(); setShowLast(true); }}
                    onChange={(e) => { setLastName(e.target.value); setShowLast(true); setLastIndex(0); }}
                    onKeyDown={(e) => handleKey(e, filteredLast, lastIndex, setLastIndex, lastRef, selectLast)}
                  />
                  {showLast && filteredLast.length > 0 && (
                    <div ref={lastRef} className={dropdownClass}>
                      {filteredLast.map((n, i) => (
                        <div key={i} className={`${itemClass} ${i === lastIndex ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : ""}`} onMouseDown={() => selectLast(n)}>{n}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative dropdown-root group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                  <input
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                    value={email} onFocus={() => { closeAll(); setShowEmail(true); }}
                    onChange={(e) => { setEmail(e.target.value); setShowEmail(true); setEmailIndex(0); }}
                    onKeyDown={(e) => handleKey(e, filteredEmails, emailIndex, setEmailIndex, emailRef, selectEmail)}
                  />
                  {showEmail && filteredEmails.length > 0 && (
                    <div ref={emailRef} className={dropdownClass}>
                      {filteredEmails.map((c, i) => (
                        <div key={c.customer_id} className={`${itemClass} ${i === emailIndex ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : ""}`} onMouseDown={() => selectEmail(c)}>{c.email}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button className="flex-1 py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-widest border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm" onClick={() => setShowAddModal(true)}>
                  <FaUserPlus className="inline mr-2" /> Register New Customer
                </button>
              </div>
            </div>
          </div>

          {/* BASKET */}
          <div className="lg:col-span-12">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <FaShoppingCart className="text-indigo-500" /> Shopping Basket
              </h3>

              <div className="space-y-6">
                {items.map((item, index) => {
                  const filtered = getFilteredProducts(item.search);
                  return (
                    <div key={index} className="grid grid-cols-12 gap-6 items-end p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-700/50 relative group transition-all hover:bg-white dark:hover:bg-slate-900/50 shadow-sm">
                      <div className="col-span-12 lg:col-span-5 relative dropdown-root">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Product Search</label>
                        <div className="relative">
                          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm text-slate-700 dark:text-white"
                            value={item.search} placeholder="Find item..." onFocus={() => { closeAll(); updateItem(index, "show", true); }}
                            onChange={(e) => { updateItem(index, "search", e.target.value); updateItem(index, "show", true); updateItem(index, "index", 0); }}
                            onKeyDown={(e) => handleProductKey(e, index, filtered)}
                          />
                        </div>
                        {item.show && (
                          <div ref={(el) => (productRefs.current[index] = el)} className={dropdownClass}>
                            {filtered.length > 0 ? (
                              filtered.map((p, i) => (
                                <div key={p.product_id} className={`${itemClass} ${i === (item.index || 0) ? "bg-indigo-50 text-indigo-600" : ""}`}
                                  onMouseDown={() => { updateItem(index, "product_id", p.product_id); updateItem(index, "search", p.product_name || p.name); updateItem(index, "show", false); }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col text-left">
                                      <span className="font-black text-xs uppercase tracking-tight">{p.product_name || p.name}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.brand_name || "No Brand"}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-black text-[10px]">₹{p.price}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Stock: {p.quantity ?? "N/A"}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-8 py-10 text-center opacity-50">
                                <FaBoxOpen className="text-2xl mx-auto mb-2 text-slate-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{loading ? "Loading..." : "No matching products"}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="col-span-4 lg:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Quantity</label>
                        <input type="number" className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-black text-center" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
                      </div>

                      <div className="col-span-4 lg:col-span-3 relative">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Discount (%)</label>
                        <div className="relative">
                          <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input type="number" className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-black text-center" value={item.discount} onChange={(e) => updateItem(index, "discount", e.target.value)} />
                        </div>
                      </div>

                      <div className="col-span-4 lg:col-span-1 text-right">
                        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90" onClick={() => removeItem(index)}>
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between mt-12 pt-12 border-t border-slate-100 dark:border-slate-700 gap-8">
                <button className="flex items-center gap-3 py-4 px-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-indigo-400 hover:text-indigo-500 transition-all" onClick={addItem}>
                  <FaPlus className="text-[8px]" /> Append Product
                </button>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">₹{total.toLocaleString("en-IN")}</h3>
                  </div>
                  <button className="py-6 px-12 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center gap-3" onClick={placeOrder}>
                    <FaCalculator /> Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL (Abstracted style) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 animate-fade-in">
            <div className="p-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 tracking-tight">New Customer Profile</h3>
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Selected Context</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{firstName} {lastName} ({email})</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Contact</label>
                  <input className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none font-bold" placeholder="+91 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Customer Classification</label>
                  <select className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none font-bold appearance-none" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                    <option value="Regular">Regular Class</option>
                    <option value="Premium">Premium Tier</option>
                    <option value="Wholesale">Wholesale Entity</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-10">
                <button className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="flex-[2] py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-95" onClick={() => setShowAddModal(false)}>Create Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}