import React, { useState, useEffect, useCallback } from 'react';
import CropSelector from './components/CropSelector';
import CropStageSelector from './components/CropStageSelector';
import LocationSection from './components/LocationSection';
import WeatherCard from './components/WeatherCard';
import SoilInfoSection from './components/SoilInfoSection';
import ImageUpload from './components/ImageUpload';
import SubmissionReview from './components/SubmissionReview';
import AnalysisResult from './components/AnalysisResult';
import { weatherService } from '../../services/weatherService';
import { diseaseService } from '../../services/diseaseService';
import { analysisService } from '../../services/analysisService';
import { useLanguage } from '../../i18n';
import {
  LeafIcon,
  MapPinIcon,
  CameraIcon,
  ShieldCheckIcon,
  ExpertIcon,
  AlertIcon,
  CheckIcon,
  ClockIcon
} from '../../components/Icons';

export default function FarmerPortal({ onNavigate, farmerSession, onFarmerLogout }) {
  const { t } = useLanguage();

  // Centralized Farmer Input State
  const [farmerInput, setFarmerInput] = useState({
    crop: null,
    cropStage: '',
    location: null,
    weather: null,
    soil: {
      type: '',
      ph: '',
      moisture: '',
      irrigation: ''
    },
    image: null
  });

  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Gemini AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisError, setAnalysisError] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [riskForecastResult, setRiskForecastResult] = useState(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState(null);

  // Persistent Farmer History State
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch past analyses on mount or farmer session change
  useEffect(() => {
    let isMounted = true;
    async function loadPastAnalyses() {
      setIsLoadingHistory(true);
      try {
        const records = await analysisService.getAnalyses(farmerSession?.id || null);
        if (isMounted && Array.isArray(records)) {
          setPastAnalyses(records);
        }
      } catch (err) {
        console.warn('Failed to load past analyses:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    loadPastAnalyses();
    return () => {
      isMounted = false;
    };
  }, [farmerSession?.id]);

  // Fetch weather when location is established
  const fetchWeatherForLocation = useCallback(async (loc) => {
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      return;
    }

    setIsWeatherLoading(true);
    setWeatherError(null);

    try {
      const data = await weatherService.getWeatherByCoordinates(loc.lat, loc.lng, loc.name);
      setFarmerInput((prev) => ({
        ...prev,
        weather: data
      }));
    } catch (err) {
      setWeatherError(err.message || 'Could not retrieve weather data.');
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Handlers for state updates
  const handleSelectCrop = (crop) => {
    setFarmerInput((prev) => ({ ...prev, crop }));
  };

  const handleSelectCropStage = (stage) => {
    setFarmerInput((prev) => ({ ...prev, cropStage: stage }));
  };

  const handleLocationChange = (location) => {
    setFarmerInput((prev) => {
      const updatedWeather = prev.weather
        ? { ...prev.weather, location: location?.name || prev.weather.location }
        : null;
      return {
        ...prev,
        location,
        weather: updatedWeather || prev.weather
      };
    });
    fetchWeatherForLocation(location);
  };

  const handleSoilChange = (soil) => {
    setFarmerInput((prev) => ({ ...prev, soil }));
  };

  const handleImageChange = (image) => {
    setFarmerInput((prev) => ({ ...prev, image }));
  };

  const handleRetryWeather = () => {
    if (farmerInput.location) {
      fetchWeatherForLocation(farmerInput.location);
    }
  };

  // Run full Gemini multimodal vision & microclimate risk pipeline
  const handleStartAnalysis = async () => {
    if (!farmerInput.crop || !farmerInput.image?.file) {
      setAnalysisError(
        !farmerInput.crop
          ? t('review.warnSelectCrop')
          : t('review.warnUploadImage')
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setRiskError(null);
    setRiskForecastResult(null);
    setAnalysisStage(t('review.promptUploading'));

    let diagnosis = null;
    try {
      // 1. Disease prediction via Gemini multimodal
      diagnosis = await diseaseService.detectDiseaseFromImage(
        farmerInput.image.file,
        farmerInput.crop.name
      );

      setDiagnosisResult(diagnosis);
      setIsAnalyzing(false);
      setAnalysisStage('');

      // Smooth scroll to results immediately
      setTimeout(() => {
        document.getElementById('analysis-result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.error('[Gemini Analysis Error]:', err);
      setAnalysisError(err.message || 'Analysis could not be completed.');
      setIsAnalyzing(false);
      setAnalysisStage('');
      return;
    }

    // 2. Automatically request 3-7 day climate disease-risk forecast after disease analysis succeeds
    setIsRiskLoading(true);
    setRiskError(null);
    let risk = null;
    try {
      risk = await diseaseService.predictDiseaseRisk({
        crop: diagnosis.crop || farmerInput.crop.name,
        cropStage: farmerInput.cropStage || '',
        weather: farmerInput.weather || {},
        soil: farmerInput.soil || {},
        diseaseAnalysis: diagnosis
      });

      setRiskForecastResult(risk);
    } catch (riskErr) {
      console.warn('[Risk Forecast Warning]:', riskErr.message);
      setRiskError(t('risk.unavailable'));
    } finally {
      setIsRiskLoading(false);
    }

    // 3. Automatically persist diagnosis and microclimate risk to Supabase database
    try {
      let imageDataUrl = farmerInput.image?.dataUrl || null;
      if (!imageDataUrl && farmerInput.image?.file) {
        try {
          imageDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(farmerInput.image.file);
          });
        } catch {
          imageDataUrl = null;
        }
      }

      const savedRecord = await analysisService.saveAnalysis({
        farmerId: farmerSession?.id || null,
        farmerName: farmerSession?.name || 'Farmer',
        crop: diagnosis.crop || farmerInput.crop?.name || 'Crop',
        cropStage: farmerInput.cropStage || '',
        location: farmerInput.location,
        weather: farmerInput.weather,
        soil: farmerInput.soil,
        image: farmerInput.image ? {
          name: farmerInput.image.name,
          dataUrl: imageDataUrl || farmerInput.image.previewUrl
        } : null,
        diagnosis,
        riskForecast: risk
      });

      if (savedRecord) {
        setPastAnalyses((prev) => [savedRecord, ...prev.filter((r) => r.id !== savedRecord.id)]);
      }
    } catch (persistErr) {
      console.warn('[Analysis Persistence Warning]:', persistErr.message);
    }
  };

  const handleResetAnalysis = () => {
    setDiagnosisResult(null);
    setRiskForecastResult(null);
    setIsRiskLoading(false);
    setRiskError(null);
    setAnalysisError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stepper progress indicator calculation
  const steps = [
    { id: 1, label: t('farmer.stepCrop'), completed: Boolean(farmerInput.crop) },
    { id: 2, label: t('farmer.stepStage'), completed: Boolean(farmerInput.cropStage) },
    { id: 3, label: t('farmer.stepLocation'), completed: Boolean(farmerInput.location) },
    { id: 4, label: t('farmer.stepWeather'), completed: Boolean(farmerInput.weather) },
    { id: 5, label: t('farmer.stepSoil'), completed: Boolean(farmerInput.soil?.type || farmerInput.soil?.moisture) },
    { id: 6, label: t('farmer.stepImage'), completed: Boolean(farmerInput.image) },
    { id: 7, label: t('farmer.stepReview'), completed: Boolean(farmerInput.crop && farmerInput.image) },
    { id: 8, label: t('farmer.stepDiagnosis'), completed: Boolean(diagnosisResult) }
  ];

  return (
    <div className="page-wrapper dashboard-page farmer-portal-page">
      {/* Top Header */}
      <header className="dashboard-header">
        <div>
          <div className="portal-crumb">{t('farmer.crumb')}</div>
          <h1 className="dashboard-title">{t('farmer.title')}</h1>
          <p className="dashboard-subtitle">
            {t('farmer.subtitle')}
          </p>
        </div>
        <div className="header-meta-badge">
          {farmerSession && (
            <span style={{ marginRight: '8px', fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.82rem' }}>
              {t('farmer.farmerLabel')} {farmerSession.name}
            </span>
          )}
          {onFarmerLogout && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onFarmerLogout}
              style={{ marginRight: '8px', padding: '2px 8px', fontSize: '0.75rem' }}
            >
              {t('common.logout')}
            </button>
          )}
          <span className="live-dot green"></span>
          <span>{t('farmer.engineActive')}</span>
        </div>
      </header>

      {/* Stepped Workflow Guide */}
      <section className="workflow-stepper-bar" aria-label="Workflow progress">
        <div className="stepper-track">
          {steps.map((s, index) => (
            <div
              key={s.id}
              className={`step-bubble ${s.completed ? 'completed' : ''}`}
            >
              <div className="bubble-circle">
                {s.completed ? <CheckIcon size={12} /> : s.id}
              </div>
              <span className="bubble-label">{s.label}</span>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Main Workflow Form Cards Grid */}
      <div className="farmer-workflow-stack">
        {/* Step 1 & 2: Crop Selection & Growth Stage */}
        <section className="dash-card workflow-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble green">
                <LeafIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">{t('farmer.section1Title')}</h3>
                <span className="card-subtitle">{t('farmer.section1Subtitle')}</span>
              </div>
            </div>
            <span className="card-tag">{t('common.required')}</span>
          </div>

          <div className="card-body">
            <CropSelector
              selectedCrop={farmerInput.crop}
              onSelectCrop={handleSelectCrop}
            />

            <div className="card-divider"></div>

            <CropStageSelector
              selectedStage={farmerInput.cropStage}
              onSelectStage={handleSelectCropStage}
            />
          </div>
        </section>

        {/* Step 3 & 4: Location & Microclimate Weather */}
        <div className="workflow-dual-grid">
          <section className="dash-card workflow-card">
            <div className="card-top">
              <div className="card-title-group">
                <div className="card-icon-bubble green">
                  <MapPinIcon size={20} />
                </div>
                <div>
                  <h3 className="card-title">{t('farmer.section2Title')}</h3>
                  <span className="card-subtitle">{t('farmer.section2Subtitle')}</span>
                </div>
              </div>
              <span className="card-tag">{t('farmer.locationTag')}</span>
            </div>

            <div className="card-body">
              <LocationSection
                location={farmerInput.location}
                onLocationChange={handleLocationChange}
              />
            </div>
          </section>

          {/* Weather Card */}
          <WeatherCard
            weather={farmerInput.weather}
            isLoading={isWeatherLoading}
            error={weatherError}
            onRetry={handleRetryWeather}
            hasLocation={Boolean(farmerInput.location)}
          />
        </div>

        {/* Step 5: Optional Soil Information */}
        <section className="dash-card workflow-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble green">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">{t('soil.sectionTitle')}</h3>
                <span className="card-subtitle">
                  {t('soil.sectionSubtitle')}
                </span>
              </div>
            </div>
            <span className="card-tag subtle">{t('common.optional')}</span>
          </div>

          <div className="card-body">
            <SoilInfoSection
              soil={farmerInput.soil}
              onChange={handleSoilChange}
            />
          </div>
        </section>

        {/* Step 6: Crop Leaf Image Upload */}
        <section className="dash-card workflow-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble green">
                <CameraIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">{t('image.sectionTitle')}</h3>
                <span className="card-subtitle">
                  {t('image.sectionSubtitle')}
                </span>
              </div>
            </div>
            <span className="card-tag">{t('image.tag')}</span>
          </div>

          <div className="card-body">
            <ImageUpload
              image={farmerInput.image}
              onImageChange={handleImageChange}
            />
          </div>
        </section>

        {/* Predictive Risk Model Principle */}
        <section className="dash-card disease-risk-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble amber">
                <AlertIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">{t('principle.title')}</h3>
                <span className="card-subtitle">{t('principle.subtitle')}</span>
              </div>
            </div>
            <span className="card-tag alert-tag">{t('principle.tag')}</span>
          </div>
          <div className="card-body">
            <div className="risk-disclaimer">
              {t('principle.disclaimer')}
            </div>
          </div>
        </section>

        {/* Step 7 & 8: Submission Review & Readiness */}
        <SubmissionReview
          farmerInput={farmerInput}
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={isAnalyzing}
          analysisStage={analysisStage}
          analysisError={analysisError}
        />

        {/* AI Diagnosis and Risk Results (Rendered upon successful analysis) */}
        {diagnosisResult && (
          <AnalysisResult
            diagnosis={diagnosisResult}
            riskForecast={riskForecastResult}
            isRiskLoading={isRiskLoading}
            riskError={riskError}
            crop={farmerInput.crop}
            cropStage={farmerInput.cropStage}
            location={farmerInput.location}
            weather={farmerInput.weather}
            soil={farmerInput.soil}
            image={farmerInput.image}
            farmerSession={farmerSession}
            onReset={handleResetAnalysis}
          />
        )}

        {/* Ask an Expert Escalation Option */}
        <section className="dash-card expert-consult-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble green">
                <ExpertIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">{t('expertCallout.title')}</h3>
                <span className="card-subtitle">{t('expertCallout.subtitle')}</span>
              </div>
            </div>
            <span className="card-tag">Support</span>
          </div>

          <div className="card-body">
            <p className="consult-desc">
              {t('expertCallout.desc')}
            </p>
            <div className="consult-features">
              <div className="feature-chip">{t('expertCallout.feat1')}</div>
              <div className="feature-chip">{t('expertCallout.feat2')}</div>
              <div className="feature-chip">{t('expertCallout.feat3')}</div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate('expert')}
            >
              <span>{t('expertCallout.btn')}</span>
            </button>
          </div>
        </section>

        {/* Persistent Records: Past Crop Analyses & History */}
        <section className="dash-card workflow-card" style={{ marginTop: '16px' }}>
          <div className="card-top">
            <div className="card-title-group">
              <div className="card-icon-bubble green">
                <ClockIcon size={20} />
              </div>
              <div>
                <h3 className="card-title">Past Crop Analyses & History</h3>
                <span className="card-subtitle">
                  Permanently saved diagnoses and microclimate risk records
                </span>
              </div>
            </div>
            <span className="card-tag">
              {pastAnalyses.length} {pastAnalyses.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="card-body">
            {isLoadingHistory ? (
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem' }}>Loading saved records...</p>
            ) : pastAnalyses.length === 0 ? (
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem', margin: 0 }}>
                No past diagnoses recorded yet. Complete a crop health scan above to preserve your permanent field record.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pastAnalyses.slice(0, 6).map((record) => {
                  const diag = record.diseaseAnalysis || record.diagnosis;
                  const diseaseName = diag?.disease || 'Health Assessment';
                  const isHealthy = diag?.isHealthy;
                  const dateStr = record.createdAt ? new Date(record.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Recently';

                  return (
                    <div
                      key={record.id}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                            {record.crop}
                          </span>
                          {record.cropStage && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                              ({record.cropStage})
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 600,
                              backgroundColor: isHealthy ? '#ecfdf5' : '#fef2f2',
                              color: isHealthy ? '#059669' : '#dc2626'
                            }}
                          >
                            {diseaseName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                          <span>Case #{record.id}</span>
                          {record.location && (
                            <span style={{ marginLeft: '10px' }}>
                              📍 {typeof record.location === 'string' ? record.location : record.location?.name || 'Local'}
                            </span>
                          )}
                          <span style={{ marginLeft: '10px' }}>
                            📅 {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
