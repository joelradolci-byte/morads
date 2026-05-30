import { FEEDBACK_COOLDOWN_DAYS, FEEDBACK_MIN_DAYS } from "./config";

export type FeedbackEligibility = {
  eligible: boolean;
  showFab: boolean;
  canSubmit: boolean;
  daysRemaining: number;
  hasSubmittedRecently: boolean;
  auditCount: number;
  firstAuditAt: string | null;
  nextSurveyAvailableAt: string | null;
};

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeFeedbackEligibility(params: {
  auditCount: number;
  firstAuditAt: string | null;
  lastSurveyAt: string | null;
  now?: Date;
}): FeedbackEligibility {
  const now = params.now ?? new Date();
  const auditCount = params.auditCount;

  if (auditCount < 1 || !params.firstAuditAt) {
    return {
      eligible: false,
      showFab: false,
      canSubmit: false,
      daysRemaining: FEEDBACK_MIN_DAYS,
      hasSubmittedRecently: false,
      auditCount,
      firstAuditAt: null,
      nextSurveyAvailableAt: null,
    };
  }

  const first = new Date(params.firstAuditAt);
  const daysSinceFirst = Number.isNaN(first.getTime())
    ? 0
    : daysBetween(first, now);
  const daysRemaining = Math.max(0, FEEDBACK_MIN_DAYS - daysSinceFirst);
  const eligible = daysSinceFirst >= FEEDBACK_MIN_DAYS;

  let hasSubmittedRecently = false;
  let nextSurveyAvailableAt: string | null = null;

  if (params.lastSurveyAt) {
    const last = new Date(params.lastSurveyAt);
    if (!Number.isNaN(last.getTime())) {
      const daysSinceSurvey = daysBetween(last, now);
      hasSubmittedRecently = daysSinceSurvey < FEEDBACK_COOLDOWN_DAYS;
      if (hasSubmittedRecently) {
        const next = new Date(last);
        next.setDate(next.getDate() + FEEDBACK_COOLDOWN_DAYS);
        nextSurveyAvailableAt = next.toISOString();
      }
    }
  }

  const canSubmit = eligible && !hasSubmittedRecently;
  const showFab = canSubmit;

  return {
    eligible,
    showFab,
    canSubmit,
    daysRemaining,
    hasSubmittedRecently,
    auditCount,
    firstAuditAt: params.firstAuditAt,
    nextSurveyAvailableAt,
  };
}
