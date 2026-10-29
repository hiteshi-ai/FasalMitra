import React, { useState } from 'react';
import { DISTRICTS } from '../../../data/districts';
import { MapPinIcon, RefreshIcon, AlertIcon } from '../../../components/Icons';
import { reverseGeocodeCoordinates } from '../../../services/locationService';
import { useLanguage } from '../../../i18n';

export default function LocationSection({ location, onLocationChange }) {
  const { t } = useLanguage();
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(
    location?.type === 'manual' ? location.id || '' : ''
  );

  const handleUseMyLocation = () => {
    setLocError(null);

    if (!('geolocation' in navigator)) {
      setLocError(t('farmer.geoNotSupported'));
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        
        // Immediate notification with auto-detected fallback to trigger weather without delay
        onLocationChange({
          type: 'gps',
          name: 'Current Device Location (Auto-detected)',
          lat: latitude,
          lng: longitude
        });

        // Resolve human-readable city/state asynchronously via OpenStreetMap Nominatim
        try {
          const resolvedName = await reverseGeocodeCoordinates(latitude, longitude);
          if (resolvedName && resolvedName !== 'Current Device Location (Auto-detected)') {
            onLocationChange({
              type: 'gps',
              name: resolvedName,
              lat: latitude,
              lng: longitude
            });
          }
        } catch {
          // Gracefully retain "Current Device Location (Auto-detected)"
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          setLocError(t('farmer.geoDenied'));
        } else if (error.code === 2) {
          setLocError(t('farmer.geoUnavailable'));
        } else if (error.code === 3) {
          setLocError(t('farmer.geoTimeout'));
        } else {
          setLocError(t('farmer.geoError'));
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

  const handleDistrictSelect = (e) => {
    const distId = e.target.value;
    setSelectedDistrictId(distId);
    setLocError(null);

    if (!distId) return;

    const district = DISTRICTS.find((d) => d.id === distId);
    if (district) {
      onLocationChange({
        type: 'manual',
        id: district.id,
        name: `${district.name}, ${district.state}`,
        lat: district.lat,
        lng: district.lng
      });
    }
  };

  return (
    <div className="location-section-container">
      {location ? (
        // Active Location Display
        <div className="active-location-banner">
          <div className="location-badge-group">
            <div className="location-icon-bubble">
              <MapPinIcon size={20} />
            </div>
            <div>
              <span className="location-type-tag">
                {location.type === 'gps' ? t('farmer.gpsAutoDetected') : t('farmer.districtSelected')}
              </span>
              <h4 className="active-location-name">{location.name}</h4>
            </div>
          </div>

          <div className="location-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleUseMyLocation}
              disabled={isLocating}
            >
              <RefreshIcon size={14} />
              <span>{isLocating ? t('farmer.locating') : t('farmer.redetectGps')}</span>
            </button>
          </div>
        </div>
      ) : (
        // Set Location Controls
        <div className="location-picker-controls">
          <p className="location-hint-text">
            {t('farmer.locationHint')}
          </p>

          <div className="location-buttons-grid">
            <button
              type="button"
              className="btn btn-primary location-gps-btn"
              onClick={handleUseMyLocation}
              disabled={isLocating}
            >
              <MapPinIcon size={18} />
              <span>{isLocating ? t('farmer.detectingLocation') : t('farmer.useMyLocation')}</span>
            </button>

            <div className="district-dropdown-wrapper">
              <label htmlFor="district-select" className="district-label">
                {t('farmer.selectDistrictManually')}
              </label>
              <select
                id="district-select"
                className="district-select-input"
                value={selectedDistrictId}
                onChange={handleDistrictSelect}
              >
                <option value="">{t('farmer.chooseDistrict')}</option>
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation / Fallback Error Message */}
      {locError && (
        <div className="location-error-alert" role="alert">
          <div className="alert-content">
            <AlertIcon size={18} />
            <span>{locError}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline retry-btn"
            onClick={handleUseMyLocation}
          >
            {t('farmer.retryGps')}
          </button>
        </div>
      )}
    </div>
  );
}
