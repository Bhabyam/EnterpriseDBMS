import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes";
import AuthProvider from "./context/AuthContext";
import ThemeProvider from "./context/ThemeContext";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  </AuthProvider>
);


