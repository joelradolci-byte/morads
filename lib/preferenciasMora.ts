/** Preferencias de explicación de Mora (localStorage). */

export type PreferenciaExplicacion = "clara" | "tecnica";

const KEY_PREFERENCIA = "mora_preferencia_explicacion";
const KEY_ONBOARDING = "mora_onboarding_explicacion_done";

export function getPreferenciaExplicacion(): PreferenciaExplicacion {
  if (typeof window === "undefined") return "tecnica";
  return localStorage.getItem(KEY_PREFERENCIA) === "clara" ? "clara" : "tecnica";
}

export function setPreferenciaExplicacion(pref: PreferenciaExplicacion): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_PREFERENCIA, pref);
  localStorage.setItem(KEY_ONBOARDING, "1");
}

export function isOnboardingExplicacionDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_ONBOARDING) === "1";
}

export function preferenciaEsLenguajeClaro(): boolean {
  return getPreferenciaExplicacion() === "clara";
}
