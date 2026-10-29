import React, { useState } from 'react';
import { LeafIcon, LockIcon, MailIcon, UserIcon, AlertIcon, ArrowRightIcon } from '../../components/Icons';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';

export default function FarmerSignup({ onNavigate, onSignupSuccess }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await authService.registerFarmer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (onSignupSuccess) {
        onSignupSuccess(t('auth.signupSuccess'));
      } else {
        onNavigate('login');
      }
    } catch (err) {
      let msg = err.message || t('auth.signupFailed');
      if (err.message && err.message.includes('already exists')) {
        msg = t('auth.emailExists');
      } else if (err.message && err.message.includes('do not match')) {
        msg = t('auth.passwordMismatch');
      }
      setErrorMsg(msg);
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
          <h2 className="auth-title">{t('auth.farmerSignupTitle')}</h2>
          <p className="auth-subtitle">
            {t('auth.farmerSignupSubtitle')}
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
            <label htmlFor="farmer-name">{t('auth.fullName')}</label>
            <div className="input-with-icon">
              <UserIcon size={18} className="field-icon" />
              <input
                id="farmer-name"
                type="text"
                className="form-input"
                placeholder={t('auth.fullNamePlaceholder')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">{t('auth.emailAddress')} *</label>
            <div className="input-with-icon">
              <MailIcon size={18} className="field-icon" />
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder={t('auth.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="farmer-phone">{t('auth.phoneOptional')}</label>
            <input
              id="farmer-phone"
              type="tel"
              className="form-input"
              placeholder={t('auth.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">{t('auth.signupPassword')}</label>
            <div className="input-with-icon">
              <LockIcon size={18} className="field-icon" />
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder={t('auth.signupPasswordPlaceholder')}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password">{t('auth.confirmPassword')}</label>
            <div className="input-with-icon">
              <LockIcon size={18} className="field-icon" />
              <input
                id="signup-confirm-password"
                type="password"
                className="form-input"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.hasAccount')}{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onNavigate('login')}
            >
              {t('auth.logInHere')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
