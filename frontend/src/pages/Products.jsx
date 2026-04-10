import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // 🔥 Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/api/products/");
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 🔍 Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 📦 Group products by category
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

    return Object.entries(map);
  }, [products, search]);

  const selectedItems =
    selected ? grouped.find(([c]) => c === selected)?.[1] || [] : [];

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search products/brands/categories"
        className="w-full p-3 border rounded-lg mb-6"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Categories */}
          <div className="space-y-2">
            {grouped.map(([category, items]) => (
              <div
                key={category}
                onClick={() => setSelected(category)}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selected === category
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {category} ({items.length})
              </div>
            ))}
          </div>

          {/* Product List */}
          <div className="md:col-span-2">
            {selected ? (
              <div className="bg-white p-4 rounded-lg border">
                <h2 className="font-semibold mb-4">{selected}</h2>

                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left">ID</th>
                      <th className="text-left">Name</th>
                      <th>Brand</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((p) => (
                      <tr key={p.product_id} className="border-b">
                        <td>{p.product_id}</td>
                        <td>{p.name}</td>
                        <td>{p.brand_name}</td>
                        <td>₹{p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                Select a category to view products
              </p>
            )}
          </div>

        </div>
      )}

    </DashboardLayout>
  );
}