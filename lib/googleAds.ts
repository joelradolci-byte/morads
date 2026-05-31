// Cliente: datos de Google Ads vía API real (sin mock en runtime).

import type {
  CampanaMora,
  TerminoBusqueda,
  DatosAuditoriaInput,
  DatoHorarioCampana,
} from "./motorMora";
import { moraAuthHeaders } from "./auth/client-headers";

const ERROR_MESSAGES: Record<string, string> = {
  not_connected: "Conectá Google Ads en Configuración.",
  account_not_linked: "Elegí la cuenta a auditar en Configuración.",
  not_configured: "Google Ads no está configurado en el servidor.",
  google_ads_error: "No se pudieron obtener datos de Google Ads.",
  unauthorized: "Iniciá sesión para ver tus campañas.",
};

export class GoogleAdsDataError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = "GoogleAdsDataError";
  }
}

function messageForApiError(
  error?: string,
  fallback?: string
): string {
  if (error && ERROR_MESSAGES[error]) return ERROR_MESSAGES[error];
  return fallback ?? "No se pudieron cargar datos de Google Ads.";
}

export async function fetchAuditData(): Promise<DatosAuditoriaInput> {
  const res = await fetch("/api/google-ads/audit-data", {
    headers: await moraAuthHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new GoogleAdsDataError(
      messageForApiError(data.error, data.message),
      data.error,
      res.status
    );
  }
  return data as DatosAuditoriaInput;
}

export const construirDatosAuditoria = async (): Promise<DatosAuditoriaInput> =>
  fetchAuditData();

export const extraerDatosGoogle = async (): Promise<CampanaMora[]> => {
  const datos = await fetchAuditData();
  return datos.campanas ?? [];
};

export const extraerTerminosGoogle = async (): Promise<TerminoBusqueda[]> => {
  const datos = await fetchAuditData();
  return datos.terminos ?? [];
};

export const extraerDatosHorariosGoogle = async (): Promise<DatoHorarioCampana[]> => {
  const datos = await fetchAuditData();
  return datos.horarios ?? [];
};
