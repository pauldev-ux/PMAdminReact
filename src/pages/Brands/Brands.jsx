import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listBrands, createBrand } from "../../api/brands";

const input = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn   = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };

export default function Brands() {
  const { token } = useAuth();
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  async function load() {
    setLoading(true); setErr(null); setOk(null);
    try {
      const data = await listBrands(token);
      setBrands(data || []);
    } catch (e) {
      setErr(e.message || "Error cargando marcas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = (brands || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
    return q ? arr.filter(b => b.nombre.toLowerCase().includes(q)) : arr;
  }, [brands, search]);

  async function onCreate(e) {
    e.preventDefault();
    setErr(null); setOk(null);
    const n = name.trim();
    if (n.length < 2) { setErr("El nombre debe tener al menos 2 caracteres."); return; }
    setSaving(true);
    try {
      const created = await createBrand(n, token);
      setOk(`Marca creada: ${created.nombre} (id ${created.id})`);
      setName("");
      // agrega sin recargar
      setBrands(prev => [...prev, created]);
    } catch (e) {
      setErr(e.message || "No se pudo crear la marca");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Marca</h2>

      {/* Crear marca */}
      <form onSubmit={onCreate} style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8, maxWidth: 520, marginBottom: 16 }}>
        <input
          style={input}
          placeholder="Nueva marca (ej. Dior, Chanel, etc.)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button disabled={saving} style={btn}>{saving ? "Guardando…" : "Añadir"}</button>
      </form>

      {/* Feedback */}
      {err && <div style={{ color: "#b00020", marginBottom: 8 }}>{err}</div>}
      {ok &&  <div style={{ color: "#0a7e07", marginBottom: 8 }}>{ok}</div>}

      {/* Buscar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, maxWidth: 420 }}>
        <input
          style={input}
          placeholder="Buscar marca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={load} style={btn}>Recargar</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#666" }}>No hay marcas.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <Td>{b.id}</Td>
                  <Td>{b.nombre}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, color: "#666" }}>
            Total: <b>{filtered.length}</b> {search ? `(filtrado de ${brands.length})` : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{children}</td>;
}
