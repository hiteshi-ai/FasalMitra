import React from 'react';
import {
  WeatherIcon,
  ClockIcon,
  RefreshIcon,
  AlertIcon,
  InfoIcon
} from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

export default function WeatherCard({
  weather,
  isLoading,
  error,
  onRetry,
  hasLocation
}) {
  const { t } = useLanguage();

  const formatTime = (isoString) => {
    if (!isoString) return t('common.justNow');
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return t('common.recent');
    }
  };

  return (
    <section className="dash-card weather-card">
      <div className="card-top">
        <div className="card-title-group">
          <div className="card-icon-bubble green">
            <WeatherIcon size={20} />
          </div>
          <div>
            <h3 className="card-title">{t('weather.title')}</h3>
            <span className="card-subtitle">
              {weather ? weather.location : t('weather.defaultSubtitle')}
            </span>
          </div>
        </div>

        {weather && (
          <span className={`card-tag ${weather.isDevelopmentData ? 'alert-tag' : 'live-tag'}`}>
            {weather.isDevelopmentData ? t('weather.fallbackMode') : t('weather.liveFeed')}
          </span>
        )}
      </div>

      <div className="card-body">
        {/* State 1: No Location Selected */}
        {!hasLocation && !isLoading && (
          <div className="weather-empty-state">
            <WeatherIcon size={32} className="empty-icon" />
            <p className="empty-title">{t('weather.locationRequired')}</p>
            <span className="empty-sub">
              {t('weather.locationRequiredHint')}
            </span>
          </div>
        )}

        {/* State 2: Loading State */}
        {isLoading && (
          <div className="weather-loading-state">
            <div className="loading-spinner"></div>
            <p>{t('weather.fetching')}</p>
            <span className="sub-hint">{t('weather.queryingSensors')}</span>
          </div>
        )}

        {/* State 3: Error State */}
        {!isLoading && error && (
          <div className="weather-error-state">
            <AlertIcon size={24} className="error-icon" />
            <p className="error-msg">{t('weather.errorTitle')}</p>
            <span className="error-sub">{error}</span>
            <button type="button" className="btn btn-outline btn-sm retry-btn" onClick={onRetry}>
              <RefreshIcon size={14} />
              <span>{t('weather.retryBtn')}</span>
            </button>
          </div>
        )}

        {/* State 4: Loaded Weather Data */}
        {!isLoading && !error && weather && (
          <div className="weather-loaded-content">
            {weather.isDevelopmentData && (
              <div className="dev-data-banner">
                <InfoIcon size={16} />
                <span>{t('weather.devBanner')}</span>
              </div>
            )}

            <div className="weather-preview">
              <div className="weather-primary">
                <span className="weather-temp">{weather.temperature}&deg;C</span>
                <div>
                  <span className="weather-condition">{weather.condition}</span>
                  <div className="weather-location-sub">{weather.location}</div>
                </div>
              </div>

              <div className="weather-metrics">
                <div className="metric-item">
                  <span className="metric-label">{t('weather.humidity')}</span>
                  <span className="metric-val">{weather.humidity}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t('weather.rainChance')}</span>
                  <span className="metric-val">{weather.rainProbability}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t('weather.windSpeed')}</span>
                  <span className="metric-val">{weather.windSpeed} km/h</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t('weather.rainfall')}</span>
                  <span className="metric-val">{weather.rainfall ?? 0} mm</span>
                </div>
              </div>
            </div>

            <div className="weather-footer-bar">
              <div className="update-time-note">
                <ClockIcon size={14} />
                <span>{t('weather.updated')} {formatTime(weather.timestamp)} &bull; {weather.dataSource}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm refresh-weather-btn"
                onClick={onRetry}
                title={t('common.refresh')}
              >
                <RefreshIcon size={14} />
                <span>{t('common.refresh')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
