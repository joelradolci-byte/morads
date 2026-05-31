import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { moraDayToGoogleDayOfWeek } from "./mutations";
import { microsToUnits, unitsToMicros } from "./units";

describe("googleAds units", () => {
  it("convierte micros y unidades de forma reversible", () => {
    assert.equal(microsToUnits(1_500_000), 1.5);
    assert.equal(unitsToMicros(1.5), 1_500_000);
  });
});

describe("moraDayToGoogleDayOfWeek", () => {
  it("mapea lunes=0 a Google MONDAY=2", () => {
    assert.equal(moraDayToGoogleDayOfWeek(0), 2);
    assert.equal(moraDayToGoogleDayOfWeek(6), 8);
  });

  it("acota días fuera de rango", () => {
    assert.equal(moraDayToGoogleDayOfWeek(-3), 2);
    assert.equal(moraDayToGoogleDayOfWeek(99), 8);
  });
});
