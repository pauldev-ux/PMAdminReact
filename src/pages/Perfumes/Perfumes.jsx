import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listProducts } from "../../api/products";
import { listBrands } from "../../api/brands";
import { API_BASE } from "../../api/client";

const cardStyle = {
  display: "grid",
  gridTemplateColumns: "96px 1fr",
  gap: 12,
  padding: 12,
  border: "1px solid #eee",
  borderRadius: 12,
  background: "white",
};

const imgStyle = {
  width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid #eee", background: "#f9f9f9"
};

export default function Perfumes() {
  const { token } = useAuth();
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
      setProducts(p);
      setBrands(b);
    } catch (e) {
      setErr(e.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []); // carga inicial

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Perfumes</h2>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10, width: 320 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          Solo activos
        </label>
        <button onClick={load} style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" }}>
          Buscar
        </button>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{ color: "#b00020" }}>{err}</div>}

      {!loading && !err && products.length === 0 && (
        <div style={{ color: "#666" }}>No hay productos que coincidan.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 12 }}>
        {products.map((p) => {
          const brand = p.brand_id ? brandNameById.get(p.brand_id) : "-";
          const imgSrc = p.image_url
            ? (p.image_url.startsWith("http") ? p.image_url : `${API_BASE}${p.image_url}`)
            : "https://via.placeholder.com/96x96?text=IMG";
          return (
            <div key={p.id} style={cardStyle}>
              <img src={imgSrc} alt={p.nombre} style={imgStyle} />
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <b>{p.nombre}</b>
                  <span style={{ fontSize: 12, color: "#666" }}>ID: {p.id}</span>
                </div>
                <div style={{ color: "#666" }}>Marca: <b>{brand}</b></div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span>Compra: <b>{formatMoney(p.precio_compra)} </b></span>
                  <span>Venta: <b>{formatMoney(p.precio_venta)} </b></span>
                  <span>Stock: <b>{p.cantidad}</b></span>
                </div>
                {!p.activo && <span style={{ color: "#b00020", fontSize: 12 }}>Inactivo</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMoney(x) {
  if (x == null) return "-";
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  return n.toFixed(2);
}
