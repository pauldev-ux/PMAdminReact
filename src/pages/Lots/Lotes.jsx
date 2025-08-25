import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listLots } from "../../api/lots";
import { listProducts } from "../../api/products";
import { listBrands } from "../../api/brands";
import { useNavigate } from "react-router-dom";

const badge  = { padding: "10px 14px", border: "1px solid #eee", borderRadius: 12, background: "white" };
const n2 = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

export default function Lotes(){
  const { token } = useAuth();
  const nav = useNavigate();

  // filtros (vacíos ⇒ mostrar TODO)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [lotId, setLotId] = useState("");
  const [qName, setQName] = useState("");

  // toggles UI
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // data
  const [lots, setLots] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load(){
    setLoading(true); setErr(null);
    try{
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const [ls, ps, bs] = await Promise.all([
        listLots(params, token),
        listProducts({}, token),
        listBrands(token),
      ]);
      setLots(Array.isArray(ls) ? ls : []);
      setProducts(Array.isArray(ps) ? ps : []);
      setBrands(Array.isArray(bs) ? bs : []);
    }catch(e){
      setErr(e.message || "Error cargando lotes");
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);

  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);
  const brandNameById = useMemo(() => {
    const m = new Map();
    for (const b of brands) m.set(b.id, b.nombre);
    return m;
  }, [brands]);

  // Normalizamos a filas por item, con filtros
  const rows = useMemo(() => {
    const q = qName.trim().toLowerCase();
    const selected = lotId ? Number(lotId) : null;

    const arr = [];
    for (const l of lots) {
      if (selected && l.id !== selected) continue;
      const lotName = l.nombre || `Lote #${l.id}`;
      for (const it of l.items || []) {
        const prod = productMap.get(it.product_id);
        const pname = prod?.nombre || `#${it.product_id}`;
        const bname = prod?.brand_id ? (brandNameById.get(prod.brand_id) || "-") : "-";
        const row = {
          lot_id: l.id,
          lot_name: lotName,
          fecha: l.fecha?.slice(0,10),
          product_id: it.product_id,
          product_name: pname,
          brand_name: bname,
          qty: n2(it.cantidad),
          unit: n2(it.costo_unitario_bob),
          total: n2(it.subtotal_bob),
        };
        if (q && !(row.product_name.toLowerCase().includes(q) || lotName.toLowerCase().includes(q))) continue;
        arr.push(row);
      }
    }
    return arr.sort((a,b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  }, [lots, productMap, brandNameById, lotId, qName]);

  // KPIs
  const kpis = useMemo(() => {
    const lotCount = new Set(rows.map(r => r.lot_id)).size;
    const units    = rows.reduce((a,r)=>a+r.qty,0);
    const invested = rows.reduce((a,r)=>a+r.total,0);
    return { lotCount, units, invested };
  }, [rows]);

  function onSubmit(e){ e.preventDefault(); load(); }

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Header + iconos */}
      <div className="pm-page-head">
        <h2>Lotes</h2>
        <div className="pm-row">
          <button onClick={()=>nav("/lotes/nuevo")} className="pm-btn primary">Nuevo lote</button>

          <button
            type="button"
            className="pm-btn ghost"
            title="Buscar producto"
            aria-label="Buscar"
            onClick={()=>setShowSearch(v=>!v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <button
            type="button"
            className="pm-btn ghost"
            title="Filtrar por fecha"
            aria-label="Filtro"
            onClick={()=>setShowFilters(v=>!v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h18l-7 8v6l-4 2v-8z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      {showSearch && (
        <div style={{ marginBottom: 10 }}>
          <input
            className="pm-input"
            value={qName}
            onChange={e=>setQName(e.target.value)}
            placeholder="producto"
          />
        </div>
      )}

      {/* Filtros fecha */}
      {showFilters && (
        <form onSubmit={onSubmit} className="pm-form" style={{ margin: "8px 0 12px" }}>
          <div>
            <label className="pm-label">Desde</label>
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="pm-input"/>
          </div>
          <div>
            <label className="pm-label">Hasta</label>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="pm-input"/>
          </div>
          <div>
            <label className="pm-label">Lote</label>
            <select value={lotId} onChange={e=>setLotId(e.target.value)} className="pm-select">
              <option value="">(Todos)</option>
              {lots.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.fecha?.slice(0,10)}</option>)}
            </select>
          </div>
          <div className="pm-row" style={{ gap:8 }}>
            <button className="pm-btn">Aplicar</button>
            <button type="button" className="pm-btn" onClick={()=>{ setLotId(""); setFromDate(""); setToDate(""); load(); }}>
              Limpiar
            </button>
          </div>
        </form>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:10, marginBottom:12 }}>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>N.º lotes</div><div style={{fontSize:22,fontWeight:700}}>{kpis.lotCount}</div></div>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>Unidades</div><div style={{fontSize:22,fontWeight:700}}>{kpis.units}</div></div>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>Total invertido</div><div style={{fontSize:22,fontWeight:700}}>{kpis.invested.toFixed(2)}</div></div>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{color:"#b00020"}}>{err}</div>}

      {!loading && !err && (
  <div className="lots-list">
    {rows.map((r, i) => (
      <article key={`${r.lot_id}-${r.product_id}-${i}`} className="lot-card">
        {/* Fila 1: Lote y fecha */}
        <div className="lot-top">
          <div className="lot-name"><b>{r.lot_name}</b></div>
          <div className="lot-date">{r.fecha}</div>
        </div>

        {/* Fila 2: Producto + Marca */}
        <div className="lot-products">
          <div><b>{r.product_name}</b></div>
          <div className="pm-muted" style={{ fontSize: 12 }}>Marca: {r.brand_name}</div>
        </div>

        {/* Fila 3: Cantidad, Costo unit, Total */}
        <div className="lot-totals">
          <div className="kv">
            <span>Cantidad</span>
            <span>{r.qty}</span>
          </div>
          <div className="kv">
            <span>Costo unit</span>
            <span>{r.unit.toFixed(2)}</span>
          </div>
          <div className="kv">
            <span>Total (BOB)</span>
            <span><b>{r.total.toFixed(2)}</b></span>
          </div>
        </div>
      </article>
    ))}

    {rows.length === 0 && (
      <div className="pm-muted">No hay resultados con estos filtros.</div>
    )}
  </div>
)}

    </div>
  );
}

function Th({children, className=""}){ return <th className={className} style={{ textAlign:"left", padding:".6rem .7rem", borderBottom:"1px solid var(--border)", fontWeight:600 }}>{children}</th>; }
function Td({children, className="", ...rest}){ return <td className={className} {...rest} style={{ padding:".6rem .7rem", borderBottom:"1px solid var(--border)" }}>{children}</td>; }
