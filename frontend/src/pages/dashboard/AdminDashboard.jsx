import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import {
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

/* 🔹 KPI CARD WITH GROWTH */
function Card({ title, value, growth }) {
  const color =
    growth > 0 ? "text-green-600" :
    growth < 0 ? "text-red-600" :
    "text-gray-500";

  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>

      {growth !== undefined && (
        <p className={`text-sm mt-1 ${color}`}>
          {growth > 0 ? "+" : ""}{growth}%
        </p>
      )}
    </div>
  );
}

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

  /* 🔹 PARAMS */
  const getParams = () => {
    let params = { period };
    if (branch !== "All") params.branch_id = branch;
    return params;
  };

  /* 🔹 FETCH DATA */
  const fetchData = async () => {
    const params = getParams();

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

      /* SUMMARY */
      setSummary(summaryRes.data.data);

      /* REVENUE */
      setRevenueData(
        (revenueRes.data.data || []).map(d => ({
          date: d.date || d[0],
          revenue: Number(d.revenue || d[1] || 0)
        }))
      );

      /* PROFIT */
      setProfitData(
        (paymentsRes.data.data || []).map(d => ({
          date: d.date || d[0],
          profit: Math.max(
            Number(d.customer || d[1] || 0) -
            Number(d.supplier || d[2] || 0),
            0
          )
        }))
      );

      /* ORDERS */
      setOrdersData(
        (ordersRes.data.data || []).map(d => ({
          date: d.date || d[0],
          orders: Number(d.orders || d[1] || 0),
          purchases: Number(d.purchases || d[2] || 0)
        }))
      );

      /* SESSIONS */
      setSessions(
        (sessionsRes.data.data || []).map(d => ({
          date: d.date || d[0],
          sessions: Number(d.sessions || d[1] || 0)
        }))
      );

      setSuppliers(suppliersRes.data.data || []);
      setInsights(insightsRes.data.data || []);
      setBranches(branchesRes.data.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  /* 🔹 DEBOUNCE */
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeout);
  }, [branch, period]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-gray-700">
              {p.name}: {Number(p.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* 🔹 FILTERS */}
      <div className="flex gap-3 mb-6">

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="p-2 border rounded bg-white text-black"
        >
          <option value="All">All</option>
          {branches.map(b => (
            <option key={b.branch_id} value={b.branch_id}>
              {b.branch_name}
            </option>
          ))}
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2 border rounded bg-white text-black"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>

      </div>

      {/* 🔹 KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <Card
          title="Total Orders"
          value={summary.orders || 0}
          growth={summary.growth?.orders}
        />

        <Card
          title="Revenue"
          value={`Rs. ${Number(summary.revenue || 0).toLocaleString()}`}
          growth={summary.growth?.revenue}
        />

        <Card
          title="Returns"
          value={summary.returns || 0}
        />

        <Card
          title="Net Revenue"
          value={`Rs. ${Number(summary.net_revenue || 0).toLocaleString()}`}
        />

      </div>

      {/* 🔹 ROW 1 */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fill="url(#revGradient)"
                strokeWidth={2}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={profitData}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="profit"
                stroke="#16a34a"
                fill="url(#profitGradient)"
                strokeWidth={2}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔹 ROW 2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">Orders vs Purchases</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ordersData}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>

                <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="orders"
                stroke="#2563eb"
                fill="url(#ordersGradient)"
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="purchases"
                stroke="#f59e0b"
                fill="url(#purchaseGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">User Sessions</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={sessions}>
              <defs>
                <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#8b5cf6"
                fill="url(#sessionGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔹 ROW 3 */}
      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">Top Suppliers</h3>
          {suppliers.map((s, i) => (
            <p key={i}>
              {s.supplier_name} — {s.count} orders
            </p>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2 font-semibold">Insights</h3>
          {insights.map((i, idx) => (
            <p key={idx}>• {i}</p>
          ))}
        </div>

      </div>

    </DashboardLayout>
  );
}