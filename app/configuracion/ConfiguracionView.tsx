"use client";

import { useState } from "react";
import {
  Settings,
  CreditCard,
  ChevronDown,
  Globe,
  FileText,
} from "lucide-react";
import { useLocale } from "../../lib/i18n/LocaleProvider";
import type { UsageSnapshot } from "../../lib/usage/config";
import GoogleAdsConnectBlock from "../components/GoogleAdsConnectBlock";
import GoogleAdsAccountPicker from "../components/GoogleAdsAccountPicker";

type TabId = "cuenta" | "experiencia" | "pdf";

export interface ConfiguracionViewProps {
  session: { user?: { id?: string; email?: string; name?: string } } | null;
  perfil: { plan?: string } | null;
  usageSnapshot: UsageSnapshot | null;
  agenciaNombre: string;
  setAgenciaNombre: (v: string) => void;
  agenciaLogo: string;
  agenciaWeb: string;
  setAgenciaWeb: (v: string) => void;
  agenciaPie: string;
  setAgenciaPie: (v: string) => void;
  uploading: boolean;
  loading: boolean;
  onSubirLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGuardar: () => Promise<void>;
  onIrFacturacion: () => void;
  currencyCodeLabel?: string | null;
  googleAdsConnected: boolean;
  googleAdsChecking: boolean;
  onConectarGoogleAds: () => void;
  onGoogleAdsAccountLinked?: () => void;
}

export default function ConfiguracionView({
  session,
  perfil,
  usageSnapshot,
  agenciaNombre,
  setAgenciaNombre,
  agenciaLogo,
  agenciaWeb,
  setAgenciaWeb,
  agenciaPie,
  setAgenciaPie,
  uploading,
  loading,
  onSubirLogo,
  onGuardar,
  onIrFacturacion,
  currencyCodeLabel,
  googleAdsConnected,
  googleAdsChecking,
  onConectarGoogleAds,
  onGoogleAdsAccountLinked,
}: ConfiguracionViewProps) {
  const { locale, dict, setLocale, resumenAutoAbrir, setResumenAutoAbrir } = useLocale();
  const s = dict.settings;
  const [tab, setTab] = useState<TabId>("experiencia");
  const [toast, setToast] = useState<string | null>(null);

  const handleGuardar = async () => {
    await onGuardar();
    setToast(s.saved);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
    { id: "cuenta", label: s.account, icon: CreditCard },
    { id: "experiencia", label: s.experience, icon: Globe },
    { id: "pdf", label: s.pdfBrand, icon: FileText },
  ];

  return (
    <div className="animate-fade-custom bg-[#FFFFFF] border border-[#E5E7EB] p-6 md:p-10 rounded-[2rem] shadow-sm max-w-4xl mx-auto print:hidden relative z-10 w-full">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F4F4F5]">
        <div className="w-14 h-14 bg-[#F4F4F5] border border-[#E5E7EB] shadow-sm rounded-2xl flex items-center justify-center text-[#0a0a0a]">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#0a0a0a]">{s.title}</h2>
          {currencyCodeLabel && (
            <p className="text-[#6366F1] text-xs font-bold mt-1">{s.currencyBadge(currencyCodeLabel)}</p>
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? "bg-[#E0E7FF] text-[#0a0a0a] border border-[#E0E7FF]"
                  : "bg-[#F4F4F5] text-[#4B5563] border border-[#E5E7EB] hover:bg-white"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "cuenta" && (
        <div className="space-y-6">
          <GoogleAdsConnectBlock
            locale={locale}
            connected={googleAdsConnected}
            checking={googleAdsChecking}
            onConnect={onConectarGoogleAds}
            variant="settings"
          />
          <GoogleAdsAccountPicker
            locale={locale}
            connected={googleAdsConnected}
            variant="settings"
            onLinked={onGoogleAdsAccountLinked}
          />
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F4F4F5] p-6">
            <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">Email</p>
            <p className="text-sm font-bold text-[#0a0a0a]">{session?.user?.email ?? "—"}</p>
          </div>
          {usageSnapshot && (
            <div className="rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
              <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest">
                {locale === "en" ? "Usage this month" : "Uso este mes"}
              </p>
              <p className="text-sm font-medium text-[#4B5563]">
                {locale === "en" ? "Audits" : "Auditorías"}: {usageSnapshot.usage.audit}/
                {usageSnapshot.limits.audit.monthly}
              </p>
              <p className="text-sm font-medium text-[#4B5563]">
                PDF: {usageSnapshot.usage.pdf}/{usageSnapshot.limits.pdf.monthly}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] p-6">
            <div>
              <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">Plan</p>
              <p className="text-xl font-black text-[#0a0a0a]">
                {perfil?.plan === "pro" ? "Mora Pro" : "Mora Free"}
              </p>
            </div>
            <button
              type="button"
              onClick={onIrFacturacion}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F4F4F5]"
            >
              {locale === "en" ? "Manage billing" : "Gestionar facturación"}
            </button>
          </div>
        </div>
      )}

      {tab === "experiencia" && (
        <div className="space-y-6 max-w-lg">
          <div>
            <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">
              {s.language}
            </label>
            <p className="text-xs text-[#4B5563] mb-3 font-medium">{s.languageHint}</p>
            <div className="relative">
              <select
                className="w-full p-4 bg-[#F4F4F5] border border-[#E5E7EB] rounded-xl text-[#0a0a0a] font-bold shadow-inner appearance-none cursor-pointer text-sm"
                value={locale}
                onChange={(e) => setLocale(e.target.value === "en" ? "en" : "es")}
              >
                <option value="es">{s.languageEs}</option>
                <option value="en">{s.languageEn}</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
              />
            </div>
          </div>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E7EB] bg-[#F4F4F5] cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={resumenAutoAbrir}
              onChange={(e) => setResumenAutoAbrir(e.target.checked)}
            />
            <span className="text-sm font-medium text-[#4B5563]">{s.resumenAutoAbrir}</span>
          </label>
        </div>
      )}

      {tab === "pdf" && (
        <div className="space-y-6 max-w-xl">
          <p className="text-sm text-[#4B5563] font-medium">{s.businessNameHint}</p>
          <div>
            <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">
              {s.businessName}
            </label>
            <input
              type="text"
              className="w-full p-4 bg-[#F4F4F5] border border-[#E5E7EB] rounded-xl text-[#0a0a0a] font-bold shadow-inner focus:border-[#E0E7FF] focus:bg-[#FAFAF9] focus:outline-none text-sm"
              value={agenciaNombre}
              onChange={(e) => setAgenciaNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">
              {s.website}
            </label>
            <input
              type="text"
              placeholder={s.websitePlaceholder}
              className="w-full p-4 bg-[#F4F4F5] border border-[#E5E7EB] rounded-xl text-[#0a0a0a] font-bold shadow-inner focus:border-[#E0E7FF] focus:bg-[#FAFAF9] focus:outline-none text-sm"
              value={agenciaWeb}
              onChange={(e) => setAgenciaWeb(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">
              {s.logo}
            </label>
            <div className="flex items-center gap-6 p-4 border border-[#E5E7EB] rounded-xl bg-[#F4F4F5] shadow-inner">
              {agenciaLogo ? (
                <img
                  src={agenciaLogo}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded bg-white p-1 border border-[#E5E7EB]"
                />
              ) : (
                <div className="w-14 h-14 bg-[#FAFAF9] rounded-lg flex items-center justify-center text-[#8A968C] text-[9px] uppercase font-black border border-dashed">
                  Logo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onSubirLogo}
                disabled={uploading}
                className="flex-1 text-xs text-[#4B5563] font-bold cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white file:text-[#0a0a0a]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">
              {s.footer}
            </label>
            <p className="text-xs text-[#4B5563] mb-2 font-medium">{s.footerHint}</p>
            <textarea
              className="w-full h-24 p-4 bg-[#F4F4F5] border border-[#E5E7EB] rounded-xl text-[#0a0a0a] font-bold shadow-inner text-sm resize-none focus:outline-none focus:border-[#E0E7FF]"
              value={agenciaPie}
              onChange={(e) => setAgenciaPie(e.target.value)}
            />
          </div>
        </div>
      )}

      {tab !== "cuenta" && (
        <div className="border-t border-[#E5E7EB] mt-8 pt-8 flex justify-end">
          <button
            type="button"
            onClick={() => void handleGuardar()}
            disabled={loading || uploading}
            className="w-full md:w-auto md:px-10 text-[#0a0a0a] bg-[#E0E7FF] hover:bg-[#eab3a1] px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? s.saving : s.save}
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#0a0a0a] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
