import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { FaBox, FaSearch, FaTags, FaLayerGroup, FaChevronRight, FaInfoCircle } from "react-icons/fa";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/api/products/");
        const data = res.data.data || [];
        setProducts(data);
        if (data.length > 0) {
          const firstCat = data[0].category_name || "Other";
          setSelected(firstCat);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const grouped = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = products.filter((p) =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.category_name || "").toLowerCase().includes(term) ||
      (p.brand_name || "").toLowerCase().includes(term)
    );

    const map = {};
    for (const p of filtered) {
      const cat = p.category_name || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [products, search]);

  const selectedItems = selected ? grouped.find(([c]) => c === selected)?.[1] || [] : [];

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Product Catalog</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Global inventory & SKU directory</p>
          </div>
          <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
            {products.length} Registered Products
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative group mb-10">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-lg" />
          <input
            type="text"
            placeholder="Search across products, brands, or categories..."
            className="w-full pl-16 pr-6 py-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-lg text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-2xl shadow-slate-200/50 dark:shadow-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* CATEGORIES SIDEBAR */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center gap-2 mb-6 ml-2">
                <FaLayerGroup className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categories</h3>
              </div>
              <div className="space-y-2">
                {grouped.map(([category, items]) => (
                  <button
                    key={category}
                    onClick={() => setSelected(category)}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all group ${
                      selected === category
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 translate-x-2"
                        : "bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50"
                    }`}
                  >
                    <span className="font-bold text-sm tracking-tight">{category}</span>
                    <div className={`flex items-center gap-2 ${selected === category ? "text-white/60" : "text-slate-300"}`}>
                      <span className="text-[10px] font-black">{items.length}</span>
                      <FaChevronRight className="text-[8px]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="lg:col-span-3">
              {selected ? (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8 ml-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                        <FaTags />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">{selected}</h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{selectedItems.length} SKUs in this group</p>
                  </div>

                  <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">ID</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Label</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {selectedItems.map((p) => (
                          <tr key={p.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all group">
                            <td className="px-8 py-5 font-black text-xs text-indigo-500">#{p.product_id}</td>
                            <td className="px-8 py-5 font-bold text-slate-800 dark:text-white text-sm">{p.name}</td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                                {p.brand_name || "Unbranded"}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-slate-800 dark:text-white text-sm">₹{Number(p.price).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
                    <FaInfoCircle className="text-4xl" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 italic">Select a category from the sidebar to view catalog details</h3>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}