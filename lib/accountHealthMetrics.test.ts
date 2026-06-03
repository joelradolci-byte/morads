import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cpaFromReporte,
  cpaTrendSemantic,
} from "../app/dashboard/components/kpi/accountHealthMetrics";

describe("cpaFromReporte", () => {
  it("lee cpa_promedio_cuenta del resumen", () => {
    assert.equal(
      cpaFromReporte({ resumen: { cpa_promedio_cuenta: 50.25 } }),
      50.25
    );
  });

  it("devuelve null si falta o es inválido", () => {
    assert.equal(cpaFromReporte({}), null);
    assert.equal(cpaFromReporte({ resumen: { cpa_promedio_cuenta: 0 } }), null);
  });
});

describe("cpaTrendSemantic", () => {
  it("improved cuando CPA bajó", () => {
    assert.equal(cpaTrendSemantic(40, 50), "improved");
  });

  it("worsened cuando CPA subió", () => {
    assert.equal(cpaTrendSemantic(55, 50), "worsened");
  });

  it("null si cambio menor al umbral", () => {
    assert.equal(cpaTrendSemantic(50.02, 50), null);
  });
});
