import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MetricCard from "../../components/dashboard/MetricCard";
import API from "../../services/api";
import { FaUndo, FaBoxOpen, FaHandHoldingHeart, FaCalendarAlt, FaSync, FaChartBar, FaLifeRing } from "react-icons/fa";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function SupportDashboard() {
  const [summary, setSummary] = useState({ total_returns: 0, total_items: 0, total_refund: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [returnsTrend, setReturnsTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branch_id = user?.branch_id;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { branch_id, period };
      const [sumRes, revRes, retTrendRes] = await Promise.all([
        API.get("/api/dashboard/support_summary", { params }),
        API.get("/api/dashboard/revenue_trend", { params }),
        API.get("/api/dashboard/returns_trend", { params })
      ]);

      setSummary(sumRes.data.data || {});
      setRevenueData((revRes.data.data || []).map(d => ({ date: d.date, revenue: Number(d.revenue || 0) })));
      setReturnsTrend((retTrendRes.data.data || []).map(d => ({ date: d.date, value: Number(d.value || 0) })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (branch_id) fetchData(); }, [period, branch_id]);

  const isDark = document.documentElement.classList.contains("dark");

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10">
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name}: {p.name.includes("Amount") || p.name.includes("Refund") ? `₹${Number(p.value).toLocaleString()}` : p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-500/30">
              <FaLifeRing className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Support Desk</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Returns & Claims Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-[1.5rem] backdrop-blur-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <button onClick={fetchData} className="px-5 py-3 rounded-xl bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-all flex items-center gap-2">
              <FaSync className={loading ? "animate-spin" : ""} /> Sync
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div className="relative group">
              <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-xs" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <MetricCard title="Total Claims" value={summary.total_returns} icon={FaUndo} color="rose" />
              <MetricCard title="Units Processed" value={summary.total_items} icon={FaBoxOpen} color="indigo" />
              <MetricCard title="Capital Reimbursed" value={`₹${Number(summary.total_refund).toLocaleString()}`} icon={FaHandHoldingHeart} color="violet" />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ChartContainer title="Return Frequency" subtitle="Claim volume trend">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={returnsTrend}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" name="Returns" stroke="#f43f5e" strokeWidth={3} fill="url(#retGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Reimbursement Velocity" subtitle="Refund capital trend">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Refunds" stroke="#8b5cf6" strokeWidth={3} fill="url(#refGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ChartContainer({ title, subtitle, children }) {
  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-fade-in">
      <div className="mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}