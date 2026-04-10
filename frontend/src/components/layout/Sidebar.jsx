import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const role = user?.role;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 🔥 ROLE-BASED MENUS
  const menus = {
    Admin: [
      { name: "Dashboard", path: "/dashboard/admin" },
      { name: "Customer Orders", path: "/orders" },
      { name: "Customer Payments", path: "/payments" },
      { name: "Supplier Payments", path: "/supplier_payments" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
      { name: "Employees", path: "/employees" },
      { name: "User Sessions", path: "/sessions" },
    ],

    Manager: [
      { name: "Dashboard", path: "/dashboard/manager" },
      { name: "Customer Orders", path: "/orders" },
      { name: "Customer Payments", path: "/payments" },
      { name: "Supplier Payments", path: "/supplier_payments" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
    ],

    "Sales Executive": [
      { name: "Dashboard", path: "/dashboard/sales" },
    ],

    "Inventory Staff": [
      { name: "Dashboard", path: "/dashboard/inventory" },
      { name: "Supplier Payments", path: "/supplier_payments" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
    ],

    Cashier: [
      { name: "Dashboard", path: "/dashboard/cashier" },
      { name: "Customer Orders", path: "/orders" },
      { name: "Customer Payments", path: "/payments" },
      { name: "Products", path: "/products" },
    ],

    "Support Staff": [
      { name: "Dashboard", path: "/dashboard/support" },
    ],
  };

  const menu = menus[role] || [];

  return (
    <div className="w-64 h-full bg-white text-gray-900 flex flex-col p-4 border-r">

      {/* Logo */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">RetailMS</h1>
        <p className="text-xs text-gray-400">{role}</p>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`block px-4 py-2 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Bottom user */}
      <div className="mt-6 border-t border-gray-300 pt-4">
        <p className="text-sm font-medium">{user?.username}</p>
        <p className="text-xs text-gray-400">{user?.role}</p>

        <button
          onClick={handleLogout}
          className="mt-3 text-sm text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </div>

    </div>
  );
}