import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OrdersChart({ data = [] }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Orders Trend</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="orders" stroke="#2563eb" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}