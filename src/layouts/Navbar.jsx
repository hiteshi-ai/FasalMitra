import React from 'react';
import { SproutIcon, LeafIcon, ExpertIcon } from '../components/Icons';
import { useLanguage, LanguageSelector } from '../i18n';

export default function Navbar({
  currentPage,
  onNavigate,
  farmerSession,
  expertSession,
  onFarmerLogout,
  onExpertLogout
}) {
  const { t } = useLanguage();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <button
          className="brand-logo-btn"
          onClick={() => onNavigate('home')}
          aria-label="FasalMitra AI Home"
        >
          <div className="brand-icon-wrapper">
            <SproutIcon size={24} className="brand-icon" />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">
              {t('common.fasalMitra')} <span className="brand-highlight">{t('common.ai')}</span>
            </span>
            <span className="brand-badge">{t('common.phase1')}</span>
          </div>
        </button>

        <nav className="nav-links">
          <button
            onClick={() => onNavigate('home')}
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          >
            {t('nav.home')}
          </button>
          <button
            onClick={() => onNavigate('farmer')}
            className={`nav-btn ${currentPage === 'farmer' || currentPage === 'login' ? 'active' : ''}`}
          >
            {t('nav.farmerPortal')}
          </button>
          <button
            onClick={() => onNavigate('expert')}
            className={`nav-btn ${currentPage === 'expert' || currentPage === 'expert-login' ? 'active' : ''}`}
          >
            {t('nav.expertPortal')}
          </button>

          {farmerSession ? (
            <div className="nav-user-panel">
              <span className="nav-user-chip farmer-chip" title={farmerSession.email}>
                <LeafIcon size={14} />
                <span>{farmerSession.name}</span>
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm nav-logout-btn"
                onClick={onFarmerLogout}
              >
                {t('common.logout')}
              </button>
            </div>
          ) : expertSession ? (
            <div className="nav-user-panel">
              <span className="nav-user-chip expert-chip">
                <ExpertIcon size={14} />
                <span>{t('nav.expertSpecialist')}</span>
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm nav-logout-btn"
                onClick={onExpertLogout}
              >
                {t('common.logout')}
              </button>
            </div>
          ) : null}

          <LanguageSelector />
        </nav>
      </div>
    </header>
  );
}
