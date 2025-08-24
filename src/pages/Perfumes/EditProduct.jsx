import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listBrands } from "../../api/brands";
import { getProduct, updateProduct, uploadProductImage } from "../../api/products";
import { API_BASE } from "../../api/client";

const input   = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn     = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='#888'>IMG</text></svg>`);

export default function EditProduct() {
  const { id } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const [saving, setSaving] = useState(false);

  // campos
  const [nombre, setNombre] = useState("");
  const [brandId, setBrandId] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [cantidadActual, setCantidadActual] = useState(0);
  const [sumarCantidad, setSumarCantidad] = useState("0");
  const [activo, setActivo] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setErr(null);
      try {
        const [p, b] = await Promise.all([ getProduct(id, token), listBrands(token) ]);
        setBrands(b || []);
        // precargar valores
        setNombre(p.nombre || "");
        setBrandId(p.brand_id ?? "");
        setPrecioCompra(String(p.precio_compra ?? ""));
        setPrecioVenta(String(p.precio_venta ?? ""));
        setCantidadActual(Number(p.cantidad ?? 0));
        setActivo(Boolean(p.activo));
        setImageUrl(p.image_url || null);
      } catch (e) {
        setErr(e.message || "Error cargando producto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  const nuevoStock = useMemo(() => {
    const add = Number(sumarCantidad);
    return (Number.isFinite(add) ? cantidadActual + Math.max(0, Math.trunc(add)) : cantidadActual);
  }, [cantidadActual, sumarCantidad]);

  function onFile(e) {
    const f = e.target.files?.[0];
    setImageFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null); setOk(null);

    const pc = toNum(precioCompra);   if (!isFiniteNumber(pc) || pc < 0) { setErr("Precio de compra inválido."); return; }
    const pv = toNum(precioVenta);    if (!isFiniteNumber(pv) || pv < 0) { setErr("Precio de venta inválido."); return; }
    const add = Number(sumarCantidad);
    if (!Number.isFinite(add) || add < 0 || !Number.isInteger(add)) { setErr("Cantidad a sumar inválida."); return; }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        brand_id: brandId ? Number(brandId) : null,
        precio_compra: normalizeDec(precioCompra),
        precio_venta:  normalizeDec(precioVenta),
        cantidad: nuevoStock,
        activo,
      };
      const updated = await updateProduct(id, payload, token);
      if (imageFile) {
        await uploadProductImage(updated.id, imageFile, token);
      }
      setOk("Producto actualizado");
      setTimeout(() => nav("/perfumes"), 600);
    } catch (e) {
      setErr(e.message || "No se pudo actualizar el producto");
    } finally {
      setSaving(false);
    }
  }

  const img = preview
    ? preview
    : imageUrl
      ? (imageUrl.startsWith("http") ? imageUrl : `${API_BASE}${imageUrl}`)
      : PLACEHOLDER_IMG;

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Editar producto / Aumentar stock</h2>

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <form onSubmit={onSubmit}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end", marginTop: 12 }}>

          <div style={{ gridColumn: "span 2" }}>
            <label>Nombre</label>
            <input style={input} value={nombre} onChange={(e)=>setNombre(e.target.value)} required />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label>Marca</label>
            <select style={input} value={brandId} onChange={(e)=>setBrandId(e.target.value)}>
              <option value="">(Sin marca)</option>
              {brands.sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Precio compra</label>
            <input style={input} value={precioCompra} onChange={(e)=>setPrecioCompra(e.target.value)} />
          </div>
          <div>
            <label>Precio venta</label>
            <input style={input} value={precioVenta} onChange={(e)=>setPrecioVenta(e.target.value)} />
          </div>

          <div>
            <label>Stock actual</label>
            <input style={{ ...input, background:"#f4f5f7" }} value={cantidadActual} readOnly />
          </div>
          <div>
            <label>Sumar al stock</label>
            <input style={input} type="number" min="0" step="1" value={sumarCantidad} onChange={(e)=>setSumarCantidad(e.target.value)} />
            <div style={{ fontSize:12, color:"#555", marginTop:4 }}>Nuevo stock: <b>{nuevoStock}</b></div>
          </div>

          <div>
            <label>Activo</label><br />
            <input type="checkbox" checked={activo} onChange={(e)=>setActivo(e.target.checked)} />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label>Imagen (opcional, reemplaza la actual)</label>
            <input type="file" accept="image/*" onChange={onFile} style={input} />
            <img src={img} alt="preview" style={{ marginTop: 8, width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid #eee" }}
                 onError={(e)=>{e.currentTarget.src=PLACEHOLDER_IMG}}/>
          </div>

          <div style={{ display: "flex", gap: 8, gridColumn: "span 2" }}>
            <button disabled={saving} style={btnPrim}>{saving ? "Guardando…" : "Guardar"}</button>
            <button type="button" onClick={()=>nav("/perfumes")} style={btn}>Cancelar</button>
          </div>

          {err && <div style={{ color: "#b00020", gridColumn: "span 4" }}>{err}</div>}
          {ok  && <div style={{ color: "#0a7e07", gridColumn: "span 4" }}>{ok}</div>}
        </form>
      )}
    </div>
  );
}

/* helpers */
function normalizeDec(s) { return String(s ?? "").replace(",", "."); }
function toNum(s) { const n = Number(normalizeDec(s)); return Number.isFinite(n) ? n : NaN; }
function isFiniteNumber(n) { return typeof n === "number" && Number.isFinite(n); }
