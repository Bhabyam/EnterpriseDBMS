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
      { name: "Return History", path: "/returns" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
      { name: "Supplier Payments", path: "/supplier_payments" },
      { name: "Employees", path: "/employees" },
      { name: "User Sessions", path: "/sessions" },
    ],

    Manager: [
      { name: "Dashboard", path: "/dashboard/manager" },
      { name: "Customer Orders", path: "/orders" },
      { name: "Customer Payments", path: "/payments" },
      { name: "Return History", path: "/returns" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
      { name: "Supplier Payments", path: "/supplier_payments" },
    ],

    "Sales Executive": [
      { name: "Dashboard", path: "/dashboard/sales" },
      { name: "Inventory", path: "/inventory" },
      { name: "Sales Insights", path: "/sales_insights" },
    ],

    "Inventory Staff": [
      { name: "Dashboard", path: "/dashboard/inventory" },
      { name: "Supplier Payments", path: "/supplier_payments" },
      { name: "Inventory", path: "/inventory" },
      { name: "Purchase Orders", path: "/purchase_orders" },
      { name: "Place Orders", path: "/create_purchase_order" },
      { name: "Receive Goods", path: "/receive_goods" },
      { name: "Transfer Stock", path: "/transfer_stock" },
      { name: "Add Payment", path: "/add_purchase_payment" },
    ],

    Cashier: [
      { name: "Dashboard", path: "/dashboard/cashier" },
      { name: "Products", path: "/products" },
      { name: "Place Order", path: "/place_order" },
      { name: "Customer Orders", path: "/orders" },
      { name: "Add Payment", path: "/add_payment" },
      { name: "Customer Payments", path: "/payments" },
      { name: "Process Return", path: "/process_return" },
      { name: "Return History", path: "/returns" },
    ],

    "Support Staff": [
      { name: "Dashboard", path: "/dashboard/support" },
      { name: "Products", path: "/products" },
      { name: "Orders", path: "/orders" },
      { name: "Process Return", path: "/process_return" },
      { name: "Return History", path: "/returns" },
    ],
  };

  const menu = menus[role] || [];

  return (
    <div className="w-64 h-full bg-[#1e293b] text-white flex flex-col p-4 border-r border-blue-800">

      {/* Logo */}
      <div className="mb-8 px-2 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">R</div>
          <h1 className="text-xl font-bold tracking-tight">Retail Hub</h1>
        </div>
        <p className="text-[10px] text-blue-300 uppercase font-bold tracking-[0.2em] mt-2 opacity-80">{role}</p>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-blue-100 hover:bg-white/10 hover:translate-x-1"
              }`}
            >
              <span className={`font-medium ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom user */}
      <div className="mt-6 border-t border-blue-800/50 pt-6 px-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.username}</p>
            <p className="text-[10px] text-blue-400 uppercase font-bold truncate tracking-wider">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-center"
        >
          Logout Session
        </button>
      </div>

    </div>
  );
}