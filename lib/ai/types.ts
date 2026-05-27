export type MoraAITask = "redactor_hallazgos" | "estratega_auditoria" | "anuncios_rsa";

export type HallazgoRedactor = {
  id_rastreo: string;
  titulo: string;
  descripcion_tecnica?: string;
  descripcion_simple?: string;
  sugerencia?: string;
  razonamiento?: string;
  resultado_esperado?: string;
};

export type HallazgosBuckets = {
  graves_rojo: HallazgoRedactor[];
  debiles_amarillo: HallazgoRedactor[];
  bien_verde: HallazgoRedactor[];
};

export type RedactorHallazgosResponse = {
  hallazgos: HallazgosBuckets;
};

export type PriorizacionItem = {
  id_rastreo: string;
  orden: number;
  rationale: string;
};

export type PlanAccionItem = {
  tarea: string;
  impacto: string;
  color: string;
  plazo?: string;
};

export type EstrategaAuditoriaResponse = {
  resumen_ejecutivo: string;
  lectura_global_cuenta: string;
  cierre_cliente: string;
  priorizacion_final: PriorizacionItem[];
  plan_accion: PlanAccionItem[];
  advertencias: string[];
};

export type AnuncioVarianteRaw = {
  enfoque: string;
  objetivo: string;
  headlines: string[];
  descriptions: string[];
  keywords_usadas: string[];
  terminos_evitar: string[];
  advertencias: string[];
  razonamiento: string;
};

export type AnunciosRsaResponse = {
  variantes: AnuncioVarianteRaw[];
};
