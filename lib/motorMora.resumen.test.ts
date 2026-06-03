import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generarEsqueletoAuditoria, type DatosAuditoriaInput } from "./motorMora";

const datosMinimos: DatosAuditoriaInput = {
  tipo_negocio: "ecommerce",
  cpa_promedio_cuenta: 42.5,
  gasto_total_cuenta: 1000,
  conversiones_totales: 20,
  clics_totales: 600,
  campanas: [
    {
      id: "c1",
      nombre: "Test",
      estado: "ENABLED",
      presupuesto_mensual: 1000,
      gasto_mensual: 800,
      clics: 400,
      conversiones: 15,
      cpa_actual: 53.33,
    },
  ],
  terminos: [],
};

describe("generarEsqueletoAuditoria resumen", () => {
  it("incluye cpa_promedio_cuenta en resumen", () => {
    const reporte = generarEsqueletoAuditoria(datosMinimos);
    const resumen = reporte.resumen as {
      cpa_promedio_cuenta?: number;
      gasto_total_cuenta?: number;
      conversiones_totales?: number;
    };
    assert.equal(resumen.cpa_promedio_cuenta, 42.5);
    assert.equal(resumen.gasto_total_cuenta, 1000);
    assert.equal(resumen.conversiones_totales, 20);
  });
});
