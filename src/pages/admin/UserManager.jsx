import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminUserApi,
  fetchAdminUsersApi,
  updateAdminUserActiveApi,
  updateAdminUserRoleApi,
} from "../../services/adminService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./AdminPages.css";

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const createForm = () => ({
  fullName: "",
  email: "",
  password: "",
  role: "user",
});

const toAccount = (email = "") => String(email || "").split("@")[0] || "-";

export default function UserManager() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(createForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    if (!token) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchAdminUsersApi(token, { page: 1, limit: 200 });
      setUsers(result?.data || []);
    } catch (apiError) {
      notifyError(apiError, "Failed to load backend users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((item) => item.role === "admin").length;
    const activeCount = users.filter((item) => item.is_active).length;

    return {
      total,
      adminCount,
      userCount: total - adminCount,
      activeCount,
    };
  }, [users]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Admin backend login is required.");
      return;
    }

    const fullName = String(form.fullName || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");

    if (!fullName || !email || !password) {
      setError("Please enter full name, email, and password.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSaving(true);
      const result = await createAdminUserApi(
        {
          fullName,
          email,
          password,
          role: form.role,
        },
        token
      );

      setForm(createForm());
      setSuccess(`Created account ${result?.data?.email || email} successfully.`);
      notifySuccess("User created successfully");
      await loadUsers();
    } catch (apiError) {
      const message = apiError?.message || "Create user failed";
      setError(message);
      notifyError(apiError, "Create user failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    if (!token) return;

    try {
      await updateAdminUserRoleApi(userId, role, token);
      notifySuccess("Role updated");
      await loadUsers();
    } catch (apiError) {
      notifyError(apiError, "Role update failed");
    }
  };

  const handleToggleActive = async (user) => {
    if (!token) return;

    try {
      await updateAdminUserActiveApi(user.id, !user.is_active, token);
      notifySuccess("User status updated");
      await loadUsers();
    } catch (apiError) {
      notifyError(apiError, "User status update failed");
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Backend user manager</p>
            <h1>User management</h1>
            <p>This page is fully connected to backend admin APIs.</p>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-overview-card">
          <p>Total users</p>
          <strong>{userStats.total}</strong>
          <span>Total users returned by backend.</span>
        </article>
        <article className="admin-overview-card">
          <p>User role</p>
          <strong>{userStats.userCount}</strong>
          <span>Regular storefront accounts.</span>
        </article>
        <article className="admin-overview-card">
          <p>Admin role</p>
          <strong>{userStats.adminCount}</strong>
          <span>Accounts with admin permissions.</span>
        </article>
        <article className="admin-overview-card">
          <p>Active users</p>
          <strong>{userStats.activeCount}</strong>
          <span>Accounts currently active.</span>
        </article>
      </section>

      <section className="admin-panel">
        <h1>Backend user operations</h1>
        <p>Admin backend login is required.</p>
      </section>

      <section className="admin-form">
        <h2>Create account</h2>

        <div className="admin-user-stats">
          <span>Total: {userStats.total}</span>
          <span>User: {userStats.userCount}</span>
          <span>Admin: {userStats.adminCount}</span>
          <span>Active: {userStats.activeCount}</span>
        </div>

        <form className="admin-form-grid admin-user-create-grid" onSubmit={handleCreateUser}>
          <div className="admin-form-field">
            <label htmlFor="user-name">Full name</label>
            <input
              id="user-name"
              type="text"
              placeholder="Nguyen Van A"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
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
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              placeholder="At least 6 characters"
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

          <div className="admin-form-field full">
            <div className="admin-user-actions">
              <button type="submit" className="admin-btn" disabled={!token || saving}>
                {saving ? "CREATING..." : "CREATE ACCOUNT"}
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
              <th>Full name</th>
              <th>Account</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading users...</td>
              </tr>
            ) : null}

            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={7}>No users found.</td>
              </tr>
            ) : null}

            {!loading
              ? users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{toAccount(user.email)}</td>
                    <td>{user.email}</td>
                    <td>
                      <select value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`admin-status ${user.is_active ? "done" : "pending"}`}>
                        {user.is_active ? "Active" : "Locked"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="admin-btn-outline" onClick={() => handleToggleActive(user)}>
                        {user.is_active ? "Lock" : "Unlock"}
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
