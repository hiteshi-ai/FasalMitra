import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  LeafIcon,
  MapPinIcon,
  WeatherIcon,
  CameraIcon,
  InfoIcon,
  AlertIcon
} from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

export default function SubmissionReview({
  farmerInput,
  onStartAnalysis,
  isAnalyzing,
  analysisStage,
  analysisError
}) {
  const { t, language } = useLanguage();
  const [localWarning, setLocalWarning] = useState(null);

  const { crop, cropStage, location, weather, soil, image } = farmerInput;

  const isReadyForAnalysis = Boolean(crop && image?.file);

  const handleAnalyzeClick = () => {
    setLocalWarning(null);

    if (!crop) {
      setLocalWarning(t('review.warnSelectCrop'));
      return;
    }

    if (!image?.file) {
      setLocalWarning(t('review.warnUploadImage'));
      return;
    }

    onStartAnalysis();
  };

  const getSoilSummary = () => {
    if (!soil) return t('review.noSoil');
    const parts = [];
    if (soil.type) parts.push(`${t('soil.soilType')}: ${soil.type}`);
    if (soil.ph) parts.push(`pH: ${soil.ph}`);
    if (soil.moisture) parts.push(`${t('soil.moisture')}: ${soil.moisture}`);
    if (soil.irrigation) parts.push(`${t('soil.irrigation')}: ${soil.irrigation}`);
    return parts.length > 0 ? parts.join(' • ') : t('review.soilSummaryStandard');
  };

  const getRegionalCropName = (c) => {
    if (!c) return '';
    if (language === 'pa' && c.punjabiName) return c.punjabiName;
    return c.hindiName || '';
  };

  return (
    <section className="dash-card submission-review-card featured">
      <div className="card-top">
        <div className="card-title-group">
          <div className="card-icon-bubble green">
            <ShieldCheckIcon size={20} />
          </div>
          <div>
            <h3 className="card-title">{t('review.title')}</h3>
            <span className="card-subtitle">
              {t('review.subtitle')}
            </span>
          </div>
        </div>
        <span className="card-tag">{t('review.readyTag')}</span>
      </div>

      <div className="card-body">
        {/* Input Summary Grid */}
        <div className="review-summary-grid">
          {/* Row 1: Crop & Stage */}
          <div className="review-item">
            <div className="review-item-header">
              <LeafIcon size={16} className="review-item-icon" />
              <span className="review-item-label">{t('review.cropStageLabel')}</span>
            </div>
            <div className="review-item-value">
              {crop ? (
                <>
                  <strong>{crop.name}</strong>{' '}
                  <span className="review-hindi">({getRegionalCropName(crop)})</span>
                  <div className="review-sub-badge">
                    {t('farmer.stepStage')}: {cropStage || t('review.stageUnspecified')} &bull; {crop.category}
                  </div>
                </>
              ) : (
                <span className="review-missing">{t('review.noCrop')}</span>
              )}
            </div>
          </div>

          {/* Row 2: Location */}
          <div className="review-item">
            <div className="review-item-header">
              <MapPinIcon size={16} className="review-item-icon" />
              <span className="review-item-label">{t('review.locationLabel')}</span>
            </div>
            <div className="review-item-value">
              {location ? (
                <>
                  <strong>{location.name}</strong>
                  <div className="review-sub-badge">
                    {location.type === 'gps' ? t('review.sourceGps') : t('review.sourceManual')}
                  </div>
                </>
              ) : (
                <span className="review-missing">{t('review.noLocation')}</span>
              )}
            </div>
          </div>

          {/* Row 3: Weather Microclimate */}
          <div className="review-item">
            <div className="review-item-header">
              <WeatherIcon size={16} className="review-item-icon" />
              <span className="review-item-label">{t('review.weatherLabel')}</span>
            </div>
            <div className="review-item-value">
              {weather ? (
                <>
                  <strong>{weather.temperature}&deg;C &bull; {weather.condition}</strong>
                  <div className="review-sub-badge">
                    {t('weather.humidity')}: {weather.humidity}% &bull; {t('weather.rainChance')}: {weather.rainProbability}%
                  </div>
                </>
              ) : (
                <span className="review-missing">{t('review.pendingWeather')}</span>
              )}
            </div>
          </div>

          {/* Row 4: Soil Information */}
          <div className="review-item">
            <div className="review-item-header">
              <ShieldCheckIcon size={16} className="review-item-icon" />
              <span className="review-item-label">{t('review.soilLabel')}</span>
            </div>
            <div className="review-item-value">
              <span>{getSoilSummary()}</span>
            </div>
          </div>

          {/* Row 5: Leaf Image */}
          <div className="review-item image-review-item">
            <div className="review-item-header">
              <CameraIcon size={16} className="review-item-icon" />
              <span className="review-item-label">{t('review.imageLabel')}</span>
            </div>
            <div className="review-item-value">
              {image ? (
                <div className="review-image-preview-row">
                  <img
                    src={image.previewUrl}
                    alt="Uploaded Leaf Thumbnail"
                    className="review-thumbnail-img"
                  />
                  <div>
                    <strong>{image.name}</strong>
                    <div className="review-sub-badge">
                      {(image.size / (1024 * 1024)).toFixed(2)} MB &bull; {t('review.imageReady')}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="review-missing">{t('review.noImage')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Local Warning Banner */}
        {localWarning && (
          <div className="review-warning-banner" role="alert">
            <AlertIcon size={16} />
            <span>{localWarning}</span>
          </div>
        )}

        {/* Analysis Error Banner */}
        {analysisError && (
          <div className="review-error-banner" role="alert">
            <AlertIcon size={18} />
            <div className="error-text-wrap">
              <strong>{t('review.errorHeader')}</strong>
              <p>{analysisError}</p>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="analysis-action-bar">
          <div className="analysis-prompt-text">
            <InfoIcon size={18} />
            <span>
              {isAnalyzing
                ? analysisStage || t('review.promptProcessing')
                : t('review.promptReady')}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg analyze-submit-btn"
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing || !isReadyForAnalysis}
            title={!isReadyForAnalysis ? t('review.warnSelectCrop') : t('review.analyzeBtn')}
          >
            {isAnalyzing ? (
              <>
                <div className="btn-spinner"></div>
                <span>{analysisStage || t('review.analyzingBtn')}</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon size={20} />
                <span>{t('review.analyzeBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
