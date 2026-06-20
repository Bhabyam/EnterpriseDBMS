import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MetricCard from "../../components/dashboard/MetricCard";
import API from "../../services/api";
import { FaChartLine, FaShoppingBag, FaUndo, FaWallet, FaBuilding, FaCalendarAlt } from "react-icons/fa";
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [insights, setInsights] = useState([]);
  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState("All");
  const [period, setPeriod] = useState("week");

  const fetchData = async () => {
    let params = { period };
    if (branch !== "All") params.branch_id = branch;

    try {
      const [
        summaryRes,
        revenueRes,
        ordersRes,
        paymentsRes,
        sessionsRes,
        suppliersRes,
        insightsRes,
        branchesRes
      ] = await Promise.all([
        API.get("/api/dashboard/summary", { params }),
        API.get("/api/dashboard/revenue_trend", { params }),
        API.get("/api/dashboard/orders_vs_purchase", { params }),
        API.get("/api/dashboard/payments_trend", { params }),
        API.get("/api/dashboard/sessions", { params }),
        API.get("/api/dashboard/top_suppliers", { params }),
        API.get("/api/dashboard/insights", { params }),
        API.get("/api/dashboard/branches")
      ]);

      setSummary(summaryRes.data.data || {});
      setRevenueData((revenueRes.data.data || []).map(d => ({ date: d.date || d[0], revenue: Number(d.revenue || d[1] || 0) })));
      setProfitData((paymentsRes.data.data || []).map(d => ({ date: d.date || d[0], profit: Math.max(Number(d.customer || d[1] || 0) - Number(d.supplier || d[2] || 0), 0) })));
      setOrdersData((ordersRes.data.data || []).map(d => ({ date: d.date || d[0], orders: Number(d.orders || d[1] || 0), purchases: Number(d.purchases || d[2] || 0) })));
      setSessions((sessionsRes.data.data || []).map(d => ({ date: d.date || d[0], sessions: Number(d.sessions || d[1] || 0) })));
      setSuppliers(suppliersRes.data.data || []);
      setInsights(insightsRes.data.data || []);
      setBranches(branchesRes.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [branch, period]);

  const isDark = document.documentElement.classList.contains("dark");

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10">
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name}: ₹{Number(p.value).toLocaleString()}</span>
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
        {/* HEADER & FILTERS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Admin Console</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Global operations & analytics</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-[1.5rem] backdrop-blur-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="relative group">
              <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-xs" />
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="All">All Branches</option>
                {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
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

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <MetricCard title="Gross Orders" value={summary.orders || 0} growth={summary.growth?.orders} icon={FaShoppingBag} color="indigo" />
          <MetricCard title="Total Revenue" value={`₹${Number(summary.revenue || 0).toLocaleString()}`} growth={summary.growth?.revenue} icon={FaChartLine} color="emerald" />
          <MetricCard title="Processed Returns" value={summary.returns || 0} icon={FaUndo} color="rose" />
          <MetricCard title="Net Liquidity" value={`₹${Number(summary.net_revenue || 0).toLocaleString()}`} icon={FaWallet} color="amber" />
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChartContainer title="Revenue Performance" subtitle="Gross income vs targets">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Profit Realization" subtitle="Net margins after expenditure">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={profitData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* CHARTS ROW 2 & INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChartContainer title="Order Dynamics" subtitle="Sales vs Procurement volume">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ordersData}>
                  <defs>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="procGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="orders" name="Sales" stroke="#6366f1" strokeWidth={3} fill="url(#ordersGrad)" />
                  <Area type="monotone" dataKey="purchases" name="Procurement" stroke="#f59e0b" strokeWidth={3} fill="url(#procGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="space-y-8">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none h-full">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Strategic Insights</h3>
              <div className="space-y-4">
                {insights.length > 0 ? insights.map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">"{insight}"</p>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic">Calculating AI insights based on current trends...</p>
                )}
              </div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-10 mb-6">Top Suppliers</h3>
              <div className="space-y-3">
                {suppliers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.supplier_name}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">{s.count} Orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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