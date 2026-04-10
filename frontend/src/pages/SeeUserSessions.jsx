import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";

export default function UserSessions() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedRole, setSelectedRole] = useState("All");

  const [sortKey, setSortKey] = useState("login_time");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/user_sessions/")
      .then((res) => setSessions(res.data.data || []))
      .catch(console.error);
  }, []);

  // 🔹 BRANCH LIST
  const branches = useMemo(() => {
    const unique = new Set(sessions.map((s) => s.branch_name));
    return ["All Branches", ...unique];
  }, [sessions]);

  // 🔹 ROLE LIST
  const roles = useMemo(() => {
    const unique = new Set(sessions.map((s) => s.role_name));
    return ["All", ...unique];
  }, [sessions]);

  // 🔍 FILTER + SORT
  const filteredSessions = useMemo(() => {
    let data = [...sessions];

    // FILTER
    data = data.filter((s) => {
      const matchesSearch =
        `${s.username} ${s.role_name} ${s.branch_name}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesBranch =
        selectedBranch === "All Branches" ||
        s.branch_name === selectedBranch;

      const matchesRole =
        selectedRole === "All" || s.role_name === selectedRole;

      return matchesSearch && matchesBranch && matchesRole;
    });

    // SORT
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (["login_time", "logout_time"].includes(sortKey)) {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [sessions, search, selectedBranch, selectedRole, sortKey, sortOrder]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // 🔄 SORT HANDLER
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

  // 📄 PAGE NUMBERS
  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // 📊 COUNT
  const totalCount = filteredSessions.length;

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-4">
        User Sessions ({totalCount})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="User / Role / Branch"
          className="p-2 border rounded w-[300px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* BRANCH */}
        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded min-w-[180px]"
        >
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* ROLE */}
        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded min-w-[150px]"
        >
          {roles.map((r, i) => (
            <option key={i} value={r}>
              {r}
            </option>
          ))}
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

          <table className="w-full text-sm text-center table-fixed">

            <thead className="bg-gray-900 text-white">
              <tr>

                <th className={`py-3 cursor-pointer ${isActive("username")}`} onClick={() => handleSort("username")}>
                  User{getArrow("username")}
                </th>

                <th className={`cursor-pointer ${isActive("role_name")}`} onClick={() => handleSort("role_name")}>
                  Role{getArrow("role_name")}
                </th>

                <th className={`cursor-pointer ${isActive("branch_name")}`} onClick={() => handleSort("branch_name")}>
                  Branch{getArrow("branch_name")}
                </th>

                <th className={`cursor-pointer ${isActive("login_time")}`} onClick={() => handleSort("login_time")}>
                  Login{getArrow("login_time")}
                </th>

                <th className={`cursor-pointer ${isActive("logout_time")}`} onClick={() => handleSort("logout_time")}>
                  Logout{getArrow("logout_time")}
                </th>

                <th>Device</th>

              </tr>
            </thead>

            <tbody>
              {paginatedSessions.map((s) => (
                <tr key={s.session_id} className="border-b hover:bg-gray-100">

                  <td className="py-2">{s.username}</td>
                  <td>{s.role_name}</td>
                  <td>{s.branch_name || "-"}</td>

                  <td>
                    {s.login_time
                      ? new Date(s.login_time).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {s.logout_time
                      ? new Date(s.logout_time).toLocaleString()
                      : <span className="text-green-500 font-semibold">Active</span>}
                  </td>

                  <td>{s.device_info || "-"}</td>

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