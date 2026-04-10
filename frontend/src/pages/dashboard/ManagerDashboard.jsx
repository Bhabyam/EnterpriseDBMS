import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

/* =========================
   🔹 KPI CARD
========================= */
function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
      <p className="text-gray-500 text-sm">{title}</p>
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

  const branch_id = localStorage.getItem("branch_id");

  /* =========================
     🔹 FETCH DATA
  ========================= */
  const fetchData = async () => {

    try {
      const params = {
        branch_id,
        period
      };

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

      setSummary(summaryRes.data.data);

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

      // 🔥 LOW STOCK FILTER (< 10)
      const low = (inventoryRes.data.data || []).filter(i => i.quantity < 10);
      setLowStock(low);

      setInsights(insightsRes.data.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

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

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Total Orders" value={summary.orders} />
        <Card title="Revenue" value={summary.revenue} />
        <Card title="Returns" value={summary.returns} />
        <Card title="Net Revenue" value={summary.net_revenue} />
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <XAxis dataKey="date"/>
              <YAxis/>
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="revenue" stroke="#2563eb" fill="#93c5fd" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ordersData}>
              <XAxis dataKey="date"/>
              <YAxis/>
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="orders" stroke="#16a34a" fill="#86efac" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* LOW STOCK + INSIGHTS */}
      <div className="grid grid-cols-2 gap-6">

        {/* LOW STOCK */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold text-red-600">Low Stock Alerts</h3>
          {lowStock.length === 0 ? (
            <p>No low stock items 🎉</p>
          ) : (
            lowStock.slice(0, 5).map((item, i) => (
              <p key={i}>
                {item.product_name} — {item.quantity}
              </p>
            ))
          )}
        </div>

        {/* INSIGHTS */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Insights</h3>
          {insights.map((i, idx) => (
            <p key={idx}>• {i}</p>
          ))}
        </div>

      </div>

    </DashboardLayout>
  );
}