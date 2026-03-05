import { useMemo, useState } from "react";
import "./AdminPages.css";

const LOCAL_ACCOUNTS_KEY = "pc_store_local_accounts";
const SEED_IDS = new Set(["local-1", "local-2"]);

const LOCAL_SEED_ACCOUNTS = [
  {
    id: "local-1",
    account: "tk1",
    fullName: "User Demo",
    email: "tk1@demo.local",
    password: "123456",
    role: "user",
    active: true,
  },
  {
    id: "local-2",
    account: "tk2",
    fullName: "Admin Demo",
    email: "tk2@demo.local",
    password: "123456",
    role: "admin",
    active: true,
  },
];

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeAccount = (item, index = 0) => {
  const rawEmail = String(item?.email || "").trim().toLowerCase();
  const fallbackAccount = rawEmail ? rawEmail.split("@")[0] : `user${index + 1}`;
  const rawAccount = String(item?.account || fallbackAccount).trim().toLowerCase();
  const id = item?.id || `local-${Date.now()}-${index}`;

  return {
    id,
    fullName: String(item?.fullName || item?.name || rawAccount || `User ${index + 1}`).trim(),
    account: rawAccount,
    email: rawEmail || `${rawAccount}@demo.local`,
    password: String(item?.password || "123456"),
    role: item?.role === "admin" ? "admin" : "user",
    active: item?.active !== false,
    isSeed: SEED_IDS.has(id),
  };
};

const readAccounts = () => {
  if (typeof window === "undefined") {
    return LOCAL_SEED_ACCOUNTS.map(normalizeAccount);
  }

  const merged = LOCAL_SEED_ACCOUNTS.map(normalizeAccount);

  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const dynamic = Array.isArray(parsed) ? parsed.map(normalizeAccount) : [];

    dynamic.forEach((item) => {
      const existedIndex = merged.findIndex(
        (seed) =>
          seed.id === item.id ||
          seed.account.toLowerCase() === item.account.toLowerCase() ||
          seed.email.toLowerCase() === item.email.toLowerCase()
      );

      if (existedIndex >= 0) {
        merged[existedIndex] = { ...merged[existedIndex], ...item, isSeed: SEED_IDS.has(merged[existedIndex].id) };
      } else {
        merged.push(item);
      }
    });
  } catch {
    return merged;
  }

  return merged;
};

const writeAccounts = (accounts) => {
  if (typeof window === "undefined") return;

  const payload = accounts.map((item) => {
    const nextItem = { ...item };
    delete nextItem.isSeed;
    return nextItem;
  });

  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(payload));
};

const createForm = () => ({
  fullName: "",
  account: "",
  email: "",
  password: "",
  role: "user",
  active: true,
});

export default function UserManager() {
  const [users, setUsers] = useState(() => readAccounts());
  const [form, setForm] = useState(createForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((item) => item.role === "admin").length;
    const activeCount = users.filter((item) => item.active).length;

    return {
      total,
      adminCount,
      userCount: total - adminCount,
      activeCount,
    };
  }, [users]);

  const persistUsers = (nextUsers) => {
    const normalized = nextUsers.map((item, index) => normalizeAccount(item, index));
    setUsers(normalized);
    writeAccounts(normalized);
  };

  const handleCreateUser = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const fullName = String(form.fullName || "").trim();
    const account = String(form.account || "").trim().toLowerCase();
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");

    if (!fullName || !account || !email || !password) {
      setError("Vui long nhap du ho ten, tai khoan, email va mat khau.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Email khong hop le.");
      return;
    }

    if (password.length < 6) {
      setError("Mat khau toi thieu 6 ky tu.");
      return;
    }

    const duplicated = users.some(
      (item) =>
        String(item.account || "").toLowerCase() === account ||
        String(item.email || "").toLowerCase() === email
    );

    if (duplicated) {
      setError("Tai khoan hoac email da ton tai.");
      return;
    }

    const created = normalizeAccount(
      {
        id: `local-${Date.now()}`,
        fullName,
        account,
        email,
        password,
        role: form.role,
        active: form.active,
      },
      users.length
    );

    persistUsers([created, ...users]);
    setForm(createForm());
    setSuccess(`Da them tai khoan ${created.account} thanh cong.`);
  };

  const handleRoleChange = (id, role) => {
    const next = users.map((item) => {
      if (item.id !== id || item.isSeed) return item;
      return { ...item, role: role === "admin" ? "admin" : "user" };
    });

    persistUsers(next);
  };

  const handleToggleActive = (id) => {
    const next = users.map((item) => {
      if (item.id !== id || item.isSeed) return item;
      return { ...item, active: !item.active };
    });

    persistUsers(next);
  };

  return (
    <div className="admin-page">
      <section className="admin-panel">
        <h1>Quan ly nguoi dung</h1>
        <p>Them tai khoan moi truc tiep tu trang admin va phan quyen user/admin.</p>
      </section>

      <section className="admin-form">
        <h2>Them tai khoan</h2>

        <div className="admin-user-stats">
          <span>Tong: {userStats.total}</span>
          <span>User: {userStats.userCount}</span>
          <span>Admin: {userStats.adminCount}</span>
          <span>Dang hoat dong: {userStats.activeCount}</span>
        </div>

        <form className="admin-form-grid admin-user-create-grid" onSubmit={handleCreateUser}>
          <div className="admin-form-field">
            <label htmlFor="user-name">Ho ten</label>
            <input
              id="user-name"
              type="text"
              placeholder="Nguyen Van A"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="user-account">Tai khoan</label>
            <input
              id="user-account"
              type="text"
              placeholder="nguyenvana"
              value={form.account}
              onChange={(event) => setForm((prev) => ({ ...prev, account: event.target.value }))}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="user-password">Mat khau</label>
            <input
              id="user-password"
              type="password"
              placeholder="Toi thieu 6 ky tu"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="admin-form-field">
            <label htmlFor="user-status">Trang thai</label>
            <select
              id="user-status"
              value={form.active ? "active" : "inactive"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  active: event.target.value === "active",
                }))
              }
            >
              <option value="active">Dang hoat dong</option>
              <option value="inactive">Tam khoa</option>
            </select>
          </div>

          <div className="admin-form-field full">
            <div className="admin-user-actions">
              <button type="submit" className="admin-btn">
                THEM TAI KHOAN
              </button>
              <button type="button" className="admin-btn-outline" onClick={() => setForm(createForm())}>
                RESET
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-form-field full">
              <p className="admin-inline-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="admin-form-field full">
              <p className="admin-inline-success">{success}</p>
            </div>
          )}
        </form>
      </section>

      <section className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ho ten</th>
              <th>Tai khoan</th>
              <th>Email</th>
              <th>Role</th>
              <th>Trang thai</th>
              <th>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.fullName}</td>
                <td>{user.account}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    disabled={user.isSeed}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span className={`admin-status ${user.active ? "done" : "pending"}`}>
                    {user.active ? "Dang hoat dong" : "Tam khoa"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn-outline"
                    onClick={() => handleToggleActive(user.id)}
                    disabled={user.isSeed}
                  >
                    {user.active ? "Khoa" : "Mo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
