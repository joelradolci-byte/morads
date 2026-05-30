import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  adaptarTextoHistorico,
  esAuditoriaHistorica,
  prefijarNarrativaHistorica,
  tituloHallazgoHistorico,
} from "./copyHistorico";

describe("adaptarTextoHistorico", () => {
  it("convierte voseo presente habitual", () => {
    assert.equal(
      adaptarTextoHistorico("Tenés un CPA alto en la campaña."),
      "Tenías un CPA alto en la campaña."
    );
    assert.equal(
      adaptarTextoHistorico("Tu cuenta está en buen estado."),
      "Tu cuenta estaba en buen estado."
    );
  });

  it("prefija narrativa con fecha", () => {
    assert.equal(
      prefijarNarrativaHistorica("Tu cuenta tenía fugas.", "12/3/2025"),
      "En la auditoría del 12/3/2025: Tu cuenta tenía fugas."
    );
  });

  it("titulo conocido en pasado", () => {
    assert.equal(
      tituloHallazgoHistorico(
        "DAYPARTING_FUGAS_HORARIAS",
        "Hay horarios donde gastás"
      ),
      "Había horarios donde gastabas y no vendías"
    );
  });
});

describe("esAuditoriaHistorica", () => {
  it("detecta ids distintos", () => {
    assert.equal(esAuditoriaHistorica(2, 1), true);
    assert.equal(esAuditoriaHistorica("a", "a"), false);
  });
});
