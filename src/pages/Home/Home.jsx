import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listProducts } from "../../api/products";

export default function Home() {
  const { user, token, loadingUser } = useAuth();
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) return;
      try {
        const data = await listProducts({ only_active: true }, token);
        if (alive) setCount(data.length);
      } catch (e) {
        if (alive) setError(e.message);
      }
    }
    load();
    return () => { alive = false; };
  }, [token]);

  if (loadingUser) return <div style={{ padding: 24 }}>Cargando usuario…</div>;

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h2>
        ¡Bienvenido{user?.full_name ? `, ${user.full_name}` : user ? `, ${user.username}` : ""}! 🧴
      </h2>
      <p style={{ color: "#555" }}>
        Has iniciado sesión correctamente. El frontend ya está conectado al backend.
      </p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <b>Prueba de conexión:</b>
        {error && <div style={{ color: "#b00020", marginTop: 8 }}>Error: {error}</div>}
        {count !== null && !error && <div style={{ marginTop: 8 }}>Productos activos encontrados: <b>{count}</b></div>}
        {count === null && !error && <div style={{ marginTop: 8 }}>Consultando /products…</div>}
      </div>
    </div>
  );
}
