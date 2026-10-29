-- ============================================================================
-- FasalMitra AI — Supabase PostgreSQL Schema
-- ============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- This script is idempotent: safe to run multiple times without data loss.
-- ============================================================================

-- ============================================================================
-- 1. FARMER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    id           TEXT        PRIMARY KEY,
    name         TEXT        NOT NULL,
    email        TEXT        UNIQUE NOT NULL,
    phone        TEXT        DEFAULT '',
    password_hash TEXT       NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at   TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_farmer_profiles_email
    ON public.farmer_profiles (email);

-- ============================================================================
-- 2. FARMER ANALYSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.farmer_analyses (
    id              TEXT        PRIMARY KEY,
    farmer_id       TEXT        REFERENCES public.farmer_profiles(id) ON DELETE SET NULL,
    farmer_name     TEXT        DEFAULT 'Farmer',
    crop            TEXT        NOT NULL,
    crop_stage      TEXT        DEFAULT '',
    location        JSONB,
    weather         JSONB,
    soil            JSONB,
    image           JSONB,
    disease_analysis JSONB,
    risk_forecast   JSONB,
    created_at      TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_farmer_analyses_farmer_id
    ON public.farmer_analyses (farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_analyses_created_at
    ON public.farmer_analyses (created_at DESC);

-- ============================================================================
-- 3. EXPERT CONSULTATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expert_consultations (
    id                TEXT        PRIMARY KEY,
    farmer_id         TEXT        REFERENCES public.farmer_profiles(id) ON DELETE SET NULL,
    farmer_name       TEXT        NOT NULL,
    crop              TEXT        NOT NULL,
    crop_stage        TEXT        DEFAULT '',
    location          TEXT        DEFAULT '',
    weather           JSONB,
    soil              JSONB,
    image             JSONB,
    disease_analysis  JSONB,
    image_analysis    JSONB,
    risk_forecast     JSONB,
    farmer_notes      TEXT        DEFAULT '',
    question          TEXT        DEFAULT '',
    status            TEXT        DEFAULT 'Pending'
                          CHECK (status IN ('Pending', 'Under Review', 'Resolved', 'Closed')),
    expert_notes      TEXT        DEFAULT '',
    expert_assessment TEXT        DEFAULT '',
    created_at        TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at        TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_expert_consultations_status
    ON public.expert_consultations (status);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_created_at
    ON public.expert_consultations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_farmer_id
    ON public.expert_consultations (farmer_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- The backend uses the service_role key (sb_secret_...) which bypasses RLS.
-- These permissive policies are required for the anon/publishable key fallback.
-- ============================================================================

ALTER TABLE public.farmer_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_consultations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to make this script safely re-runnable
DROP POLICY IF EXISTS "fasalmitra_farmer_profiles_all"      ON public.farmer_profiles;
DROP POLICY IF EXISTS "fasalmitra_farmer_analyses_all"      ON public.farmer_analyses;
DROP POLICY IF EXISTS "fasalmitra_expert_consultations_all" ON public.expert_consultations;

CREATE POLICY "fasalmitra_farmer_profiles_all"
    ON public.farmer_profiles FOR ALL
    TO anon, authenticated, service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "fasalmitra_farmer_analyses_all"
    ON public.farmer_analyses FOR ALL
    TO anon, authenticated, service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "fasalmitra_expert_consultations_all"
    ON public.expert_consultations FOR ALL
    TO anon, authenticated, service_role
    USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. SEED DATA — one sample case so the Expert Portal is not empty on first load
-- ============================================================================
INSERT INTO public.expert_consultations (
    id, farmer_name, crop, crop_stage, location,
    weather, soil, image,
    disease_analysis, image_analysis, risk_forecast,
    farmer_notes, question, status, expert_notes, expert_assessment,
    created_at, updated_at
) VALUES (
    'FM-EXP-101',
    'Gurpreet Singh',
    'Wheat',
    'Vegetative',
    'Ludhiana, Punjab',
    '{"temperature":22,"humidity":82,"rainProbability":60,"rainfall":3.5,"windSpeed":14,"condition":"Overcast"}'::jsonb,
    '{"type":"Alluvial Loam","ph":"7.1","moisture":"Adequate","irrigation":"Canal Irrigated"}'::jsonb,
    '{"url":"/assets/hero.png","name":"wheat_leaf_sample.jpg","size":1048576}'::jsonb,
    '{"crop":"Wheat","disease":"Yellow Rust (Stripe Rust)","isHealthy":false,"confidence":0.88,"severity":"Moderate","symptoms":["Linear yellow-orange pustules aligned along leaf veins","Chlorotic striping on upper foliage"],"possibleCauses":["Puccinia striiformis fungal spore infection","Extended leaf wetness with cool day temperatures"],"recommendations":["Inspect surrounding fields for stripe orientation.","Avoid excessive late-season nitrogen applications."],"explanation":"Characteristic stripe rust pustules forming parallel rows between leaf veins under favorable microclimate.","needsExpertReview":true}'::jsonb,
    '{"crop":"Wheat","disease":"Yellow Rust (Stripe Rust)","isHealthy":false,"confidence":0.88,"severity":"Moderate","symptoms":["Linear yellow-orange pustules aligned along leaf veins"],"explanation":"Characteristic stripe rust pustules forming parallel rows under favorable microclimate."}'::jsonb,
    '{"riskLevel":"Moderate","threeDayRisk":{"level":"Moderate","probability":0.45,"explanation":"Incubation conditions favorable due to morning dew and 82% humidity."},"sevenDayRisk":{"level":"High","probability":0.72,"explanation":"Overcast forecast and persistent moisture increase spore sporulation."},"risk":{"next3Days":0.45,"next7Days":0.72},"factors":["Relative humidity of 82% provides requisite leaf wetness","Temperature of 22°C sits within favorable germination range"],"recommendations":["Monitor canopy density in canal-fed strips.","Prepare propiconazole or tebuconazole spray if pustules advance to flag leaf."],"disclaimer":"AI-assisted disease risk estimate; not a guaranteed prediction."}'::jsonb,
    'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    'Pending', '', '',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
) ON CONFLICT (id) DO NOTHING;
