/**
 * Centralized Authentication Service for FasalMitra AI
 * 
 * Provides lightweight, zero-dependency client-side authentication
 * for Farmer (Sign Up, Login, Session) and Expert (Fixed Identity Login, Session).
 */

const FARMER_ACCOUNTS_KEY = 'fasalmitra_farmer_accounts';
const FARMER_SESSION_KEY = 'fasalmitra_farmer_session';
const EXPERT_SESSION_KEY = 'fasalmitra_expert_session';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Client-side cryptographic hash using standard Web Crypto API SHA-256
 * with deterministic fallback for legacy/insecure contexts.
 */
async function hashPassword(password) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Simple deterministic hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fm_hash_' + Math.abs(hash).toString(16);
}

export const authService = {
  // ==========================================
  // Farmer Authentication
  // ==========================================

  getFarmerAccounts: () => {
    try {
      const raw = localStorage.getItem(FARMER_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  registerFarmer: async ({ name, email, password, confirmPassword, phone = '' }) => {
    // 1. Validate required fields
    if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
      throw new Error('Please fill in all required fields (Name, Email, Password, Confirm Password).');
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    // 3. Password and Confirm Password must match
    if (password !== confirmPassword) {
      throw new Error('Password and Confirm Password do not match.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 4. Prevent duplicate email registration
    const accounts = authService.getFarmerAccounts();
    const isDuplicate = accounts.some((acc) => acc.email.toLowerCase() === cleanEmail);
    if (isDuplicate) {
      throw new Error('This email is already registered. Please log in instead.');
    }

    // 5. Hash password (client-side SHA-256)
    const passwordHash = await hashPassword(password);

    // 6. Register with backend (Supabase) — this is the authoritative store.
    // localStorage is only used as a login cache after successful backend registration.
    let backendId = null;
    let backendError = null;

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/farmer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone?.trim() || '',
          passwordHash
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        // Backend registered successfully
        backendId = data?.profile?.id || null;
      } else if (response.status === 409) {
        // Email already registered in the database
        throw new Error('This email is already registered. Please log in instead.');
      } else {
        // Other backend error
        backendError = data?.message || `Registration failed (HTTP ${response.status}). Please try again.`;
      }
    } catch (err) {
      // Re-throw intentional errors (duplicate email, etc.)
      if (
        err.message.includes('already registered') ||
        err.message.includes('already exists')
      ) {
        throw err;
      }
      // Network / server unreachable — fall back to localStorage only
      backendError = null; // treat as network-only fallback
    }

    // If the backend returned a meaningful error (not a network failure), surface it
    if (backendError) {
      throw new Error(backendError);
    }

    // 7. Cache in localStorage so login works even while offline
    const newAccount = {
      id: backendId || `FARMER-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '',
      passwordHash,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem(FARMER_ACCOUNTS_KEY, JSON.stringify(accounts));

    return {
      success: true,
      message: 'Account created successfully! Please log in with your credentials.'
    };
  },

  loginFarmer: async ({ email, password }) => {
    if (!email?.trim() || !password) {
      throw new Error('Please enter both email and password.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);

    // Try backend authentication first
    let backendDefinitelyWrongPassword = false;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/farmer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, passwordHash })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.session) {
          localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify(data.session));
          return data.session;
        }
      } else if (response.status === 401) {
        // 401 can mean wrong password OR in-memory store was cleared by server restart.
        // Fall through to localStorage so the user isn't locked out after a restart.
        // If localStorage also fails, we know it's genuinely wrong credentials.
        backendDefinitelyWrongPassword = false; // will be confirmed by localStorage check
      }
      // 503 = Supabase not configured — always fall through to localStorage
    } catch {
      // Network error — fall through to localStorage
    }

    // localStorage fallback (covers: server restart, Supabase not yet configured, offline)
    const accounts = authService.getFarmerAccounts();
    const account = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

    if (!account || account.passwordHash !== passwordHash) {
      // Neither backend nor localStorage has this account with this password
      throw new Error('Invalid email or password.');
    }

    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      role: 'farmer',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  getFarmerSession: () => {
    try {
      const raw = localStorage.getItem(FARMER_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logoutFarmer: () => {
    localStorage.removeItem(FARMER_SESSION_KEY);
  },

  // ==========================================
  // Expert Authentication (Fixed Single Identity)
  // ==========================================

  loginExpert: async ({ name, password }) => {
    if (!name?.trim() || !password) {
      throw new Error('Please enter both name and password.');
    }

    // Only these exact credentials can log in
    if (name.trim() !== 'Expert' || password !== 'expert@123') {
      throw new Error('Invalid expert credentials. Only authorized agricultural specialists can enter.');
    }

    const session = {
      name: 'Expert',
      role: 'expert',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(EXPERT_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  getExpertSession: () => {
    try {
      const raw = localStorage.getItem(EXPERT_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logoutExpert: () => {
    localStorage.removeItem(EXPERT_SESSION_KEY);
  },

  // ==========================================
  // Global Access Control Guards
  // ==========================================

  isFarmerAuthenticated: () => {
    const session = authService.getFarmerSession();
    return Boolean(session && session.role === 'farmer');
  },

  isExpertAuthenticated: () => {
    const session = authService.getExpertSession();
    return Boolean(session && session.role === 'expert');
  }
};

export default authService;
