import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

/* =========================
   🔹 KPI CARD (UPGRADED)
========================= */
function Card({ title, value, color }) {
  return (
    <div className={`p-4 rounded-xl shadow text-white ${color}`}>
      <p className="text-sm opacity-80">{title}</p>
      <h2 className="text-xl font-bold">
        {title.includes("Revenue")
          ? `Rs. ${Number(value || 0).toLocaleString()}`
          : value}
      </h2>
    </div>
  );
}

/* =========================
   🔹 TOOLTIP
========================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i}>
            {p.name}: {Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ManagerDashboard() {

  const [summary, setSummary] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [insights, setInsights] = useState([]);

  const [period, setPeriod] = useState("week");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branch_id = user?.branch_id;

  /* =========================
     🔹 FETCH DATA
  ========================= */
  const fetchData = async () => {

    try {
      const params = { branch_id, period };

      const [
        summaryRes,
        revenueRes,
        ordersRes,
        inventoryRes,
        insightsRes
      ] = await Promise.all([
        API.get("/api/dashboard/summary", { params }),
        API.get("/api/dashboard/revenue_trend", { params }),
        API.get("/api/dashboard/orders_vs_purchase", { params }),
        API.get("/api/inventory/", { params }),
        API.get("/api/dashboard/insights", { params })
      ]);

      const summaryData = summaryRes.data.data || {};
      setSummary(summaryData);

      setRevenueData(
        (revenueRes.data.data || []).map(d => ({
          date: d.date,
          revenue: Number(d.revenue || 0)
        }))
      );

      setOrdersData(
        (ordersRes.data.data || []).map(d => ({
          date: d.date,
          orders: Number(d.orders || 0)
        }))
      );

      const low = (inventoryRes.data.data || []).filter(i => i.quantity < 10);
      setLowStock(low);

      setInsights(insightsRes.data.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (branch_id) fetchData();
  }, [period, branch_id]);

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>

      {/* FILTER */}
      <div className="flex gap-3 mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2 border rounded bg-white"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* 🔥 KPI CARDS (UPGRADED) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Total Orders" value={summary.orders} color="bg-blue-500" />
        <Card title="Revenue" value={summary.revenue} color="bg-green-500" />
        <Card title="Pending Orders" value={insights[0]?.split(" ")[0] || 0} color="bg-yellow-500" />
        <Card title="Low Stock Items" value={lowStock.length} color="bg-red-500" />
      </div>

      {/* 🔥 GRAPHS (IMPROVED) */}
      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ordersData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#16a34a"
                fillOpacity={1}
                fill="url(#colorOrders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔥 ALERTS SECTION */}
      <div className="grid grid-cols-2 gap-6">

        {/* LOW STOCK */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold text-red-600">Low Stock Alerts</h3>
          {lowStock.length === 0 ? (
            <p>No low stock items 🎉</p>
          ) : (
            lowStock.slice(0, 5).map((item, i) => (
              <p key={i} className="text-sm">
                ⚠ {item.product_name} — {item.quantity}
              </p>
            ))
          )}
        </div>

        {/* INSIGHTS */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Insights</h3>
          {insights.map((i, idx) => (
            <p key={idx} className="text-sm">• {i}</p>
          ))}
        </div>

      </div>

    </DashboardLayout>
  );
}