import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Container from "./Container";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "white" : "#333",
  background: isActive ? "#0ea5e9" : "transparent",
});

export default function Navbar() {
  const { logout, user } = useAuth();
  const nav = useNavigate();
  const { count } = useCart();

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <div style={{ borderBottom: "1px solid #eee", background: "#fafafa" }}>
      <Container>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <b>PM Perfumes Admin</b>
            <NavLink to="/perfumes" style={linkStyle}>Perfumes</NavLink>
            <NavLink to="/marcas"   style={linkStyle}>Marca</NavLink>
            <NavLink to="/ventas"   style={linkStyle}>Ventas{count>0?` (${count})`:""}</NavLink>
            <NavLink to="/reportes" style={linkStyle}>Reportes de Ventas</NavLink>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#555" }}>{user?.full_name || user?.username}</span>
            <button onClick={() => { logout(); nav("/login", { replace: true }); }}
              style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" }}>
              Salir
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
