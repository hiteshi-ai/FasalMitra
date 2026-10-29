import React, { useState, useEffect, useCallback } from 'react';
import { translations, LANGUAGES } from './translations.js';
import LanguageContext from './context.js';

const STORAGE_KEY = 'fasalmitra_language';
const VALID_LANGS = ['en', 'hi', 'pa'];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_LANGS.includes(saved)) {
        return saved;
      }
    } catch {
      // Fallback if localStorage unavailable
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang) => {
    if (VALID_LANGS.includes(newLang)) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        // Handle localStorage quota or private mode
      }
    }
  }, []);

  // Listen to cross-tab changes if any
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue && VALID_LANGS.includes(e.newValue)) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useCallback((key, params = {}) => {
    let text = translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
