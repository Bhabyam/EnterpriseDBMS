export default function MetricCard({ title, value, change, icon: Icon, color = "indigo" }) {
  const isPositive = change && !change.toString().startsWith("-");

  const colors = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30",
  };

  const selectedColor = colors[color] || colors.indigo;

  return (
    <div className="relative overflow-hidden p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:translate-y-[-2px] hover:shadow-2xl group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {title}
          </p>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {value}
          </h2>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${selectedColor} transition-transform group-hover:scale-110`}>
            <Icon className="text-xl" />
          </div>
        )}
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isPositive ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`}>
            {isPositive ? "+" : ""}{change}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">vs last month</span>
        </div>
      )}

      {/* Subtle background decoration */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${selectedColor.split(' ')[0]}`} />
    </div>
  );
}