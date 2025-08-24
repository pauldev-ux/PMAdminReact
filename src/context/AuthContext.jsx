import React, { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, meRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!token);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      if (!token) return;
      try {
        const u = await meRequest(token);
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, [token]);

  async function login(username, password) {
    const { access_token } = await loginRequest(username, password);
    localStorage.setItem("token", access_token);
    setToken(access_token);
    const u = await meRequest(access_token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
