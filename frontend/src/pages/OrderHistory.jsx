import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const statusColors = {
  Delivered: "bg-green-500 text-white",
  Confirmed: "bg-blue-500 text-white",
  Pending: "bg-yellow-400 text-black",
  Cancelled: "bg-red-500 text-white",
};

export default function Orders() {

  const role = localStorage.getItem("role");          // ✅ ADDED
  const isAdmin = role === "Admin";                   // ✅ ADDED

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [sortKey, setSortKey] = useState("order_id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const navigate = useNavigate();
  const location = useLocation()

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/orders/")
      .then((res) => setOrders(res.data.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");

    if (status) {
      setSelectedStatus(status);
    }
  }, [location.search]);

  // 🔹 BRANCHES
  const branches = useMemo(() => {
    const unique = new Set(orders.map((o) => o.branch_name));
    return ["All Branches", ...unique];
  }, [orders]);

  const baseFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        `${o.order_id} ${o.invoice_number} ${o.customer}`
          .toLowerCase()
          .includes(search.toLowerCase());

      // ✅ ONLY APPLY BRANCH FILTER FOR ADMIN
      const matchesBranch =
        !isAdmin || selectedBranch === "All Branches" || o.branch_name === selectedBranch;

      return matchesSearch && matchesBranch;
    });
  }, [orders, search, selectedBranch, isAdmin]);

  // 🔍 FILTER + SORT
  const filteredOrders = useMemo(() => {
    let data = [...orders];

    data = data.filter((o) => {
      const matchesSearch =
        `${o.order_id} ${o.invoice_number} ${o.customer}`
          .toLowerCase()
          .includes(search.toLowerCase());

      // ✅ ONLY ADMIN FILTERS BY BRANCH
      const matchesBranch =
        !isAdmin || selectedBranch === "All Branches" || o.branch_name === selectedBranch;

      const matchesStatus =
        selectedStatus === "All" || o.status === selectedStatus;

      return matchesSearch && matchesBranch && matchesStatus;
    });

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["total_amount", "paid", "remaining"].includes(sortKey)) {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (sortKey === "order_date") {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [orders, search, selectedBranch, selectedStatus, sortKey, sortOrder, isAdmin]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
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

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const statusCounts = {
    All: 0,
    Delivered: 0,
    Confirmed: 0,
    Pending: 0,
    Cancelled: 0,
  };

  filteredOrders.forEach((o) => {
    statusCounts.All++;

    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-4">
        Order History ({statusCounts.All})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        <input
          type="text"
          placeholder="Order ID/Invoice/Customer"
          className="p-2 border rounded w-1/4"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* ✅ SHOW ONLY FOR ADMIN */}
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
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          <option value="All">All ({statusCounts.All})</option>
          <option value="Delivered">Delivered ({statusCounts.Delivered})</option>
          <option value="Confirmed">Confirmed ({statusCounts.Confirmed})</option>
          <option value="Pending">Pending ({statusCounts.Pending})</option>
          <option value="Cancelled">Cancelled ({statusCounts.Cancelled})</option>
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

          <table className="w-full text-sm text-center table-fixed">

            <thead className="bg-gray-900 text-white">
              <tr>
                <th className={`py-3 w-[6%] cursor-pointer ${isActive("order_id")}`} onClick={() => handleSort("order_id")}>
                  ID{getArrow("order_id")}
                </th>

                <th className={`w-[12%] cursor-pointer ${isActive("invoice_number")}`} onClick={() => handleSort("invoice_number")}>
                  Invoice{getArrow("invoice_number")}
                </th>

                <th className={`w-[15%] cursor-pointer ${isActive("customer")}`} onClick={() => handleSort("customer")}>
                  Customer{getArrow("customer")}
                </th>

                {/* ✅ ONLY ADMIN */}
                {isAdmin && <th className="w-[12%]">Branch</th>}

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

                <th className="w-[7%]">Status</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((o) => (
                <tr
                  key={o.order_id}
                  onClick={() => navigate(`/orders/${o.order_id}`)}
                  className="border-b hover:bg-gray-100 cursor-pointer"
                >
                  <td className="py-3 text-blue-600">{o.order_id}</td>
                  <td className="truncate">{o.invoice_number}</td>
                  <td className="truncate">{o.customer}</td>

                  {/* ✅ ONLY ADMIN */}
                  {isAdmin && <td>{o.branch_name}</td>}

                  <td className="text-xs">{new Date(o.order_date).toLocaleString()}</td>
                  <td>₹{o.total_amount}</td>
                  <td>₹{o.paid}</td>
                  <td>₹{o.remaining}</td>

                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[o.status]}`}>
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
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Prev
        </button>

        <div className="flex gap-2">
          {getPageNumbers().map((page) => (
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
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next
        </button>

      </div>

    </DashboardLayout>
  );
}