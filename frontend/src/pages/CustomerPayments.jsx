import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";

export default function Payments() {
  
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  const [sortKey, setSortKey] = useState("payment_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/payments/")
      .then(res => setPayments(res.data?.data || []))
      .catch(console.error);
  }, []);

  // 🔹 BRANCH LIST FROM DATA
  const branches = useMemo(() => {
    const unique = new Set(payments.map(p => p.branch_name));
    return ["All Branches", ...unique];
  }, [payments]);

  // 🔍 FILTER + SORT
  const filteredPayments = useMemo(() => {

    let data = [...payments];

    // SEARCH
    data = data.filter(p => {
      const text = `${p.payment_id} ${p.order_id} ${p.payment_method} ${p.transaction_id} ${p.branch_name}`
        .toLowerCase();

      return text.includes(search.toLowerCase());
    });

    // METHOD FILTER
    if (methodFilter !== "All") {
      data = data.filter(p => p.payment_method === methodFilter);
    }

    // ✅ BRANCH FILTER ONLY FOR ADMIN
    if (isAdmin && selectedBranch !== "All Branches") {
      data = data.filter(p => p.branch_name === selectedBranch);
    }

    // SORT
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["payment_id", "order_id", "amount"].includes(sortKey)) {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortKey === "payment_date") {
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

  }, [payments, search, methodFilter, selectedBranch, sortKey, sortOrder, isAdmin]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  const paginatedPayments = filteredPayments.slice(
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
        Payments ({filteredPayments.length})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        <input
          type="text"
          placeholder="Payment / Order / Method / TXN / Branch"
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
              <option key={i} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          <option value="All">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="NetBanking">NetBanking</option>
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

                <th className={`py-3 cursor-pointer ${isActive("payment_id")}`} onClick={() => handleSort("payment_id")}>
                  Payment ID{getArrow("payment_id")}
                </th>

                <th className={`cursor-pointer ${isActive("order_id")}`} onClick={() => handleSort("order_id")}>
                  Order ID{getArrow("order_id")}
                </th>

                <th className={`cursor-pointer ${isActive("amount")}`} onClick={() => handleSort("amount")}>
                  Amount{getArrow("amount")}
                </th>

                <th className={`cursor-pointer ${isActive("payment_method")}`} onClick={() => handleSort("payment_method")}>
                  Method{getArrow("payment_method")}
                </th>

                <th className={`cursor-pointer ${isActive("transaction_id")}`} onClick={() => handleSort("transaction_id")}>
                  Transaction{getArrow("transaction_id")}
                </th>

                <th className={`cursor-pointer ${isActive("payment_date")}`} onClick={() => handleSort("payment_date")}>
                  Date{getArrow("payment_date")}
                </th>

                {/* ✅ ONLY ADMIN */}
                {isAdmin && (
                  <th className={`cursor-pointer ${isActive("branch_name")}`} onClick={() => handleSort("branch_name")}>
                    Branch{getArrow("branch_name")}
                  </th>
                )}

              </tr>
            </thead>

            <tbody>
              {paginatedPayments.map((p) => (
                <tr key={p.payment_id} className="border-b hover:bg-gray-100">

                  <td className="py-2 text-blue-600">{p.payment_id}</td>
                  <td>{p.order_id}</td>

                  <td className="font-semibold">
                    ₹{Number(p.amount).toLocaleString()}
                  </td>

                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white
                      ${p.payment_method === "Cash" ? "bg-green-500" :
                        p.payment_method === "UPI" ? "bg-blue-500" :
                        p.payment_method === "Card" ? "bg-purple-500" :
                        p.payment_method === "NetBanking" ? "bg-orange-500" :
                        "bg-gray-500"}`}>
                      {p.payment_method}
                    </span>
                  </td>

                  <td>{p.transaction_id}</td>

                  <td>
                    {p.payment_date
                      ? new Date(p.payment_date).toLocaleString()
                      : "-"}
                  </td>

                  {/* ✅ ONLY ADMIN */}
                  {isAdmin && <td>{p.branch_name}</td>}

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