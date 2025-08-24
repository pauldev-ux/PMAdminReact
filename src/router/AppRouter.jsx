import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Layout/Navbar";
import Home from "../pages/Home/Home";         
import Login from "../pages/Login/Login";      
import Perfumes from "../pages/Perfumes/Perfumes";
import Brands from "../pages/Brands/Brands";
import Sales from "../pages/Sales/Sales";
import Reports from "../pages/Reports/Reports";
import Container from "../components/Layout/Container";
import NewProduct from "../pages/Perfumes/NewProduct";
import EditProduct from "../pages/Perfumes/EditProduct";
import Lots from "../pages/Lots/Lotes";          
import NewLot from "../pages/Lots/NewLot";

function PrivateGuard() {
  const { token, loadingUser } = useAuth();
  if (loadingUser) return <Container><div>Cargando…</div></Container>;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PrivateLayout() {
  return (
    <>
      <Navbar />
      <Container>
        <Outlet />
      </Container>
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* públicas */}
        <Route path="/login" element={<Login />} />

        {/* privadas */}
        <Route element={<PrivateGuard />}>
          <Route element={<PrivateLayout />}>
            <Route path="/" element={<Navigate to="/perfumes" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/perfumes" element={<Perfumes />} />
            <Route path="/perfumes/nuevo" element={<NewProduct />} />
            <Route path="/perfumes/:id/editar" element={<EditProduct />} />
            <Route path="/marcas" element={<Brands />} />
            <Route path="/ventas" element={<Sales />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/lotes" element={<Lots />} />
            <Route path="/lotes/nuevo" element={<NewLot />} />
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/perfumes" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
