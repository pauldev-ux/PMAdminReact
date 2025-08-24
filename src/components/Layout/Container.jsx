import React from "react";
export default function Container({ children }) {
  return <div style={{ maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>{children}</div>;
}
