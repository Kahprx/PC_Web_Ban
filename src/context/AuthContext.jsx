/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { ApiError } from "../services/apiClient";
import { loginApi, profileApi, registerApi } from "../services/authService";

const SESSION_KEY = "pc_store_session";

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const readSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (session) => {
  if (typeof window === "undefined") return;

  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem("user", JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("user");
  }
};

const toBackendSession = (data) => ({
  id: `acc-${data.user.id}`,
  email: data.user.email,
  account: data.user.email.split("@")[0],
  name: data.user.full_name || data.user.email,
  phone: data.user.phone || "",
  birthDate: data.user.birth_date || "",
  defaultShippingAddress: data.user.default_shipping_address || "",
  deliveryNote: data.user.delivery_note || "",
  role: data.user.role,
  token: data.token,
  source: "backend",
  loginAt: new Date().toISOString(),
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = async ({ email, password }) => {
    const safeEmail = String(email || "").trim().toLowerCase();
    const safePassword = String(password || "");

    if (!safeEmail || !isValidEmail(safeEmail)) {
      throw new ApiError("Invalid email.", 400);
    }

    if (!safePassword) {
      throw new ApiError("Password is required.", 400);
    }

    const data = await loginApi({
      email: safeEmail,
      password: safePassword,
    });

    const nextSession = toBackendSession(data);
    setSession(nextSession);
    writeSession(nextSession);
    return nextSession;
  };

  const register = async ({ fullName, email, password }) => {
    const safeName = String(fullName || "").trim();
    const safeEmail = String(email || "").trim().toLowerCase();
    const safePassword = String(password || "");

    if (!safeName || !safeEmail || !safePassword) {
      throw new ApiError("Please fill all required fields.", 400);
    }

    if (!isValidEmail(safeEmail)) {
      throw new ApiError("Invalid email.", 400);
    }

    if (safePassword.length < 6) {
      throw new ApiError("Password must be at least 6 characters.", 400);
    }

    const data = await registerApi({
      fullName: safeName,
      email: safeEmail,
      password: safePassword,
    });

    const nextSession = toBackendSession(data);
    setSession(nextSession);
    writeSession(nextSession);
    return nextSession;
  };

  const refreshProfile = async () => {
    if (!session?.token) return session;

    const profile = await profileApi(session.token);
    const nextSession = {
      ...session,
      email: profile.email,
      name: profile.full_name || session.name,
      phone: profile.phone || "",
      birthDate: profile.birth_date || "",
      defaultShippingAddress: profile.default_shipping_address || "",
      deliveryNote: profile.delivery_note || "",
      role: profile.role,
    };

    setSession(nextSession);
    writeSession(nextSession);
    return nextSession;
  };

  const logout = () => {
    setSession(null);
    writeSession(null);
  };

  const value = {
    session,
    role: session?.role || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === "admin",
    isUser: session?.role === "user",
    login,
    register,
    refreshProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
