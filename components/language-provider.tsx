"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import en from "@/locales/en.json";
import ta from "@/locales/ta.json";
import taLatn from "@/locales/ta-Latn.json";
import hi from "@/locales/hi.json";
import te from "@/locales/te.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";

const dictionaries = { en, ta, "ta-Latn": taLatn, hi, te, kn, ml } as const;
export type LocaleCode = keyof typeof dictionaries;
const localeNames: Record<LocaleCode, string> = { en: "English", ta: "தமிழ்", "ta-Latn": "Tanglish", hi: "हिन्दी", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം" };

type LocaleContextValue = { locale: LocaleCode; setLocale: (locale: LocaleCode) => void; t: (path: string) => string; localeNames: Record<LocaleCode, string> };
const LocaleContext = createContext<LocaleContextValue | null>(null);
const storageKey = "vozskin-locale";
const changeEvent = "vozskin-locale-change";

function getLocaleSnapshot(): LocaleCode {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(storageKey) as LocaleCode | null;
  return saved && saved in dictionaries ? saved : "en";
}

function getServerLocaleSnapshot(): LocaleCode { return "en"; }

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

function lookup(value: unknown, path: string): string | undefined {
  const result = path.split(".").reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null || !(key in current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
  return typeof result === "string" ? result : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getServerLocaleSnapshot);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = useCallback((nextLocale: LocaleCode) => {
    window.localStorage.setItem(storageKey, nextLocale);
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  const t = useCallback((path: string) => lookup(dictionaries[locale], path) ?? lookup(dictionaries.en, path) ?? path, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t, localeNames }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, localeNames } = useLocale();
  return <label aria-label="Select language" className={compact ? "language-control compact" : "language-control"}>
    <span className="sr-only">Select language</span>
    <select aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as LocaleCode)}>
      {(Object.keys(localeNames) as LocaleCode[]).map((code) => <option key={code} value={code}>{localeNames[code]}</option>)}
    </select>
  </label>;
}
