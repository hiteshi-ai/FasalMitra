import React, { useState } from 'react';
import {
  XIcon,
  CheckCircleIcon,
  AlertIcon,
  ClockIcon,
  ShieldCheckIcon,
  LeafIcon,
  WeatherIcon,
  DropletIcon,
  CameraIcon,
  MapPinIcon,
  InfoIcon
} from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

// Helper to normalize initial status string
function getNormalizedStatus(rawStatus) {
  if (!rawStatus) return 'Pending';
  const s = rawStatus.toLowerCase();
  if (s.includes('resolve') || s.includes('closed')) return 'Resolved';
  if (s.includes('under review') || s.includes('active') || s.includes('in progress')) return 'Under Review';
  return 'Pending';
}

function CaseReviewModalContent({
  caseData,
  onClose,
  onSaveReview
}) {
  const { t } = useLanguage();
  const [expertNotes, setExpertNotes] = useState(caseData.expertNotes || '');
  const [expertAssessment, setExpertAssessment] = useState(caseData.expertAssessment || '');
  const [status, setStatus] = useState(() => getNormalizedStatus(caseData.status));
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSaveReview(caseData.id, {
        expertNotes: expertNotes.trim(),
        expertAssessment: expertAssessment.trim(),
        status
      });
      setSuccessMessage(t('caseReview.saveSuccess'));
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || t('caseReview.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const [imageError, setImageError] = useState(false);

  // Image source resolution
  const imageUrl = caseData.image?.url || caseData.image?.dataUrl || caseData.image?.previewUrl || (typeof caseData.image === 'string' ? caseData.image : null);

  // AI analysis details
  const diagnosis = caseData.diseaseAnalysis || caseData.imageAnalysis;
  const confidencePct = diagnosis?.confidence !== undefined
    ? Math.round(Number(diagnosis.confidence) * 100)
    : null;

  const weather = caseData.weather;
  const soil = caseData.soil;
  const riskForecast = caseData.riskForecast;

  const getStatusLabel = (st) => {
    if (st === 'Pending') return t('common.pending');
    if (st === 'Under Review') return t('common.underReview');
    if (st === 'Resolved') return t('common.resolved');
    return st;
  };

  return (
    <div className="expert-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="case-review-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheckIcon size={22} className="modal-header-icon" />
            <div>
              <div className="modal-case-tag">{t('expert.caseTag', { id: caseData.id })}</div>
              <h2 id="review-modal-title" className="modal-title">
                {t('caseReview.title')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm close-modal-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="case-review-scrollable-body">
          {/* Top Quick Meta Banner */}
          <div className="case-meta-banner">
            <div className="meta-badge-item">
              <LeafIcon size={16} />
              <span><strong>{t('caseReview.crop')}</strong> {caseData.crop || 'Unspecified'} {caseData.cropStage ? `(${caseData.cropStage})` : ''}</span>
            </div>
            <div className="meta-badge-item">
              <MapPinIcon size={16} />
              <span><strong>{t('caseReview.location')}</strong> {caseData.location || 'Local Farm'}</span>
            </div>
            <div className="meta-badge-item">
              <ClockIcon size={16} />
              <span><strong>{t('caseReview.submitted')}</strong> {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : t('common.recent')}</span>
            </div>
            <div className="meta-badge-item">
              <span className={`case-status-pill status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                {getStatusLabel(status)}
              </span>
            </div>
          </div>

          {/* Farmer Notes / Inquiry */}
          <div className="review-section-block">
            <h4 className="review-section-title">{t('caseReview.farmerInquiry')}</h4>
            <div className="farmer-inquiry-box">
              <p>{caseData.farmerNotes || caseData.question || 'Farmer requested specialist review of plant symptoms.'}</p>
              <div className="farmer-name-sub">
                {t('caseReview.submittedBy')} <strong>{caseData.farmerName || t('caseReview.anonymous')}</strong>
              </div>
            </div>
          </div>

          {/* Crop Leaf Image Preview */}
          <div className="review-section-block">
            <h4 className="review-section-title">{t('caseReview.foliageSpecimen')}</h4>
            {imageUrl && !imageError ? (
              <div className="case-image-container">
                <img
                  src={imageUrl}
                  alt={`Foliage specimen for ${caseData.crop || 'crop'}`}
                  className="case-modal-large-image"
                  onError={() => setImageError(true)}
                />
                <div className="image-caption-bar">
                  <span>{t('caseReview.farmerUploaded', { name: caseData.image?.name || 'leaf_photo.jpg' })}</span>
                  {caseData.image?.size ? (
                    <span>{(caseData.image.size / (1024 * 1024)).toFixed(2)} MB</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="case-no-image-box">
                <CameraIcon size={36} className="no-image-icon" />
                <p>{t('caseReview.noImageTitle')}</p>
                <span className="no-image-subtext">{t('caseReview.noImageSub')}</span>
              </div>
            )}
          </div>

          {/* AI Assessment Section */}
          <div className="review-section-block">
            <div className="section-title-with-badge">
              <h4 className="review-section-title">{t('caseReview.aiSectionTitle')}</h4>
              <span className="ai-notice-tag">{t('caseReview.aiNotice')}</span>
            </div>

            {diagnosis ? (
              <div className="ai-assessment-panel">
                <div className="ai-primary-badge-row">
                  <div className="ai-diagnosis-badge">
                    <span className="ai-badge-label">{t('caseReview.detectedCondition')}</span>
                    <span className="ai-badge-value">
                      {diagnosis.isHealthy ? t('diagnosis.healthy') : (diagnosis.disease || t('diagnosis.detected'))}
                    </span>
                  </div>

                  {confidencePct !== null && (
                    <div className="ai-stat-pill">
                      <span className="stat-label">{t('caseReview.confidence')}</span>
                      <span className="stat-value">{confidencePct}%</span>
                    </div>
                  )}

                  {diagnosis.severity && (
                    <div className="ai-stat-pill">
                      <span className="stat-label">{t('caseReview.severity')}</span>
                      <span className={`stat-value severity-${diagnosis.severity.toLowerCase()}`}>
                        {diagnosis.severity}
                      </span>
                    </div>
                  )}
                </div>

                {diagnosis.explanation && (
                  <div className="ai-explanation-box">
                    <strong>{t('caseReview.clinicalSummary')}</strong>
                    <p>{diagnosis.explanation}</p>
                  </div>
                )}

                {Array.isArray(diagnosis.symptoms) && diagnosis.symptoms.length > 0 && (
                  <div className="ai-details-list-group">
                    <strong>{t('caseReview.observedSymptoms')}</strong>
                    <ul className="ai-bullet-list">
                      {diagnosis.symptoms.map((sym, idx) => (
                        <li key={idx}>{sym}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(diagnosis.recommendations) && diagnosis.recommendations.length > 0 && (
                  <div className="ai-details-list-group">
                    <strong>{t('caseReview.prelimGuidance')}</strong>
                    <ul className="ai-bullet-list">
                      {diagnosis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-section-notice">
                <InfoIcon size={16} />
                <span>{t('caseReview.noAiDiagnosis')}</span>
              </div>
            )}

            {/* 3-7 Day Microclimate Risk Forecast */}
            {riskForecast && (
              <div className="risk-forecast-subpanel">
                <div className="risk-header-row">
                  <strong>{t('caseReview.sporeRisk')}</strong>
                  <span className={`risk-level-tag pill-${(riskForecast.riskLevel || riskForecast.threeDayRisk?.level || 'moderate').toLowerCase()}`}>
                    {riskForecast.riskLevel || riskForecast.threeDayRisk?.level || 'Moderate'} {t('common.high')}
                  </span>
                </div>
                <div className="risk-meters-mini">
                  <div className="risk-metric">
                    <span>{t('caseReview.threeDay')}</span>
                    <strong>
                      {Math.round(((riskForecast.threeDayRisk?.probability ?? riskForecast.risk?.next3Days) || 0) * (riskForecast.threeDayRisk?.probability > 1 ? 1 : 100))}%
                    </strong>
                  </div>
                  <div className="risk-metric">
                    <span>{t('caseReview.sevenDay')}</span>
                    <strong>
                      {Math.round(((riskForecast.sevenDayRisk?.probability ?? riskForecast.risk?.next7Days) || 0) * (riskForecast.sevenDayRisk?.probability > 1 ? 1 : 100))}%
                    </strong>
                  </div>
                </div>
                {(riskForecast.explanation || riskForecast.threeDayRisk?.explanation) && (
                  <p className="risk-mini-exp">{riskForecast.explanation || riskForecast.threeDayRisk?.explanation}</p>
                )}
              </div>
            )}
          </div>

          {/* Environmental Conditions Section */}
          <div className="review-section-block">
            <h4 className="review-section-title">{t('caseReview.envTitle')}</h4>
            <div className="environmental-grid">
              {/* Weather Sub-block */}
              <div className="env-subcard">
                <div className="env-subcard-header">
                  <WeatherIcon size={16} />
                  <span>{t('caseReview.microclimate')}</span>
                </div>
                {weather ? (
                  <div className="env-data-list">
                    <div className="env-data-row">
                      <span>{t('caseReview.temperature')}</span>
                      <strong>{weather.temperature}&deg;C ({weather.condition || 'Fair'})</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.humidity')}</span>
                      <strong>{weather.humidity}%</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.rainProb')}</span>
                      <strong>{weather.rainProbability}%</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.precipitation')}</span>
                      <strong>{weather.rainfall ?? 0} mm</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.windSpeed')}</span>
                      <strong>{weather.windSpeed ?? 'N/A'} km/h</strong>
                    </div>
                  </div>
                ) : (
                  <p className="env-empty-note">{t('caseReview.noWeather')}</p>
                )}
              </div>

              {/* Soil Sub-block */}
              <div className="env-subcard">
                <div className="env-subcard-header">
                  <DropletIcon size={16} />
                  <span>{t('caseReview.soilProfile')}</span>
                </div>
                {soil && (soil.type || soil.ph || soil.moisture || soil.irrigation) ? (
                  <div className="env-data-list">
                    <div className="env-data-row">
                      <span>{t('caseReview.soilType')}</span>
                      <strong>{soil.type || t('soil.typeNotSpecified')}</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.soilPh')}</span>
                      <strong>{soil.ph || t('soil.phNotTested')}</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.soilMoisture')}</span>
                      <strong>{soil.moisture || t('soil.moistureNotSure')}</strong>
                    </div>
                    <div className="env-data-row">
                      <span>{t('caseReview.soilIrrigation')}</span>
                      <strong>{soil.irrigation || t('soil.irrigNotSpecified')}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="env-empty-note">{t('caseReview.noSoil')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Expert Review Section */}
          <form onSubmit={handleSave} className="review-section-block expert-edit-section">
            <h4 className="review-section-title">{t('caseReview.expertSectionTitle')}</h4>

            <div className="form-group-block">
              <label htmlFor="modal-expert-notes" className="modal-field-label">
                {t('caseReview.expertNotesLabel')}
              </label>
              <textarea
                id="modal-expert-notes"
                className="modal-textarea"
                rows="3"
                placeholder={t('caseReview.expertNotesPlaceholder')}
                value={expertNotes}
                onChange={(e) => setExpertNotes(e.target.value)}
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="modal-expert-assessment" className="modal-field-label">
                {t('caseReview.expertAssessmentLabel')}
              </label>
              <textarea
                id="modal-expert-assessment"
                className="modal-textarea"
                rows="3"
                placeholder={t('caseReview.expertAssessmentPlaceholder')}
                value={expertAssessment}
                onChange={(e) => setExpertAssessment(e.target.value)}
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="modal-case-status" className="modal-field-label">
                {t('caseReview.caseStatusLabel')}
              </label>
              <select
                id="modal-case-status"
                className="modal-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">{t('common.pending')}</option>
                <option value="Under Review">{t('common.underReview')}</option>
                <option value="Resolved">{t('common.resolved')}</option>
              </select>
            </div>

            {/* Notification messages */}
            {successMessage && (
              <div className="modal-success-banner" role="status">
                <CheckCircleIcon size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="modal-error-alert" role="alert">
                <AlertIcon size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="modal-actions-bar">
              <span className="session-storage-notice">
                {t('caseReview.sessionNotice')}
              </span>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onClose}
                >
                  {t('common.close')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm save-review-btn"
                  disabled={isSaving}
                >
                  {isSaving ? t('caseReview.savingBtn') : t('caseReview.saveBtn')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CaseReviewModal({
  isOpen,
  caseData,
  onClose,
  onSaveReview
}) {
  if (!isOpen || !caseData) return null;

  return (
    <CaseReviewModalContent
      key={caseData.id}
      caseData={caseData}
      onClose={onClose}
      onSaveReview={onSaveReview}
    />
  );
}
