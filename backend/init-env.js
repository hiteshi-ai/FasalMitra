/**
 * FasalMitra AI - Environment Initializer
 *
 * This MUST be imported before any other module that reads process.env.
 * In ES modules, all `import` statements are hoisted and run before any
 * top-level code, so dotenv.config() in server.js runs too late to affect
 * modules like supabaseClient.js that read process.env at import time.
 *
 * Solution: Use this file as the entry point. It loads dotenv synchronously
 * before the dynamic import of server.js, guaranteeing env vars are available
 * to every module at the time they first execute.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env BEFORE anything else imports and reads process.env
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('[FasalMitra] Environment loaded.');
console.log('[FasalMitra] SUPABASE_URL set:', Boolean(process.env.SUPABASE_URL));
console.log('[FasalMitra] SUPABASE_SERVICE_ROLE_KEY set:', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));

// Now dynamically import server so all its transitive imports see the env vars
await import('./server.js');
