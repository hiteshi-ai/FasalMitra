import { databaseService } from '../services/databaseService.js';
import { isSupabaseReady } from '../services/supabaseClient.js';

/**
 * Farmer Authentication & Profiles Controller
 *
 * Returns HTTP 503 when Supabase is not configured so the frontend knows
 * data was NOT persisted (rather than silently falling to in-memory storage).
 * Diagnostic logs show Supabase status, table operations, and errors — never keys/passwords.
 */

export async function registerFarmer(req, res, next) {
  try {
    const { name, email, passwordHash, phone } = req.body || {};

    const supabaseOk = isSupabaseReady();
    console.log('[registerFarmer] Supabase ready:', supabaseOk);

    if (!name?.trim() || !email?.trim() || !passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and passwordHash are required.'
      });
    }

    // Block registration if Supabase is not configured — in-memory fallback gives false success
    if (!supabaseOk) {
      console.error('[registerFarmer] BLOCKED — Supabase not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env and ensure the schema has been created in the Supabase SQL Editor.');
      return res.status(503).json({
        success: false,
        supabaseReady: false,
        message: 'Database not configured. The administrator must set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env and run the schema SQL.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Duplicate-email check
    const existing = await databaseService.getProfileByEmail(cleanEmail);
    console.log('[registerFarmer] Duplicate email check:', Boolean(existing));
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in instead.'
      });
    }

    // Persist to Supabase
    const profile = await databaseService.createProfile({
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '',
      passwordHash
    });

    console.log('[registerFarmer] Profile created. ID:', profile?.id, '| Supabase:', supabaseOk);

    return res.status(201).json({
      success: true,
      supabaseReady: true,
      message: 'Farmer account created successfully.',
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('[registerFarmer] Error:', error.message, '| code:', error.code);
    next(error);
  }
}

export async function loginFarmer(req, res, next) {
  try {
    const { email, passwordHash } = req.body || {};

    const supabaseOk = isSupabaseReady();
    console.log('[loginFarmer] Supabase ready:', supabaseOk);

    if (!email?.trim() || !passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Email and passwordHash are required.'
      });
    }

    // If Supabase is down return 503 so the frontend falls through to localStorage
    if (!supabaseOk) {
      console.warn('[loginFarmer] Supabase not ready — returning 503 so client checks localStorage.');
      return res.status(503).json({
        success: false,
        supabaseReady: false,
        message: 'Database not available. Falling back to local session.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const profile = await databaseService.getProfileByEmail(cleanEmail);
    console.log('[loginFarmer] Profile lookup:', cleanEmail, '| found:', Boolean(profile));

    if (!profile) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (profile.passwordHash !== passwordHash) {
      console.log('[loginFarmer] Hash mismatch for:', cleanEmail);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    console.log('[loginFarmer] Login success:', cleanEmail);
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      session: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        role: 'farmer',
        loggedInAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[loginFarmer] Error:', error.message, '| code:', error.code);
    next(error);
  }
}

export async function getFarmerAccounts(req, res, next) {
  try {
    const profiles = await databaseService.getProfiles();
    return res.status(200).json({
      success: true,
      total: profiles.length,
      accounts: profiles
    });
  } catch (error) {
    next(error);
  }
}
