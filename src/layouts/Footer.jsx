import React from 'react';
import { SproutIcon } from '../components/Icons';
import { useLanguage } from '../i18n';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-logo">
            <SproutIcon size={18} className="footer-icon" />
            <span>{t('common.fasalMitra')} {t('common.ai')}</span>
          </div>
          <p className="footer-text">
            {t('footer.tagline')}
          </p>
        </div>
        <div className="footer-right">
          <span className="footer-tag">{t('footer.phaseNote')}</span>
        </div>
      </div>
    </footer>
  );
}
