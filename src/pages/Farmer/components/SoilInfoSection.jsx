import React from 'react';
import { useLanguage } from '../../../i18n';

export default function SoilInfoSection({ soil = {}, onChange }) {
  const { t } = useLanguage();

  const SOIL_TYPES = [
    { value: '', label: t('soil.typeNotSpecified') },
    { value: 'alluvial', label: t('soil.typeAlluvial') },
    { value: 'black', label: t('soil.typeBlack') },
    { value: 'red_yellow', label: t('soil.typeRed') },
    { value: 'clayey', label: t('soil.typeClayey') },
    { value: 'other', label: t('soil.typeOther') }
  ];

  const PH_LEVELS = [
    { value: '', label: t('soil.phNotTested') },
    { value: 'neutral', label: t('soil.phNormal') },
    { value: 'acidic', label: t('soil.phAcidic') },
    { value: 'alkaline', label: t('soil.phAlkaline') }
  ];

  const MOISTURE_LEVELS = [
    { value: '', label: t('soil.moistureNotSure') },
    { value: 'dry', label: t('soil.moistureDry') },
    { value: 'normal', label: t('soil.moistureNormal') },
    { value: 'wet', label: t('soil.moistureWet') }
  ];

  const IRRIGATION_TYPES = [
    { value: '', label: t('soil.irrigNotSpecified') },
    { value: 'rainfed', label: t('soil.irrigRainfed') },
    { value: 'canal', label: t('soil.irrigCanal') },
    { value: 'tubewell', label: t('soil.irrigTubewell') },
    { value: 'drip_sprinkler', label: t('soil.irrigDrip') }
  ];

  const handleChange = (field, val) => {
    onChange({
      ...soil,
      [field]: val
    });
  };

  const handleReset = () => {
    onChange({
      type: '',
      ph: '',
      moisture: '',
      irrigation: ''
    });
  };

  const hasAnyData = Boolean(soil.type || soil.ph || soil.moisture || soil.irrigation);

  return (
    <div className="soil-info-container">
      <div className="section-sub-desc">
        {t('soil.description')}
      </div>

      <div className="soil-form-grid">
        {/* Soil Type */}
        <div className="soil-input-group">
          <label htmlFor="soil-type-select" className="soil-label">
            {t('soil.soilType')}
          </label>
          <select
            id="soil-type-select"
            className="soil-select"
            value={soil.type || ''}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {SOIL_TYPES.map((tItem) => (
              <option key={tItem.value} value={tItem.value}>
                {tItem.label}
              </option>
            ))}
          </select>
        </div>

        {/* Approximate pH */}
        <div className="soil-input-group">
          <label htmlFor="soil-ph-select" className="soil-label">
            {t('soil.approxPh')}
          </label>
          <select
            id="soil-ph-select"
            className="soil-select"
            value={soil.ph || ''}
            onChange={(e) => handleChange('ph', e.target.value)}
          >
            {PH_LEVELS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Soil Moisture */}
        <div className="soil-input-group">
          <label htmlFor="soil-moisture-select" className="soil-label">
            {t('soil.moisture')}
          </label>
          <select
            id="soil-moisture-select"
            className="soil-select"
            value={soil.moisture || ''}
            onChange={(e) => handleChange('moisture', e.target.value)}
          >
            {MOISTURE_LEVELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Irrigation Method */}
        <div className="soil-input-group">
          <label htmlFor="soil-irrigation-select" className="soil-label">
            {t('soil.irrigation')}
          </label>
          <select
            id="soil-irrigation-select"
            className="soil-select"
            value={soil.irrigation || ''}
            onChange={(e) => handleChange('irrigation', e.target.value)}
          >
            {IRRIGATION_TYPES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasAnyData && (
        <div className="soil-actions-bar">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
          >
            {t('soil.clearBtn')}
          </button>
        </div>
      )}
    </div>
  );
}
