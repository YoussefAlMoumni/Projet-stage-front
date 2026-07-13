(function () {
  const API_BASE = "http://localhost:8081/api";
  const ACCOUNTS_KEY = "creditflow.accounts";
  const SESSION_KEY = "creditflow.session";

  const demoAccounts = [
    { username: "admin", password: "adminpass", role: "ROLE_ADMIN" },
    { username: "manager", password: "managerpass", role: "ROLE_MANAGER" },
    { username: "banker", password: "bankerpass", role: "ROLE_MANAGER" },
    { username: "analyst", password: "analystpass", role: "ROLE_ANALYST" }
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

  function getAccounts() {
    const stored = readJson(ACCOUNTS_KEY, []);
    const merged = [...demoAccounts];
    stored.forEach((account) => {
      if (!merged.some((item) => item.username === account.username)) {
        merged.push(account);
      }
    });
    return merged;
  }

  function saveLocalAccount(account) {
    const stored = readJson(ACCOUNTS_KEY, []);
    if (stored.some((item) => item.username === account.username) ||
        demoAccounts.some((item) => item.username === account.username)) {
      throw new Error("That username is already registered.");
    }
    stored.push(account);
    writeJson(ACCOUNTS_KEY, stored);
  }

  function saveSession(session) {
    writeJson(SESSION_KEY, {
      username: session.username,
      role: session.role,
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

  async function postJson(path, payload) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "Request failed.");
    }
    return data;
  }

  async function getJson(path) {
    const session = getSession();
    const headers = {};
    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, { headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "Request failed.");
    }
    return data;
  }

  async function signIn(username, password) {
    try {
      const data = await postJson("/auth/login", { username, password });
      saveSession({ username, role: data.role, token: data.token, source: "backend" });
      return;
    } catch (error) {
      if (!String(error.message).includes("Failed to fetch")) {
        throw error;
      }
    }

    const account = getAccounts().find((item) => item.username === username && item.password === password);
    if (!account) {
      throw new Error("Invalid username or password.");
    }
    saveSession({ username: account.username, role: account.role, source: "local" });
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

    saveLocalAccount({ username, password, role });
    saveSession({ username, role, source: "local" });
  }

  window.CreditFlowAuth = {
    createAccount,
    getJson,
    signIn,
    getSession,
    clearSession
  };
})();
