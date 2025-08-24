import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";

function PrivateRoute({ children }) {
  const { token, loadingUser } = useAuth();
  if (loadingUser) return <div style={{ padding: 24 }}>Cargando…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
