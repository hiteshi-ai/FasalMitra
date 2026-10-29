import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './useLanguage.js';

export default function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="language-selector-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select platform language"
      >
        <span className="lang-globe-icon" aria-hidden="true">🌐</span>
        <span className="lang-current-label">{currentLang.nativeLabel}</span>
        <span className="lang-chevron" aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <ul className="language-dropdown-menu" role="listbox" aria-label="Languages">
          {languages.map((l) => {
            const isSelected = l.code === language;
            return (
              <li
                key={l.code}
                role="option"
                aria-selected={isSelected}
                className={`language-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(l.code)}
              >
                <span className="lang-item-native">{l.nativeLabel}</span>
                {isSelected && <span className="lang-check-mark">✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
