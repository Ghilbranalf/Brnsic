import React from "react";

export type SeasonalThemeId =
  | "auto"
  | "halloween"
  | "christmas"
  | "newyear"
  | "valentine"
  | "ramadan"
  | "eidfitr"
  | "eidadha"
  | "independenceday"
  | "daily"
  | "off";

export interface SeasonalThemeInfo {
  id: SeasonalThemeId;
  resolvedId:
    | "halloween"
    | "christmas"
    | "newyear"
    | "valentine"
    | "ramadan"
    | "eidfitr"
    | "eidadha"
    | "independenceday"
    | "daily"
    | "off";
  name: string;
  ambientGradient: string;
  topAccentLine: string;
  glowColor: string;
  isSpecialEvent: boolean;
}

function getHijriMonthDay(date: Date): { month: number; day: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      month: "numeric",
      day: "numeric"
    });
    const parts = formatter.formatToParts(date);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const d = Number(parts.find((p) => p.type === "day")?.value);
    if (Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 30) {
      return { month: m, day: d };
    }
  } catch (e) {}
  return null;
}

export function resolveCalendarHoliday(now: Date = new Date()): SeasonalThemeInfo["resolvedId"] {
  const hijri = getHijriMonthDay(now);
  if (hijri) {
    if (hijri.month === 9) return "ramadan";
    if (hijri.month === 10 && hijri.day <= 7) return "eidfitr";
    if (hijri.month === 12 && hijri.day >= 9 && hijri.day <= 13) return "eidadha";
  }

  const month = now.getMonth(); // 0 = Jan .. 11 = Dec
  const day = now.getDate();

  if (month === 0 && day <= 7) return "newyear";
  if (month === 1 && day >= 10 && day <= 16) return "valentine";
  if (month === 7 && day >= 14 && day <= 20) return "independenceday";
  if ((month === 9 && day >= 24) || (month === 10 && day <= 3)) return "halloween";
  if (month === 11 && day >= 18) return "christmas";

  return "daily";
}

export function getSeasonalTheme(selectedId: SeasonalThemeId = "auto", now: Date = new Date()): SeasonalThemeInfo {
  const resolved: SeasonalThemeInfo["resolvedId"] =
    selectedId === "auto" ? resolveCalendarHoliday(now) : selectedId;

  switch (resolved) {
    case "off":
      return {
        id: selectedId,
        resolvedId: "off",
        name: "AMOLED Minimal",
        ambientGradient: "none",
        topAccentLine: "transparent",
        glowColor: "transparent",
        isSpecialEvent: false
      };

    case "ramadan":
      return {
        id: selectedId,
        resolvedId: "ramadan",
        name: "Ramadan",
        ambientGradient:
          "radial-gradient(ellipse 80% 45% at 50% -10%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 185, 129, 0.08) 45%, transparent 75%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.45), transparent)",
        glowColor: "#fbbf24",
        isSpecialEvent: true
      };

    case "eidfitr":
      return {
        id: selectedId,
        resolvedId: "eidfitr",
        name: "Idul Fitri",
        ambientGradient:
          "radial-gradient(ellipse 85% 48% at 50% -8%, rgba(30, 215, 96, 0.18) 0%, rgba(250, 204, 21, 0.10) 48%, transparent 78%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(30, 215, 96, 0.55), rgba(250, 204, 21, 0.45), transparent)",
        glowColor: "#1ed760",
        isSpecialEvent: true
      };

    case "eidadha":
      return {
        id: selectedId,
        resolvedId: "eidadha",
        name: "Idul Adha",
        ambientGradient:
          "radial-gradient(ellipse 80% 45% at 50% -10%, rgba(16, 185, 129, 0.16) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 75%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)",
        glowColor: "#10b981",
        isSpecialEvent: true
      };

    case "independenceday":
      return {
        id: selectedId,
        resolvedId: "independenceday",
        name: "Kemerdekaan RI",
        ambientGradient:
          "radial-gradient(ellipse 85% 42% at 35% -12%, rgba(220, 38, 38, 0.20) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 72%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.65), rgba(255, 255, 255, 0.4), transparent)",
        glowColor: "#ef4444",
        isSpecialEvent: true
      };

    case "halloween":
      return {
        id: selectedId,
        resolvedId: "halloween",
        name: "Halloween",
        ambientGradient:
          "radial-gradient(ellipse 80% 45% at 75% -10%, rgba(249, 115, 22, 0.17) 0%, rgba(126, 34, 206, 0.11) 45%, transparent 76%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.55), rgba(168, 85, 247, 0.45), transparent)",
        glowColor: "#f97316",
        isSpecialEvent: true
      };

    case "christmas":
      return {
        id: selectedId,
        resolvedId: "christmas",
        name: "Natal & Akhir Tahun",
        ambientGradient:
          "radial-gradient(ellipse 85% 45% at 50% -10%, rgba(22, 163, 74, 0.16) 0%, rgba(220, 38, 38, 0.10) 45%, transparent 76%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), rgba(239, 68, 68, 0.5), transparent)",
        glowColor: "#22c55e",
        isSpecialEvent: true
      };

    case "newyear":
      return {
        id: selectedId,
        resolvedId: "newyear",
        name: "Tahun Baru",
        ambientGradient:
          "radial-gradient(ellipse 85% 48% at 50% -10%, rgba(250, 204, 21, 0.18) 0%, rgba(56, 189, 248, 0.08) 48%, transparent 78%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.6), transparent)",
        glowColor: "#facc15",
        isSpecialEvent: true
      };

    case "valentine":
      return {
        id: selectedId,
        resolvedId: "valentine",
        name: "Valentine",
        ambientGradient:
          "radial-gradient(ellipse 80% 45% at 50% -10%, rgba(244, 63, 94, 0.16) 0%, rgba(192, 132, 252, 0.07) 48%, transparent 76%)",
        topAccentLine: "linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.55), transparent)",
        glowColor: "#f43f5e",
        isSpecialEvent: true
      };

    case "daily":
    default: {
      const hour = now.getHours();
      if (hour >= 5 && hour < 11) {
        return {
          id: selectedId,
          resolvedId: "daily",
          name: "Pagi",
          ambientGradient:
            "radial-gradient(ellipse 75% 40% at 80% -12%, rgba(56, 189, 248, 0.10) 0%, rgba(30, 215, 96, 0.05) 45%, transparent 72%)",
          topAccentLine: "transparent",
          glowColor: "#38bdf8",
          isSpecialEvent: false
        };
      }
      if (hour >= 15 && hour < 19) {
        return {
          id: selectedId,
          resolvedId: "daily",
          name: "Senja",
          ambientGradient:
            "radial-gradient(ellipse 75% 40% at 80% -12%, rgba(245, 158, 11, 0.11) 0%, rgba(244, 63, 94, 0.05) 45%, transparent 72%)",
          topAccentLine: "transparent",
          glowColor: "#f59e0b",
          isSpecialEvent: false
        };
      }
      return {
        id: selectedId,
        resolvedId: "daily",
        name: "Malam",
        ambientGradient:
          "radial-gradient(ellipse 75% 40% at 80% -12%, rgba(30, 215, 96, 0.09) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 72%)",
        topAccentLine: "transparent",
        glowColor: "#1ed760",
        isSpecialEvent: false
      };
    }
  }
}

export function SeasonalMascotIcon(_props: {
  theme: SeasonalThemeInfo;
  onClick?: () => void;
}) {
  return null;
}
