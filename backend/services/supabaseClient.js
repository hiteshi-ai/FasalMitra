import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization for FasalMitra AI
 *
 * Secure backend-only client using environment variables.
 * Prints clear diagnostic messages on startup — never prints keys or secrets.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

let supabase = null;
let isConfigured = false;

// --- Startup diagnostics (no secrets printed) ---
const urlOk = Boolean(SUPABASE_URL) &&
  SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_URL.startsWith('https://');

const keyOk = Boolean(SUPABASE_KEY) &&
  SUPABASE_KEY !== 'YOUR_SUPABASE_SERVICE_ROLE_OR_ANON_KEY' &&
  SUPABASE_KEY !== 'your_actual_secret_key';

console.log('[Supabase] SUPABASE_URL present and valid:', urlOk);
console.log('[Supabase] SUPABASE_KEY present and valid:', keyOk);

if (!urlOk) {
  console.error('[Supabase] ✗ SUPABASE_URL is missing or invalid. Set it in backend/.env to https://<project-ref>.supabase.co');
}
if (!keyOk) {
  console.error('[Supabase] ✗ SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder. Set the real sb_secret_... value in backend/.env');
}

if (urlOk && keyOk) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
    console.log('[Supabase] ✓ Client initialized. Project:', SUPABASE_URL.replace('https://', '').split('.')[0]);
  } catch (err) {
    console.error('[Supabase] ✗ createClient failed:', err.message);
    supabase = null;
    isConfigured = false;
  }
} else {
  console.warn('[Supabase] ✗ Running WITHOUT Supabase — all data will be lost on server restart.');
  console.warn('[Supabase]   To fix: fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  console.warn('[Supabase]   Then run the schema SQL in Supabase Dashboard → SQL Editor → New query');
}

export function getSupabase() {
  return supabase;
}

export function isSupabaseReady() {
  return isConfigured && supabase !== null;
}

export default {
  getSupabase,
  isSupabaseReady
};
