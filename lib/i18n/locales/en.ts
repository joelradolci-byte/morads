import type { EsDict } from "./es";

export const en = {
  settings: {
    title: "Settings",
    experience: "Mora experience",
    language: "Language",
    languageHint: "Applies to the app and new AI-powered audits.",
    languageEs: "Español",
    languageEn: "English",
    resumenAutoAbrir: "Open summary when an audit finishes",
    pdfBrand: "Your brand on the PDF",
    businessName: "Business name",
    businessNameHint: "Shown on the PDF cover page.",
    website: "Website",
    websitePlaceholder: "e.g. www.yourbusiness.com",
    logo: "Logo",
    footer: "PDF footer text",
    footerHint: "Confidentiality, legal disclaimer, etc.",
    save: "Save changes",
    saving: "Saving…",
    saved: "Changes saved",
    account: "Account & plan",
    currencyBadge: (code: string) => `Amounts in ${code}`,
  },
  common: {
    cancel: "Cancel",
  },
} satisfies EsDict;
