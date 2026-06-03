"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { moraAuthHeaders } from "@/lib/auth/client-headers";
import { normalizeCustomerId } from "@/lib/googleAds/normalizeCustomerId";

type Locale = "es" | "en";

type Account = {
  id: string;
  name: string;
  manager: boolean;
};

type BreadcrumbItem = { id: string; name: string };

type StatusResponse = {
  connected?: boolean;
  accountLinked?: boolean;
  customer_id?: string | null;
  login_customer_id?: string | null;
};

type LinkedSummary = {
  customerId: string;
  loginCustomerId: string | null;
};

type WizardStep = "roots" | "drilldown";

const copy = {
  es: {
    title: "Cuenta a auditar",
    hint: "Elegí la cuenta de Google Ads que Mora debe analizar.",
    drillHint: "Elegí una cuenta cliente bajo este administrador (MCC).",
    loading: "Cargando cuentas…",
    loadingChildren: "Cargando cuentas hijas…",
    empty: "No encontramos cuentas accesibles con este usuario.",
    emptyChildren: "Este administrador no tiene cuentas hijas visibles.",
    error: "No se pudieron cargar las cuentas. Revisá la conexión o intentá de nuevo.",
    selectPlaceholder: "Seleccioná una cuenta",
    save: "Usar esta cuenta",
    next: "Siguiente",
    back: "Volver",
    saving: "Guardando…",
    saved: "Cuenta guardada",
    change: "Cambiar cuenta",
    breadcrumbRoot: "Cuentas",
    active: (customerId: string, loginId: string | null) =>
      loginId
        ? `Cuenta activa: ${customerId} (administrada por ${loginId})`
        : `Cuenta activa: ${customerId}`,
    mcc: "MCC",
    subMcc: "Sub-MCC",
    confirmChangeAccount:
      "Al cambiar de cuenta se eliminará todo tu historial de auditorías. ¿Continuar?",
  },
  en: {
    title: "Account to audit",
    hint: "Choose the Google Ads account Mora should analyze.",
    drillHint: "Choose a client account under this manager (MCC).",
    loading: "Loading accounts…",
    loadingChildren: "Loading child accounts…",
    empty: "No accessible accounts found for this user.",
    emptyChildren: "This manager has no visible child accounts.",
    error: "Could not load accounts. Check your connection or try again.",
    selectPlaceholder: "Select an account",
    save: "Use this account",
    next: "Next",
    back: "Back",
    saving: "Saving…",
    saved: "Account saved",
    change: "Change account",
    breadcrumbRoot: "Accounts",
    active: (customerId: string, loginId: string | null) =>
      loginId
        ? `Active account: ${customerId} (via manager ${loginId})`
        : `Active account: ${customerId}`,
    mcc: "MCC",
    subMcc: "Sub-MCC",
    confirmChangeAccount:
      "Switching accounts will delete all your audit history. Continue?",
  },
} as const;

export type GoogleAdsLinkResult = {
  accountChanged: boolean;
};

export interface GoogleAdsAccountPickerProps {
  locale: Locale;
  connected: boolean;
  variant?: "settings" | "dashboard";
  onLinked?: (result: GoogleAdsLinkResult) => void;
}

export default function GoogleAdsAccountPicker({
  locale,
  connected,
  variant = "settings",
  onLinked,
}: GoogleAdsAccountPickerProps) {
  const c = copy[locale];

  const [editing, setEditing] = useState(false);
  const [linked, setLinked] = useState<LinkedSummary | null>(null);
  const [step, setStep] = useState<WizardStep>("roots");
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [rootAccounts, setRootAccounts] = useState<Account[]>([]);
  const [childAccounts, setChildAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const currentList = step === "roots" ? rootAccounts : childAccounts;
  const selectedAccount = currentList.find((a) => a.id === selectedId);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/google-ads/status", {
      headers: await moraAuthHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as StatusResponse;
  }, []);

  const fetchChildren = useCallback(
    async (managerId: string) => {
      const res = await fetch(
        `/api/google-ads/accounts/clients?manager_id=${encodeURIComponent(managerId)}`,
        { headers: await moraAuthHeaders() }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? c.error);
      }
      const data = (await res.json()) as { clients?: Account[] };
      return Array.isArray(data.clients) ? data.clients : [];
    },
    [c.error]
  );

  const resetWizard = useCallback(() => {
    setStep("roots");
    setBreadcrumb([]);
    setChildAccounts([]);
    setSelectedId("");
    setError(null);
  }, []);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, res] = await Promise.all([
        loadStatus(),
        fetch("/api/google-ads/accounts", { headers: await moraAuthHeaders() }),
      ]);

      if (status?.accountLinked && status.customer_id) {
        setLinked({
          customerId: status.customer_id,
          loginCustomerId: status.login_customer_id ?? null,
        });
        setEditing(false);
      } else {
        setLinked(null);
        setEditing(true);
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? c.error);
        setRootAccounts([]);
        return;
      }

      const data = (await res.json()) as { accounts?: Account[] };
      const list = Array.isArray(data.accounts) ? data.accounts : [];
      setRootAccounts(list);
      resetWizard();

      if (!status?.customer_id && list.length === 1 && !list[0].manager) {
        setSelectedId(list[0].id);
      }
    } catch {
      setError(c.error);
      setRootAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [c.error, loadStatus, resetWizard]);

  useEffect(() => {
    if (!connected) {
      setRootAccounts([]);
      setLinked(null);
      setEditing(false);
      resetWizard();
      return;
    }
    void loadRoots();
  }, [connected, loadRoots, resetWizard]);

  const goToDrilldown = async (manager: BreadcrumbItem) => {
    setLoading(true);
    setError(null);
    setSelectedId("");
    try {
      const children = await fetchChildren(manager.id);
      setChildAccounts(children);
      setStep("drilldown");
      if (children.length === 1 && !children[0].manager) {
        setSelectedId(children[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
      setChildAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!selectedAccount) return;

    if (step === "roots" && selectedAccount.manager) {
      const crumb: BreadcrumbItem = {
        id: selectedAccount.id,
        name: selectedAccount.name,
      };
      setBreadcrumb([crumb]);
      await goToDrilldown(crumb);
      return;
    }

    if (step === "drilldown" && selectedAccount.manager) {
      const crumb: BreadcrumbItem = {
        id: selectedAccount.id,
        name: selectedAccount.name,
      };
      const nextPath = [...breadcrumb, crumb];
      setBreadcrumb(nextPath);
      await goToDrilldown(crumb);
      return;
    }

    const loginCustomerId =
      step === "drilldown" && breadcrumb.length > 0
        ? breadcrumb[breadcrumb.length - 1].id
        : null;

    if (
      linked?.customerId &&
      normalizeCustomerId(linked.customerId) !==
        normalizeCustomerId(selectedAccount.id)
    ) {
      if (!window.confirm(c.confirmChangeAccount)) {
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/google-ads/link", {
        method: "POST",
        headers: await moraAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          customer_id: selectedAccount.id,
          login_customer_id: loginCustomerId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        account_changed?: boolean;
      };
      if (!res.ok) {
        setError(data.message ?? c.error);
        return;
      }
      setLinked({
        customerId: selectedAccount.id,
        loginCustomerId,
      });
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
      onLinked?.({ accountChanged: !!data.account_changed });
    } catch {
      setError(c.error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (step === "roots") return;

    if (breadcrumb.length <= 1) {
      resetWizard();
      return;
    }

    const parentPath = breadcrumb.slice(0, -1);
    const parent = parentPath[parentPath.length - 1];
    setBreadcrumb(parentPath);
    await goToDrilldown(parent);
  };

  const navigateBreadcrumb = async (index: number) => {
    const targetPath = breadcrumb.slice(0, index + 1);
    const target = targetPath[targetPath.length - 1];
    setBreadcrumb(targetPath);
    await goToDrilldown(target);
  };

  if (!connected) return null;

  const isDark = variant === "dashboard";
  const cardClass = isDark
    ? "rounded-xl border border-[#44403C] bg-[#1C1917]/80 p-5 text-left w-full"
    : "rounded-2xl border border-[#E5E7EB] bg-white p-6 w-full";
  const titleClass = isDark
    ? "text-lg font-black text-[#F5F0EB]"
    : "text-lg font-black text-[#0a0a0a]";
  const hintClass = isDark
    ? "text-sm text-[#A8A29E] font-medium"
    : "text-sm text-[#4B5563] font-medium";
  const selectClass = isDark
    ? "bg-[#292524] border border-[#44403C] text-[#F5F0EB]"
    : "bg-[#F4F4F5] border border-[#E5E7EB] text-[#0a0a0a]";
  const btnPrimary = isDark
    ? "bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1]"
    : "bg-[#E0E7FF] text-[#0a0a0a] hover:bg-[#eab3a1] border border-[#E0E7FF]";
  const btnSecondary = isDark
    ? "border border-[#44403C] text-[#A8A29E] hover:bg-[#292524]"
    : "border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F4F4F5]";

  const isPrimaryNext = Boolean(selectedAccount?.manager);
  const primaryLabel = saving
    ? c.saving
    : savedFlash
      ? c.saved
      : isPrimaryNext
        ? c.next
        : c.save;

  const showWizard = editing || !linked;

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark
              ? "bg-[#4285F4]/15 border border-[#4285F4]/30 text-[#93C5FD]"
              : "bg-[#E0E7FF]/30 border border-[#E0E7FF] text-[#6366F1]"
          }`}
        >
          <Building2 size={20} />
        </div>
        <div>
          <p className={titleClass}>{c.title}</p>
          <p className={`${hintClass} mt-1`}>
            {step === "drilldown" ? c.drillHint : c.hint}
          </p>
        </div>
      </div>

      {linked && !editing && (
        <div className="mb-4 space-y-3">
          <p className="text-xs font-bold text-[#10B981]">
            {c.active(linked.customerId, linked.loginCustomerId)}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              resetWizard();
            }}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${btnSecondary}`}
          >
            {c.change}
          </button>
        </div>
      )}

      {showWizard && (
        <>
          {step === "drilldown" && breadcrumb.length > 0 && (
            <nav className="flex flex-wrap items-center gap-1 mb-4 text-[10px] font-bold uppercase tracking-widest">
              <button
                type="button"
                onClick={() => {
                  resetWizard();
                }}
                className={isDark ? "text-[#93C5FD] hover:underline" : "text-[#6366F1] hover:underline"}
              >
                {c.breadcrumbRoot}
              </button>
              {breadcrumb.map((item, index) => (
                <span key={item.id} className="flex items-center gap-1">
                  <ChevronRight size={12} className="opacity-50" />
                  <button
                    type="button"
                    onClick={() => void navigateBreadcrumb(index)}
                    className={
                      index === breadcrumb.length - 1
                        ? isDark
                          ? "text-[#F5F0EB]"
                          : "text-[#0a0a0a]"
                        : isDark
                          ? "text-[#93C5FD] hover:underline"
                          : "text-[#6366F1] hover:underline"
                    }
                  >
                    {item.name}
                  </button>
                </span>
              ))}
            </nav>
          )}

          {loading && (
            <div className={`flex items-center gap-2 text-sm font-medium ${hintClass}`}>
              <Loader2 size={16} className="animate-spin shrink-0" />
              {step === "drilldown" ? c.loadingChildren : c.loading}
            </div>
          )}

          {!loading && error && (
            <p
              className={`text-sm font-medium flex gap-2 mb-4 ${
                isDark ? "text-[#FCA5A5]" : "text-[#DC2626]"
              }`}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </p>
          )}

          {!loading && !error && currentList.length === 0 && (
            <p className={hintClass}>
              {step === "drilldown" ? c.emptyChildren : c.empty}
            </p>
          )}

          {!loading && currentList.length > 0 && (
            <div className="space-y-4">
              <select
                className={`w-full p-4 rounded-xl font-bold text-sm appearance-none cursor-pointer ${selectClass}`}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={saving}
              >
                <option value="">{c.selectPlaceholder}</option>
                {currentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                    {a.manager
                      ? step === "roots"
                        ? ` — ${c.mcc}`
                        : ` — ${c.subMcc}`
                      : ""}
                  </option>
                ))}
              </select>

              <div className="flex flex-col sm:flex-row gap-2">
                {step === "drilldown" && (
                  <button
                    type="button"
                    onClick={() => void handleBack()}
                    disabled={saving || loading}
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${btnSecondary}`}
                  >
                    {c.back}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handlePrimaryAction()}
                  disabled={!selectedId || saving || loading}
                  className={`flex-1 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${btnPrimary}`}
                >
                  {primaryLabel}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
