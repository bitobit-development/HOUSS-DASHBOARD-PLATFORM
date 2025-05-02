// lib/b2b-api.js
// -----------------------------------------------------------------------------
// Bit2Bit OAuth client – browser-friendly, SSR-safe, full HTTP verb support.
// -----------------------------------------------------------------------------

// Where your FastAPI instance lives
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_B2B_BASE_URL ??  'https://houss-api-haimderazon.replit.app/';
  // 'https://6429f7fa-23e7-4979-9ac6-e6757c619b45-00-3280b19ure2cw.worf.replit.dev';

// -----------------------------------------------------------------------------
// In-memory auth state (mirrored to localStorage for persistence)
// -----------------------------------------------------------------------------
let accessToken  = null;
let refreshToken = null;
let tokenExpiry  = 0;          // epoch ms
let userEmail    = '';         // convenience only

// -----------------------------------------------------------------------------
// Proactive refresh timer (fires 30 s before expiry)
// -----------------------------------------------------------------------------
let refreshTimer;

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  if (!tokenExpiry) return;

  const delay = tokenExpiry - Date.now() - 30_000; // 30 s early
  if (delay > 0) {
    refreshTimer = setTimeout(
      () => b2bApi._refreshToken().catch(console.error),
      delay
    );
  }
}

// -----------------------------------------------------------------------------
// Helpers – persistence & cross-tab sync
// -----------------------------------------------------------------------------
const STORAGE_KEY = 'b2bAuth';

/** Persist to localStorage. */
function persistSession(email = userEmail) {
  if (typeof window === 'undefined') return; // SSR safeguard
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken,
      refreshToken,
      tokenExpiry,
      user: { email },
    })
  );
  scheduleRefresh();
}

/** Restore from localStorage on first use. */
function restoreSession() {
  if (accessToken || typeof window === 'undefined') return; // already done / SSR

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    accessToken  = parsed.accessToken;
    refreshToken = parsed.refreshToken;
    tokenExpiry  = parsed.tokenExpiry;
    userEmail    = parsed?.user?.email ?? '';
    scheduleRefresh();
  } catch {
    localStorage.removeItem(STORAGE_KEY); // corrupted JSON → nuke it
  }
}

/** Clear everything. */
function clearSession() {
  accessToken = null;
  refreshToken = null;
  tokenExpiry = 0;
  userEmail   = '';
  clearTimeout(refreshTimer);
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

/** Cross-tab live sync. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const { accessToken: at, refreshToken: rt, tokenExpiry: te, user } =
        JSON.parse(e.newValue);
      accessToken = at;
      refreshToken = rt;
      tokenExpiry = te;
      userEmail   = user?.email ?? '';
      scheduleRefresh();
    } catch {
      /* ignore */
    }
  });
}

// -----------------------------------------------------------------------------
// Helpers – HTTP
// -----------------------------------------------------------------------------
function isExpired() {
  // treat as expired 30 s before actual expiry to avoid race-conditions
  return !tokenExpiry || Date.now() >= tokenExpiry - 30_000;
}

function rawFetch(url, { method = 'GET', headers = {}, body, ...rest } = {}) {
  const finalHeaders = { ...headers };
  let finalBody = body;

  if (
    body &&
    !(body instanceof FormData) &&
    typeof body !== 'string' &&
    !('arrayBuffer' in body) // Blob / File / ArrayBuffer etc.
  ) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  return fetch(url, { method, headers: finalHeaders, body: finalBody, ...rest });
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export const b2bApi = {
  // ──────────────────────────────────────────────────────────────────────────
  // Auth
  // ──────────────────────────────────────────────────────────────────────────
  async signIn({ email, password }) {
    const res = await rawFetch(`${DEFAULT_BASE_URL}/signin`, {
      method: 'POST',
      body: { email, password },
    });

    if (!res.ok) {
      throw new Error(`Sign-in failed: ${await res.text()}`);
    }

    const { access_token, refresh_token, expires_in } = await res.json();

    accessToken  = access_token;
    refreshToken = refresh_token;
    tokenExpiry  = Date.now() + expires_in * 1000;
    userEmail    = email;
    persistSession(email);
  },

  signOut() {
    clearSession();
  },

  async _refreshToken() {
    if (!refreshToken) throw new Error('No refresh token present');

    const res = await rawFetch(`${DEFAULT_BASE_URL}/refresh_token`, {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });

    if (!res.ok) {
      clearSession();
      throw new Error('Token refresh failed – please sign in again');
    }

    const {
      access_token,
      refresh_token: rt = refreshToken,
      expires_in,
    } = await res.json();

    accessToken  = access_token;
    refreshToken = rt;
    tokenExpiry  = Date.now() + expires_in * 1000;
    persistSession(); // email unchanged
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Core fetch wrapper (adds Bearer token & auto-refresh)
  // ──────────────────────────────────────────────────────────────────────────
  async fetch(path, init = {}) {
    restoreSession();
    if (!accessToken) throw new Error('Not authenticated – call signIn() first');

    if (isExpired()) await this._refreshToken();

    const res = await rawFetch(`${DEFAULT_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers || {}),
      },
    });

    // If token was revoked server-side, try a fresh refresh once
    if (res.status === 401) {
      await this._refreshToken();
      return this.fetch(path, init);
    }

    return res;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Verb helpers
  // ──────────────────────────────────────────────────────────────────────────
  get    : (p, o)         => b2bApi.fetch(p, { ...(o || {}), method: 'GET' }),
  post   : (p, b = {}, o) => b2bApi.fetch(p, { ...(o || {}), method: 'POST',  body: b }),
  put    : (p, b = {}, o) => b2bApi.fetch(p, { ...(o || {}), method: 'PUT',   body: b }),
  patch  : (p, b = {}, o) => b2bApi.fetch(p, { ...(o || {}), method: 'PATCH', body: b }),
  delete : (p, o)         => b2bApi.fetch(p, { ...(o || {}), method: 'DELETE' }),
  options: (p, o)         => b2bApi.fetch(p, { ...(o || {}), method: 'OPTIONS' }),
};

// -----------------------------------------------------------------------------
// Initialise from any stored session immediately (browser side)
// -----------------------------------------------------------------------------
restoreSession();
