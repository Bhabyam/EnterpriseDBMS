import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { FaChevronDown, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function AddPurchasePayment() {
  const location = useLocation();

  // ✅ 1. DECLARE USER AT THE TOP (This fixes the ReferenceError)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branch_id = user?.branch_id;

  const [pos, setPos] = useState([]);
  const [poSearch, setPoSearch] = useState("");
  const [poId, setPoId] = useState("");
  const [showPO, setShowPO] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const poRef = useRef();

  // ✅ 2. FETCH PENDING POs (Fixed Scope)
  const fetchPendingPOs = async () => {
    if (!branch_id) return; // Don't fetch if branch_id is missing
    try {
      const res = await API.get("/api/add_purchase_payment/pos", {
        params: { branch_id: branch_id } // Using the branch_id from our user variable
      });
      setPos(res.data.data || []);
    } catch (e) {
      console.error("Error fetching POs:", e);
    }
  };

  useEffect(() => {
    fetchPendingPOs();
  }, [branch_id]);

  // ✅ DROPDOWN OUTSIDE CLICK LOGIC
  useEffect(() => {
    const handler = (e) => {
      if (poRef.current && !poRef.current.contains(e.target)) setShowPO(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ SYNC WITH URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const po = params.get("po_id");
    if (po) {
      setPoId(po);
      setPoSearch(`PO-${po}`);
    }
  }, [location.search]);

  const filteredPO = pos.filter((p) =>
    String(p.po_id).includes(poSearch.replace("PO-", ""))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poId || !paymentMethod) {
      setErr("Please select a Purchase Order and payment method.");
      return;
    }

    setLoading(true);
    try {
      await API.post("/api/add_purchase_payment/", {
        po_id: Number(poId),
        payment_method: paymentMethod,
      });

      setMsg("✅ Payment Added Successfully");
      setTimeout(() => {
        setPoId("");
        setPoSearch("");
        setPaymentMethod("");
        fetchPendingPOs();
      }, 1500);
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to add payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800 dark:text-slate-200">Add Purchase Payment</h1>
          <p className="text-gray-500 dark:text-slate-400 font-bold">Branch: {branch_id || "Global View"}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-2 bg-indigo-600"></div>
          
          <div className="p-8">
            {err && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 flex items-center gap-2"><FaExclamationCircle/> {err}</div>}
            {msg && <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-xl font-bold border border-green-100 flex items-center gap-2"><FaCheckCircle/> {msg}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PO Search Dropdown */}
              <div className="relative" ref={poRef}>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Purchase Order</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:ring-2 dark:focus:ring-blue-500800 outline-none transition-all font-bold text-gray-700"
                  placeholder="Search PO ID..."
                  value={poSearch}
                  onFocus={() => setShowPO(true)}
                  onChange={(e) => { setPoSearch(e.target.value); setShowPO(true); }}
                />
                
                {showPO && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredPO.length > 0 ? filteredPO.map(p => (
                      <div
                        key={p.po_id}
                        onClick={() => { setPoId(p.po_id); setPoSearch(`PO-${p.po_id}`); setShowPO(false); }}
                        className="px-5 py-4 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition border-b border-gray-50 last:border-0"
                      >
                        <span className="font-bold">PO-{p.po_id}</span>
                        <span className="text-xs text-gray-400 italic">{p.supplier_name}</span>
                      </div>
                    )) : (
                      <div className="p-5 text-center text-gray-400 font-bold">No pending POs found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Payment Method</label>
                <select
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:ring-2 dark:focus:ring-blue-500800 outline-none transition-all font-bold text-gray-700 cursor-pointer"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Select Method</option>
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>NetBanking</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg transition-all ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1"}`}
              >
                {loading ? "Processing..." : "Submit Payment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}