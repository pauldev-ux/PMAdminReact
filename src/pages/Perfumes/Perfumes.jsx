import React, { useEffect, useMemo, useState } from "react"; 
import { useAuth } from "../../context/AuthContext";
import { listProducts } from "../../api/products";
import { listBrands } from "../../api/brands";
import { API_BASE } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='#888'>IMG</text></svg>`);

export default function Perfumes() {
  const { token } = useAuth();
  const { items, addItem } = useCart();              // ← traemos items para saber si ya está en el carrito
  const nav = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true); // “Perfumes disponibles”
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

      // Si está marcado “Perfumes disponibles”, filtramos los que tengan stock > 0
      const list = Array.isArray(p) ? (onlyActive ? p.filter(x => Number(x.cantidad) > 0) : p) : [];
      setProducts(list);
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

  // set con ids de productos ya en el carrito
  const inCartIds = useMemo(() => new Set((items || []).map(it => it.product_id)), [items]);

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Encabezado */}
      <div className="pm-page-head">
        <h2>Perfumes</h2>
        <button onClick={() => nav("/perfumes/nuevo")} className="pm-btn primary">Añadir producto</button>
      </div>

      {/* Filtros */}
      <div className="pm-toolbar">
        <div className="pm-search">
          <input
            className="pm-input"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="pm-row">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          <span className="pm-muted">Perfumes disponibles</span>
        </label>

        <button onClick={load} className="pm-btn">Buscar</button>
      </div>

      {loading && <div className="pm-muted">Cargando…</div>}
      {err && <div className="pm-alert error">{err}</div>}
      {!loading && !err && products.length === 0 && <div className="pm-muted">No hay productos.</div>}

      {/* Grid de tarjetas responsivo */}
      <div className="pm-grid">
        {products.map((p) => {
          const brand = p.brand_id ? brandNameById.get(p.brand_id) : "-";
          const added = inCartIds.has(p.id); // ¿ya está en el carrito?

          return (
            <div key={p.id} className="pm-card">
              <img src={imgSrcOf(p)} alt={p.nombre} className="pm-thumb" onError={handleImgError} loading="lazy" />
              <div style={{ display: "grid", gap: 4 }}>
                <div className="pm-row" style={{ justifyContent: "space-between" }}>
                  <b>{p.nombre}</b>
                  <span className="pm-muted" style={{ fontSize: 12 }}>ID: {p.id}</span>
                </div>
                <div className="pm-muted">Marca: <b>{brand}</b></div>
                <div className="pm-row wrap" style={{ gap: 16 }}>
                  <span>Venta: <b>{fmt(p.precio_venta)}</b></span>
                  <span>Stock: <b>{p.cantidad}</b></span>
                </div>

                <div className="pm-row" style={{ gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => { if (!added) addItem(p); }}
                    className={`pm-btn ${added ? "success" : "primary"}`}
                    style={{ padding: "8px 12px" }}
                    disabled={added}
                  >
                    {added ? "Añadido al carrito" : "Añadir al carrito"}
                  </button>

                  <button
                    onClick={() => nav(`/perfumes/${p.id}/editar`)}
                    className="pm-btn"
                    title="Editar y aumentar stock"
                    style={{ padding: "8px 12px" }}
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
