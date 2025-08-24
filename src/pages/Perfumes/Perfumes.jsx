import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listProducts, createProduct, uploadProductImage } from "../../api/products";
import { listBrands } from "../../api/brands";
import { API_BASE } from "../../api/client";

// --- estilos simples ---
const cardStyle = { display: "grid", gridTemplateColumns: "96px 1fr", gap: 12, padding: 12, border: "1px solid #eee", borderRadius: 12, background: "white" };
const imgStyle  = { width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid #eee", background: "#f9f9f9" };
const input     = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn       = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim   = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };

// Placeholder local por si una imagen falla
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='#888'>IMG</text></svg>`);

export default function Perfumes() {
  const { token } = useAuth();

  // listado
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // form crear
  const [fNombre, setFNombre] = useState("");
  const [fBrandId, setFBrandId] = useState(""); // "" = sin marca
  const [fCompra, setFCompra] = useState("");
  const [fVenta, setFVenta] = useState("");
  const [fCantidad, setFCantidad] = useState("0");
  const [fActivo, setFActivo] = useState(true);
  const [fImage, setFImage] = useState(null);
  const [fPreview, setFPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(null);

  const brandNameById = useMemo(() => {
    const m = new Map();
    for (const b of brands) m.set(b.id, b.nombre);
    return m;
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

  // --- crear producto ---
  function normDec(s) { return String(s).replace(",", "."); }
  function validateForm() {
    if (fNombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    const pc = Number(normDec(fCompra)); if (isNaN(pc) || pc < 0) return "Precio de compra inválido.";
    const pv = Number(normDec(fVenta));  if (isNaN(pv) || pv < 0) return "Precio de venta inválido.";
    const qty = Number(fCantidad); if (!Number.isInteger(qty) || qty < 0) return "Cantidad inválida.";
    return null;
  }

  async function onCreate(e) {
    e.preventDefault();
    setErr(null); setOk(null);
    const v = validateForm();
    if (v) { setErr(v); return; }

    setSaving(true);
    try {
      const payload = {
        nombre: fNombre.trim(),
        brand_id: fBrandId ? Number(fBrandId) : null,
        precio_compra: normDec(fCompra), // como string para Decimal
        precio_venta:  normDec(fVenta),
        cantidad: Number(fCantidad),
        activo: fActivo,
      };

      // 1) crear
      const created = await createProduct(payload, token);

      // 2) subir imagen (opcional)
      let updated = created;
      if (fImage) {
        updated = await uploadProductImage(created.id, fImage, token);
      }

      // 3) feedback y refresco local
      setOk(`Producto creado: ${updated.nombre} (id ${updated.id})`);
      setProducts(prev => [updated, ...prev]); // insertamos arriba

      // 4) limpiar form
      setFNombre(""); setFBrandId(""); setFCompra(""); setFVenta("");
      setFCantidad("0"); setFActivo(true); setFImage(null); setFPreview(null);
    } catch (e) {
      setErr(e.message || "No se pudo crear el producto");
    } finally {
      setSaving(false);
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    setFImage(file || null);
    if (file) setFPreview(URL.createObjectURL(file));
    else setFPreview(null);
  }

  function imgSrcOf(p) {
    const url = p.image_url;
    if (!url) return PLACEHOLDER_IMG;
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
  }
  function handleImgError(e) { e.currentTarget.src = PLACEHOLDER_IMG; }

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Perfumes</h2>

      {/* ---------- Formulario crear ---------- */}
      <form onSubmit={onCreate}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "end", margin: "12px 0" }}>
        <div style={{ gridColumn: "span 2" }}>
          <label>Nombre</label>
          <input style={input} value={fNombre} onChange={(e) => setFNombre(e.target.value)} placeholder="Sauvage EDT 100ml" required />
        </div>
        <div>
          <label>Marca</label>
          <select style={input} value={fBrandId} onChange={(e) => setFBrandId(e.target.value)}>
            <option value="">(Sin marca)</option>
            {brands.sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Precio compra</label>
          <input style={input} value={fCompra} onChange={(e) => setFCompra(e.target.value)} placeholder="25000.00" />
        </div>
        <div>
          <label>Precio venta</label>
          <input style={input} value={fVenta} onChange={(e) => setFVenta(e.target.value)} placeholder="680.00" />
        </div>
        <div>
          <label>Cantidad</label>
          <input style={input} type="number" min="0" step="1" value={fCantidad} onChange={(e)=>setFCantidad(e.target.value)} />
        </div>

        <div>
          <label>Activo</label><br />
          <input type="checkbox" checked={fActivo} onChange={(e)=>setFActivo(e.target.checked)} />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label>Imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={onFile} style={input} />
          {fPreview && (
            <div style={{ marginTop: 6 }}>
              <img src={fPreview} alt="preview" style={{ ...imgStyle, width: 72, height: 72 }} />
            </div>
          )}
        </div>

        <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
          <button disabled={saving} style={btnPrim}>{saving ? "Guardando…" : "Añadir perfume"}</button>
          <button type="button" onClick={load} style={btn}>Recargar</button>
        </div>
      </form>

      {err && <div style={{ color: "#b00020", marginBottom: 8 }}>{err}</div>}
      {ok  && <div style={{ color: "#0a7e07", marginBottom: 8 }}>{ok}</div>}

      {/* ---------- Filtros de listado ---------- */}
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

      {/* ---------- Listado ---------- */}
      {loading && <div>Cargando…</div>}
      {(!loading && !err && products.length === 0) && <div style={{ color: "#666" }}>No hay productos.</div>}

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
                  <span>Compra: <b>{fmt(p.precio_compra)}</b></span>
                  <span>Venta: <b>{fmt(p.precio_venta)}</b></span>
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

function fmt(x) { const n = Number(x); return isNaN(n) ? "-" : n.toFixed(2); }
