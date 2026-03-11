/**
 * @file src/hooks/useLanguage.tsx
 * @description Provides language management with localStorage persistence and instant translation.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LangCode, TranslationKeys } from '../i18n/translations';
import { VALID_LANG_CODES, DEFAULT_LANG, translations } from '../i18n/translations';

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  /** Translation function: t('key', { var: val }) */
  t: (key: keyof TranslationKeys, variables?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const stored = localStorage.getItem('planr-lang');
      if (stored && (VALID_LANG_CODES as string[]).includes(stored)) {
        return stored as LangCode;
      }
    } catch (e) {
      console.error('Failed to read language from localStorage', e);
    }
    return DEFAULT_LANG;
  });

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem('planr-lang', newLang);
    } catch (e) {
      console.error('Failed to save language to localStorage', e);
    }
  };

  const isRTL = lang === 'ar';

  useEffect(() => {
    // Update document direction and lang attribute for accessibility/SEO
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key: keyof TranslationKeys, variables?: Record<string, string | number>): string => {
    // Security: keys are strictly from the English dictionary type
    // Fallback to English if translation is missing for the current language
    let text = (translations[lang] as any)[key] || (translations[DEFAULT_LANG] as any)[key] || (key as string);

    // Basic variable interpolation (e.g. {year} -> 2024)
    if (variables) {
      Object.entries(variables).forEach(([vKey, vVal]) => {
        text = text.replace(`{${vKey}}`, String(vVal));
      });
    }

    return (text as string);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
