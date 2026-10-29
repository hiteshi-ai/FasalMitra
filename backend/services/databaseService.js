import { getSupabase, isSupabaseReady } from './supabaseClient.js';

/**
 * Unified Database Persistence Service for FasalMitra AI
 * 
 * Supports:
 * 1. Expert Consultations (triaged farmer cases and agronomic prescriptions)
 * 2. Farmer Crop Analyses & History (crop, disease diagnosis, 3-7 day risk, weather, soil)
 * 3. Farmer Profiles (account details and credentials)
 * 
 * Ensures 100% backward compatibility with in-memory fallback.
 */

// In-memory fallback stores
const inMemoryConsultations = [
  {
    id: 'FM-EXP-101',
    farmerName: 'Gurpreet Singh',
    crop: 'Wheat',
    cropStage: 'Vegetative',
    location: 'Ludhiana, Punjab',
    weather: {
      temperature: 22,
      humidity: 82,
      rainProbability: 60,
      rainfall: 3.5,
      windSpeed: 14,
      condition: 'Overcast'
    },
    soil: {
      type: 'Alluvial Loam',
      ph: '7.1',
      moisture: 'Adequate',
      irrigation: 'Canal Irrigated'
    },
    image: {
      url: '/assets/hero.png',
      name: 'wheat_leaf_sample.jpg',
      size: 1048576
    },
    diseaseAnalysis: {
      crop: 'Wheat',
      disease: 'Yellow Rust (Stripe Rust)',
      isHealthy: false,
      confidence: 0.88,
      severity: 'Moderate',
      symptoms: [
        'Linear yellow-orange pustules aligned along leaf veins',
        'Chlorotic striping on upper foliage'
      ],
      possibleCauses: [
        'Puccinia striiformis fungal spore infection',
        'Extended leaf wetness with cool day temperatures'
      ],
      recommendations: [
        'Inspect surrounding fields for stripe orientation.',
        'Avoid excessive late-season nitrogen applications.'
      ],
      explanation: 'Characteristic stripe rust pustules forming parallel rows between leaf veins under favorable microclimate.',
      needsExpertReview: true
    },
    riskForecast: {
      threeDayRisk: {
        level: 'Moderate',
        probability: 0.45,
        explanation: 'Incubation conditions favorable due to morning dew and 82% humidity.'
      },
      sevenDayRisk: {
        level: 'High',
        probability: 0.72,
        explanation: 'Overcast forecast and persistent moisture increase spore sporulation.'
      },
      riskLevel: 'Moderate',
      risk: { next3Days: 0.45, next7Days: 0.72 },
      factors: [
        'Relative humidity of 82% provides requisite leaf wetness',
        'Temperature of 22°C sits within favorable germination range'
      ],
      recommendations: [
        'Monitor canopy density in canal-fed strips.',
        'Prepare propiconazole or tebuconazole spray if pustules advance to flag leaf.'
      ],
      disclaimer: 'AI-assisted disease risk estimate; not a guaranteed prediction.'
    },
    farmerNotes: 'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    question: 'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    status: 'Pending',
    expertNotes: '',
    expertAssessment: '',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const inMemoryAnalyses = [];
const inMemoryProfiles = [];

// ============================================================================
// Helpers: Map between DB (snake_case) and App (camelCase)
// ============================================================================

function mapConsultationFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmerId: row.farmer_id || null,
    farmerName: row.farmer_name,
    crop: row.crop,
    cropStage: row.crop_stage || '',
    location: row.location || 'Local Farm',
    weather: row.weather || null,
    soil: row.soil || null,
    image: row.image || null,
    diseaseAnalysis: row.disease_analysis || null,
    imageAnalysis: row.image_analysis || row.disease_analysis || null,
    riskForecast: row.risk_forecast || null,
    farmerNotes: row.farmer_notes || '',
    question: row.question || row.farmer_notes || '',
    status: row.status || 'Pending',
    expertNotes: row.expert_notes || '',
    expertAssessment: row.expert_assessment || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapConsultationToDb(item) {
  return {
    id: item.id,
    farmer_id: item.farmerId || null,
    farmer_name: item.farmerName || 'Anonymous Farmer',
    crop: item.crop || 'Crop',
    crop_stage: item.cropStage || '',
    location: typeof item.location === 'string' ? item.location : (item.location?.name || 'Local Farm'),
    weather: item.weather || null,
    soil: item.soil || null,
    image: item.image || null,
    disease_analysis: item.diseaseAnalysis || null,
    image_analysis: item.imageAnalysis || item.diseaseAnalysis || null,
    risk_forecast: item.riskForecast || null,
    farmer_notes: item.farmerNotes || item.question || '',
    question: item.question || item.farmerNotes || '',
    status: item.status || 'Pending',
    expert_notes: item.expertNotes || '',
    expert_assessment: item.expertAssessment || '',
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString()
  };
}

function mapAnalysisFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmerId: row.farmer_id || null,
    farmerName: row.farmer_name || 'Farmer',
    crop: row.crop,
    cropStage: row.crop_stage || '',
    location: row.location || null,
    weather: row.weather || null,
    soil: row.soil || null,
    image: row.image || null,
    diseaseAnalysis: row.disease_analysis || null,
    riskForecast: row.risk_forecast || null,
    createdAt: row.created_at
  };
}

function mapAnalysisToDb(item) {
  return {
    id: item.id,
    farmer_id: item.farmerId || null,
    farmer_name: item.farmerName || 'Farmer',
    crop: item.crop || 'Crop',
    crop_stage: item.cropStage || '',
    location: item.location || null,
    weather: item.weather || null,
    soil: item.soil || null,
    image: item.image || null,
    disease_analysis: item.diseaseAnalysis || null,
    risk_forecast: item.riskForecast || null,
    created_at: item.createdAt || new Date().toISOString()
  };
}

// ============================================================================
// Optional Supabase Storage Helper for Crop Images
// ============================================================================

async function tryUploadImageToStorage(imageData, filenamePrefix = 'leaf') {
  if (!isSupabaseReady() || !imageData?.dataUrl) return imageData;
  const supabase = getSupabase();

  try {
    const dataUrl = imageData.dataUrl;
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return imageData;

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    const ext = mimeType.split('/')[1] || 'jpg';
    const filePath = `analyses/${filenamePrefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('crop-images')
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      // If bucket doesn't exist, ignore and use original imageData
      return imageData;
    }

    const { data: publicUrlData } = supabase.storage
      .from('crop-images')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      return {
        ...imageData,
        url: publicUrlData.publicUrl,
        storagePath: filePath
      };
    }
  } catch (err) {
    console.warn('[Supabase Storage] Image upload skipped:', err.message);
  }

  return imageData;
}

// ============================================================================
// 1. EXPERT CONSULTATIONS
// ============================================================================

export const databaseService = {
  // Get all expert consultations
  getConsultations: async () => {
    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('expert_consultations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Supabase getConsultations error]:', error.message);
        } else if (Array.isArray(data) && data.length > 0) {
          return data.map(mapConsultationFromDb);
        } else if (Array.isArray(data) && data.length === 0) {
          // If table is newly created, seed the sample case so portal is not empty
          await databaseService.createConsultation(inMemoryConsultations[0]);
          return inMemoryConsultations;
        }
      } catch (err) {
        console.warn('[Supabase getConsultations exception]:', err.message);
      }
    }
    return inMemoryConsultations;
  },

  // Create an expert consultation
  createConsultation: async (caseData) => {
    // Process image storage if possible
    let processedImage = caseData.image;
    if (processedImage?.dataUrl) {
      processedImage = await tryUploadImageToStorage(processedImage, caseData.id || 'exp');
    }

    const newCase = {
      ...caseData,
      image: processedImage,
      createdAt: caseData.createdAt || new Date().toISOString(),
      updatedAt: caseData.updatedAt || new Date().toISOString()
    };

    // Always keep in-memory fallback in sync
    const existingIdx = inMemoryConsultations.findIndex(c => c.id === newCase.id);
    if (existingIdx >= 0) {
      inMemoryConsultations[existingIdx] = newCase;
    } else {
      inMemoryConsultations.unshift(newCase);
    }

    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        const dbRow = mapConsultationToDb(newCase);
        const { data, error } = await supabase
          .from('expert_consultations')
          .upsert(dbRow, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[Supabase createConsultation error]:', error.message);
        } else if (data) {
          return mapConsultationFromDb(data);
        }
      } catch (err) {
        console.error('[Supabase createConsultation exception]:', err.message);
      }
    }

    return newCase;
  },

  // Update an expert consultation by ID (status, expertNotes, expertAssessment, updatedAt)
  updateConsultation: async (id, updates) => {
    const updatedAt = new Date().toISOString();

    // 1. Update in-memory
    const memCase = inMemoryConsultations.find(c => String(c.id) === String(id) || c.id === id);
    if (memCase) {
      if (updates.expertNotes !== undefined) memCase.expertNotes = updates.expertNotes;
      if (updates.expertAssessment !== undefined) memCase.expertAssessment = updates.expertAssessment;
      if (updates.status !== undefined) memCase.status = updates.status;
      memCase.updatedAt = updatedAt;
    }

    // 2. Update Supabase
    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        const dbUpdates = {
          updated_at: updatedAt
        };
        if (updates.expertNotes !== undefined) dbUpdates.expert_notes = updates.expertNotes;
        if (updates.expertAssessment !== undefined) dbUpdates.expert_assessment = updates.expertAssessment;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { data, error } = await supabase
          .from('expert_consultations')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[Supabase updateConsultation error]:', error.message);
        } else if (data) {
          return mapConsultationFromDb(data);
        }
      } catch (err) {
        console.error('[Supabase updateConsultation exception]:', err.message);
      }
    }

    return memCase || { id, ...updates, updatedAt };
  },

  // ============================================================================
  // 2. FARMER ANALYSES & HISTORY
  // ============================================================================

  saveAnalysis: async (analysisPayload) => {
    const id = analysisPayload.id || `FA-${Date.now().toString().slice(-8)}`;
    const createdAt = analysisPayload.createdAt || new Date().toISOString();

    let processedImage = analysisPayload.image;
    if (processedImage?.dataUrl) {
      processedImage = await tryUploadImageToStorage(processedImage, id);
    }

    const item = {
      id,
      farmerId: analysisPayload.farmerId || analysisPayload.farmerSession?.id || null,
      farmerName: analysisPayload.farmerName || analysisPayload.farmerSession?.name || 'Farmer',
      crop: analysisPayload.crop?.name || analysisPayload.crop || 'Crop',
      cropStage: analysisPayload.cropStage || '',
      location: analysisPayload.location || null,
      weather: analysisPayload.weather || null,
      soil: analysisPayload.soil || null,
      image: processedImage || null,
      diseaseAnalysis: analysisPayload.diagnosis || analysisPayload.diseaseAnalysis || null,
      riskForecast: analysisPayload.riskForecast || null,
      createdAt
    };

    inMemoryAnalyses.unshift(item);

    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        const dbRow = mapAnalysisToDb(item);

        // If a farmerId is supplied, verify it exists first to avoid a FK constraint error.
        // A temporary/local farmer ID (e.g. freshly registered on this session) may not
        // exist in farmer_profiles yet if the browser cached the ID before the DB write
        // completed, or if the farmer registered while Supabase was momentarily unavailable.
        // In those cases we store the analysis with farmer_id = null so the row is not lost.
        if (dbRow.farmer_id) {
          const { data: profileRow, error: profileErr } = await supabase
            .from('farmer_profiles')
            .select('id')
            .eq('id', dbRow.farmer_id)
            .maybeSingle();
          if (profileErr || !profileRow) {
            console.warn(`[Supabase saveAnalysis] farmerId "${dbRow.farmer_id}" not found in farmer_profiles — storing with farmer_id = null to avoid FK violation.`);
            dbRow.farmer_id = null;
            item.farmerId = null;
          }
        }

        const { data, error } = await supabase
          .from('farmer_analyses')
          .upsert(dbRow, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[Supabase saveAnalysis error]:', error.message);
        } else if (data) {
          return mapAnalysisFromDb(data);
        }
      } catch (err) {
        console.error('[Supabase saveAnalysis exception]:', err.message);
      }
    }

    return item;
  },

  getAnalyses: async (farmerId = null) => {
    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        let query = supabase
          .from('farmer_analyses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (farmerId) {
          query = query.eq('farmer_id', farmerId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[Supabase getAnalyses error]:', error.message);
        } else if (Array.isArray(data)) {
          return data.map(mapAnalysisFromDb);
        }
      } catch (err) {
        console.warn('[Supabase getAnalyses exception]:', err.message);
      }
    }

    if (farmerId) {
      return inMemoryAnalyses.filter(a => a.farmerId === farmerId);
    }
    return inMemoryAnalyses;
  },

  // ============================================================================
  // 3. FARMER PROFILES & ACCOUNTS
  // ============================================================================

  createProfile: async (profile) => {
    const id = profile.id || `FARMER-${Date.now().toString().slice(-6)}`;
    const createdAt = profile.createdAt || new Date().toISOString();
    const cleanEmail = (profile.email || '').trim().toLowerCase();

    const newProfile = {
      id,
      name: profile.name?.trim() || 'Farmer',
      email: cleanEmail,
      phone: profile.phone?.trim() || '',
      passwordHash: profile.passwordHash,
      createdAt,
      updatedAt: createdAt
    };

    if (isSupabaseReady()) {
      const supabase = getSupabase();
      const dbRow = {
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        phone: newProfile.phone,
        password_hash: newProfile.passwordHash,
        created_at: newProfile.createdAt,
        updated_at: newProfile.updatedAt
      };

      const { data, error } = await supabase
        .from('farmer_profiles')
        .upsert(dbRow, { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        // PGRST205 = table does not exist (schema not yet run)
        console.error('[createProfile] Supabase error code:', error.code, '| msg:', error.message);
        if (error.code === 'PGRST205' || error.code === '42P01') {
          throw new Error('Database table farmer_profiles does not exist. Run supabase_schema.sql in Supabase Dashboard → SQL Editor.');
        }
        throw new Error('Database insert failed: ' + error.message);
      }

      if (data) {
        console.log('[createProfile] Saved to Supabase. ID:', data.id);
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: data.password_hash,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    }

    // Supabase not ready — in-memory fallback (data lost on restart)
    console.warn('[createProfile] Supabase not ready — falling to in-memory. Data will be lost on restart.');
    const existingIdx = inMemoryProfiles.findIndex(p => p.email === cleanEmail);
    if (existingIdx >= 0) {
      inMemoryProfiles[existingIdx] = newProfile;
    } else {
      inMemoryProfiles.push(newProfile);
    }
    return newProfile;
  },

  getProfileByEmail: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (isSupabaseReady()) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.warn('[getProfileByEmail] Supabase error code:', error.code, '| msg:', error.message);
        if (error.code === 'PGRST205' || error.code === '42P01') {
          throw new Error('Database table farmer_profiles does not exist. Run supabase_schema.sql in Supabase Dashboard → SQL Editor.');
        }
        // Other DB error — fall through to in-memory
        console.warn('[getProfileByEmail] Falling to in-memory due to DB error.');
      } else if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: data.password_hash,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        // Supabase returned null — email genuinely not registered
        return null;
      }
    }

    return inMemoryProfiles.find(p => p.email === cleanEmail) || null;
  },

  getProfiles: async () => {
    if (isSupabaseReady()) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('farmer_profiles')
          .select('id, name, email, phone, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Supabase getProfiles error]:', error.message);
        } else if (Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('[Supabase getProfiles exception]:', err.message);
      }
    }

    return inMemoryProfiles.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    }));
  }
};

export default databaseService;
