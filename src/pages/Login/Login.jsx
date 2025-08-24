import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(username, password);
      nav("/", { replace: true }); // → Home
    } catch (e) {
      setErr(e?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "12vh auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 12 }}>Iniciar sesión</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          <div>Usuario</div>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} placeholder="admin" />
        </label>
        <label>
          <div>Contraseña</div>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" style={inputStyle} placeholder="••••••" />
        </label>
        {err && <div style={{ color: "#b00020" }}>{err}</div>}
        <button disabled={loading} style={primaryBtnStyle}>{loading ? "Ingresando…" : "Entrar"}</button>
      </form>
    </div>
  );
}

const inputStyle = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const primaryBtnStyle = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };
