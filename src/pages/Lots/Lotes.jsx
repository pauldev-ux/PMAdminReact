import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listLots } from "../../api/lots";
import { listProducts } from "../../api/products";
import { listBrands } from "../../api/brands";
import { useNavigate } from "react-router-dom";

const input  = { padding: 8, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn    = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim= { padding: "8px 12px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };
const badge  = { padding: "10px 14px", border: "1px solid #eee", borderRadius: 12, background: "white" };

function todayStr(){ return new Date().toISOString().slice(0,10); }
function firstDayOfMonthStr(){ const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10); }
const n2 = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

export default function Lotes(){
  const { token } = useAuth();
  const nav = useNavigate();

  // filtros
  const [fromDate, setFromDate] = useState(firstDayOfMonthStr());
  const [toDate, setToDate] = useState(todayStr());
  const [lotId, setLotId] = useState("");     // filtrar por un lote específico
  const [qName, setQName] = useState("");     // por nombre de producto o lote

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
      const [ls, ps, bs] = await Promise.all([
        listLots({ from_date: fromDate, to_date: toDate }, token),
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
    // ordenar por fecha lote desc
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
        <h2>Lotes</h2>
        <button onClick={()=>nav("/lotes/nuevo")} style={btnPrim}>Nuevo lote</button>
      </div>

      {/* filtros */}
      <form onSubmit={onSubmit} style={{ display:"grid", gridTemplateColumns:"160px 160px 1fr 220px 120px 120px", gap:8, alignItems:"end", margin:"12px 0" }}>
        <div>
          <label>Desde</label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={input}/>
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={input}/>
        </div>
        <div>
          <label>Buscar (lote o producto)</label>
          <input value={qName} onChange={e=>setQName(e.target.value)} style={input} placeholder="Nombre de lote o producto"/>
        </div>
        <div>
          <label>Lote</label>
          <select value={lotId} onChange={e=>setLotId(e.target.value)} style={input}>
            <option value="">(Todos)</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.fecha?.slice(0,10)}</option>)}
          </select>
        </div>
        <button style={btn}>Buscar</button>
        <button type="button" style={btn} onClick={()=>{ setLotId(""); setQName(""); setFromDate(firstDayOfMonthStr()); setToDate(todayStr()); load(); }}>
          Limpiar
        </button>
      </form>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:10, marginBottom:12 }}>
        <div style={badge}><div style={{color:"#666",fontSize:12}}>N.º lotes</div><div style={{fontSize:22,fontWeight:700}}>{kpis.lotCount}</div></div>
        <div style={badge}><div style={{color:"#666",fontSize:12}}>Unidades</div><div style={{fontSize:22,fontWeight:700}}>{kpis.units}</div></div>
        <div style={badge}><div style={{color:"#666",fontSize:12}}>Total invertido</div><div style={{fontSize:22,fontWeight:700}}>{kpis.invested.toFixed(2)}</div></div>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{color:"#b00020"}}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Lote</Th>
                <Th>Producto</Th>
                <Th>Marca</Th>
                <Th>Cantidad</Th>
                <Th>Costo unit</Th>
                <Th>Total</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.lot_id}-${r.product_id}-${i}`}>
                  <Td>{r.fecha}</Td>
                  <Td>{r.lot_name}</Td>
                  <Td>{r.product_name}</Td>
                  <Td>{r.brand_name}</Td>
                  <Td>{r.qty}</Td>
                  <Td>{r.unit.toFixed(2)}</Td>
                  <Td>{r.total.toFixed(2)}</Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><Td colSpan={7} style={{ color:"#666" }}>No hay resultados con estos filtros.</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({children}){ return <th style={{ textAlign:"left", padding:8, borderBottom:"1px solid #eee", fontWeight:600 }}>{children}</th>; }
function Td({children, ...rest}){ return <td {...rest} style={{ padding:8, borderBottom:"1px solid #f3f3f3" }}>{children}</td>; }
