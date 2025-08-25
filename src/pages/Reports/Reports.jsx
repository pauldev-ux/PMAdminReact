import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listSales } from "../../api/sales";
import { listProducts } from "../../api/products";

const badge  = { padding: "10px 14px", border: "1px solid #eee", borderRadius: 12, background: "white" };

function todayStr() { return new Date().toISOString().slice(0, 10); }
function firstDayOfMonthStr() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function n2(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }

export default function Reports() {
  const { token } = useAuth();

  // filtros (vacíos por defecto ⇒ mostrar TODO)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [qName, setQName] = useState("");

  // toggles UI
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const [s, p] = await Promise.all([
        listSales(params, token),
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
      let units = 0;
      let profit = 0;
      const names = [];

      for (const it of s.items || []) {
        const prod = productMap.get(it.product_id);
        const compra = prod ? n2(prod.precio_compra) : 0;
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
      {/* Header + iconos */}
      <div className="pm-page-head">
        <h2>Reporte de ventas</h2>
        <div className="pm-row">
          {/* Buscar */}
          <button
            type="button"
            className="pm-btn ghost"
            title="Buscar producto"
            aria-label="Buscar"
            onClick={()=>setShowSearch(v=>!v)}
          >
            {/* Lupa */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Filtros fecha */}
          <button
            type="button"
            className="pm-btn ghost"
            title="Filtrar por fecha"
            aria-label="Filtro"
            onClick={()=>setShowFilters(v=>!v)}
          >
            {/* Embudo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h18l-7 8v6l-4 2v-8z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Caja de búsqueda (toggle) */}
      {showSearch && (
        <div style={{ marginBottom: 10 }}>
          <input
            className="pm-input"
            value={qName}
            onChange={(e)=>setQName(e.target.value)}
            placeholder="producto"
          />
        </div>
      )}

      {/* Filtros fecha (toggle) */}
      {showFilters && (
        <form onSubmit={onSubmit} className="pm-form" style={{ margin: "8px 0 12px" }}>
          <div>
            <label className="pm-label">Desde</label>
            <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="pm-input" />
          </div>
          <div>
            <label className="pm-label">Hasta</label>
            <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="pm-input" />
          </div>
          <div className="pm-row" style={{ gap: 8 }}>
            <button className="pm-btn">Aplicar</button>
            <button
              type="button"
              className="pm-btn"
              onClick={()=>{ setFromDate(""); setToDate(""); load(); }}
            >
              Limpiar
            </button>
          </div>
        </form>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>Productos en stock</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totalStock}</div></div>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>Productos vendidos</div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.soldUnits}</div></div>
        <div style={badge}><div className="pm-muted" style={{fontSize:12}}>Total ventas (BOB)</div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.totalSales.toFixed(2)}</div></div>
        <div style={badge}><div className="pm-muted" style={{ fontSize: 12 }}>Ganancia (BOB)</div><div className={`profit kpi-value ${kpis.totalProfit < 0 ? "neg" : ""}`}>{kpis.totalProfit.toFixed(2)}
      </div>
    </div>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{ color: "#b00020" }}>{err}</div>}

      {!loading && !err && (
  <div className="sales-list">
    {salesEnriched.map(s => (
      <article key={s.id} className="sale-card">
        {/* Fila 1: # venta y fecha */}
        <div className="sale-top">
          <div className="sale-no">#{s.id}</div>
          <div className="sale-date">{s.fecha_venta?.slice(0,10)}</div>
        </div>

        {/* Fila 2: productos */}
        <div className="sale-products">
          {s.__names || "-"}
        </div>

        {/* Fila 3: totales */}
        <div className="sale-totals">
          <div className="kv">
            <span className="pm-muted">Unidades</span>
            <span>{s.__units}</span>
          </div>
          <div className="kv">
            <span className="pm-muted">Total (BOB)</span>
            <span>{s.__total.toFixed(2)}</span>
          </div>
          <div className="kv">
            <span className="pm-muted">Ganancia (BOB)</span>
            <b className="profit">{s.__profit.toFixed(2)}</b>
          </div>
        </div>
      </article>
    ))}

    {salesEnriched.length === 0 && (
      <div className="pm-muted">No hay ventas para estos filtros.</div>
    )}
  </div>
)}

    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={className} style={{ textAlign: "left", padding: ".6rem .7rem", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{children}</th>;
}
function Td({ children, className = "", ...rest }) {
  return <td className={className} {...rest} style={{ padding: ".6rem .7rem", borderBottom: "1px solid var(--border)" }}>{children}</td>;
}
