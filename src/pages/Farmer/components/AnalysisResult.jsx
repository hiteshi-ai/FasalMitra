import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  LeafIcon,
  AlertIcon,
  WeatherIcon,
  CheckCircleIcon,
  ExpertIcon,
  ClockIcon,
  InfoIcon,
  RefreshIcon
} from '../../../components/Icons';
import { expertService } from '../../../services/expertService';
import { useLanguage } from '../../../i18n';

export default function AnalysisResult({
  diagnosis,
  riskForecast,
  isRiskLoading,
  riskError,
  crop,
  cropStage,
  location,
  weather,
  soil,
  image,
  farmerSession,
  onReset
}) {
  const { t } = useLanguage();
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [farmerName, setFarmerName] = useState(() => farmerSession?.name || '');
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [isSubmittingExpert, setIsSubmittingExpert] = useState(false);
  const [expertSuccessCase, setExpertSuccessCase] = useState(null);
  const [expertError, setExpertError] = useState(null);

  if (!diagnosis) return null;

  const {
    crop: detectedCrop,
    disease,
    isHealthy,
    confidence,
    severity,
    symptoms = [],
    possibleCauses = [],
    recommendations: diseaseRecs = [],
    explanation: diseaseExplanation,
    needsExpertReview
  } = diagnosis;

  const confidencePct = Math.round((confidence || 0) * 100);

  const getLocalizedLevel = (lvl) => {
    if (!lvl) return '';
    const lower = String(lvl).toLowerCase();
    if (lower === 'low') return t('common.low');
    if (lower === 'moderate' || lower === 'medium') return t('common.moderate');
    if (lower === 'high' || lower === 'severe') return t('common.high');
    return lvl;
  };

  const handleExpertSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingExpert(true);
    setExpertError(null);

    try {
      // Process image data URL for persistence across portal sessions
      let dataUrl = image?.dataUrl || null;
      if (!dataUrl && image?.file) {
        try {
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(image.file);
          });
        } catch {
          dataUrl = null;
        }
      }

      const effectiveUrl = dataUrl || image?.previewUrl || null;
      const imagePayload = effectiveUrl ? {
        url: effectiveUrl,
        dataUrl: dataUrl || (effectiveUrl.startsWith('data:') ? effectiveUrl : null),
        name: image?.name || 'crop_leaf.jpg',
        size: image?.size || 0,
        type: image?.type || 'image/jpeg'
      } : null;

      const response = await expertService.submitConsultation({
        farmerId: farmerSession?.id || null,
        farmerName: farmerName.trim() || farmerSession?.name || 'Farmer',
        crop: detectedCrop || crop?.name || 'Crop',
        cropStage: cropStage || '',
        location: location?.name || 'Local Farm',
        weather: weather || null,
        soil: soil || null,
        image: imagePayload,
        diseaseAnalysis: diagnosis,
        imageAnalysis: diagnosis,
        riskForecast: riskForecast || null,
        farmerNotes: farmerQuestion.trim() || `Farmer requested specialist verification for ${disease || 'crop condition'}.`,
        question: farmerQuestion.trim() || `Farmer requested specialist verification for ${disease || 'crop condition'}.`,
        status: 'Pending',
        expertNotes: '',
        expertAssessment: ''
      });

      setExpertSuccessCase(response.consultation);
    } catch (err) {
      setExpertError(err.message || 'Could not submit consultation request.');
    } finally {
      setIsSubmittingExpert(false);
    }
  };

  return (
    <section className="analysis-result-container" id="analysis-result-section">
      {/* Primary Diagnosis Header */}
      <div className={`result-hero-banner ${isHealthy ? 'healthy' : needsExpertReview ? 'uncertain' : 'disease-detected'}`}>
        <div className="hero-status-content">
          <div className="hero-status-badge">
            {isHealthy ? (
              <CheckCircleIcon size={18} />
            ) : needsExpertReview ? (
              <AlertIcon size={18} />
            ) : (
              <ShieldCheckIcon size={18} />
            )}
            <span>
              {isHealthy
                ? t('diagnosis.healthy')
                : needsExpertReview
                ? t('diagnosis.uncertain')
                : t('diagnosis.detected')}
            </span>
          </div>

          <h2 className="hero-disease-title">
            {isHealthy
              ? t('diagnosis.healthyTitle', { crop: detectedCrop || crop?.name || 'Plant' })
              : t('diagnosis.detectedTitle', { crop: detectedCrop || crop?.name || 'Crop', disease: disease || '' })}
          </h2>

          <div className="hero-metrics-row">
            <div className="metric-chip">
              <span className="metric-chip-label">{t('diagnosis.confidence')}</span>
              <span className="metric-chip-val">{confidencePct}%</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">{t('diagnosis.severity')}</span>
              <span className={`metric-chip-val severity-${severity?.toLowerCase() || 'unknown'}`}>
                {getLocalizedLevel(severity) || t('common.unknown')}
              </span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">{t('diagnosis.identifiedCrop')}</span>
              <span className="metric-chip-val">{detectedCrop}</span>
            </div>
          </div>
        </div>

        <div className="hero-action-group">
          <button
            type="button"
            className="btn btn-outline btn-sm reset-analysis-btn"
            onClick={onReset}
          >
            <RefreshIcon size={14} />
            <span>{t('diagnosis.analyzeAnother')}</span>
          </button>
        </div>
      </div>

      {/* Main Diagnostic Detail Columns */}
      <div className="result-grid-layout">
        {/* Left Column: Visual Diagnosis Findings */}
        <div className="result-column-card">
          <div className="column-card-header">
            <LeafIcon size={18} className="col-icon" />
            <h3 className="column-card-title">{t('diagnosis.findingsTitle')}</h3>
          </div>

          <p className="diagnostic-explanation-text">
            {diseaseExplanation}
          </p>

          {/* Symptoms List */}
          {symptoms.length > 0 && (
            <div className="findings-sub-block">
              <h4 className="findings-sub-title">{t('diagnosis.observedSymptoms')}</h4>
              <ul className="symptoms-bullet-list">
                {symptoms.map((s, idx) => (
                  <li key={idx}>
                    <span className="bullet-dot"></span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Possible Causes */}
          {possibleCauses.length > 0 && (
            <div className="findings-sub-block">
              <h4 className="findings-sub-title">{t('diagnosis.possibleCauses')}</h4>
              <div className="causes-chips-wrap">
                {possibleCauses.map((c, idx) => (
                  <span key={idx} className="cause-tag-chip">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Immediate Cultural Recommendations */}
          {diseaseRecs.length > 0 && (
            <div className="findings-sub-block">
              <h4 className="findings-sub-title">{t('diagnosis.immediateActions')}</h4>
              <ol className="recommendations-numbered-list">
                {diseaseRecs.map((r, idx) => (
                  <li key={idx}>
                    <span className="rec-num">{idx + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right Column: 3-7 Day Microclimate Risk Forecast */}
        <div className="result-column-card risk-forecast-column">
          <div className="column-card-header">
            <WeatherIcon size={18} className="col-icon" />
            <div>
              <h3 className="column-card-title">{t('risk.columnTitle')}</h3>
              <span className="column-sub-tag">{t('risk.badgeTag')}</span>
            </div>
          </div>

          {isRiskLoading ? (
            <div className="risk-loading-sub" style={{ padding: '28px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="loading-spinner"></div>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-title)', fontWeight: 600 }}>
                {t('risk.calculating')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('risk.calculatingSub', { crop: detectedCrop || crop?.name || 'crop' })}
              </span>
            </div>
          ) : riskError ? (
            <div className="risk-error-sub" style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertIcon size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#991b1b', fontSize: '0.9rem', marginBottom: '4px' }}>
                  {t('risk.unavailable')}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                  {t('risk.unavailableSub')}
                </p>
              </div>
            </div>
          ) : riskForecast ? (() => {
            const threeDayRaw = riskForecast.threeDayRisk?.probability ?? riskForecast.risk?.next3Days;
            const threeDayPct = threeDayRaw !== undefined
              ? Math.round(Number(threeDayRaw) * (Number(threeDayRaw) > 1 ? 1 : 100))
              : 45;
            const threeDayLevel = riskForecast.threeDayRisk?.level || (threeDayPct >= 65 ? 'High' : threeDayPct >= 35 ? 'Moderate' : 'Low');
            const threeDayExplanation = riskForecast.threeDayRisk?.explanation;

            const sevenDayRaw = riskForecast.sevenDayRisk?.probability ?? riskForecast.risk?.next7Days;
            const sevenDayPct = sevenDayRaw !== undefined
              ? Math.round(Number(sevenDayRaw) * (Number(sevenDayRaw) > 1 ? 1 : 100))
              : 55;
            const sevenDayLevel = riskForecast.sevenDayRisk?.level || (sevenDayPct >= 65 ? 'High' : sevenDayPct >= 35 ? 'Moderate' : 'Low');
            const sevenDayExplanation = riskForecast.sevenDayRisk?.explanation;

            const overallRiskLevel = riskForecast.riskLevel || (
              (sevenDayPct >= 65 || threeDayPct >= 65) ? 'High' : (sevenDayPct >= 35 || threeDayPct >= 35) ? 'Moderate' : 'Low'
            );

            const factorsList = Array.isArray(riskForecast.riskFactors) && riskForecast.riskFactors.length > 0
              ? riskForecast.riskFactors
              : (Array.isArray(riskForecast.factors) && riskForecast.factors.length > 0 ? riskForecast.factors : []);

            const recsList = Array.isArray(riskForecast.recommendations) && riskForecast.recommendations.length > 0
              ? riskForecast.recommendations
              : [];

            const disclaimer = riskForecast.disclaimer || t('risk.defaultDisclaimer');

            return (
              <div className="risk-forecast-content">
                {/* Risk Meters */}
                <div className="dual-risk-meters">
                  <div className="risk-meter-box">
                    <div className="meter-label-row">
                      <span className="meter-time">{t('risk.threeDayTitle')}</span>
                      <span className="meter-pct">{threeDayPct}%</span>
                    </div>
                    <div className="meter-progress-track">
                      <div
                        className={`meter-progress-fill risk-${threeDayLevel.toLowerCase()}`}
                        style={{ width: `${threeDayPct}%` }}
                      ></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className={`risk-status-pill pill-${threeDayLevel.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {t('risk.threeDayLevel', { level: getLocalizedLevel(threeDayLevel) })}
                      </span>
                    </div>
                    {threeDayExplanation && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {threeDayExplanation}
                      </p>
                    )}
                  </div>

                  <div className="risk-meter-box">
                    <div className="meter-label-row">
                      <span className="meter-time">{t('risk.sevenDayTitle')}</span>
                      <span className="meter-pct">{sevenDayPct}%</span>
                    </div>
                    <div className="meter-progress-track">
                      <div
                        className={`meter-progress-fill risk-${sevenDayLevel.toLowerCase()}`}
                        style={{ width: `${sevenDayPct}%` }}
                      ></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className={`risk-status-pill pill-${sevenDayLevel.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {t('risk.sevenDayLevel', { level: getLocalizedLevel(sevenDayLevel) })}
                      </span>
                    </div>
                    {sevenDayExplanation && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {sevenDayExplanation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overall Risk Level Badge */}
                <div className="overall-risk-status">
                  <span className="risk-status-label">{t('risk.cumulative')}</span>
                  <span className={`risk-status-pill pill-${overallRiskLevel.toLowerCase()}`}>
                    {t('risk.threeDayLevel', { level: getLocalizedLevel(overallRiskLevel) })}
                  </span>
                </div>

                {/* Environmental Drivers / Risk Factors */}
                {factorsList.length > 0 && (
                  <div className="risk-drivers-box">
                    <h4 className="drivers-title">{t('risk.driversTitle')}</h4>
                    <ul className="drivers-list">
                      {factorsList.map((f, idx) => (
                        <li key={idx}>
                          <WeatherIcon size={14} className="factor-icon" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Explanation fallback if per-period explanations were not provided */}
                {riskForecast.explanation && !threeDayExplanation && !sevenDayExplanation && (
                  <p className="risk-explanation-text">
                    {riskForecast.explanation}
                  </p>
                )}

                {/* Preventative Recommendations */}
                {recsList.length > 0 && (
                  <div className="risk-preventative-box">
                    <h4 className="preventative-title">{t('risk.preventionTitle')}</h4>
                    <ul className="preventative-list">
                      {recsList.map((pr, idx) => (
                        <li key={idx}>
                          <CheckCircleIcon size={14} className="check-icon" />
                          <span>{pr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mandatory Disclaimer */}
                <div className="risk-disclaimer-note">
                  <InfoIcon size={14} />
                  <span>{disclaimer}</span>
                </div>
              </div>
            );
          })() : (
            <div className="risk-loading-sub" style={{ padding: '20px 16px', textAlign: 'center' }}>
              <ClockIcon size={16} />
              <span>{t('risk.awaiting')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expert Verification Recommendation Banner */}
      <div className="expert-recommendation-bar">
        <div className="expert-rec-text-group">
          <div className="expert-avatar-bubble">
            <ExpertIcon size={22} />
          </div>
          <div>
            <h4 className="expert-rec-title">
              {needsExpertReview
                ? t('expertBanner.recommended')
                : t('expertBanner.secondOpinion')}
            </h4>
            <p className="expert-rec-sub">
              {needsExpertReview
                ? t('expertBanner.recDesc')
                : t('expertBanner.opDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary expert-escalate-btn"
          onClick={() => setShowExpertModal(true)}
        >
          <ExpertIcon size={16} />
          <span>{t('expertBanner.requestBtn')}</span>
        </button>
      </div>

      {/* Expert Escalation Modal */}
      {showExpertModal && (
        <div className="expert-modal-backdrop" role="dialog" aria-modal="true">
          <div className="expert-modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <ExpertIcon size={20} className="modal-header-icon" />
                <h3>{t('expertModal.title')}</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm close-modal-btn"
                onClick={() => setShowExpertModal(false)}
              >
                &times;
              </button>
            </div>

            {expertSuccessCase ? (
              <div className="modal-success-state">
                <CheckCircleIcon size={36} className="modal-success-icon" />
                <h4>{t('expertModal.successTitle')}</h4>
                <p>
                  {t('expertModal.successDesc', { id: expertSuccessCase.id })}
                </p>
                <div className="case-ticket-summary">
                  <div><strong>{t('expertModal.caseCrop')}</strong> {expertSuccessCase.crop}</div>
                  <div><strong>{t('expertModal.caseStatus')}</strong> {expertSuccessCase.status}</div>
                  <div><strong>{t('expertModal.caseLocation')}</strong> {expertSuccessCase.location}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowExpertModal(false);
                    setExpertSuccessCase(null);
                  }}
                >
                  {t('common.done')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleExpertSubmit} className="modal-form">
                <p className="modal-form-intro">
                  {t('expertModal.intro', { disease: disease || 'condition' })}
                </p>

                <div className="modal-input-group">
                  <label htmlFor="farmer-name-input">{t('expertModal.nameLabel')}</label>
                  <input
                    id="farmer-name-input"
                    type="text"
                    className="modal-input"
                    placeholder={t('expertModal.namePlaceholder')}
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                  />
                </div>

                <div className="modal-input-group">
                  <label htmlFor="farmer-question-input">{t('expertModal.questionLabel')}</label>
                  <textarea
                    id="farmer-question-input"
                    className="modal-textarea"
                    rows="3"
                    placeholder={t('expertModal.questionPlaceholder')}
                    value={farmerQuestion}
                    onChange={(e) => setFarmerQuestion(e.target.value)}
                  ></textarea>
                </div>

                {expertError && (
                  <div className="modal-error-alert">
                    <AlertIcon size={16} />
                    <span>{expertError}</span>
                  </div>
                )}

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowExpertModal(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSubmittingExpert}
                  >
                    {isSubmittingExpert ? t('expertModal.submitting') : t('expertModal.submitBtn')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Scientific Honesty & Transparency Notice */}
      <footer className="analysis-honesty-footer">
        <InfoIcon size={16} />
        <span>
          {t('diagnosis.honestyFooter')}
        </span>
      </footer>
    </section>
  );
}
