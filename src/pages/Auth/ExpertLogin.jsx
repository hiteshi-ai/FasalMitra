import React, { useState } from 'react';
import { ExpertIcon, LockIcon, UserIcon, AlertIcon, ArrowRightIcon } from '../../components/Icons';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';

export default function ExpertLogin({ onNavigate, onLoginSuccess }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const session = await authService.loginExpert({ name, password });
      if (onLoginSuccess) {
        onLoginSuccess(session);
      } else {
        onNavigate('expert');
      }
    } catch (err) {
      setErrorMsg(err.message || t('auth.expertInvalid'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper auth-page-wrapper">
      <div className="auth-card expert-auth-card">
        <div className="auth-header">
          <div className="auth-icon-bubble blue">
            <ExpertIcon size={28} />
          </div>
          <h2 className="auth-title">{t('auth.expertLoginTitle')}</h2>
          <p className="auth-subtitle">
            {t('auth.expertLoginSubtitle')}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-banner error">
            <AlertIcon size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="expert-name">{t('auth.specialistName')}</label>
            <div className="input-with-icon">
              <UserIcon size={18} className="field-icon" />
              <input
                id="expert-name"
                type="text"
                className="form-input"
                placeholder={t('auth.specialistNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expert-password">{t('auth.specialistPassword')}</label>
            <div className="input-with-icon">
              <LockIcon size={18} className="field-icon" />
              <input
                id="expert-password"
                type="password"
                className="form-input"
                placeholder={t('auth.specialistPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn expert-btn"
            disabled={isLoading}
          >
            {isLoading ? t('auth.verifyingCredentials') : t('auth.expertAuthBtn')}
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className="auth-footer expert-footer">
          <p className="expert-security-notice">
            {t('auth.expertSecurityNotice')}
          </p>
        </div>
      </div>
    </div>
  );
}
