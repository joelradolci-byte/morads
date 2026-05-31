"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../supabase/browser";
import { getDictionary, type Dictionary } from "./index";
import { normalizeLocale, type Locale } from "./types";

const STORAGE_KEY = "mora_idioma_ui";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (next: Locale) => void;
  resumenAutoAbrir: boolean;
  setResumenAutoAbrir: (value: boolean) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string | null;
}) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [resumenAutoAbrir, setResumenAutoAbrirState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      setLocaleState(stored);
    } else if (typeof navigator !== "undefined" && navigator.language.startsWith("en")) {
      setLocaleState("en");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      let uid = userId;
      if (!uid) {
        const { data: authData } = await supabase.auth.getSession();
        uid = authData.session?.user?.id;
      }
      if (!uid) return;
      const { data } = await supabase
        .from("configuracion_agencia")
        .select("idioma_ui, resumen_auto_abrir")
        .eq("user_id", uid)
        .maybeSingle();
      if (data?.idioma_ui) {
        const next = normalizeLocale(data.idioma_ui);
        setLocaleState(next);
        localStorage.setItem(STORAGE_KEY, next);
      }
      if (typeof data?.resumen_auto_abrir === "boolean") {
        setResumenAutoAbrirState(data.resumen_auto_abrir);
      }
    })();
  }, [userId, hydrated]);

  const persistLocale = useCallback(
    async (next: Locale, autoAbrir?: boolean) => {
      localStorage.setItem(STORAGE_KEY, next);
      if (!userId) return;
      const payload: Record<string, unknown> = {
        user_id: userId,
        idioma_ui: next,
      };
      if (autoAbrir !== undefined) payload.resumen_auto_abrir = autoAbrir;
      await supabase.from("configuracion_agencia").upsert(payload);
    },
    [userId]
  );

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      void persistLocale(next);
    },
    [persistLocale]
  );

  const setResumenAutoAbrir = useCallback(
    (value: boolean) => {
      setResumenAutoAbrirState(value);
      if (userId) void persistLocale(locale, value);
    },
    [locale, persistLocale, userId]
  );

  const value = useMemo(
    () => ({
      locale,
      dict: getDictionary(locale),
      setLocale,
      resumenAutoAbrir,
      setResumenAutoAbrir,
    }),
    [locale, resumenAutoAbrir, setLocale, setResumenAutoAbrir]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
