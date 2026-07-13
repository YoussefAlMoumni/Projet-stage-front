(function () {
  const API_BASE = "http://localhost:8081/api";
  const ACCOUNTS_KEY = "creditflow.accounts";
  const SESSION_KEY = "creditflow.session";

  const demoAccounts = [
    {
      id: 1,
      username: "admin",
      password: "adminpass",
      role: "ROLE_ADMIN",
      firstName: "System",
      lastName: "Admin",
      email: "admin@talan.com",
      nationalId: "NID-admin"
    },
    {
      id: 2,
      username: "banker",
      password: "bankerpass",
      role: "ROLE_MANAGER",
      firstName: "Bank",
      lastName: "Manager",
      email: "banker@talan.com",
      nationalId: "NID-banker"
    },
    {
      id: 3,
      username: "analyst",
      password: "analystpass",
      role: "ROLE_ANALYST",
      firstName: "Senior",
      lastName: "Analyst",
      email: "analyst@talan.com",
      nationalId: "NID-analyst"
    }
  ];

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeRoleForStorage(role) {
    const value = String(role || "").trim().toUpperCase();
    if (value === "ROLE_ADMIN" || value === "ADMIN") {
      return "ROLE_ADMIN";
    }
    if (value === "ROLE_ANALYST" || value === "ANALYST") {
      return "ROLE_ANALYST";
    }
    return "ROLE_MANAGER";
  }

  function normalizeRoleForDisplay(role) {
    return normalizeRoleForStorage(role).replace("ROLE_", "").toLowerCase();
  }

  function normalizeAccount(account) {
    const username = String(account?.username || "").trim();
    if (!username) {
      return null;
    }

    return {
      ...account,
      id: Number(account?.id ?? 0) || 0,
      username,
      password: String(account?.password || ""),
      role: normalizeRoleForStorage(account?.role),
      firstName: String(account?.firstName || username).trim(),
      lastName: String(account?.lastName || username).trim(),
      email: String(account?.email || `${username}@talan.com`).trim(),
      nationalId: String(account?.nationalId || `NID-${username}`).trim()
    };
  }

  function getAccounts() {
    const stored = readJson(ACCOUNTS_KEY, []);
    const merged = demoAccounts.map((account) => normalizeAccount(account)).filter(Boolean);

    stored.forEach((account) => {
      const normalized = normalizeAccount(account);
      if (!normalized) {
        return;
      }
      if (!merged.some((item) => item.username === normalized.username)) {
        merged.push(normalized);
      }
    });

    return merged;
  }

  function nextAccountId() {
    return Math.max(0, ...getAccounts().map((item) => Number(item.id) || 0)) + 1;
  }

  function saveLocalAccount(account) {
    const normalized = normalizeAccount({
      ...account,
      id: account?.id || nextAccountId(),
      username: String(account?.username || "").trim(),
      password: String(account?.password || "")
    });

    if (!normalized || !normalized.password) {
      throw new Error("Username and password are required.");
    }

    const stored = readJson(ACCOUNTS_KEY, []);
    if (stored.some((item) => item.username === normalized.username) ||
        demoAccounts.some((item) => item.username === normalized.username)) {
      throw new Error("That username is already registered.");
    }

    stored.push(normalized);
    writeJson(ACCOUNTS_KEY, stored);
    return normalized;
  }

  function saveSession(session) {
    writeJson(SESSION_KEY, {
      username: session.username,
      role: normalizeRoleForStorage(session.role),
      token: session.token || null,
      source: session.source || "local"
    });
  }

  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getLocalFallback(path, options = {}) {
    const session = getSession();
    if (!session || session.source !== "local") {
      return null;
    }

    const method = String(options.method || "GET").toUpperCase();
    if (method === "GET" && path === "/admin/employees") {
      return getAccounts().map((account) => ({
        ...account,
        role: normalizeRoleForDisplay(account.role)
      }));
    }

    if (method === "GET" && path === "/manager/analysts") {
      return getAccounts()
        .filter((account) => normalizeRoleForStorage(account.role) === "ROLE_ANALYST")
        .map((account) => ({
          ...account,
          role: normalizeRoleForDisplay(account.role)
        }));
    }

    if (method === "GET" && path === "/analyst/dossiers/pending") {
      return [];
    }

    if (method === "POST" && path === "/admin/users") {
      const payload = JSON.parse(options.body || "{}");
      return saveLocalAccount(payload);
    }

    if (method === "PUT") {
      const id = Number(path.split("/").pop());
      if (!Number.isFinite(id)) {
        return null;
      }

      const stored = readJson(ACCOUNTS_KEY, []);
      const index = stored.findIndex((item) => Number(item.id) === id);
      if (index === -1) {
        return null;
      }

      const payload = JSON.parse(options.body || "{}");
      const updated = normalizeAccount({
        ...stored[index],
        ...payload,
        id,
        role: normalizeRoleForStorage(payload.role || stored[index].role),
        password: payload.password || stored[index].password
      });

      stored[index] = updated;
      writeJson(ACCOUNTS_KEY, stored);
      return {
        ...updated,
        role: normalizeRoleForDisplay(updated.role)
      };
    }

    if (method === "DELETE") {
      const id = Number(path.split("/").pop());
      if (!Number.isFinite(id)) {
        return null;
      }

      const stored = readJson(ACCOUNTS_KEY, []);
      writeJson(ACCOUNTS_KEY, stored.filter((item) => Number(item.id) !== id));
      return { message: "User deleted." };
    }

    return null;
  }

  async function requestJson(path, options = {}) {
    const requestOptions = {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...authHeader(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${API_BASE}${path}`, requestOptions);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed.");
      }
      return data;
    } catch (error) {
      const fallback = getLocalFallback(path, requestOptions);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  }

  async function postJson(path, payload) {
    return requestJson(path, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async function getJson(path) {
    return requestJson(path);
  }

  async function putJson(path, payload) {
    return requestJson(path, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async function deleteJson(path) {
    return requestJson(path, { method: "DELETE" });
  }

  function authHeader() {
    const session = getSession();
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  }

  async function signIn(username, password) {
    try {
      const data = await postJson("/auth/login", { username, password });
      saveSession({ username, role: data.role, token: data.token, source: "backend" });
      return;
    } catch (error) {
      const account = getAccounts().find((item) => item.username === username && item.password === password);
      if (!account) {
        throw error;
      }

      saveSession({ username: account.username, role: account.role, source: "local" });
    }
  }

  async function createAccount(username, password, role) {
    try {
      const data = await postJson("/auth/register", { username, password, role });
      saveSession({ username, role: data.role, token: data.token, source: "backend" });
      return;
    } catch (error) {
      if (!String(error.message).includes("Failed to fetch")) {
        throw error;
      }
    }

    saveLocalAccount({ username, password, role: normalizeRoleForStorage(role) });
    saveSession({ username, role: normalizeRoleForStorage(role), source: "local" });
  }

  window.CreditFlowAuth = {
    createAccount,
    deleteJson,
    getJson,
    postJson,
    putJson,
    signIn,
    getSession,
    clearSession
  };
})();
