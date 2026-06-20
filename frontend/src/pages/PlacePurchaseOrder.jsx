import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { 
  FaPlus, 
  FaTrash, 
  FaShoppingCart, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaFilter,
  FaArrowLeft,
  FaBuilding,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function PlacePurchaseOrder() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branch_id = user?.branch_id;

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1, cost_price: "" }]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await API.get("/api/create_purchase_order/suppliers");
        setSuppliers(res.data.data || []);
      } catch (e) {
        setErr("Failed to load suppliers.");
      }
    };
    if (branch_id) fetchSuppliers();
  }, [branch_id]);

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (!selectedSupplier) {
        setProducts([]); 
        return;
      }
      try {
        setLoading(true);
        const res = await API.get("/api/create_purchase_order/products", {
          params: { supplier_id: selectedSupplier }
        });
        setProducts(res.data.data || []);
        setItems([{ product_id: "", quantity: 1, cost_price: "" }]);
        setErr("");
      } catch (e) {
        setErr("Could not fetch products for this supplier.");
      } finally {
        setLoading(false);
      }
    };
    fetchFilteredProducts();
  }, [selectedSupplier]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field === "product_id") {
      updated[index].product_id = value;
      const selectedProd = products.find(p => String(p.product_id) === String(value));
      updated[index].cost_price = selectedProd ? (selectedProd.cost_price || "") : "";
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const removeItem = (i) => setItems(items.length > 1 ? items.filter((_, x) => x !== i) : items);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(""); 
    setErr("");

    if (!selectedSupplier || items.some(i => !i.product_id)) {
      setErr("Please select a supplier and at least one product.");
      setLoading(false);
      return;
    }

    try {
      await API.post("/api/create_purchase_order/", {
        supplier_id: selectedSupplier,
        branch_id: branch_id,
        items: items
      });
      setMsg("✅ Success: Purchase Order Created!");
      setItems([{ product_id: "", quantity: 1, cost_price: "" }]);
      setSelectedSupplier("");
    } catch (e) {
      setErr(e.response?.data?.error || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.cost_price || 0)), 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaFileInvoiceDollar className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Procurement Order</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Stock Acquisition Terminal</p>
            </div>
          </div>
          <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm flex items-center gap-2">
            <FaBuilding /> Branch #{branch_id}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Supplier Selection */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Selection</h3>
              {selectedSupplier && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/20">
                  <FaFilter /> Filtering Catalog
                </div>
              )}
            </div>
            <div className="relative max-w-md group">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full pl-6 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white appearance-none cursor-pointer shadow-sm"
              >
                <option value="">Select Primary Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <FaPlus className="rotate-45 text-[10px]" />
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Item</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Volume</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-56">Acquisition Cost (₹)</th>
                  <th className="px-8 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all">
                    <td className="px-8 py-5">
                      <select
                        value={item.product_id}
                        disabled={!selectedSupplier}
                        onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                        className={`w-full bg-transparent border-none focus:ring-0 font-bold text-sm ${!selectedSupplier ? 'text-slate-300 cursor-not-allowed italic' : 'text-slate-800 dark:text-white'}`}
                      >
                        <option value="">{selectedSupplier ? 'Select Catalog Item...' : 'Select Supplier to Load Products'}</option>
                        {products.map(p => (
                          <option key={p.product_id} value={p.product_id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 font-black text-center text-sm text-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-8 py-5">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.cost_price}
                        onChange={(e) => handleItemChange(index, "cost_price", e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-right font-black text-sm text-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-8 py-5">
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeItem(index)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                disabled={!selectedSupplier}
                onClick={() => setItems([...items, { product_id: "", quantity: 1, cost_price: "" }])}
                className={`flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${!selectedSupplier ? 'text-slate-300' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                <FaPlus className="text-[8px]" /> Append Line Item
              </button>
            </div>
          </div>

          {/* Feedback & Submission */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mt-12">
            <div className="flex-1 space-y-4 w-full">
              {err && (
                <div className="p-5 bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs flex items-center gap-3 animate-shake uppercase tracking-widest">
                  <FaExclamationCircle className="shrink-0" /> {err}
                </div>
              )}
              {msg && (
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold text-xs flex items-center gap-3 animate-fade-in uppercase tracking-widest">
                  <FaCheckCircle className="shrink-0" /> {msg}
                </div>
              )}
            </div>

            <div className="flex items-center gap-10">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Total</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">₹{total.toLocaleString("en-IN")}</h3>
              </div>
              <button
                type="submit"
                disabled={loading || !selectedSupplier}
                className="py-6 px-12 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "Authorizing..." : <><FaShoppingCart /> Finalize Contract</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}