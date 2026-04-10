import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedPosition, setSelectedPosition] = useState("All Positions");

  const [sortKey, setSortKey] = useState("employee_id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔹 FETCH DATA
  useEffect(() => {
    API.get("/api/employees/")
      .then((res) => setEmployees(res.data.data || []))
      .catch(console.error);
  }, []);

  // 🔹 BRANCHES
  const branches = useMemo(() => {
    const unique = new Set(employees.map((e) => e.branch_name));
    return ["All Branches", ...unique];
  }, [employees]);

  // 🔹 POSITIONS
  const positions = useMemo(() => {
    const unique = new Set(employees.map((e) => e.position));
    return ["All Positions", ...unique];
  }, [employees]);

  // 🔍 FILTER + SORT
  const filteredEmployees = useMemo(() => {
    let data = [...employees];

    // FILTER
    data = data.filter((e) => {
      const matchesSearch =
        `${e.employee_id} ${e.first_name} ${e.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesBranch =
        selectedBranch === "All Branches" ||
        e.branch_name === selectedBranch;

      const matchesPosition =
        selectedPosition === "All Positions" || e.position === selectedPosition;

      return matchesSearch && matchesBranch && matchesPosition;
    });

    // SORT
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === "name") {
        valA = `${a.first_name} ${a.last_name}`.toLowerCase();
        valB = `${b.first_name} ${b.last_name}`.toLowerCase();
      }

      if (sortKey === "salary") {
        valA = Number(a.salary);
        valB = Number(b.salary);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [employees, search, selectedBranch, selectedPosition, sortKey, sortOrder]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const paginatedEmployees = filteredEmployees.slice(
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

  // 🔽 ARROWS
  const getArrow = (key) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const isActive = (key) =>
    sortKey === key ? "text-blue-300 font-semibold" : "";

  // 📄 SMART PAGE NUMBERS
  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // 📊 POSITION COUNTS
  const positionCounts = {
    All: 0,
  };

  positions.forEach((p) => {
    if (p !== "All POsitions") positionCounts[p] = 0;
  });

  filteredEmployees.forEach((e) => {
    positionCounts.All++;

    if (positionCounts[e.position] !== undefined) {
      positionCounts[e.position]++;
    }
  });

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold mb-4">
        Employees ({positionCounts.All})
      </h1>

      {/* 🔍 CONTROLS */}
      <div className="flex justify-between items-center mb-4 gap-4">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Employee ID / Name"
          className="p-2 border rounded w-1/4"
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
          className="p-2 border rounded"
        >
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* POSITION */}
        <select
          value={selectedPosition}
          onChange={(e) => {
            setSelectedPosition(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded"
        >
          <option value="All Positions">All Positions ({positionCounts.All})</option>

          {positions
            .filter((p) => p !== "All Positions")
            .map((p, i) => (
              <option key={i} value={p}>
                {p} ({positionCounts[p]})
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

                <th className={`py-3 w-[8%] cursor-pointer ${isActive("employee_id")}`} onClick={() => handleSort("employee_id")}>
                  ID{getArrow("employee_id")}
                </th>

                <th className={`w-[18%] cursor-pointer ${isActive("name")}`} onClick={() => handleSort("name")}>
                  Name{getArrow("name")}
                </th>

                <th className="w-[12%]">Branch</th>

                <th className={`w-[15%] cursor-pointer ${isActive("position")}`} onClick={() => handleSort("position")}>
                  Position{getArrow("position")}
                </th>

                <th className="w-[15%]">Phone</th>

                <th className="w-[20%]">Email</th>

                <th className={`w-[12%] cursor-pointer ${isActive("salary")}`} onClick={() => handleSort("salary")}>
                  Salary{getArrow("salary")}
                </th>

              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.map((e) => (
                <tr
                  key={e.employee_id}
                  className="border-b hover:bg-gray-100"
                >
                  <td className="py-3 text-blue-600">{e.employee_id}</td>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{e.branch_name}</td>
                  <td>{e.position}</td>
                  <td>{e.phone}</td>
                  <td className="truncate">{e.email}</td>
                  <td>₹{e.salary}</td>
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