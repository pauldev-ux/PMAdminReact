import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Container from "./Container";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const linkClass = ({ isActive }) => `pm-tab${isActive ? " active" : ""}`;

export default function Navbar() {
  const { logout, user } = useAuth();
  const nav = useNavigate();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="pm-navbar">
      <Container>
        <div className="pm-nav-inner">
          {/* Lado izquierdo: marca + tabs (desktop) */}
          <div className="pm-brand-and-tabs">
            <button
              className={`pm-hamburger ${open ? "open" : ""}`}
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="pm-mobile-menu"
              onClick={() => setOpen(o => !o)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="pm-brand">
              <span className="dot" />
              <b>PM</b>
              <span className="muted">Perfumes</span>
              <b>Admin</b>
            </div>

            {/* Tabs desktop */}
            <nav className="pm-tabs pm-tabs-desktop" aria-label="Secciones">
              <NavLink to="/perfumes" className={linkClass}>Perfumes</NavLink>
              <NavLink to="/marcas"   className={linkClass}>Marca</NavLink>
              <NavLink to="/ventas"   className={linkClass}>
                Ventas{count>0 ? ` (${count})` : ""}
              </NavLink>
              <NavLink to="/reportes" className={linkClass}>Reportes de Ventas</NavLink>
              <NavLink to="/lotes"    className={linkClass}>Lotes</NavLink>
            </nav>
          </div>

          {/* Lado derecho (desktop) */}
          <div className="pm-rightside pm-right-desktop">
            <span className="pm-user">{user?.full_name || user?.username}</span>
            <button
              onClick={() => { logout(); nav("/login", { replace: true }); }}
              className="pm-btn"
            >
              Salir
            </button>
          </div>
        </div>
      </Container>

      {/* Menú móvil desplegable */}
      <div
        id="pm-mobile-menu"
        className={`pm-mobile ${open ? "open" : ""}`}
        onClick={close}
      >
        <Container>
          <nav className="pm-mobile-list" aria-label="Menú móvil">
            <NavLink to="/perfumes" className={linkClass} onClick={close}>Perfumes</NavLink>
            <NavLink to="/marcas"   className={linkClass} onClick={close}>Marca</NavLink>
            <NavLink to="/ventas"   className={linkClass} onClick={close}>
              Ventas{count>0 ? ` (${count})` : ""}
            </NavLink>
            <NavLink to="/reportes" className={linkClass} onClick={close}>Reportes de Ventas</NavLink>
            <NavLink to="/lotes"    className={linkClass} onClick={close}>Lotes</NavLink>

            <div className="pm-mobile-footer">
              <span className="pm-user">{user?.full_name || user?.username}</span>
              <button
                onClick={() => { logout(); nav("/login", { replace: true }); }}
                className="pm-btn"
              >
                Salir
              </button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}
