import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { FaSync, FaCheckCircle, FaClock, FaTimesCircle, FaTimes, FaDownload, FaFilter, FaFileInvoiceDollar, FaChevronLeft, FaChevronRight, FaPrint, FaTruckLoading, FaUndo } from "react-icons/fa";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";

const statusConfig = {
  Pending: { color: "amber", icon: FaClock, label: "Pending" },
  Delivered: { color: "emerald", icon: FaCheckCircle, label: "Delivered" },
  Cancelled: { color: "rose", icon: FaTimesCircle, label: "Cancelled" },
};

export default function PurchasePaymentPage() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const [statusTab, setStatusTab] = useState("Pending");
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const loadHistory = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get("/api/purchase-orders/", { headers }).then(r => setOrders(r.data?.data ?? [])),
      axios.get("/api/purchase-orders/details", { headers }).then(r => setDetails(r.data?.data ?? [])),
      axios.get("/api/purchase-orders/payments", { headers }).then(r => setPayments(r.data?.data ?? [])),
    ]).catch(() => setError("Failed to synchronize with server")).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => setCurrentPage(1), [statusTab]);

  const printInvoice = (order) => {
    const poItems = details.filter(d => String(d.po_id) === String(order.po_id));
    const poPayments = payments.filter(p => String(p.po_id) === String(order.po_id));
    const win = window.open("", "_blank", "width=800,height=900");
    win.document.write(`
      <html><head><title>Invoice — PO #${order.po_id}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        h1 { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .meta { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 5px; }
        .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
        .info-box { padding: 20px; background: #f8fafc; rounded: 12px; }
        .info-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 14px; font-weight: 700; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1e293b; color: #fff; padding: 12px 15px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 500; }
        .right { text-align: right; }
        .footer { margin-top: 40px; text-align: right; border-top: 2px solid #1e293b; padding-top: 20px; }
        .total-label { font-size: 12px; font-weight: 900; color: #64748b; text-transform: uppercase; }
        .total-value { font-size: 24px; font-weight: 900; color: #1e293b; }
      </style></head><body>
      <div class="header">
        <div>
          <h1>Purchase Invoice</h1>
          <div class="meta">Order ID: PO-${order.po_id} &nbsp; | &nbsp; ${new Date(order.order_date).toLocaleDateString("en-IN")}</div>
        </div>
        <div style="text-align: right">
          <div style="font-weight: 900; font-size: 18px">ENTERPRISE DBMS</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 700">SUPPLY CHAIN SOLUTIONS</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Source Supplier</div>
          <div class="info-value">${order.supplier_name}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Intake Branch</div>
          <div class="info-value">${order.branch_name}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Item Specification</th><th class="right">Qty</th><th class="right">Unit Cost</th><th class="right">Subtotal</th></tr></thead>
        <tbody>
          ${poItems.map(i => `<tr><td>${i.product_name}</td><td class="right">${i.quantity}</td><td class="right">₹${Number(i.cost_price).toLocaleString()}</td><td class="right">₹${Number(i.quantity * i.cost_price).toLocaleString()}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="footer">
        <div class="total-label">Grand Total Commitment</div>
        <div class="total-value">₹${Number(order.total_amount).toLocaleString()}</div>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  const filtered = useMemo(() => orders.filter(o => o.status === statusTab), [orders, statusTab]);
  const stats = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === "Pending").length;
    const totalPending = orders.filter(o => o.status === "Pending").reduce((s, o) => s + Number(o.total_amount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    return { pendingCount, totalPending, totalPaid, totalOrders: orders.length };
  }, [orders, payments]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const cancelOrder = async (poId) => {
    if (!window.confirm(`Cancel PO #${poId}? This action is irreversible.`)) return;
    setCancellingId(poId);
    try {
      await axios.post(`/api/purchase-orders/${poId}/cancel`, {}, { headers });
      loadHistory();
      if (selectedOrder?.po_id === poId) setSelectedOrder(null);
    } catch (err) { setError("Failed to cancel order"); }
    finally { setCancellingId(null); }
  };

  const thClass = "px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest";

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Procurement Payments</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Financial settlement & invoice control</p>
          </div>
          <button onClick={loadHistory} disabled={loading} className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-3">
            <FaSync className={loading ? "animate-spin" : ""} /> {loading ? "Syncing..." : "Sync Ledger"}
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Active POs" value={stats.totalOrders} icon={FaFileInvoiceDollar} color="indigo" />
          <MetricCard title="Pending Review" value={stats.pendingCount} icon={FaClock} color="amber" />
          <MetricCard title="Accrued Liabilities" value={`₹${stats.totalPending.toLocaleString("en-IN")}`} color="rose" />
          <MetricCard title="Total Disbursed" value={`₹${stats.totalPaid.toLocaleString("en-IN")}`} icon={FaCheckCircle} color="emerald" />
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {Object.entries(statusConfig).map(([key, config]) => {
            const active = statusTab === key;
            const Icon = config.icon;
            const count = orders.filter(o => o.status === key).length;
            return (
              <button key={key} onClick={() => setStatusTab(key)} className={`flex items-center gap-3 px-6 py-4 rounded-3xl border transition-all min-w-[180px] ${active ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                <Icon className={active ? "text-white" : `text-${config.color}-500`} />
                <span className="font-black text-xs uppercase tracking-widest">{key}</span>
                <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* TABLE */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className={thClass}>ID Ref</th>
                  <th className={thClass}>Supplier Entity</th>
                  <th className={thClass}>Intake Branch</th>
                  <th className={thClass}>Order Date</th>
                  <th className={thClass}>Financial Commitment</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginated.length === 0 ? (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">No {statusTab} orders found in registry</td></tr>
                ) : paginated.map((o) => {
                  const config = statusConfig[o.status];
                  const Icon = config.icon;
                  return (
                    <tr key={o.po_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all">
                      <td className="px-6 py-5 font-black text-xs text-indigo-500">#{o.po_id}</td>
                      <td className="px-6 py-5 font-bold text-slate-800 dark:text-white uppercase text-xs tracking-tight">{o.supplier_name}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{o.branch_name}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(o.order_date).toLocaleDateString()}</td>
                      <td className="px-6 py-5 font-black text-slate-800 dark:text-white">₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          o.status === "Delivered" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          o.status === "Pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                          "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                        }`}>
                          <Icon className="text-[8px]" /> {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => setSelectedOrder(o)} className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">Audit</button>
                          {o.status === "Pending" && (
                            <button disabled={cancellingId === o.po_id} onClick={() => cancelOrder(o.po_id)} className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-30">{cancellingId === o.po_id ? "..." : "Cancel"}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Monitoring {filtered.length} total procurement records</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm"><FaChevronLeft /></button>
            <div className="flex gap-1">{[...Array(totalPages)].map((_, i) => <button key={i} onClick={() => setCurrentPage(i+1)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${currentPage === i+1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50"}`}>{i+1}</button>)}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm"><FaChevronRight /></button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-3xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Audit: PO-#{selectedOrder.po_id}</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">{selectedOrder.supplier_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => printInvoice(selectedOrder)} className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"><FaPrint /> Invoice</button>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20"><FaTimes /></button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Branch Intake</p>
                  <p className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{selectedOrder.branch_name}</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Date</p>
                  <p className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Order Itemization</p>
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest">Product</th>
                        <th className="px-4 py-3 text-center font-black text-slate-400 uppercase tracking-widest">Qty</th>
                        <th className="px-4 py-3 text-right font-black text-slate-400 uppercase tracking-widest">Cost</th>
                        <th className="px-4 py-3 text-right font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {details.filter(d => String(d.po_id) === String(selectedOrder.po_id)).map((d, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{d.product_name}</td>
                          <td className="px-4 py-3 text-center font-black text-slate-800 dark:text-white">{d.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-500">₹{Number(d.cost_price).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">₹{Number(d.quantity * d.cost_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50 dark:bg-slate-900/80">
                      <tr>
                        <td colSpan="3" className="px-4 py-4 text-right font-black text-slate-400 uppercase tracking-widest">Total Commitment</td>
                        <td className="px-4 py-4 text-right font-black text-indigo-500 text-sm">₹{Number(selectedOrder.total_amount).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.status === "Pending" && (
                <button onClick={() => navigate("/purchase-payment/add", { state: { order: selectedOrder, items: details.filter(d => String(d.po_id) === String(selectedOrder.po_id)) }})} className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"><FaFileInvoiceDollar /> Initiate Payment Settlement</button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
