import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function OrdersChart({ data = [] }) {
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none h-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Orders Trend</h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Monthly performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed Orders</span>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? "#1e293b" : "#ffffff", 
                borderRadius: "16px", 
                border: "none",
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                padding: "12px"
              }}
              itemStyle={{ fontWeight: 900, fontSize: "12px" }}
              labelStyle={{ color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#6366f1" 
              strokeWidth={4} 
              dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: isDark ? "#1e293b" : "#fff" }}
              activeDot={{ r: 6, fill: "#4f46e5" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}