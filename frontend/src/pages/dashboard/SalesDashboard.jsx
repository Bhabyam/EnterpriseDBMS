import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MetricCard from "../../components/dashboard/MetricCard";
import API from "../../services/api";
import { FaChartLine, FaShoppingBag, FaUndo, FaWallet, FaBuilding, FaCalendarAlt, FaHandHoldingUsd } from "react-icons/fa";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function SalesDashboard() {
  const [summary, setSummary] = useState({ orders: 0, revenue: 0, returns: 0, net_revenue: 0 });
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
      const [summaryRes, revenueRes, returnsTrendRes] = await Promise.all([
        API.get("/api/dashboard/summary", { params }),
        API.get("/api/dashboard/revenue_trend", { params }),
        API.get("/api/dashboard/returns_trend", { params }).catch(() => ({ data: { data: [] } }))
      ]);

      setSummary(summaryRes.data.data || {});
      setRevenueData((revenueRes.data.data || []).map(d => ({ date: d.date, revenue: Number(d.revenue || 0) })));
      setReturnsTrend((returnsTrendRes.data.data || []).map(d => ({ date: d.date, value: Number(d.value || 0) })));
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branch_id) fetchData();
  }, [period, branch_id]);

  const isDark = document.documentElement.classList.contains("dark");

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10">
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name}: {p.name.includes("Revenue") ? `₹${Number(p.value).toLocaleString()}` : p.value}</span>
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
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
              <FaHandHoldingUsd className="text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Sales Performance</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Revenue & Market Velocity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-[1.5rem] backdrop-blur-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="px-5 py-3 rounded-xl bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <FaBuilding className="text-indigo-500" /> Branch #{branch_id}
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div className="relative group">
              <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-xs" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <MetricCard title="Total Sales" value={summary.orders} color="indigo" icon={FaShoppingBag} />
              <MetricCard title="Gross Revenue" value={`₹${Number(summary.revenue).toLocaleString()}`} color="emerald" icon={FaChartLine} />
              <MetricCard title="Total Returns" value={summary.returns} color="rose" icon={FaUndo} />
              <MetricCard title="Net Settlement" value={`₹${Number(summary.net_revenue).toLocaleString()}`} color="violet" icon={FaWallet} />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ChartContainer title="Revenue Trajectory" subtitle="Income velocity analysis">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Returns Trend" subtitle="Service quality analysis">
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