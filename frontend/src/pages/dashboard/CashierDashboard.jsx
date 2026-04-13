import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

/* =========================
   🔹 CARD
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

export default function CashierDashboard() {

  const [summary, setSummary] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);

  const [period, setPeriod] = useState("month");

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
        ordersRes
      ] = await Promise.all([
        API.get("/api/dashboard/summary", { params }),
        API.get("/api/dashboard/revenue_trend", { params }),
        API.get("/api/dashboard/orders_vs_purchase", { params })
      ]);

      setSummary(summaryRes.data.data || {});

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

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (branch_id) fetchData();
  }, [period, branch_id]);

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-6">Cashier Dashboard</h1>

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

      {/* 🔥 KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <Card
          title="Total Orders"
          value={summary.orders}
          color="bg-blue-500"
        />

        <Card
          title="Total Revenue"
          value={summary.revenue}
          color="bg-green-500"
        />

        <Card
          title="Total Returns"
          value={summary.returns}
          color="bg-yellow-500"
        />

        <Card
          title="Net Revenue"
          value={summary.net_revenue}
          color="bg-purple-500"
        />

      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-2 gap-6">

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#93c5fd" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="orders" stroke="#16a34a" fill="#86efac" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

    </DashboardLayout>
  );
}