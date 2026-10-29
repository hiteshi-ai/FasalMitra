import React, { useState } from 'react';
import { LeafIcon, LockIcon, MailIcon, AlertIcon, CheckCircleIcon, ArrowRightIcon } from '../../components/Icons';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';

export default function FarmerLogin({ onNavigate, onLoginSuccess, initialMessage = null }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(initialMessage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const session = await authService.loginFarmer({ email, password });
      if (onLoginSuccess) {
        onLoginSuccess(session);
      } else {
        onNavigate('farmer');
      }
    } catch (err) {
      setErrorMsg(err.message || t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-bubble green">
            <LeafIcon size={28} />
          </div>
          <h2 className="auth-title">{t('auth.farmerLoginTitle')}</h2>
          <p className="auth-subtitle">
            {t('auth.farmerLoginSubtitle')}
          </p>
        </div>

        {successMsg && (
          <div className="auth-banner success">
            <CheckCircleIcon size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-banner error">
            <AlertIcon size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="farmer-email">{t('auth.emailAddress')}</label>
            <div className="input-with-icon">
              <MailIcon size={18} className="field-icon" />
              <input
                id="farmer-email"
                type="email"
                className="form-input"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="farmer-password">{t('auth.password')}</label>
            <div className="input-with-icon">
              <LockIcon size={18} className="field-icon" />
              <input
                id="farmer-password"
                type="password"
                className="form-input"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? t('auth.signingIn') : t('auth.signInBtn')}
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onNavigate('signup')}
            >
              {t('auth.signUpLink')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
