import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listBrands } from "../../api/brands";
import { listLots } from "../../api/lots"; // 👈 NUEVO
import { createProduct, uploadProductImage } from "../../api/products";
import { useNavigate, useSearchParams } from "react-router-dom";

const input   = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn     = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };
const hint    = { fontSize: 12, color: "#666" };

export default function NewProduct() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  // selects
  const [brands, setBrands] = useState([]);
  const [lots, setLots] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingLots, setLoadingLots] = useState(true);

  // form
  const [nombre, setNombre] = useState("");
  const [brandId, setBrandId] = useState("");
  const [lotId, setLotId] = useState("");          // 👈 NUEVO (obligatorio)
  const [precioCompra, setPrecioCompra] = useState("");
  const [envio, setEnvio] = useState("50");
  const [ganancia, setGanancia] = useState("150");
  const [precioVenta, setPrecioVenta] = useState("");
  const [autoCalc, setAutoCalc] = useState(true);
  const [cantidad, setCantidad] = useState("1");    // por defecto 1 para cumplir back
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  // cargar marcas
  useEffect(() => {
    async function loadBrands() {
      setLoadingBrands(true);
      try {
        const data = await listBrands(token);
        setBrands(data || []);
      } catch (e) {
        setErr(e.message || "Error cargando marcas");
      } finally {
        setLoadingBrands(false);
      }
    }
    loadBrands();
  }, [token]);

  // cargar lotes
  useEffect(() => {
    async function loadLots() {
      setLoadingLots(true);
      try {
        const data = await listLots({}, token); // sin filtros: traemos todos, el back ya ordena por fecha/creación
        setLots(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Error cargando lotes");
      } finally {
        setLoadingLots(false);
      }
    }
    loadLots();
  }, [token]);

  const pc = toNum(precioCompra);
  const ev = toNum(envio);
  const ga = toNum(ganancia);

  // recalcular PV automáticamente
  useEffect(() => {
    if (autoCalc) {
      const pv = isFiniteNumber(pc) && isFiniteNumber(ev) && isFiniteNumber(ga) ? pc + ev + ga : "";
      setPrecioVenta(pv === "" ? "" : String(pv));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioCompra, envio, ganancia, autoCalc]);

  function onFile(e) {
    const f = e.target.files?.[0];
    setImage(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function validate() {
    if (!lotId) return "Debes seleccionar un lote.";
    if (nombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (!isFiniteNumber(pc) || pc < 0) return "Precio de compra inválido.";
    if (!isFiniteNumber(toNum(precioVenta)) || toNum(precioVenta) < 0) return "Precio de venta inválido.";
    const qty = Number(cantidad);
    if (!Number.isInteger(qty) || qty <= 0) return "Cantidad inválida (debe ser mayor a 0).";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null); setOk(null);
    const v = validate();
    if (v) { setErr(v); return; }
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        brand_id: brandId ? Number(brandId) : null,
        precio_compra: normalizeDec(precioCompra),
        precio_venta:  normalizeDec(precioVenta),
        cantidad: Number(cantidad),
        activo: true,
        lot_id: Number(lotId),           // 👈 NUEVO: exigido por el backend
      };
      const created = await createProduct(payload, token);
      let updated = created;
      if (image) {
        updated = await uploadProductImage(created.id, image, token);
      }
      setOk(`Producto creado: ${updated.nombre} (id ${updated.id})`);
      setTimeout(() => nav("/perfumes"), 700);
    } catch (e) {
      setErr(e.message || "No se pudo crear el producto");
    } finally {
      setSaving(false);
    }
  }

  // ordenar lotes por fecha desc, luego id desc (para que salgan arriba los recientes)
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const fa = a.fecha || a.created_at || "";
      const fb = b.fecha || b.created_at || "";
      if (fa > fb) return -1;
      if (fa < fb) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [lots]);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2>Nuevo producto</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={btn} onClick={() => nav("/lotes/nuevo")}>Crear lote</button>
          <button className="btn" style={btn} onClick={() => nav("/perfumes")}>Volver</button>
        </div>
      </div>

      <form onSubmit={onSubmit}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end", marginTop: 12 }}>
        {/* Lote (obligatorio) */}
        <div style={{ gridColumn: "span 2" }}>
          <label>Lote <span style={{ color:"#b00020" }}>*</span></label>
          <select style={input} value={lotId} onChange={(e)=>setLotId(e.target.value)} disabled={loadingLots}>
            <option value="">— Seleccionar lote —</option>
            {sortedLots.map(l => (
              <option key={l.id} value={l.id}>
                {l.nombre} — { (l.fecha || l.created_at || "").slice(0,10) } — #{l.id}
              </option>
            ))}
          </select>
          <div style={hint}>Si no aparece, crea un lote y vuelve.</div>
        </div>

        {/* Marca */}
        <div style={{ gridColumn: "span 2" }}>
          <label>Marca</label>
          <select style={input} value={brandId} onChange={(e)=>setBrandId(e.target.value)} disabled={loadingBrands}>
            <option value="">(Sin marca)</option>
            {brands.sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div style={{ gridColumn: "span 2" }}>
          <label>Nombre</label>
          <input style={input} value={nombre} onChange={(e)=>setNombre(e.target.value)} placeholder="Sauvage EDT 100ml" required />
        </div>

        {/* Precios */}
        <div>
          <label>Precio compra</label>
          <input style={input} value={precioCompra} onChange={(e)=>setPrecioCompra(e.target.value)} placeholder="250.00" />
        </div>
        <div>
          <label>Envío (BOB)</label>
          <input style={input} value={envio} onChange={(e)=>setEnvio(e.target.value)} placeholder="50" />
        </div>
        <div>
          <label>Posible ganancia (BOB)</label>
          <input style={input} value={ganancia} onChange={(e)=>setGanancia(e.target.value)} placeholder="150" />
        </div>
        <div>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Precio venta</span>
            <span style={{ fontSize: 12, color: "#555" }}>
              <input type="checkbox" checked={autoCalc} onChange={(e)=>setAutoCalc(e.target.checked)} /> auto
            </span>
          </label>
          <input
            style={{ ...input, background: autoCalc ? "#f9fafb" : "white" }}
            value={precioVenta}
            onChange={(e)=>setPrecioVenta(e.target.value)}
            placeholder="450.00"
            readOnly={autoCalc}
          />
        </div>

        {/* Cantidad */}
        <div>
          <label>Cantidad</label>
          <input style={input} type="number" min="1" step="1" value={cantidad} onChange={(e)=>setCantidad(e.target.value)} />
          <div style={hint}>Debe ser &gt; 0 (se asentará en el lote).</div>
        </div>

        {/* Imagen */}
        <div style={{ gridColumn: "span 2" }}>
          <label>Imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={onFile} style={input} />
          {preview && <img src={preview} alt="preview" style={{ marginTop: 8, width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid #eee" }} />}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 8, gridColumn: "span 2" }}>
          <button disabled={saving || loadingLots} style={btnPrim}>{saving ? "Guardando…" : "Guardar"}</button>
          <button type="button" onClick={()=>nav("/perfumes")} style={btn}>Cancelar</button>
        </div>
      </form>

      {err && <div style={{ color: "#b00020", marginTop: 8 }}>{err}</div>}
      {ok  && <div style={{ color: "#0a7e07", marginTop: 8 }}>{ok}</div>}
    </div>
  );
}

/* helpers */
function normalizeDec(s) { return String(s ?? "").replace(",", "."); }
function toNum(s) { const n = Number(normalizeDec(s)); return Number.isFinite(n) ? n : NaN; }
function isFiniteNumber(n) { return typeof n === "number" && Number.isFinite(n); }
