import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listSales } from "../../api/sales";
import { listProducts } from "../../api/products";

const input  = { padding: 8, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn    = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const badge  = { padding: "10px 14px", border: "1px solid #eee", borderRadius: 12, background: "white" };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthStr() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function n2(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }

export default function Reports() {
  const { token } = useAuth();

  // filtros
  const [fromDate, setFromDate] = useState(firstDayOfMonthStr());
  const [toDate, setToDate] = useState(todayStr());
  const [qName, setQName] = useState("");

  // data
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // cargar datos
  async function load() {
    setLoading(true); setErr(null);
    try {
      const [s, p] = await Promise.all([
        listSales({ from_date: fromDate, to_date: toDate }, token),
        listProducts({}, token),
      ]);
      setSales(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p) ? p : []);
    } catch (e) {
      setErr(e.message || "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // índices útiles
  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // total stock (suma de cantidades actuales)
  const totalStock = useMemo(
    () => products.reduce((a, p) => a + (p.cantidad || 0), 0),
    [products]
  );

  // ventas enriquecidas + filtros por nombre de producto
  const salesEnriched = useMemo(() => {
    const nameQuery = qName.trim().toLowerCase();
    return sales.map(s => {
      // totales por venta
      let units = 0;
      let profit = 0; // BOB
      const names = [];

      for (const it of s.items || []) {
        const prod = productMap.get(it.product_id);
        const compra = prod ? n2(prod.precio_compra) : 0;  // DECIMAL -> Number
        const venta  = n2(it.precio_unitario_bob);
        const qty    = n2(it.cantidad);

        units += qty;
        profit += (venta - compra) * qty;
        if (prod) names.push(`${prod.nombre} x${qty}`);
      }

      const saleTotal = n2(s.total_bob);
      const matches = !nameQuery || names.join(" || ").toLowerCase().includes(nameQuery);

      return {
        ...s,
        __units: units,
        __profit: profit,
        __total: saleTotal,
        __names: names.join(", "),
        __matches: matches,
      };
    }).filter(x => x.__matches);
  }, [sales, productMap, qName]);

  // KPI agregados del filtro actual
  const kpis = useMemo(() => {
    const soldUnits = salesEnriched.reduce((a, s) => a + s.__units, 0);
    const totalSales = salesEnriched.reduce((a, s) => a + s.__total, 0);
    const totalProfit = salesEnriched.reduce((a, s) => a + s.__profit, 0);
    return { soldUnits, totalSales, totalProfit };
  }, [salesEnriched]);

  function onSubmit(e) { e.preventDefault(); load(); }

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Reporte de ventas</h2>

      {/* Filtros */}
      <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "160px 160px 1fr 120px 120px", gap: 8, alignItems: "end", margin: "12px 0" }}>
        <div>
          <label>Desde</label>
          <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} style={input} />
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} style={input} />
        </div>
        <div>
          <label>Producto (nombre)</label>
          <input value={qName} onChange={(e)=>setQName(e.target.value)} style={input} placeholder="ej. Sauvage" />
        </div>
        <button style={btn}>Buscar</button>
        <button type="button" style={btn} onClick={() => { setQName(""); setFromDate(firstDayOfMonthStr()); setToDate(todayStr()); load(); }}>
          Limpiar
        </button>
      </form>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
        <div style={badge}>
          <div style={{ color: "#666", fontSize: 12 }}>Productos en stock</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalStock}</div>
        </div>
        <div style={badge}>
          <div style={{ color: "#666", fontSize: 12 }}>Productos vendidos</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.soldUnits}</div>
        </div>
        <div style={badge}>
          <div style={{ color: "#666", fontSize: 12 }}>Total ventas (BOB)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.totalSales.toFixed(2)}</div>
        </div>
        <div style={badge}>
          <div style={{ color: "#666", fontSize: 12 }}>Ganancia (BOB)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.totalProfit.toFixed(2)}</div>
        </div>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{ color: "#b00020" }}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th># Venta</Th>
                <Th>Productos</Th>
                <Th>Unidades</Th>
                <Th>Total (BOB)</Th>
                <Th>Ganancia (BOB)</Th>
              </tr>
            </thead>
            <tbody>
              {salesEnriched.map(s => (
                <tr key={s.id}>
                  <Td>{s.fecha_venta?.slice(0,10)}</Td>
                  <Td>{s.id}</Td>
                  <Td style={{ maxWidth: 520 }}>{s.__names || "-"}</Td>
                  <Td>{s.__units}</Td>
                  <Td>{s.__total.toFixed(2)}</Td>
                  <Td>{s.__profit.toFixed(2)}</Td>
                </tr>
              ))}
              {salesEnriched.length === 0 && (
                <tr><Td colSpan={6} style={{ color: "#666" }}>No hay ventas para estos filtros.</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600 }}>{children}</th>;
}
function Td({ children, ...rest }) {
  return <td {...rest} style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{children}</td>;
}
