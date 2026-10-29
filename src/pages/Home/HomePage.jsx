import React from 'react';
import { SproutIcon, ExpertIcon, LeafIcon, ShieldCheckIcon, WeatherIcon, AlertIcon } from '../../components/Icons';
import { useLanguage } from '../../i18n';

export default function HomePage({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <main className="page-wrapper home-page">
      <section className="hero-section">
        <div className="hero-badge">
          <SproutIcon size={16} />
          <span>{t('home.heroBadge')}</span>
        </div>

        <h1 className="hero-title">
          {t('common.fasalMitra')} <span className="brand-accent">{t('common.ai')}</span>
        </h1>

        <p className="hero-tagline">
          {t('home.heroTagline')}
        </p>

        <p className="hero-description">
          {t('home.heroDescription')}
        </p>

        <div className="hero-actions">
          <button
            onClick={() => onNavigate('farmer')}
            className="btn btn-primary"
            id="btn-farmer-portal"
          >
            <LeafIcon size={18} />
            <span>{t('home.farmerPortalBtn')}</span>
          </button>

          <button
            onClick={() => onNavigate('expert')}
            className="btn btn-secondary"
            id="btn-expert-portal"
          >
            <ExpertIcon size={18} />
            <span>{t('home.expertPortalBtn')}</span>
          </button>
        </div>
      </section>

      {/* Portal Highlights Overview */}
      <section className="portal-overview-section">
        <div className="portal-card" onClick={() => onNavigate('farmer')}>
          <div className="portal-card-header">
            <div className="portal-card-icon farmer-accent">
              <LeafIcon size={24} />
            </div>
            <div>
              <span className="portal-badge">{t('home.farmerCardBadge')}</span>
              <h3 className="portal-card-title">{t('home.farmerCardTitle')}</h3>
            </div>
          </div>
          <p className="portal-card-desc">
            {t('home.farmerCardDesc')}
          </p>
          <ul className="portal-features-list">
            <li><WeatherIcon size={16} /> {t('home.farmerCardFeature1')}</li>
            <li><AlertIcon size={16} /> {t('home.farmerCardFeature2')}</li>
            <li><ShieldCheckIcon size={16} /> {t('home.farmerCardFeature3')}</li>
          </ul>
          <div className="portal-card-action">
            <span>{t('home.farmerCardAction')}</span>
          </div>
        </div>

        <div className="portal-card" onClick={() => onNavigate('expert')}>
          <div className="portal-card-header">
            <div className="portal-card-icon expert-accent">
              <ExpertIcon size={24} />
            </div>
            <div>
              <span className="portal-badge">{t('home.expertCardBadge')}</span>
              <h3 className="portal-card-title">{t('home.expertCardTitle')}</h3>
            </div>
          </div>
          <p className="portal-card-desc">
            {t('home.expertCardDesc')}
          </p>
          <ul className="portal-features-list">
            <li><ShieldCheckIcon size={16} /> {t('home.expertCardFeature1')}</li>
            <li><AlertIcon size={16} /> {t('home.expertCardFeature2')}</li>
            <li><ExpertIcon size={16} /> {t('home.expertCardFeature3')}</li>
          </ul>
          <div className="portal-card-action">
            <span>{t('home.expertCardAction')}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
