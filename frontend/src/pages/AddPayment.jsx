import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaCreditCard, FaSearch, FaChevronDown, FaWallet, FaCheckCircle, FaMoneyBillWave, FaMobileAlt, FaUniversity, FaArrowLeft, FaHistory } from "react-icons/fa";

const methodConfig = {
  Cash: { color: "emerald", icon: FaMoneyBillWave, label: "Hard Cash" },
  UPI: { color: "indigo", icon: FaMobileAlt, label: "Digital UPI" },
  Card: { color: "purple", icon: FaCreditCard, label: "Card Swipe" },
  NetBanking: { color: "amber", icon: FaUniversity, label: "Bank Transfer" },
};

export default function AddPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const orderFromURL = params.get("order_id");

  const user = JSON.parse(localStorage.getItem("user"));
  const branchId = user?.branch_id;

  const [orderId, setOrderId] = useState(orderFromURL || "");
  const [orderSearch, setOrderSearch] = useState(orderFromURL || "");
  const [showOrders, setShowOrders] = useState(false);
  const [orderList, setOrderList] = useState([]);

  const orderRef = useRef();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [mode, setMode] = useState("custom");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (orderRef.current && !orderRef.current.contains(e.target)) setShowOrders(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!branchId) return;
    API.get(`/api/add_payment/orders?branch_id=${branchId}`)
      .then(res => setOrderList(res.data.data || []))
      .catch(() => {});
  }, [branchId]);

  useEffect(() => {
    if (!orderId || orderId === "") {
      setAmount("");
      setRemaining(null);
      setMode("custom");
      return;
    }
    API.get(`/api/add_payment/order/${orderId}`)
      .then(res => {
        const rem = res.data.data.remaining;
        setRemaining(rem);
        setAmount(rem);
        setMode("full");
      })
      .catch(() => {
        setRemaining(null);
        setAmount("");
        setMode("custom");
      });
  }, [orderId]);

  const filteredOrders = orderList.filter(o =>
    o.order_id.toString().includes(orderSearch) || 
    (o.customer || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.invoice_number || "").toLowerCase().includes(orderSearch.toLowerCase())
  );

  const handleMode = (type) => {
    if (remaining === null) return;
    setMode(type);
    if (type === "full") setAmount(remaining);
    else if (type === "half") setAmount((remaining / 2).toFixed(2));
    else setAmount("");
  };

  const addPayment = async () => {
    setLoading(true);
    const data = {
      order_id: parseInt(orderId),
      amount: parseFloat(amount),
      payment_method: method
    };
    try {
      const res = await API.post("/api/add_payment/", data);
      alert(res.data.data.message + "\nRemaining Amount: ₹" + res.data.data.remaining);
      setRemaining(res.data.data.remaining);
      if (res.data.data.remaining <= 0) {
          setOrderId("");
          setOrderSearch("");
          navigate("/payments");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error adding payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaCreditCard className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Add Payment</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Transaction Settlement Terminal</p>
            </div>
          </div>
          <button onClick={() => navigate("/payments")} className="px-6 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 backdrop-blur-sm shadow-sm flex items-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-500 transition-all">
            <FaHistory /> View History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: FORM */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-visible">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Settlement Configuration</h3>
              
              {/* ORDER SELECT */}
              <div className="relative mb-8" ref={orderRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Reference Order</label>
                <div className="relative group">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="Search by ID, Invoice or Customer..."
                    value={orderSearch}
                    onFocus={() => setShowOrders(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOrderSearch(val);
                      setOrderId(val);
                      setShowOrders(true);
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" onClick={() => setShowOrders(!showOrders)}>
                    <FaChevronDown className={`transition-transform duration-300 ${showOrders ? "rotate-180" : ""}`} />
                  </div>
                </div>
                {showOrders && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[1000] max-h-[250px] overflow-y-auto animate-fade-in">
                    {filteredOrders.length > 0 ? filteredOrders.map(o => (
                      <div key={o.order_id} className="px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0" onClick={() => {
                        setOrderId(o.order_id);
                        setOrderSearch(o.invoice_number);
                        setShowOrders(false);
                      }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">{o.invoice_number}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{o.customer}</p>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black italic tracking-tighter">ID: {o.order_id}</span>
                        </div>
                      </div>
                    )) : <div className="p-10 text-center text-slate-400 text-xs italic font-bold uppercase tracking-widest">No active orders found</div>}
                  </div>
                )}
              </div>

              {/* AMOUNT & MODE */}
              <div className="mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Disbursement Value (₹)</label>
                <div className="flex flex-col gap-4">
                  <input
                    type="number"
                    className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-2xl text-slate-800 dark:text-white placeholder:text-slate-200 shadow-sm"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setMode("custom"); setAmount(e.target.value); }}
                  />
                  {remaining !== null && (
                    <div className="flex gap-2">
                      {["full", "half", "custom"].map((m) => (
                        <button
                          key={m}
                          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            mode === m ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                          onClick={() => handleMode(m)}
                        >
                          {m} Allocation
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div className="mb-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Settlement Instrument</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(methodConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key)}
                      className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                        method === key
                          ? `bg-${cfg.color}-50 dark:bg-${cfg.color}-900/20 border-${cfg.color}-200 dark:border-${cfg.color}-700/50 text-${cfg.color}-600 dark:text-${cfg.color}-400 ring-2 ring-${cfg.color}-500/20 shadow-xl`
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700/50 text-slate-400 hover:border-indigo-100 hover:text-indigo-500"
                      }`}
                    >
                      <cfg.icon className={`text-xl transition-transform group-hover:scale-110 ${method === key ? "scale-110" : ""}`} />
                      <span className="font-black text-[10px] uppercase tracking-widest">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="w-full py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={addPayment}
                disabled={!orderId || !amount || !method || loading}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaCheckCircle className="text-sm" />}
                {loading ? "Authenticating..." : "Authorize Transaction"}
              </button>
            </div>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none h-full">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Balance Overview</h3>
              
              {remaining !== null ? (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex flex-col items-center justify-center p-10 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <FaWallet className="text-9xl" />
                    </div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 relative z-10">Currently Outstanding</label>
                    <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight relative z-10">₹{Number(remaining).toLocaleString("en-IN")}</div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Balance</span>
                      <span className="font-black text-lg text-slate-700 dark:text-slate-200">₹{Math.max(0, Number(remaining) - Number(amount || 0)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</span>
                      <span className="font-black text-xs uppercase tracking-widest text-indigo-500">{method || "Unselected"}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-slate-400 text-[10px] font-bold leading-relaxed italic">
                    * Final settlement will be recorded against Invoice Reference {orderSearch || "N/A"}. Please ensure instrument authentication is complete before confirming.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 mb-6">
                    <FaWallet className="text-4xl" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 italic max-w-[200px]">Select an order reference to visualize the settlement balance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}