export type SafeApplyStatus =
  | "preview"
  | "aplicado"
  | "cancelado"
  | "revertido"
  | "requiere_revision";

export type SafeApplyRisk = "bajo" | "medio" | "alto";

export interface SafeApplyChange {
  targetId: string;
  targetName: string;
  field: "presupuesto_mensual";
  before: number;
  after: number;
  reason: string;
}

export interface SafeApplyPlan {
  id: string;
  title: string;
  scope: "budget" | "keywords" | "campaign_status";
  risk: SafeApplyRisk;
  changes: SafeApplyChange[];
  reason: string;
  expectedImpact: string;
  createdAt: string;
  requiresConfirmation: boolean;
  undoAvailable: boolean;
}

export interface SafeApplyAuditEntry {
  id: string;
  planId: string;
  status: SafeApplyStatus;
  timestamp: string;
  details: string;
  changes: SafeApplyChange[];
}

type BudgetEntity = {
  id: string;
  presupuesto_mensual?: number;
};

function buildAuditEntry(
  plan: SafeApplyPlan,
  status: SafeApplyStatus,
  details: string
): SafeApplyAuditEntry {
  return {
    id: `${plan.id}-${Date.now()}`,
    planId: plan.id,
    status,
    timestamp: new Date().toISOString(),
    details,
    changes: plan.changes,
  };
}

export function createSafeApplyPlan(params: Omit<SafeApplyPlan, "createdAt" | "requiresConfirmation" | "undoAvailable">): SafeApplyPlan {
  return {
    ...params,
    createdAt: new Date().toISOString(),
    requiresConfirmation: true,
    undoAvailable: true,
  };
}

export function validateBudgetPlan<T extends BudgetEntity>(
  entities: T[],
  plan: SafeApplyPlan
): { ok: true } | { ok: false; message: string } {
  const entityMap = new Map(entities.map(entity => [entity.id, entity]));

  for (const change of plan.changes) {
    const entity = entityMap.get(change.targetId);
    if (!entity) {
      return { ok: false, message: `No se encontró ${change.targetName} antes de aplicar.` };
    }

    const currentValue = Number(entity.presupuesto_mensual || 0);
    if (Math.round(currentValue) !== Math.round(change.before)) {
      return {
        ok: false,
        message: `${change.targetName} cambió desde que Mora calculó la recomendación. Volvé a revisar antes de aplicar.`,
      };
    }

    if (change.after < 0) {
      return { ok: false, message: `${change.targetName} tiene un presupuesto propuesto inválido.` };
    }
  }

  return { ok: true };
}

export function executeLocalSafeApply<T extends BudgetEntity>(
  entities: T[],
  plan: SafeApplyPlan
): {
  status: SafeApplyStatus;
  entities: T[];
  audit: SafeApplyAuditEntry;
  message: string;
} {
  const validation = validateBudgetPlan(entities, plan);
  if (!validation.ok) {
    return {
      status: "cancelado",
      entities,
      audit: buildAuditEntry(plan, "cancelado", validation.message),
      message: validation.message,
    };
  }

  const nextEntities = entities.map(entity => {
    const change = plan.changes.find(item => item.targetId === entity.id);
    if (!change) return entity;
    return { ...entity, presupuesto_mensual: change.after };
  });

  const verification = validateBudgetPlan(
    nextEntities,
    {
      ...plan,
      changes: plan.changes.map(change => ({
        ...change,
        before: change.after,
      })),
    }
  );

  if (!verification.ok) {
    return {
      status: "requiere_revision",
      entities: nextEntities,
      audit: buildAuditEntry(plan, "requiere_revision", verification.message),
      message: verification.message,
    };
  }

  const message = "Mora aplicó y verificó los cambios. Undo disponible por tiempo limitado.";
  return {
    status: "aplicado",
    entities: nextEntities,
    audit: buildAuditEntry(plan, "aplicado", message),
    message,
  };
}

export function rollbackLocalSafeApply<T extends BudgetEntity>(
  entities: T[],
  plan: SafeApplyPlan
): {
  status: SafeApplyStatus;
  entities: T[];
  audit: SafeApplyAuditEntry;
  message: string;
} {
  const rolledBackEntities = entities.map(entity => {
    const change = plan.changes.find(item => item.targetId === entity.id);
    if (!change) return entity;
    return { ...entity, presupuesto_mensual: change.before };
  });

  const message = "Mora restauró los valores anteriores.";
  return {
    status: "revertido",
    entities: rolledBackEntities,
    audit: buildAuditEntry(plan, "revertido", message),
    message,
  };
}
