import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user, loadingUser } = useAuth();

  if (loadingUser) return <div style={{ padding: 24 }}>Cargando usuario…</div>;

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h2>¡Bienvenido{user?.full_name ? `, ${user.full_name}` : user ? `, ${user.username}` : ""}! 🧴</h2>
      <p style={{ color: "#555" }}>
        Has iniciado sesión correctamente. Desde aquí podrás gestionar productos y ventas.
      </p>
    </div>
  );
}
