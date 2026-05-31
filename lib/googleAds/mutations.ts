import { enums, resources, type MutateOperation, type Customer } from "google-ads-api";
import type { SafeApplyChange, SafeApplyPlan } from "../safeApply";
import type { NegativosApplyPlan, NegativoItem } from "../destripadorSafeApply";
import type { DaypartingApplyPlan, DaypartingApplyItem } from "../daypartingSafeApply";
import { isApplyDryRun } from "./applyContext";
import { microsToUnits, unitsToMicros } from "./units";

export type MutationFailure = {
  /** ID de campaña (sin guiones) o nombre para mostrar */
  target?: string;
  targetName?: string;
  reason: string;
};

export type BudgetApplyResult = {
  ok: boolean;
  applied: SafeApplyChange[];
  failed: MutationFailure[];
  message: string;
};

export type NegativosMutationResult = {
  applied: NegativoItem[];
  rejected: { item: NegativoItem; reason: string }[];
  message: string;
};

export type DaypartingMutationResult = {
  applied: DaypartingApplyItem[];
  rejected: { item: DaypartingApplyItem; reason: string }[];
  message: string;
};

type CampaignBudgetRow = {
  campaign?: { id?: string | number };
  campaign_budget?: {
    resource_name?: string;
    amount_micros?: string | number;
  };
};

export function extractGoogleAdsError(err: unknown): string {
  const e = err as {
    message?: string;
    errors?: Array<{ message?: string }>;
  };
  if (Array.isArray(e.errors) && e.errors.length > 0) {
    return e.errors.map(x => x.message).filter(Boolean).join("; ") || e.message || "Error de Google Ads";
  }
  return e.message || "Error de Google Ads";
}

/** Mora 0=Lunes … 6=Domingo → Google DayOfWeek (MONDAY=2 … SUNDAY=8). */
export function moraDayToGoogleDayOfWeek(dia: number): number {
  const d = Math.max(0, Math.min(6, Math.floor(dia)));
  return d + 2;
}

function matchTypeForNegativo(match: NegativoItem["match_type"]) {
  return match === "EXACTA"
    ? enums.KeywordMatchType.EXACT
    : enums.KeywordMatchType.PHRASE;
}

function bidModifierForAccion(accion: DaypartingApplyItem["accion"]): number {
  return accion === "pausar_trafico" ? 0 : 0.5;
}

export async function fetchCampaignBudgets(
  customer: Customer,
  campaignIds: string[]
): Promise<Map<string, { budgetResourceName: string; amountUnits: number }>> {
  const ids = [...new Set(campaignIds.map(id => id.replace(/-/g, "")))].filter(Boolean);
  if (ids.length === 0) return new Map();

  const idList = ids.join(", ");
  const rows = await customer.query<CampaignBudgetRow[]>(
    `SELECT
      campaign.id,
      campaign_budget.resource_name,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
      AND campaign.id IN (${idList})`
  );

  const map = new Map<string, { budgetResourceName: string; amountUnits: number }>();
  for (const row of rows) {
    const id = row.campaign?.id ? String(row.campaign.id).replace(/-/g, "") : "";
    const rn = row.campaign_budget?.resource_name;
    if (!id || !rn) continue;
    map.set(id, {
      budgetResourceName: rn,
      amountUnits: microsToUnits(row.campaign_budget?.amount_micros),
    });
  }
  return map;
}

function validateBudgetChangesAgainstLive(
  budgets: Map<string, { budgetResourceName: string; amountUnits: number }>,
  changes: SafeApplyChange[],
  targetValues: Map<string, number>
): MutationFailure[] {
  const failed: MutationFailure[] = [];
  for (const change of changes) {
    const id = change.targetId.replace(/-/g, "");
    const live = budgets.get(id);
    if (!live) {
      failed.push({
        target: id,
        targetName: change.targetName,
        reason: `No se encontró la campaña ${change.targetName} en Google Ads.`,
      });
      continue;
    }
    const expected = targetValues.get(id) ?? change.before;
    if (Math.round(live.amountUnits) !== Math.round(expected)) {
      failed.push({
        target: id,
        targetName: change.targetName,
        reason: `${change.targetName} cambió desde que Mora calculó la recomendación (actual: ${Math.round(live.amountUnits)}, esperado: ${Math.round(expected)}).`,
      });
    }
    if (change.after < 0) {
      failed.push({
        target: id,
        targetName: change.targetName,
        reason: `Presupuesto propuesto inválido para ${change.targetName}.`,
      });
    }
  }
  return failed;
}

export async function applyBudgetPlan(
  customer: Customer,
  plan: SafeApplyPlan,
  mode: "apply" | "undo" = "apply"
): Promise<BudgetApplyResult> {
  const changes = plan.changes.map(c => {
    if (mode === "undo") {
      return { ...c, before: c.after, after: c.before };
    }
    return c;
  });

  const campaignIds = changes.map(c => c.targetId);
  const budgets = await fetchCampaignBudgets(customer, campaignIds);

  const targetValues = new Map<string, number>();
  for (const c of changes) {
    targetValues.set(c.targetId.replace(/-/g, ""), c.before);
  }

  const failed = validateBudgetChangesAgainstLive(budgets, changes, targetValues);
  const failedIds = new Set(failed.map(f => f.target).filter(Boolean) as string[]);

  const applied: SafeApplyChange[] = [];
  const mutateFailed: MutationFailure[] = [...failed];

  for (const change of changes) {
    const id = change.targetId.replace(/-/g, "");
    if (failedIds.has(id)) continue;

    const budget = budgets.get(id);
    if (!budget) continue;

    const op: MutateOperation<resources.ICampaignBudget> = {
      entity: "campaign_budget",
      operation: "update",
      resource: {
        resource_name: budget.budgetResourceName,
        amount_micros: unitsToMicros(change.after),
      },
    };

    if (isApplyDryRun()) {
      console.log("[dry-run] campaign_budget update", change.targetName, change.after);
      applied.push(change);
      continue;
    }

    try {
      await customer.mutateResources([op]);
      applied.push(change);
    } catch (err) {
      mutateFailed.push({
        target: change.targetName,
        reason: extractGoogleAdsError(err),
      });
    }
  }

  const ok = applied.length === changes.length && mutateFailed.length === 0;
  const partial = applied.length > 0 && !ok;
  let message: string;
  if (ok) {
    message =
      mode === "undo"
        ? "Mora restauró los presupuestos anteriores en Google Ads."
        : "Mora aplicó y verificó los cambios de presupuesto en Google Ads.";
  } else if (partial) {
    message = `Se aplicaron ${applied.length} de ${changes.length} cambios. Revisá los rechazados.`;
  } else {
    message = mutateFailed[0]?.reason ?? "No se pudo aplicar ningún cambio de presupuesto.";
  }

  return { ok, applied, failed: mutateFailed, message };
}

export async function applyNegativosPlan(
  customer: Customer,
  customerId: string,
  plan: NegativosApplyPlan
): Promise<NegativosMutationResult> {
  const applied: NegativoItem[] = [];
  const rejected: { item: NegativoItem; reason: string }[] = [];
  const cid = customerId.replace(/-/g, "");

  for (const item of plan.items) {
    const matchType = matchTypeForNegativo(item.match_type);
    const keyword = { text: item.termino.trim(), match_type: matchType };

    if (!keyword.text) {
      rejected.push({ item, reason: "Término vacío." });
      continue;
    }

    if (item.scope === "cuenta") {
      const op: MutateOperation<resources.ICustomerNegativeCriterion> = {
        entity: "customer_negative_criterion",
        operation: "create",
        resource: { keyword } as resources.ICustomerNegativeCriterion,
      };

      if (isApplyDryRun()) {
        console.log("[dry-run] customer_negative_criterion", keyword.text);
        applied.push(item);
        continue;
      }

      try {
        await customer.mutateResources([op]);
        applied.push(item);
      } catch (err) {
        rejected.push({ item, reason: extractGoogleAdsError(err) });
      }
      continue;
    }

    const campanaId = item.campana_id?.replace(/-/g, "");
    if (!campanaId) {
      rejected.push({ item, reason: "Falta campana_id para negativo a nivel campaña." });
      continue;
    }

    const op: MutateOperation<resources.ICampaignCriterion> = {
      entity: "campaign_criterion",
      operation: "create",
      resource: {
        campaign: `customers/${cid}/campaigns/${campanaId}`,
        negative: true,
        keyword,
      },
    };

    if (isApplyDryRun()) {
      console.log("[dry-run] campaign_criterion negative", campanaId, keyword.text);
      applied.push(item);
      continue;
    }

    try {
      await customer.mutateResources([op]);
      applied.push(item);
    } catch (err) {
      rejected.push({ item, reason: extractGoogleAdsError(err) });
    }
  }

  const message =
    rejected.length === 0
      ? `${applied.length} negativo(s) aplicados en Google Ads.`
      : applied.length > 0
        ? `${applied.length} aplicados; ${rejected.length} rechazados.`
        : "No se pudo aplicar ningún negativo.";

  return { applied, rejected, message };
}

type AdScheduleRow = {
  campaign?: { id?: string | number };
  campaign_criterion?: {
    resource_name?: string;
    criterion_id?: string | number;
    ad_schedule?: {
      day_of_week?: string | number;
      start_hour?: number;
      end_hour?: number;
    };
    bid_modifier?: number;
  };
};

async function findAdScheduleCriterion(
  customer: Customer,
  campaignId: string,
  googleDay: number,
  startHour: number,
  endHour: number
): Promise<string | null> {
  const cid = campaignId.replace(/-/g, "");
  const rows = await customer.query<AdScheduleRow[]>(
    `SELECT
      campaign.id,
      campaign_criterion.resource_name,
      campaign_criterion.criterion_id,
      campaign_criterion.ad_schedule.day_of_week,
      campaign_criterion.ad_schedule.start_hour,
      campaign_criterion.ad_schedule.end_hour
    FROM campaign_criterion
    WHERE campaign.id = ${cid}
      AND campaign_criterion.type = 'AD_SCHEDULE'`
  );

  for (const row of rows) {
    const sched = row.campaign_criterion?.ad_schedule;
    if (!sched?.day_of_week || !row.campaign_criterion?.resource_name) continue;
    const dayNum = Number(sched.day_of_week);
    if (
      dayNum === googleDay &&
      sched.start_hour === startHour &&
      sched.end_hour === endHour
    ) {
      return row.campaign_criterion.resource_name;
    }
  }
  return null;
}

function campanasFromItem(item: DaypartingApplyItem): { id: string; nombre: string }[] {
  if (item.campanas_top?.length) {
    return item.campanas_top.map(c => ({
      id: c.campana_id.replace(/-/g, ""),
      nombre: c.campana_nombre,
    }));
  }
  return (item.campanas ?? []).map(nombre => ({ id: "", nombre }));
}

export async function applyDaypartingPlan(
  customer: Customer,
  customerId: string,
  plan: DaypartingApplyPlan
): Promise<DaypartingMutationResult> {
  const applied: DaypartingApplyItem[] = [];
  const rejected: { item: DaypartingApplyItem; reason: string }[] = [];
  const cid = customerId.replace(/-/g, "");
  const itemFailures = new Map<string, string>();

  for (const item of plan.items) {
    const startHour = item.hora_inicio;
    const endHour = Math.min(24, item.hora_fin + 1);
    const bidModifier = bidModifierForAccion(item.accion);
    const days: number[] = [];
    const diaFin = item.dia_fin ?? item.dia_semana;
    for (let d = item.dia_semana; d <= diaFin; d++) {
      days.push(d);
    }

    const targets = campanasFromItem(item).filter(t => t.id);
    if (targets.length === 0) {
      rejected.push({
        item,
        reason: "No hay campañas con ID para aplicar el horario.",
      });
      continue;
    }

    let itemOk = true;
    for (const target of targets) {
      for (const dia of days) {
        const googleDay = moraDayToGoogleDayOfWeek(dia);
        const existingRn = await findAdScheduleCriterion(
          customer,
          target.id,
          googleDay,
          startHour,
          endHour
        );

        const adSchedule = {
          day_of_week: googleDay,
          start_hour: startHour,
          start_minute: enums.MinuteOfHour.ZERO,
          end_hour: endHour,
          end_minute: enums.MinuteOfHour.ZERO,
        };

        if (existingRn) {
          const op: MutateOperation<resources.ICampaignCriterion> = {
            entity: "campaign_criterion",
            operation: "update",
            resource: {
              resource_name: existingRn,
              bid_modifier: bidModifier,
            },
          };

          if (isApplyDryRun()) {
            console.log("[dry-run] ad_schedule update", target.nombre, item.etiqueta);
            continue;
          }

          try {
            await customer.mutateResources([op]);
          } catch (err) {
            itemOk = false;
            itemFailures.set(item.franja_id, extractGoogleAdsError(err));
          }
          continue;
        }

        const op: MutateOperation<resources.ICampaignCriterion> = {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: `customers/${cid}/campaigns/${target.id}`,
            ad_schedule: adSchedule,
            bid_modifier: bidModifier,
          },
        };

        if (isApplyDryRun()) {
          console.log("[dry-run] ad_schedule create", target.nombre, item.etiqueta);
          continue;
        }

        try {
          await customer.mutateResources([op]);
        } catch (err) {
          itemOk = false;
          itemFailures.set(item.franja_id, extractGoogleAdsError(err));
        }
      }
    }

    if (itemOk) {
      applied.push(item);
    } else {
      rejected.push({
        item,
        reason: itemFailures.get(item.franja_id) ?? "Error al aplicar franja.",
      });
    }
  }

  const message =
    rejected.length === 0
      ? `${applied.length} franja(s) de dayparting aplicadas en Google Ads.`
      : applied.length > 0
        ? `${applied.length} aplicadas; ${rejected.length} rechazadas.`
        : "No se pudo aplicar ningún ajuste de dayparting.";

  return { applied, rejected, message };
}
