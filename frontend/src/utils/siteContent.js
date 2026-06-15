/**
 * Resolve bilingual CMS fields to a display string for the active locale.
 */
import { Factory, Layers, Wrench, Globe2, Cpu, Cog, Shield, Truck, Hammer, Settings } from "lucide-react";

export function siteText(field, lang = "ar") {
  if (field == null) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    return field[lang] ?? field.ar ?? field.en ?? "";
  }
  return String(field);
}

/** Lucide icon name → component map for dynamic feature cards */
export const FEATURE_ICON_OPTIONS = [
  { value: "Factory", label: "Factory" },
  { value: "Layers", label: "Layers" },
  { value: "Wrench", label: "Wrench" },
  { value: "Globe2", label: "Globe" },
  { value: "Cpu", label: "Cpu" },
  { value: "Cog", label: "Cog" },
  { value: "Shield", label: "Shield" },
  { value: "Truck", label: "Truck" },
  { value: "Hammer", label: "Hammer" },
  { value: "Settings", label: "Settings" },
];

const ICON_MAP = {
  Factory,
  Layers,
  Wrench,
  Globe2,
  Cpu,
  Cog,
  Shield,
  Truck,
  Hammer,
  Settings,
};

export function resolveFeatureIcon(name) {
  return ICON_MAP[name] || Factory;
}

export function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length >= 12) {
    return `+20 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

export function emptySiteContentDraft() {
  return {
    hero: {
      title: { ar: "", en: "" },
      subtitle: { ar: "", en: "" },
      badgeText: { ar: "", en: "" },
      ctaText: { ar: "", en: "" },
      backgroundImage: "",
    },
    about: {
      heading: { ar: "", en: "" },
      description: { ar: "", en: "" },
      sectionImage: "",
    },
    features: [],
    catalogTeaser: {
      label: { ar: "", en: "" },
      heading: { ar: "", en: "" },
      ctaText: { ar: "", en: "" },
    },
    contact: {
      phone: "",
      email: "",
      address: { ar: "", en: "" },
      facebookUrl: "",
      website: "",
    },
  };
}
