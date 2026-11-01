import React from "react";

export type SeasonalThemeId =
  | "auto"
  | "halloween"
  | "christmas"
  | "newyear"
  | "valentine"
  | "ramadan"
  | "independenceday"
  | "off";

export interface SeasonalThemeInfo {
  id: SeasonalThemeId;
  resolvedId: "halloween" | "christmas" | "newyear" | "valentine" | "ramadan" | "independenceday" | "daily" | "off";
  name: string;
  tagline: string;
  emoji: string;
  badgeLabel: string;
  toastText: string;
  ambientGradient: string;
  glowColor: string;
  isSpecialEvent: boolean;
}

export const THEME_OPTIONS: Array<{ id: SeasonalThemeId; label: string; emoji: string }> = [
  { id: "auto", label: "Otomatis (Sesuai Kalender & Jam)", emoji: "🗓️" },
  { id: "halloween", label: "Halloween 🎃", emoji: "🎃" },
  { id: "christmas", label: "Natal & Liburan 🎄", emoji: "🎄" },
  { id: "newyear", label: "Tahun Baru ✨", emoji: "✨" },
  { id: "valentine", label: "Hari Valentine 💖", emoji: "💖" },
  { id: "ramadan", label: "Ramadan & Idul Fitri 🌙", emoji: "🌙" },
  { id: "independenceday", label: "HUT RI (17 Agustus) 🇮🇩", emoji: "🇮🇩" },
  { id: "off", label: "Nonaktif (Minimalis Murni) 🖤", emoji: "🖤" }
];

export function getSeasonalTheme(selectedId: SeasonalThemeId = "auto"): SeasonalThemeInfo {
  let resolved: "halloween" | "christmas" | "newyear" | "valentine" | "ramadan" | "independenceday" | "daily" | "off" = "daily";

  if (selectedId === "off") {
    return {
      id: "off",
      resolvedId: "off",
      name: "Minimalis Murni",
      tagline: "Desain AMOLED Murni tanpa aksen musiman",
      emoji: "🖤",
      badgeLabel: "",
      toastText: "Aksen musiman dinonaktifkan.",
      ambientGradient: "none",
      glowColor: "transparent",
      isSpecialEvent: false
    };
  }

  if (selectedId !== "auto") {
    resolved = selectedId as any;
  } else {
    // Automatic date detection based on calendar
    const now = new Date();
    const month = now.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
    const day = now.getDate();

    if ((month === 9 && day >= 24) || (month === 10 && day <= 3)) {
      resolved = "halloween";
    } else if (month === 11 && day >= 18) {
      resolved = "christmas";
    } else if (month === 0 && day <= 7) {
      resolved = "newyear";
    } else if (month === 1 && day >= 10 && day <= 16) {
      resolved = "valentine";
    } else if (month === 7 && day >= 14 && day <= 20) {
      resolved = "independenceday";
    } else {
      resolved = "daily";
    }
  }

  switch (resolved) {
    case "halloween":
      return {
        id: selectedId,
        resolvedId: "halloween",
        name: "Halloween Night",
        tagline: "Suasana mistis Jack-o'-lantern & twilight aura",
        emoji: "🎃",
        badgeLabel: "Spooky",
        toastText: "🎃 Happy Halloween dari Brnsic! Nikmati alunan musik di malam spooky.",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(249, 115, 22, 0.08) 0%, rgba(147, 51, 234, 0.06) 35%, transparent 65%)",
        glowColor: "#f97316",
        isSpecialEvent: true
      };

    case "christmas":
      return {
        id: selectedId,
        resolvedId: "christmas",
        name: "Natal & Liburan",
        tagline: "Kehangatan festive & suasana akhir tahun",
        emoji: "🎄",
        badgeLabel: "Holiday",
        toastText: "🎄 Selamat Natal & Liburan Akhir Tahun dari Brnsic!",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(239, 68, 68, 0.07) 0%, rgba(30, 215, 96, 0.06) 40%, transparent 65%)",
        glowColor: "#1ed760",
        isSpecialEvent: true
      };

    case "newyear":
      return {
        id: selectedId,
        resolvedId: "newyear",
        name: "Tahun Baru",
        tagline: "Semangat baru dengan kilau emas perayaan",
        emoji: "✨",
        badgeLabel: "New Year",
        toastText: "✨ Selamat Tahun Baru! Semangat baru bareng alunan musik terbaik.",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(234, 179, 8, 0.08) 0%, rgba(168, 85, 247, 0.05) 40%, transparent 65%)",
        glowColor: "#eab308",
        isSpecialEvent: true
      };

    case "valentine":
      return {
        id: selectedId,
        resolvedId: "valentine",
        name: "Hari Kasih Sayang",
        tagline: "Sentuhan romantis manis & hangat",
        emoji: "💖",
        badgeLabel: "Valentine",
        toastText: "💖 Happy Valentine! Dengarkan playlist lagu cinta terfavoritmu.",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(244, 63, 94, 0.08) 0%, rgba(217, 70, 239, 0.05) 40%, transparent 65%)",
        glowColor: "#f43f5e",
        isSpecialEvent: true
      };

    case "ramadan":
      return {
        id: selectedId,
        resolvedId: "ramadan",
        name: "Ramadan & Idul Fitri",
        tagline: "Kedamaian bulan suci & alunan penuh berkah",
        emoji: "🌙",
        badgeLabel: "Berkah",
        toastText: "🌙 Marhaban ya Ramadan / Selamat Hari Raya Idul Fitri!",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(30, 215, 96, 0.07) 0%, rgba(234, 179, 8, 0.06) 40%, transparent 65%)",
        glowColor: "#1ed760",
        isSpecialEvent: true
      };

    case "independenceday":
      return {
        id: selectedId,
        resolvedId: "independenceday",
        name: "HUT RI (17 Agustus)",
        tagline: "Semangat Merah Putih & karya musisi bangsa",
        emoji: "🇮🇩",
        badgeLabel: "Merdeka",
        toastText: "🇮🇩 Dirgahayu Republik Indonesia! Bangga karya musik tanah air.",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 65%)",
        glowColor: "#ef4444",
        isSpecialEvent: true
      };

    case "daily":
    default: {
      const hour = new Date().getHours();
      // Pagi (05:00 - 11:59)
      if (hour >= 5 && hour < 12) {
        return {
          id: selectedId,
          resolvedId: "daily",
          name: "Suasana Pagi",
          tagline: "Fresh Morning Aura",
          emoji: "☀️",
          badgeLabel: "Pagi",
          toastText: "☀️ Selamat pagi! Mulai harimu dengan alunan musik penuh energi.",
          ambientGradient:
            "radial-gradient(circle at 85% 0%, rgba(30, 215, 96, 0.04) 0%, transparent 60%)",
          glowColor: "#1ed760",
          isSpecialEvent: false
        };
      }
      // Sore / Golden Hour (12:00 - 17:59)
      if (hour >= 12 && hour < 18) {
        return {
          id: selectedId,
          resolvedId: "daily",
          name: "Suasana Senja",
          tagline: "Golden Sunset Hour",
          emoji: "🌇",
          badgeLabel: "Senja",
          toastText: "🌇 Selamat sore! Temani waktu santaimu dengan playlist favorit.",
          ambientGradient:
            "radial-gradient(circle at 85% 0%, rgba(245, 158, 11, 0.035) 0%, transparent 60%)",
          glowColor: "#f59e0b",
          isSpecialEvent: false
        };
      }
      // Malam (18:00 - 04:59)
      return {
        id: selectedId,
        resolvedId: "daily",
        name: "Suasana Malam",
        tagline: "Deep Night Serenity",
        emoji: "🌙",
        badgeLabel: "Malam",
        toastText: "🌙 Selamat malam! Selamat menikmati musik pengantar istirahat.",
        ambientGradient:
          "radial-gradient(circle at 85% 0%, rgba(99, 102, 241, 0.035) 0%, transparent 60%)",
        glowColor: "#6366f1",
        isSpecialEvent: false
      };
    }
  }
}

/**
 * High-definition, tasteful SVG Mascot Icon rendered next to the Brnsic header brand.
 * Completely non-intrusive, zero layout shifts, perfectly sized at 18x18px.
 */
export function SeasonalMascotIcon({
  theme,
  onClick
}: {
  theme: SeasonalThemeInfo;
  onClick?: () => void;
}) {
  if (!theme.isSpecialEvent) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="inline-flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition p-0.5 rounded-full"
      title={`${theme.name} • Ketuk untuk salam spesial`}
    >
      {theme.resolvedId === "halloween" ? (
        <span className="relative flex items-center justify-center gap-1">
          <svg className="w-4 h-4 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" viewBox="0 0 24 24" fill="none">
            {/* Jack-o'-Lantern Outline & Body */}
            <path
              d="M12 4.2C8.5 4.2 4.5 6.2 3 9.5C1.5 12.8 1.5 16.5 3 19.5C4.5 22 8.5 23 12 23C15.5 23 19.5 22 21 19.5C22.5 16.5 22.5 12.8 21 9.5C19.5 6.2 15.5 4.2 12 4.2Z"
              fill="#F97316"
            />
            {/* Darker Contour Lines */}
            <path
              d="M12 4.5C9.8 4.5 8 6.5 7.5 10C7 14 7 18 7.5 21C8.2 22.5 10 23 12 23C14 23 15.8 22.5 16.5 21C17 18 17 14 16.5 10C16 6.5 14.2 4.5 12 4.5Z"
              fill="#EA580C"
            />
            {/* Green Stem */}
            <path
              d="M11.5 4.5C11.8 3 12.5 1.5 14 1C13.2 1.3 12.5 2 12 3C11.5 3.8 11.2 4.2 11.5 4.5Z"
              fill="#22C55E"
              stroke="#15803D"
              strokeWidth="0.8"
            />
            {/* Spooky Glowing Eyes */}
            <polygon points="7.5,11 9.5,13.5 7.2,13.5" fill="#180A28" />
            <polygon points="16.5,11 14.5,13.5 16.8,13.5" fill="#180A28" />
            {/* Nose */}
            <polygon points="12,13 11.2,14.5 12.8,14.5" fill="#180A28" />
            {/* Spooky Jagged Grin */}
            <path
              d="M6.5,16.5 L8.5,17.8 L10,16.5 L12,18.2 L14,16.5 L15.5,17.8 L17.5,16.5 C16.5,20.2 14.2,21 12,21 C9.8,21 7.5,20.2 6.5,16.5 Z"
              fill="#180A28"
            />
          </svg>
          {/* Subtle stylish crimson blood drop */}
          <svg className="w-2.5 h-3 text-red-600 drop-shadow-[0_0_6px_rgba(220,38,38,0.8)] animate-pulse" viewBox="0 0 10 14" fill="currentColor">
            <path d="M5 0C5 0 0 6.5 0 9.5C0 12 2.2 14 5 14C7.8 14 10 12 10 9.5C10 6.5 5 0 5 0Z" />
          </svg>
        </span>
      ) : theme.resolvedId === "christmas" ? (
        <span className="text-base select-none leading-none">🎅</span>
      ) : theme.resolvedId === "newyear" ? (
        <span className="text-base select-none leading-none">✨</span>
      ) : theme.resolvedId === "valentine" ? (
        <span className="text-base select-none leading-none">💖</span>
      ) : theme.resolvedId === "ramadan" ? (
        <span className="text-base select-none leading-none">🌙</span>
      ) : theme.resolvedId === "independenceday" ? (
        <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-600 text-white leading-none">RI</span>
      ) : null}
    </button>
  );
}
