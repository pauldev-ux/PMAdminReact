import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listProducts } from "../../api/products";
import { listBrands } from "../../api/brands";
import { API_BASE } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const cardStyle = { display: "grid", gridTemplateColumns: "96px 1fr", gap: 12, padding: 12, border: "1px solid #eee", borderRadius: 12, background: "white" };
const imgStyle  = { width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid #eee", background: "#f9f9f9" };
const input     = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn       = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim   = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };

const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='#888'>IMG</text></svg>`
);

export default function Perfumes() {
  const { token } = useAuth();
  const { addItem } = useCart();
  const nav = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const brandNameById = useMemo(() => {
    const map = new Map();
    for (const b of brands) map.set(b.id, b.nombre);
    return map;
  }, [brands]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const [p, b] = await Promise.all([
        listProducts({ search, only_active: onlyActive }, token),
        listBrands(token),
      ]);
      setProducts(p || []);
      setBrands(b || []);
    } catch (e) {
      setErr(e.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function imgSrcOf(p) {
    const url = p.image_url;
    if (!url) return PLACEHOLDER_IMG;
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
  }
  function handleImgError(e) { e.currentTarget.src = PLACEHOLDER_IMG; }
  function fmt(x) { const n = Number(x); return isNaN(n) ? "-" : n.toFixed(2); }

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2>Perfumes</h2>
        <button onClick={() => nav("/perfumes/nuevo")} style={btnPrim}>Añadir producto</button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...input, width: 320 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          Solo activos
        </label>
        <button onClick={load} style={btn}>Buscar</button>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{ color: "#b00020" }}>{err}</div>}
      {!loading && !err && products.length === 0 && <div style={{ color: "#666" }}>No hay productos.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 12 }}>
        {products.map((p) => {
          const brand = p.brand_id ? brandNameById.get(p.brand_id) : "-";
          return (
            <div key={p.id} style={cardStyle}>
              <img src={imgSrcOf(p)} alt={p.nombre} style={imgStyle} onError={handleImgError} loading="lazy" />
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <b>{p.nombre}</b>
                  <span style={{ fontSize: 12, color: "#666" }}>ID: {p.id}</span>
                </div>
                <div style={{ color: "#666" }}>Marca: <b>{brand}</b></div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span>Venta: <b>{fmt(p.precio_venta)}</b></span>
                  <span>Stock: <b>{p.cantidad}</b></span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => addItem(p)}
                    style={{ ...btnPrim, padding: "8px 12px" }}
                  >
                    Añadir al carrito
                  </button>
                  <button
                    onClick={() => nav(`/perfumes/${p.id}/editar`)}
                    style={{ ...btn, padding: "8px 12px" }}
                    title="Editar y aumentar stock"
                  >
                    Aumentar stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
