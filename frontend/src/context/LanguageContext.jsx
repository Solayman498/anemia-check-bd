import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import bn from '../locales/bn.js';
import en from '../locales/en.js';

// Translation object mapping
const translations = { bn, en };

// Create Context
const LanguageContext = createContext();

// Language Provider Component
export function LanguageProvider({ children }) {
  // Initialize language from localStorage or default to 'bn'
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    return savedLanguage && ['bn', 'en'].includes(savedLanguage) ? savedLanguage : 'bn';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'bn' ? 'en' : 'bn');
  }, []);

  // Get current translations
  const t = useMemo(() => translations[language], [language]);

  // Check current language
  const isBengali = language === 'bn';
  const isEnglish = language === 'en';

  // Context value with memoization
  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t,
    isBengali,
    isEnglish,
  }), [language, t, toggleLanguage, isBengali, isEnglish]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageContext;