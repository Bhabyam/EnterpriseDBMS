import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/dashboard/MetricCard";
import API from "../services/api";
import { FaChartBar, FaTag, FaLayerGroup, FaFilter, FaChevronLeft, FaChevronRight, FaFire, FaChartLine, FaBox, FaBuilding } from "react-icons/fa";

export default function SalesInsights() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [type, setType] = useState("all");

  const [sortKey, setSortKey] = useState("product");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          API.get("/api/categories/"),
          API.get("/api/brands/"),
        ]);
        setCategories(catRes.data?.data || []);
        setBrands(brandRes.data?.data || []);
      } catch (err) { console.error(err); }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/api/sales-products/", { params: { type, category_id: category, brand_id: brand } });
        setData(res.data?.data || []);
      } catch (err) { console.error(err); setData([]); }
    };
    fetchData();
  }, [category, brand, type]);

  const filteredBrands = useMemo(() => {
    if (category === "all") return brands;
    const categoryProducts = data.map((item) => item.brand);
    return brands.filter((b) => categoryProducts.includes(b.brand_name));
  }, [category, brands, data]);

  const stats = useMemo(() => {
    const totalSold = data.reduce((sum, item) => sum + Number(item.sold), 0);
    const topItem = [...data].sort((a, b) => b.sold - a.sold)[0]?.product || "None";
    return { totalSold, topItem, count: data.length };
  }, [data]);

  const sortedData = useMemo(() => {
    let rows = [...data];
    rows.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === "sold") { valA = Number(valA); valB = Number(valB); }
      else { valA = String(valA || "").toLowerCase(); valB = String(valB || "").toLowerCase(); }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder((prev) => prev === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("asc"); }
  };

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 1, 1);
    const end = Math.min(currentPage + 1, totalPages);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const thClass = "px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none";

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Sales Intelligence</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Product velocity & performance analytics</p>
          </div>
          <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
            Dataset: {stats.count} Active SKUs
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard title="Total Volume" value={stats.totalSold.toLocaleString()} icon={FaChartLine} color="indigo" />
          <MetricCard title="Top Velocity" value={stats.topItem} icon={FaFire} color="amber" />
          <MetricCard title="SKU Depth" value={stats.count} icon={FaBox} color="emerald" />
        </div>

        {/* FILTERS */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group min-w-[200px]">
              <FaLayerGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setBrand("all"); setCurrentPage(1); }}
                className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>

            <div className="relative flex-1 group min-w-[200px]">
              <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
              >
                <option value="all">All Brands</option>
                {filteredBrands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
              </select>
            </div>

            <div className="relative flex-1 group min-w-[200px]">
              <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value; setType(val); setCurrentPage(1);
                  if (val === "top") { setSortKey("sold"); setSortOrder("desc"); }
                  else if (val === "least") { setSortKey("sold"); setSortOrder("asc"); }
                  else { setSortKey("product"); setSortOrder("asc"); }
                }}
                className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
              >
                <option value="all">Standard View</option>
                <option value="top">High Velocity (Top Selling)</option>
                <option value="least">Low Velocity (Least Selling)</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-black text-xs text-slate-800 dark:text-white cursor-pointer shadow-sm"
              >
                <option value={10}>10 Rows</option>
                <option value={25}>25 Rows</option>
                <option value={50}>50 Rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                  <th className={thClass} onClick={() => handleSort("product")}>Product SPEC {sortKey === "product" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("category")}>Classification {sortKey === "category" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("brand")}>Label {sortKey === "brand" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className={thClass} onClick={() => handleSort("sold")}>Velocity (Units) {sortKey === "sold" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all duration-200">
                      <td className="px-6 py-5 text-[10px] font-black text-slate-300">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-6 py-5 font-bold text-slate-800 dark:text-white uppercase text-xs tracking-tight">{item.product}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{item.category}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{item.brand}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-sm ${item.sold > 10 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>{item.sold}</span>
                          <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${item.sold > 20 ? "bg-indigo-500" : item.sold > 5 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (item.sold / 50) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">No analytical data matches current filter criteria</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic italic">Synthesizing intelligence across {sortedData.length} SKUs</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm"><FaChevronLeft /></button>
            <div className="flex gap-1">{getPageNumbers().map(page => <button key={page} onClick={() => setCurrentPage(page)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50"}`}>{page}</button>)}</div>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm"><FaChevronRight /></button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}