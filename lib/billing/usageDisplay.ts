import type { UsageSnapshot } from "@/lib/usage/config";

export function auditsRemaining(snapshot: UsageSnapshot): number {
  if (snapshot.planKind === "paid") {
    return Math.max(0, snapshot.limits.audit.monthly - snapshot.usage.audit);
  }
  if (snapshot.planKind === "trial_active" && snapshot.trialUsage) {
    return Math.max(0, snapshot.trialLimits.audit.total - snapshot.trialUsage.audit);
  }
  return 0;
}

export function pdfRemaining(snapshot: UsageSnapshot): number {
  if (snapshot.planKind === "paid") {
    return Math.max(0, snapshot.limits.pdf.monthly - snapshot.usage.pdf);
  }
  if (snapshot.planKind === "trial_active" && snapshot.trialUsage) {
    return snapshot.trialUsage.pdf >= snapshot.trialLimits.pdf.total ? 0 : 1;
  }
  return 0;
}

export function auditsQuotaLabel(snapshot: UsageSnapshot): string {
  if (snapshot.planKind === "paid") {
    return `Auditorías este mes: ${snapshot.usage.audit}/${snapshot.limits.audit.monthly}`;
  }
  if (snapshot.planKind === "trial_active" && snapshot.trialUsage) {
    return `Evaluación: ${snapshot.trialUsage.audit}/${snapshot.trialLimits.audit.total} auditorías`;
  }
  if (snapshot.planKind === "trial_expired") {
    return "Evaluación finalizada";
  }
  return "Conectá Google Ads para iniciar la evaluación";
}

export function pdfQuotaLabel(snapshot: UsageSnapshot): string {
  if (snapshot.planKind === "paid") {
    return `PDFs este mes: ${snapshot.usage.pdf}/${snapshot.limits.pdf.monthly}`;
  }
  if (snapshot.planKind === "trial_active" && snapshot.trialUsage) {
    const used = snapshot.trialUsage.pdf;
    return `PDF de prueba: ${used}/${snapshot.trialLimits.pdf.total} (con marca Mora)`;
  }
  return "PDF disponible en Watchdog";
}

export function isAuditBlocked(snapshot: UsageSnapshot | null): boolean {
  if (!snapshot) return false;
  if (snapshot.planKind === "trial_expired") return true;
  if (snapshot.planKind === "trial_not_started") return true;
  return auditsRemaining(snapshot) === 0;
}

export function isPro(snapshot: UsageSnapshot | null): boolean {
  return snapshot?.planKind === "paid";
}
