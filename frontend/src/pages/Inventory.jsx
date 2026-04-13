import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";

export default function Inventory() {

  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [stock, setStock] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  const [sortKey, setSortKey] = useState("product_id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/inventory/")
      .then(res => setStock(res.data?.data || []))
      .catch(console.error);
  }, []);

  // 🔹 DERIVE BRANCHES FROM DATA
  const branches = useMemo(() => {
    const unique = new Set(stock.map(p => p.branch_name));
    return ["All Branches", ...unique];
  }, [stock]);

  // 🔍 FILTER + SEARCH
    const filteredStock = useMemo(() => {

      let data = [...stock];

      // 🔽 LOW STOCK FILTER (APPLY FIRST)
      if (filter === "low") {
        data = data.filter(p => p.quantity < 10);
      }

      // 🔍 SEARCH
      if (search) {
        const term = search.toLowerCase();

        data = data.filter(p =>
          p.product_name.toLowerCase().includes(term) ||
          p.brand_name.toLowerCase().includes(term) ||
          p.category_name.toLowerCase().includes(term) ||
          (isAdmin && p.branch_name.toLowerCase().includes(term))
        );
      }

      // 🏢 BRANCH FILTER
      if (selectedBranch !== "All Branches") {
        data = data.filter(p => p.branch_name === selectedBranch);
      }

      return data;

    }, [stock, search, filter, selectedBranch]);

  // 🔄 SORT
  const sortedStock = useMemo(() => {

    let data = [...filteredStock];

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["price", "quantity", "product_id"].includes(sortKey)) {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;

  }, [filteredStock, sortKey, sortOrder]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(sortedStock.length / rowsPerPage);

  const paginatedStock = sortedStock.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // 🔄 SORT HANDLER
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getArrow = (key) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const isActive = (key) =>
    sortKey === key ? "text-blue-300 font-semibold" : "";

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-4">
        Stock Monitor ({sortedStock.length})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        {/* SEARCH */}
        <input
          type="text"
          placeholder={
            isAdmin
              ? "Search product / brand / category / branch"
              : "Search product / brand / category"
          }
          className="p-2 border rounded w-[300px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* BRANCH FILTER */}
        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* STOCK FILTER */}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          <option value="all">All Products</option>
          <option value="low">Low Stock (&lt;10)</option>
        </select>

        {/* ROWS */}
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full text-sm text-center">

            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="py-3">ID</th>
                <th className="py-3">Branch</th>
                <th className="py-3">Name</th>
                <th className="py-3">Brand</th>
                <th className="py-3">Category</th>
                <th className="py-3">Price</th>
                <th className="py-3">Qty</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStock.map((p) => (
                <tr
                  key={`${p.product_id}-${p.branch_name}`}
                  className={`border-b hover:bg-gray-100 ${
                    Number(p.quantity) < 10 ? "bg-red-100" : ""
                  }`}
                >

                  <td className="py-2 text-blue-600">{p.product_id}</td>
                  <td className="py-2">{p.branch_name}</td>
                  <td className="py-2">{p.product_name}</td>
                  <td className="py-2">{p.brand_name}</td>
                  <td className="py-2">{p.category_name}</td>
                  <td className="py-2">₹{p.price}</td>
                  <td className="py-2 font-semibold">{p.quantity}</td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">

        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Prev
        </button>

        <div className="flex gap-2">
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentPage(p => Math.min(p + 1, totalPages))
          }
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next
        </button>

      </div>

    </DashboardLayout>
  );
}