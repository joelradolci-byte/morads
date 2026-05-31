import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularScoreCampana,
  campanaSinMetricas,
  type CampanaMora,
} from "./motorMora";

const campanaVacia: CampanaMora = {
  id: "v1",
  nombre: "Seed Pausada",
  estado: "PAUSED",
  presupuesto_mensual: 500,
  gasto_mensual: 0,
  clics: 0,
  conversiones: 0,
  cpa_actual: null,
};

describe("campanaSinMetricas", () => {
  it("detecta campaña sin gasto, clics ni conversiones", () => {
    assert.equal(campanaSinMetricas(campanaVacia), true);
  });

  it("no marca campaña con gasto sin conversiones", () => {
    assert.equal(
      campanaSinMetricas({ ...campanaVacia, gasto_mensual: 100, cpa_actual: 9999 }),
      false
    );
  });
});

describe("calcularScoreCampana sin métricas", () => {
  it("devuelve SIN_DATOS sin score ni CPA", () => {
    const ev = calcularScoreCampana(campanaVacia, 50);
    assert.equal(ev.tag, "SIN_DATOS");
    assert.equal(ev.score, null);
    assert.equal(ev.cpaActual, null);
    assert.match(ev.penalizacion, /Sin datos suficientes/i);
  });

  it("campaña con gasto y sin conversiones sigue siendo BASURA", () => {
    const ev = calcularScoreCampana(
      {
        ...campanaVacia,
        gasto_mensual: 5000,
        clics: 200,
        cpa_actual: 9999,
      },
      20
    );
    assert.equal(ev.tag, "BASURA");
    assert.ok(ev.score != null && ev.score < 60);
  });
});
