"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  type AppLanguage,
  LANGUAGES,
  translations,
  getTranslation,
} from "@/lib/i18n";

const LANG_STORAGE_KEY = "app_language";
const LANG_CHANGE_EVENT = "app_language_change";

function subscribeLang(callback: () => void) {
  window.addEventListener(LANG_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LANG_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getLangSnapshot(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as AppLanguage | null;
    if (saved && (saved === "vi" || saved === "en" || saved === "ja")) {
      return saved;
    }
    // Check browser preference
    const navLang = navigator.language?.toLowerCase() || "";
    if (navLang.startsWith("ja")) return "ja";
    if (navLang.startsWith("en")) return "en";
  } catch {
    // ignore
  }
  return "vi";
}

function getServerLangSnapshot(): AppLanguage {
  return "vi";
}

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: <S extends keyof typeof translations, K extends keyof (typeof translations)[S]>(
    section: S,
    key: K
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const setLanguage = useCallback((nextLang: AppLanguage) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  }, []);

  const t = useCallback(
    <S extends keyof typeof translations, K extends keyof (typeof translations)[S]>(
      section: S,
      key: K
    ) => getTranslation(section, key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "vi" as AppLanguage,
      setLanguage: () => {},
      t: <S extends keyof typeof translations, K extends keyof (typeof translations)[S]>(
        section: S,
        key: K
      ) => getTranslation(section, key, "vi"),
    };
  }
  return context;
}

export { LANGUAGES };
