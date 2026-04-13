import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";

// Dashboards
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import CashierDashboard from "../pages/dashboard/CashierDashboard";
import SalesDashboard from "../pages/dashboard/SalesDashboard";
import SupportDashboard from "../pages/dashboard/SupportDashboard";
import InventoryDashboard from "../pages/dashboard/InventoryDashboard";

// Pages
import Products from "../pages/Products";
import Orders from "../pages/OrderHistory";
import OrderDetails from "../pages/OrderDetails";
import PaymentPage from "../pages/CustomerPayments";
import Employees from "../pages/Employees";
import SeeUserSessions from "../pages/SeeUserSessions";
import SupplierPayments from "../pages/SupplierPayments";
import Inventory from "../pages/Inventory";
import PurchaseOrders from "../pages/PurchaseOrdersHistory";
import PurchaseOrderDetails from "../pages/PurchaseOrderDetails";
import ReturnHistory from "../pages/ReturnHistory";
import PlaceOrder from "../pages/PlaceOrder";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        {/* DASHBOARDS */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
          <Route path="/dashboard/manager" element={<ManagerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Sales Executive"]} />}>
          <Route path="/dashboard/sales" element={<SalesDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Inventory Staff"]} />}>
          <Route path="/dashboard/inventory" element={<InventoryDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Cashier"]} />}>
          <Route path="/dashboard/cashier" element={<CashierDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Support Staff"]} />}>
          <Route path="/dashboard/support" element={<SupportDashboard />} />
        </Route>

        {/* 🔥 SHARED ROUTES (FIXED) */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Manager",
                "Cashier",
                "Inventory Staff"
              ]}
            />
          }
        >
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Manager", "Cashier"]}
            />
          }
        >
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/returns" element={<ReturnHistory />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Manager", "Inventory Staff"]}
            />
          }
        >
          <Route path="/purchase_orders" element={<PurchaseOrders />} />
          <Route path="/purchase_orders/:id" element={<PurchaseOrderDetails />} />
          <Route path="/supplier_payments" element={<SupplierPayments />} />
          <Route path="/inventory" element={<Inventory />} />
        </Route>

        <Route
          element={<ProtectedRoute allowedRoles={["Admin"]} />}
        >
          <Route path="/employees" element={<Employees />} />
          <Route path="/sessions" element={<SeeUserSessions />} />
        </Route>

        <Route
          element={<ProtectedRoute allowedRoles={["Cashier"]} />}
        >
          <Route path="/products" element={<Products />} />
          <Route path="/place_order" element={<PlaceOrder />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}