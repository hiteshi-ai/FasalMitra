import { createContext } from 'react';
import { LANGUAGES } from './translations';

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  languages: LANGUAGES
});

export default LanguageContext;
