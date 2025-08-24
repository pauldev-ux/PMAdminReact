import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listBrands } from "../../api/brands";
import { createProduct, uploadProductImage } from "../../api/products";
import { useNavigate, useSearchParams } from "react-router-dom";

const input   = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn     = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };

export default function NewProduct() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // form
  const [nombre, setNombre] = useState("");
  const [brandId, setBrandId] = useState("");
  const [precioCompra, setPrecioCompra] = useState(""); // BOB/CLP? → tu backend lo guarda como Decimal (solo número)
  const [envio, setEnvio] = useState("50");             // BOB por defecto
  const [ganancia, setGanancia] = useState("150");      // BOB por defecto
  const [precioVenta, setPrecioVenta] = useState("");   // calculado
  const [autoCalc, setAutoCalc] = useState(true);       // controla si precioVenta se recalcula
  const [cantidad, setCantidad] = useState("0");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  // cargar marcas
  useEffect(() => {
    async function load() {
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
    load();
  }, [token]);

  // clonado rápido (opcional): si viene ?clone=ID podrías precargar desde store/estado; por simplicidad lo dejamos como futura mejora.

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
    if (nombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (!isFiniteNumber(pc) || pc < 0) return "Precio de compra inválido.";
    if (!isFiniteNumber(toNum(precioVenta)) || toNum(precioVenta) < 0) return "Precio de venta inválido.";
    const qty = Number(cantidad);
    if (!Number.isInteger(qty) || qty < 0) return "Cantidad inválida.";
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
      };
      const created = await createProduct(payload, token);
      let updated = created;
      if (image) {
        updated = await uploadProductImage(created.id, image, token);
      }
      setOk(`Producto creado: ${updated.nombre} (id ${updated.id})`);
      // ir al listado tras 1.5s o al instante
      setTimeout(() => nav("/perfumes"), 700);
    } catch (e) {
      setErr(e.message || "No se pudo crear el producto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Nuevo producto</h2>

      <form onSubmit={onSubmit}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end", marginTop: 12 }}>
        <div style={{ gridColumn: "span 2" }}>
          <label>Nombre</label>
          <input style={input} value={nombre} onChange={(e)=>setNombre(e.target.value)} placeholder="Sauvage EDT 100ml" required />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label>Marca</label>
          <select style={input} value={brandId} onChange={(e)=>setBrandId(e.target.value)} disabled={loadingBrands}>
            <option value="">(Sin marca)</option>
            {brands.sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

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

        <div>
          <label>Cantidad</label>
          <input style={input} type="number" min="0" step="1" value={cantidad} onChange={(e)=>setCantidad(e.target.value)} />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label>Imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={onFile} style={input} />
          {preview && <img src={preview} alt="preview" style={{ marginTop: 8, width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid #eee" }} />}
        </div>

        <div style={{ display: "flex", gap: 8, gridColumn: "span 2" }}>
          <button disabled={saving} style={btnPrim}>{saving ? "Guardando…" : "Guardar"}</button>
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
