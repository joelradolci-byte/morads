import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeFeedbackEligibility } from "./eligibility";

describe("computeFeedbackEligibility", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("sin auditorías no muestra FAB", () => {
    const r = computeFeedbackEligibility({
      auditCount: 0,
      firstAuditAt: null,
      lastSurveyAt: null,
      now,
    });
    assert.equal(r.showFab, false);
  });

  it("con audit reciente faltan días", () => {
    const r = computeFeedbackEligibility({
      auditCount: 1,
      firstAuditAt: "2026-05-30T10:00:00Z",
      lastSurveyAt: null,
      now,
    });
    assert.equal(r.eligible, false);
    assert.equal(r.daysRemaining, 5);
    assert.equal(r.showFab, false);
  });

  it("después de 7 días muestra FAB", () => {
    const r = computeFeedbackEligibility({
      auditCount: 2,
      firstAuditAt: "2026-05-20T10:00:00Z",
      lastSurveyAt: null,
      now,
    });
    assert.equal(r.showFab, true);
    assert.equal(r.canSubmit, true);
  });

  it("cooldown oculta FAB", () => {
    const r = computeFeedbackEligibility({
      auditCount: 1,
      firstAuditAt: "2026-05-01T10:00:00Z",
      lastSurveyAt: "2026-05-25T10:00:00Z",
      now,
    });
    assert.equal(r.hasSubmittedRecently, true);
    assert.equal(r.showFab, false);
  });
});
