import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluarSaludCampana,
  evaluarSaludCuenta,
  etiquetaBadgeSalud,
  gastoDesperdiciadoEsMaterial,
  tituloCampanaSaludable,
} from "./saludMora";
import type { CampanaMora } from "./motorMora";

const campanaEstrella: CampanaMora = {
  id: "c1",
  nombre: "Test Estrella",
  estado: "ENABLED",
  presupuesto_mensual: 10000,
  gasto_mensual: 5000,
  clics: 500,
  conversiones: 50,
  cpa_actual: 100,
  cpa_objetivo: 120,
};

describe("evaluarSaludCampana", () => {
  it("score alto ESTRELLA no requiere acción y tiene nota opcional baja", () => {
    const d = evaluarSaludCampana(campanaEstrella, 110);
    assert.equal(d.requiere_accion, false);
    assert.equal(d.tag, "ESTRELLA");
    assert.ok(d.score >= 80);
    assert.equal(d.sugerencia_principal, null);
    assert.ok(d.nota_escala_opcional);
    assert.match(d.nota_escala_opcional!, /no es|No es|opcional/i);
  });

  it("campaña sin conversiones requiere acción", () => {
    const d = evaluarSaludCampana(
      { ...campanaEstrella, conversiones: 0, gasto_mensual: 8000, cpa_actual: 9999 },
      100
    );
    assert.equal(d.requiere_accion, true);
    assert.ok(d.sugerencia_principal);
  });
});

describe("evaluarSaludCuenta", () => {
  it("cuenta óptima sin hallazgos", () => {
    const d = evaluarSaludCuenta({
      health_score: 95,
      gasto_desperdiciado: 10,
      gasto_total_cuenta: 50000,
      porcentaje_desperdiciado: 0.02,
      graves_rojo: [],
      debiles_amarillo: [],
    });
    assert.equal(d.cuenta_sin_cambios_urgentes, true);
    assert.equal(d.nivel, "optima");
  });
});

describe("etiquetas de salud", () => {
  it("optima usa excelente", () => {
    assert.equal(etiquetaBadgeSalud("optima"), "En excelente estado");
    assert.match(tituloCampanaSaludable("Test", "optima"), /excelente/i);
  });
  it("estable usa buen estado", () => {
    assert.equal(etiquetaBadgeSalud("estable"), "En buen estado");
  });
});

describe("gastoDesperdiciadoEsMaterial", () => {
  it("desperdicio bajo no es material", () => {
    assert.equal(gastoDesperdiciadoEsMaterial(10, 100000), false);
  });
});
