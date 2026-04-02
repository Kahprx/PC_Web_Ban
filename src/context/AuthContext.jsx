/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { ApiError } from "../services/apiClient";
import { loginApi, profileApi, registerApi } from "../services/authService";

const SESSION_KEY = "pc_store_session";
const LOCAL_ACCOUNTS_KEY = "pc_store_local_accounts";

const LOCAL_SEED_ACCOUNTS = [
  {
    id: "local-1",
    account: "tk1",
    fullName: "User Demo",
    email: "tk1@demo.local",
    password: "123456",
    role: "user",
  },
  {
    id: "local-2",
    account: "tk2",
    fullName: "Admin Demo",
    email: "tk2@demo.local",
    password: "123456",
    role: "admin",
  },
];

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

const readLocalAccounts = () => {
  if (typeof window === "undefined") return [...LOCAL_SEED_ACCOUNTS];

  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const dynamic = Array.isArray(parsed) ? parsed : [];

    const merged = [...LOCAL_SEED_ACCOUNTS];

    dynamic.forEach((account) => {
      const exists = merged.some(
        (seed) =>
          seed.account.toLowerCase() === String(account.account || "").toLowerCase() ||
          seed.email.toLowerCase() === String(account.email || "").toLowerCase()
      );

      if (!exists) {
        merged.push(account);
      }
    });

    return merged;
  } catch {
    return [...LOCAL_SEED_ACCOUNTS];
  }
};

const writeLocalAccounts = (accounts) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const normalizeIdentity = ({ account, email }) => {
  const input = String(account ?? email ?? "").trim().toLowerCase();
  return input;
};

const toLocalSession = (account) => ({
  id: account.id || `acc-${Date.now()}`,
  email: account.email,
  account: account.account,
  name: account.fullName || account.account,
  role: account.role || "user",
  token: null,
  source: "local",
  loginAt: new Date().toISOString(),
});

const toBackendSession = (data) => ({
  id: `acc-${data.user.id}`,
  email: data.user.email,
  account: data.user.email.split("@")[0],
  name: data.user.full_name || data.user.email,
  role: data.user.role,
  token: data.token,
  source: "backend",
  loginAt: new Date().toISOString(),
});

const findLocalAccountByIdentity = (identity, accounts) => {
  if (!identity) return null;

  if (identity.includes("@")) {
    return accounts.find((item) => String(item.email || "").toLowerCase() === identity) || null;
  }

  return accounts.find((item) => String(item.account || "").toLowerCase() === identity) || null;
};

const shouldFallbackToLocal = (error, localAccounts, identity) => {
  if (!(error instanceof ApiError)) {
    return true;
  }

  if (!error.statusCode || error.statusCode >= 500) {
    return true;
  }

  if (error.statusCode === 401 && findLocalAccountByIdentity(identity, localAccounts)) {
    return true;
  }

  return false;
};

const tryLoginLocal = ({ identity, password, accounts }) => {
  if (!password) {
    throw new ApiError("M?t kh?u là b?t bu?c", 400);
  }

  const local = findLocalAccountByIdentity(identity, accounts);

  if (!local) {
    throw new ApiError("Không tìm th?y tài kho?n", 401);
  }

  if (String(local.password || "") !== String(password)) {
    throw new ApiError("Sai tài kho?n ho?c m?t kh?u", 401);
  }

  return toLocalSession(local);
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = async ({ account, email, password }) => {
    const identity = normalizeIdentity({ account, email });

    if (!identity) return null;

    const localAccounts = readLocalAccounts();

    if (!identity.includes("@")) {
      const localAccount = findLocalAccountByIdentity(identity, localAccounts);

      if (localAccount?.email && password) {
        try {
          const data = await loginApi({
            email: String(localAccount.email).toLowerCase(),
            password,
          });

          const backendSession = toBackendSession(data);
          setSession(backendSession);
          writeSession(backendSession);
          return backendSession;
        } catch (_error) {
          // fallback to local session below
        }
      }

      const localSession = tryLoginLocal({ identity, password, accounts: localAccounts });
      setSession(localSession);
      writeSession(localSession);
      return localSession;
    }

    if (!password) {
      throw new ApiError("M?t kh?u là b?t bu?c", 400);
    }

    try {
      const data = await loginApi({
        email: identity,
        password,
      });

      const nextSession = toBackendSession(data);

      setSession(nextSession);
      writeSession(nextSession);
      return nextSession;
    } catch (backendError) {
      const canFallbackLocal = shouldFallbackToLocal(backendError, localAccounts, identity);

      if (!canFallbackLocal) {
        throw backendError;
      }

      const localSession = tryLoginLocal({
        identity,
        password,
        accounts: localAccounts,
      });

      setSession(localSession);
      writeSession(localSession);
      return localSession;
    }
  };

  const register = async ({ fullName, email, password }) => {
    const safeName = String(fullName || "").trim();
    const safeEmail = String(email || "").trim().toLowerCase();
    const safePassword = String(password || "");

    if (!safeName || !safeEmail || !safePassword) {
      throw new ApiError("Vui lòng nh?p d?y d? thông tin.", 400);
    }

    if (!isValidEmail(safeEmail)) {
      throw new ApiError("Email không h?p l?.", 400);
    }

    if (safePassword.length < 6) {
      throw new ApiError("M?t kh?u t?i thi?u 6 ký t?.", 400);
    }

    try {
      const data = await registerApi({
        fullName: safeName,
        email: safeEmail,
        password: safePassword,
      });

      const nextSession = toBackendSession(data);

      setSession(nextSession);
      writeSession(nextSession);
      return nextSession;
    } catch (backendError) {
      const canFallbackLocal =
        !(backendError instanceof ApiError) ||
        !backendError.statusCode ||
        backendError.statusCode >= 500;

      if (!canFallbackLocal) {
        throw backendError;
      }

      const localAccounts = readLocalAccounts();
      const accountName = safeEmail.split("@")[0];

      const duplicated = localAccounts.some(
        (item) =>
          String(item.email || "").toLowerCase() === safeEmail ||
          String(item.account || "").toLowerCase() === accountName
      );

      if (duplicated) {
        throw new ApiError("Tài kho?n dã t?n t?i ? local demo.", 400);
      }

      const newLocalAccount = {
        id: `local-${Date.now()}`,
        account: accountName,
        fullName: safeName,
        email: safeEmail,
        password: safePassword,
        role: "user",
      };

      const nextAccounts = [...localAccounts, newLocalAccount];
      writeLocalAccounts(nextAccounts);

      const localSession = toLocalSession(newLocalAccount);
      setSession(localSession);
      writeSession(localSession);
      return localSession;
    }
  };

  const refreshProfile = async () => {
    if (!session?.token) return session;

    const profile = await profileApi(session.token);
    const nextSession = {
      ...session,
      email: profile.email,
      name: profile.full_name || session.name,
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




