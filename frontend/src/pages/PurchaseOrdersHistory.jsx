import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const statusColors = {
  Delivered: "bg-green-500 text-white",
  Confirmed: "bg-blue-500 text-white",
  Pending: "bg-yellow-500 text-black",
  Cancelled: "bg-red-500 text-white",
};

export default function PurchaseOrders() {

  const role = localStorage.getItem("role");      // ✅ ADDED
  const isAdmin = role === "Admin";               // ✅ ADDED

  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [sortKey, setSortKey] = useState("po_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const navigate = useNavigate();

  // 🔹 FETCH
  useEffect(() => {
    API.get("/api/purchase_orders/")
      .then(res => setOrders(res.data?.data || []))
      .catch(console.error);
  }, []);

  // 🔹 BRANCH LIST
  const branches = useMemo(() => {
    const unique = new Set(orders.map(o => o.branch_name));
    return ["All Branches", ...unique];
  }, [orders]);

  const statuses = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

  // 🔍 FILTER + SORT
  const filtered = useMemo(() => {

    let data = [...orders];

    // SEARCH
    data = data.filter(o => {
      const text = `${o.po_id} ${o.supplier_name} ${o.branch_name}`
        .toLowerCase();
      return text.includes(search.toLowerCase());
    });

    // ✅ BRANCH FILTER ONLY FOR ADMIN
    if (isAdmin && selectedBranch !== "All Branches") {
      data = data.filter(o => o.branch_name === selectedBranch);
    }

    // STATUS FILTER
    if (selectedStatus !== "All") {
      data = data.filter(o => o.status === selectedStatus);
    }

    // SORT
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["po_id", "total_amount", "paid", "remaining"].includes(sortKey)) {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortKey === "order_date") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;

  }, [orders, search, selectedBranch, selectedStatus, sortKey, sortOrder, isAdmin]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
        Purchase Orders ({filtered.length})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        <input
          type="text"
          placeholder="Search supplier / branch"
          className="p-2 border rounded w-[300px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* ✅ ONLY ADMIN */}
        {isAdmin && (
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded"
          >
            {branches.map((b, i) => (
              <option key={i}>{b}</option>
            ))}
          </select>
        )}

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          {statuses.map((s, i) => (
            <option key={i}>{s}</option>
          ))}
        </select>

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

                <th className={`py-3 w-[6%] cursor-pointer ${isActive("po_id")}`} onClick={() => handleSort("po_id")}>
                  ID{getArrow("po_id")}
                </th>

                <th>Supplier</th>

                {/* ✅ ONLY ADMIN */}
                {isAdmin && <th>Branch</th>}

                <th className={`w-[18%] cursor-pointer ${isActive("order_date")}`} onClick={() => handleSort("order_date")}>
                  Date{getArrow("order_date")}
                </th>

                <th className={`w-[10%] cursor-pointer ${isActive("total_amount")}`} onClick={() => handleSort("total_amount")}>
                  Total{getArrow("total_amount")}
                </th>

                <th className={`w-[10%] cursor-pointer ${isActive("paid")}`} onClick={() => handleSort("paid")}>
                  Paid{getArrow("paid")}
                </th>

                <th className={`w-[10%] cursor-pointer ${isActive("remaining")}`} onClick={() => handleSort("remaining")}>
                  Remaining{getArrow("remaining")}
                </th>

                <th>Status</th>

              </tr>
            </thead>

            <tbody>
              {paginated.map(o => (
                <tr
                  key={o.po_id}
                  className="border-b hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/purchase_orders/${o.po_id}`)}
                >
                  <td className="py-2 text-blue-600">{o.po_id}</td>
                  <td>{o.supplier_name}</td>

                  {/* ✅ ONLY ADMIN */}
                  {isAdmin && <td>{o.branch_name}</td>}

                  <td>{new Date(o.order_date).toLocaleDateString()}</td>
                  <td>₹{o.total_amount}</td>
                  <td>₹{o.paid}</td>
                  <td>₹{o.remaining}</td>

                  <td>
                    <span className={`px-2 py-1 rounded ${statusColors[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
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