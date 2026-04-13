import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function ReturnHistory() {

  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  const [sortKey, setSortKey] = useState("return_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* =========================
     🔹 FETCH
  ========================= */
  useEffect(() => {
    const params = isAdmin ? {} : { branch_id: user.branch_id };

    API.get("/api/returns", { params })
      .then(res => setReturns(res.data.data || []))
      .catch(console.error);
  }, []);

  /* =========================
     🔹 BRANCHES
  ========================= */
  const branches = useMemo(() => {
    const unique = new Set(returns.map(r => r.branch_name));
    return ["All Branches", ...unique];
  }, [returns]);

  /* =========================
     🔍 FILTER + SORT
  ========================= */
  const filtered = useMemo(() => {

    let data = [...returns];

    data = data.filter(r => {
      const text = `${r.return_id} ${r.order_id} ${r.customer_name} ${r.reason}`
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesBranch =
        selectedBranch === "All Branches" ||
        r.branch_name === selectedBranch;

      return matchesSearch && matchesBranch;
    });

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["return_id", "order_id", "refund_amount"].includes(sortKey)) {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (sortKey === "return_date") {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;

  }, [returns, search, selectedBranch, sortKey, sortOrder]);

  /* =========================
     📄 PAGINATION
  ========================= */
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  /* =========================
     🔄 SORT
  ========================= */
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getArrow = (key) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  /* =========================
     🔹 VIEW MODAL (UNCHANGED)
  ========================= */
  const handleView = async (id) => {
    const res = await API.get(`/api/returns/${id}`);
    setSelectedReturn(res.data.data);
    setShowModal(true);
  };

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-4">
        Return History ({filtered.length})
      </h1>

      {/* CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        <input
          placeholder="Search return / order / customer"
          className="p-2 border rounded w-[300px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isAdmin && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="p-2 border rounded"
          >
            {branches.map((b, i) => (
              <option key={i}>{b}</option>
            ))}
          </select>
        )}

        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="p-2 border rounded"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <table className="w-full text-sm text-center table-fixed">

          <thead className="bg-gray-900 text-white">
            <tr className="h-12 text-sm">

              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("return_id")}>
                ID{getArrow("return_id")}
              </th>

              <th className="px-4 cursor-pointer" onClick={() => handleSort("order_id")}>
                Order{getArrow("order_id")}
              </th>

              <th className="px-4">Customer</th>

              {isAdmin && <th className="px-4">Branch</th>}

              <th className="px-4">Reason</th>

              <th className="px-4 cursor-pointer" onClick={() => handleSort("return_date")}>
                Date{getArrow("return_date")}
              </th>

              <th className="px-4 cursor-pointer" onClick={() => handleSort("refund_amount")}>
                Refund{getArrow("refund_amount")}
              </th>

              <th className="px-4">Actions</th>

            </tr>
          </thead>

          <tbody>
            {paginated.map(r => (
              <tr key={r.return_id} className="border-b hover:bg-gray-100">

                <td className="py-3 text-blue-600">{r.return_id}</td>
                <td className="py-3">{r.order_id}</td>
                <td className="py-3">{r.customer_name}</td>
                {isAdmin && <td className="py-3">{r.branch_name}</td>}
                <td className="py-3">{r.reason}</td>
                <td className="py-3">{new Date(r.return_date).toLocaleString()}</td>
                <td className="py-3">₹{r.refund_amount}</td>

                <td className="py-3 flex gap-2 justify-center">

                  <button
                    onClick={() => handleView(r.return_id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    View
                  </button>

                  <button
                    onClick={() => navigate(`/orders/${r.order_id}`)}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                  >
                    Order
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>

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
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next
        </button>

      </div>

      {/* 🔥 GLASS MODAL (TAILWIND ONLY) */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          {/* 🔹 BACKDROP */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* 🔹 MODAL BOX */}
          <div className="relative w-[650px] max-h-[80vh] overflow-y-auto 
                          rounded-2xl p-6 shadow-2xl
                          bg-white/50 backdrop-blur-10xl border border-white/30
                          animate-[scaleIn_0.2s_ease]">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold">
                Return ID: #{selectedReturn.summary.return_id}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:scale-105 transition"
              >
                ✕
              </button>
            </div>

            {/* SUMMARY */}
            <p className="mb-4 font-semibold">Order ID: {selectedReturn.summary.order_id}</p>
            <p className="mb-4 font-semibold">Reason: {selectedReturn.summary.reason}</p>
            <p className="mb-4 font-semibold">Date: {new Date(selectedReturn.summary.return_date).toLocaleString()}</p>
            <p className="mb-4 font-semibold">Total Refund: ₹{Number(selectedReturn.summary.total_refund).toLocaleString()}</p>

            {/* ITEMS TABLE */}
            <table className="w-full text-sm text-center">

              <thead className="bg-black/10">
                <tr>
                  <th className="py-2">Product</th>
                  <th>Qty</th>
                  <th>Condition</th>
                  <th>Refund</th>
                </tr>
              </thead>

              <tbody>
                {selectedReturn.items.map((i, idx) => (
                  <tr key={idx} className="border-b">

                    <td className="py-2">{i.product_name}</td>
                    <td>{i.quantity}</td>
                    <td>{i.item_condition}</td>
                    <td>₹{Number(i.refund_amount).toLocaleString()}</td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}