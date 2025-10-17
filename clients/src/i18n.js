import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationAM from './locales/am/translation.json';

const resources = {
  en: { translation: translationEN },
  am: { translation: translationAM },
};

i18n
  .use(LanguageDetector) // auto-detects user language
  .use(initReactI18next) // connects with React
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;
