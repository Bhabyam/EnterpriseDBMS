import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileInvoice, FaDownload, FaArrowLeft, FaCreditCard, FaUndo, FaCheckCircle, FaClock, FaTimesCircle, FaBox, FaUser, FaCalendarAlt } from "react-icons/fa";

const statusConfig = {
  Delivered: { color: "emerald", icon: FaCheckCircle, label: "Delivered" },
  Confirmed: { color: "blue", icon: FaCheckCircle, label: "Confirmed" },
  Pending: { color: "amber", icon: FaClock, label: "Pending" },
  Cancelled: { color: "rose", icon: FaTimesCircle, label: "Cancelled" },
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    API.get(`/api/orders/${id}`)
      .then(res => {
        setItems(res.data.data.items);
        setSummary(res.data.data.summary);
      })
      .catch(console.error);
  }, [id]);

  const downloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("SALES INVOICE", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice Reference: ${summary.invoice_number}`, 14, 32);
    doc.text(`Issued On: ${new Date(summary.date).toLocaleDateString()}`, 14, 37);

    // Customer Details
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("BILL TO:", 14, 50);
    doc.setFontSize(10);
    doc.text(summary.customer_name || "Direct Customer", 14, 56);
    doc.text(`Email: ${summary.customer_email || "N/A"}`, 14, 61);
    doc.text(`Phone: ${summary.customer_phone || "N/A"}`, 14, 66);
    doc.text(`Address: ${summary.customer_address || "N/A"}`, 14, 71);
    
    autoTable(doc, {
      startY: 80,
      head: [["Item", "Quantity", "Price", "Discount", "Total"]],
      body: items.map(i => [i.name, i.quantity, `Rs. ${i.price}`, `${i.discount}%`, `Rs. ${i.sub_total}`]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Amount: Rs. ${Number(summary.total_amount).toLocaleString()}`, 140, finalY);
    doc.setTextColor(16, 185, 129);
    doc.text(`Amount Paid: Rs. ${Number(summary.paid).toLocaleString()}`, 140, finalY + 6);
    doc.setTextColor(225, 29, 72);
    doc.text(`Balance Due: Rs. ${Number(summary.remaining).toLocaleString()}`, 140, finalY + 12);

    doc.save(`invoice_${summary.invoice_number}.pdf`);
  };

  if (!summary) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const status = statusConfig[summary.status] || statusConfig.Pending;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto animate-fade-in pb-20">
        {/* TOP NAV */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-8 transition-colors group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to History
        </button>

        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          
          {/* HEADER SECTION */}
          <div className="p-10 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                  <FaFileInvoice className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">{summary.invoice_number}</h1>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Digital Sales Ledger</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-${status.color}-50 dark:bg-${status.color}-900/20 border border-${status.color}-100 dark:border-${status.color}-900/30 text-${status.color}-600 dark:text-${status.color}-400`}>
                <status.icon className="text-sm" />
                <span className="text-xs font-black uppercase tracking-widest">{status.label}</span>
              </div>
            </div>
          </div>

          <div className="p-10">
            {/* METADATA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer Type</label>
                <div className="flex items-center gap-3 text-slate-700 dark:text-white font-bold">
                  <FaUser className="text-indigo-500 text-xs" /> {summary.customer_name}
                  <span className="text-[10px] text-slate-400">({summary.customer_type || "Standard Buyer"})</span>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order Date</label>
                <div className="flex items-center gap-3 text-slate-700 dark:text-white font-bold">
                  <FaCalendarAlt className="text-indigo-500 text-xs" /> {new Date(summary.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Purchase Branch</label>
                <div className="flex items-center gap-3 text-slate-700 dark:text-white font-bold">
                  <FaBox className="text-indigo-500 text-xs" /> {summary.branch_name || "Main Terminal"}
                </div>
              </div>
            </div>

            {/* PRODUCT TABLE */}
            <div className="rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden mb-12">
              <table className="w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {items.map((i, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all">
                      <td className="px-6 py-5 font-bold text-slate-800 dark:text-white text-xs">{i.name}</td>
                      <td className="px-6 py-5 text-center font-black text-slate-600 dark:text-slate-400 text-xs">{i.quantity}</td>
                      <td className="px-6 py-5 text-right font-bold text-slate-600 dark:text-slate-400 text-xs">₹{Number(i.price).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-5 text-right text-xs font-black text-emerald-500">{i.discount}%</td>
                      <td className="px-6 py-5 text-right font-black text-slate-800 dark:text-white text-xs">₹{Number(i.sub_total).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="flex flex-col md:flex-row justify-between gap-12 items-end">
              <div className="flex flex-wrap gap-4">
                {((summary.status === "Confirmed" || summary.status === "Pending") && (role !== "Admin" && role !== "Manager")) && (
                  <button onClick={() => navigate(`/add_payment?order_id=${id}`)} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/30 transition-all active:scale-95">
                    <FaCreditCard /> Add Payment
                  </button>
                )}
                {summary.status === "Delivered" && !summary.is_returned && (
                  <button onClick={() => navigate(`/returns?order_id=${id}`)} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-amber-500/30 transition-all active:scale-95">
                    <FaUndo /> Return Items
                  </button>
                )}
                <button onClick={downloadInvoice} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95">
                  <FaDownload /> Download Invoice
                </button>
              </div>

              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between items-center py-2 text-slate-400 font-bold text-xs">
                  <span>Total Amount</span>
                  <span className="text-slate-600 dark:text-slate-300 italic">₹{Number(summary.total_amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-emerald-500 font-black text-xs">
                  <span>Amount Paid</span>
                  <span>- ₹{Number(summary.paid).toLocaleString("en-IN")}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-700/50" />
                <div className="flex justify-between items-center py-4 text-slate-800 dark:text-white font-black text-lg">
                  <span>Balance Due</span>
                  <span className="text-rose-500">₹{Number(summary.remaining).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}