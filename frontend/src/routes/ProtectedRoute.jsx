import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {

  const role = localStorage.getItem("role");

  console.log("ProtectedRoute role:", role); // 🔍 debug

  if (!role) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}