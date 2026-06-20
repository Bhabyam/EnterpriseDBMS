import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MetricCard from "../../components/dashboard/MetricCard";
import API from "../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { FaSync, FaBox, FaExclamationTriangle, FaTimesCircle, FaCheckCircle, FaWarehouse } from "react-icons/fa";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

export default function InventoryDashboard() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/inventory/");
      const data = res.data?.data || [];
      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const lowStock = stock.filter(r => Number(r.quantity) > 0 && Number(r.quantity) < 10);
  const outOfStock = stock.filter(r => Number(r.quantity) === 0);
  const healthy = stock.filter(r => Number(r.quantity) >= 10);
  const totalQty = stock.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  
  const topByQty = [...stock]
    .sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))
    .slice(0, 10)
    .map(r => ({ 
      name: (r.product_name || "Unknown").slice(0, 15), 
      qty: Number(r.quantity || 0) 
    }));

  const pieData = [
    { name: "Healthy", value: healthy.length, fill: "#10b981" },
    { name: "Low Stock", value: lowStock.length, fill: "#f59e0b" },
    { name: "Out of Stock", value: outOfStock.length, fill: "#ef4444" },
  ].filter(d => d.value > 0);

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-800 flex items-center justify-center text-white shadow-2xl shadow-slate-900/30">
              <FaWarehouse className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Inventory Control</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Real-time stock analytics</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-indigo-500 transition-all flex items-center gap-2 shadow-sm">
            <FaSync className={loading ? "animate-spin" : ""} /> Sync Registry
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <MetricCard title="Total SKUs" value={stock.length} icon={FaBox} color="indigo" />
              <MetricCard title="Gross Units" value={fmt(totalQty)} icon={FaCheckCircle} color="emerald" />
              <MetricCard title="Low Stock" value={lowStock.length} icon={FaExclamationTriangle} color="amber" />
              <MetricCard title="Critical Stock" value={outOfStock.length} icon={FaTimesCircle} color="rose" />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="mb-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock Distribution</h3>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1">Top 10 products by available volume</p>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topByQty}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                        cursor={{ fill: isDark ? "#1e293b" : "#f8fafc", opacity: 0.4 }}
                      />
                      <Bar dataKey="qty" name="Units" radius={[8, 8, 0, 0]}>
                        {topByQty.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.qty === 0 ? "#ef4444" : entry.qty < 10 ? "#f59e0b" : "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="mb-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Health</h3>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1">Status proportions</p>
                </div>
                <div className="h-[350px] w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {outOfStock.length > 0 && (
                <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 overflow-hidden shadow-2xl shadow-rose-200/20 dark:shadow-none">
                  <div className="bg-rose-50/50 dark:bg-rose-900/20 p-6 border-b border-rose-100 dark:border-rose-900/30 flex justify-between items-center">
                    <span className="font-black text-rose-600 text-xs uppercase tracking-[0.2em] flex items-center gap-2"><FaTimesCircle /> Depleted SKUs</span>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{outOfStock.length}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {outOfStock.slice(0, 5).map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all flex justify-between items-center group">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-600 transition-colors uppercase">{item.product_name}</span>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Immediate Intake Req.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lowStock.length > 0 && (
                <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-2xl shadow-amber-200/20 dark:shadow-none">
                  <div className="bg-amber-50/50 dark:bg-amber-900/20 p-6 border-b border-amber-100 dark:border-amber-900/30 flex justify-between items-center">
                    <span className="font-black text-amber-600 text-xs uppercase tracking-[0.2em] flex items-center gap-2"><FaExclamationTriangle /> Warning: Understocked</span>
                    <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{lowStock.length}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {lowStock.slice(0, 5).map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all flex justify-between items-center group">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 transition-colors uppercase">{item.product_name}</span>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{item.quantity} units remaining</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}