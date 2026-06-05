/** Controla si una carga muestra spinners bloqueantes o refresca en background. */
export type DashboardLoadOptions = {
  blocking?: boolean;
};

export const blockingLoad = { blocking: true } as const;
export const silentLoad = { blocking: false } as const;
