import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createLot } from "../../api/lots";
import { useNavigate } from "react-router-dom";

const input  = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn    = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim= { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };

function todayStr(){ return new Date().toISOString().slice(0,10); }

export default function NewLot(){
  const { token } = useAuth();
  const nav = useNavigate();

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(todayStr());
  const [descripcion, setDescripcion] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  async function onSubmit(e){
    e.preventDefault();
    setErr(null); setOk(null);

    if (!nombre.trim()) { setErr("El nombre del lote es obligatorio."); return; }

    setSaving(true);
    try{
      // Nota: no enviamos items; el backend lo admite y crea el lote vacío
      const payload = { nombre: nombre.trim(), fecha, descripcion: descripcion || null };
      await createLot(payload, token);
      setOk("Lote creado correctamente");
      setTimeout(()=>nav("/lotes"), 600);
    }catch(e){
      setErr(e.message || "No se pudo crear el lote");
    }finally{
      setSaving(false);
    }
  }

  return (
    <div style={{ padding:"16px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
        <h2>Nuevo lote</h2>
        <button onClick={()=>nav("/lotes")} style={btn}>Volver</button>
      </div>

      <form onSubmit={onSubmit} style={{ display:"grid", gridTemplateColumns:"1fr 200px", gap:12, alignItems:"end", marginTop:12 }}>
        <div>
          <label>Nombre del lote</label>
          <input style={input} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Lote Agosto 2025"/>
        </div>
        <div>
          <label>Fecha</label>
          <input type="date" style={input} value={fecha} onChange={e=>setFecha(e.target.value)}/>
        </div>
        <div style={{ gridColumn:"span 2" }}>
          <label>Descripción (opcional)</label>
          <input style={input} value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="comentarios, proveedor, etc."/>
        </div>

        <div style={{ gridColumn:"span 2", display:"flex", gap:8 }}>
          <button disabled={saving} style={btnPrim}>{saving ? "Guardando…" : "Crear lote"}</button>
          <button type="button" onClick={()=>nav("/lotes")} style={btn}>Cancelar</button>
        </div>

        {err && <div style={{ color:"#b00020", gridColumn:"span 2" }}>{err}</div>}
        {ok  && <div style={{ color:"#0a7e07", gridColumn:"span 2" }}>{ok}</div>}
      </form>

      <div style={{ marginTop:12, color:"#666", fontSize:12 }}>
        El lote se crea vacío. Luego podrás asociar productos al crearlos (seleccionando este lote) o
        añadirlos desde una pantalla de “agregar productos al lote”.
      </div>
    </div>
  );
}
