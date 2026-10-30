"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import type { SafeUser } from "@/lib/auth";
import {
  buildUserTasteVector,
  trainUserVectorOnInteraction,
  rankTracksByDeepLearning,
  detectUserMood,
  type MoodInsight,
  type FeatureVector
} from "@/lib/recommendation";

// --- Types ---
interface LyricLine {
  time: number;
  text: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  duration: number; // in seconds
  cover: string;
  canvasImg?: string;
  youtubeId?: string;
  previewUrl?: string;
  plays?: string;
  collectionId?: number | string;
  lyrics: LyricLine[];
  isSmartRecommendation?: boolean;
}

interface TrendingSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  previewUrl?: string;
  rank?: number;
  plays?: string;
  genre?: string;
  releaseDate?: string;
  collectionId?: number | string;
  reason?: string;
  youtubeId?: string;
  youtubeQuery: string;
  isSmartRecommendation?: boolean;
}

interface TrendingArtist {
  id: string;
  name: string;
  image: string;
  position: number;
}

interface TasteProfile {
  userSeed: string;
  persona: string;
  artistWeights: Record<string, number>;
  genreWeights?: Record<string, number>;
  selectedGenres?: string[];
  playCounts: Record<string, number>;
  likedArtists: string[];
  totalPlays: number;
}

interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  songs: any[];
  createdAt: number;
  creator?: {
    name: string;
    avatar?: string;
  };
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.classList.contains("rounded-full") && target.alt) {
    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(target.alt)}&backgroundColor=1f1f1f&textColor=ffffff`;
  } else if (target.src !== FALLBACK_COVER) {
    target.src = FALLBACK_COVER;
  }
};

// Spotify-Grade Marquee Text Component: Automatically detects overflow and scrolls long text seamlessly ("Teks Berjalan")
const MarqueeText: React.FC<{
  text: string;
  className?: string;
  speedSec?: number;
}> = ({ text, className = "", speedSec = 14 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth + 2);
      }
    };
    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    if (ro && containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener("resize", check);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [text]);

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className={`truncate max-w-full ${className}`}>
        <span ref={textRef} className="truncate inline-block max-w-full font-inherit">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-hidden max-w-full mask-marquee-fade ${className}`}>
      <div
        className="animate-marquee-smooth inline-flex whitespace-nowrap"
        style={{ animationDuration: `${speedSec}s` }}
      >
        <span ref={textRef} className="pr-10 inline-block font-inherit">
          {text}
        </span>
        <span className="pr-10 inline-block font-inherit" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
};

// Rich Master Catalog (Diverse hits so playback never feels empty or repetitive)
const DEFAULT_CATALOG: Track[] = [
  {
    id: "sal-priadi-gala-bunga-matahari",
    title: "Gala Bunga Matahari",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    year: "2024",
    duration: 210,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    youtubeId: "kv2WIY8RLQQ",
    plays: "290M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Piano)" },
      { time: 1.89, text: "Mungkinkah" },
      { time: 3.74, text: "Mungkinkah" },
      { time: 5.89, text: "Mungkinkah" },
      { time: 8.23, text: "Kau mampir hari ini?" },
      { time: 12.49, text: "Bila tidak, mirip kau jadilah bunga matahari" },
      { time: 22.52, text: "Yang tiba-tiba mekar di taman" },
      { time: 27.06, text: "Meski bicara dengan bahasa tumbuhan" },
      { time: 31.76, text: "Ceritakan padaku" },
      { time: 36.56, text: "Bagaimana tempat tinggalmu yang baru?" },
      { time: 43.62, text: "Adakah sungai-sungai itu benar-benar" },
      { time: 48.15, text: "Dilintasi dengan air susu?" },
      { time: 55.14, text: "Juga badanmu tak sakit-sakit lagi?" },
      { time: 59.82, text: "Kau dan orang-orang di sana muda lagi?" },
      { time: 64.84, text: "Semua pertanyaan" },
      { time: 66.90, text: "Temukan jawaban" },
      { time: 69.30, text: "Hati yang gembira sering kau tertawa" },
      { time: 74.12, text: "Benarkah orang bilang ia memang suka bercanda?" },
      { time: 83.12, text: "Mungkinkah" },
      { time: 85.24, text: "Mungkinkah" },
      { time: 87.39, text: "Mungkinkah" },
      { time: 89.48, text: "Kau mampir hari ini?" },
      { time: 93.77, text: "Bila tidak, mirip kau jadilah bunga matahari" },
      { time: 103.85, text: "Yang tiba-tiba mekar di taman" },
      { time: 108.60, text: "Meski bicara dengan bahasa tumbuhan" },
      { time: 113.13, text: "'Kan kuceritakan padamu" },
      { time: 118.04, text: "Bagaimana hidupku tanpamu" },
      { time: 127.36, text: "Kangennya masih ada di setiap waktu" },
      { time: 132.19, text: "Kadang aku menangis bila aku perlu" },
      { time: 136.68, text: "Tapi aku sekarang sudah lebih lucu" },
      { time: 141.31, text: "Jadilah menyenangkan seperti katamu" },
      { time: 146.20, text: "Jalani hidup dengan penuh suka cita" },
      { time: 150.97, text: "Dan percaya kau ada di hatiku selamanya" },
      { time: 159.94, text: "Mungkinkah" },
      { time: 162.19, text: "Mungkinkah" },
      { time: 164.59, text: "Mungkinkah" },
      { time: 166.33, text: "Kau mampir hari ini?" },
      { time: 170.30, text: "Bila tidak, mirip kau jadilah bunga matahari" },
      { time: 180.56, text: "Mungkinkah" },
      { time: 182.99, text: "Mungkinkah" },
      { time: 185.28, text: "Mungkinkah" },
      { time: 187.19, text: "Kau mampir hari ini?" },
      { time: 191.65, text: "Bila tidak sekarang, janji kita pasti 'kan bertemu lagi" }
    ]
  },
  {
    id: "juicy-luicy-tampar",
    title: "Tampar",
    artist: "Juicy Luicy",
    album: "Tampar - Single",
    year: "2022",
    duration: 228,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/600x600bb.jpg",
    youtubeId: "DqJN5Pg3As4",
    plays: "260M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 12.0, text: "Hujan samarkan derasnya" },
      { time: 16.0, text: "Tutup air mata" }
    ]
  },
  {
    id: "bernadya-satu-bulan",
    title: "Satu Bulan",
    artist: "Bernadya",
    album: "Sialnya, Hidup Harus Tetap Berjalan",
    year: "2024",
    duration: 194,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg",
    collectionId: 1749876880,
    youtubeId: "z-XHpftdXEE",
    plays: "320M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Gitar Akustik)" },
      { time: 7.80, text: "Belum ada satu bulan" },
      { time: 12.91, text: "Ku yakin masih ada sisa wangiku di bajumu" },
      { time: 18.96, text: "Namun kau tampak baik saja" },
      { time: 23.04, text: "Bahkan senyummu lebih lepas" },
      { time: 25.77, text: "Sedang aku di sini hampir gila" },
      { time: 31.62, text: "Kita tak temukan jalan" },
      { time: 37.16, text: "Sepakat akhiri setelah beribu debat panjang" },
      { time: 43.46, text: "Namun kau tampak baik saja" },
      { time: 48.08, text: "Bahkan senyummu lebih lepas" },
      { time: 50.37, text: "Sedang aku di sini belum terima" },
      { time: 56.16, text: "Bohongkah tangismu sore itu di pelukku?" },
      { time: 62.08, text: "Nyatanya pergiku pun tak lagi mengganggumu" },
      { time: 67.17, text: "Apa sudah ada kabar lain yang kau tunggu?" },
      { time: 72.42, text: "Sudah adakah yang gantikanku?" },
      { time: 77.72, text: "Yang khawatirkanmu setiap waktu?" },
      { time: 83.76, text: "Yang cerita tentang apapun sampai hal-hal tak perlu?" },
      { time: 89.65, text: "Kalau bisa jangan buru-buru, kalau bisa jangan ada dulu" },
      { time: 103.98, text: "Baru lewat satu bulan" },
      { time: 116.06, text: "Kemarin ulang tahunku tak ada pesan darimu" },
      { time: 121.79, text: "Tak apa, mungkin kau lupa" },
      { time: 126.52, text: "Atau sudah ada hati yang harus kau jaga?" },
      { time: 132.48, text: "Sudah adakah yang gantikanku?" },
      { time: 137.23, text: "Yang kau antar jemput setiap Sabtu?" },
      { time: 142.68, text: "Yang selalu ingatkan untuk pakai sabuk pengamanmu?" },
      { time: 148.55, text: "Kalau bisa jangan buru-buru" },
      { time: 153.53, text: "Sudah adakah yang gantikanku?" },
      { time: 158.68, text: "Yang khawatirkanmu setiap waktu" },
      { time: 164.37, text: "Yang cerita tentang apapun sampai hal-hal tak perlu" },
      { time: 170.25, text: "Kalau bisa jangan buru-buru, kalau bisa jangan ada dulu" },
      { time: 189.97, text: "(Outro)" }
    ]
  },
  {
    id: "sal-priadi-dari-planet-lain",
    title: "Dari Planet Lain",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    year: "2024",
    duration: 290,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    youtubeId: "Xd-L2O4taPI",
    plays: "180M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 8.0, text: "Sepertinya kau memang dari planet yang lain" },
      { time: 15.0, text: "Dikirim ke bumi untuk orang-orang sepertiku" }
    ]
  },
  {
    id: "hindia-evaluasi",
    title: "Evaluasi",
    artist: "Hindia",
    album: "Menari Dengan Bayangan",
    year: "2019",
    duration: 204,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
    collectionId: 1481804269,
    youtubeId: "cWrSjCZ5AeE",
    plays: "310M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Music)" },
      { time: 12.0, text: "Yang tak bisa terobati" },
      { time: 15.5, text: "Biar mengering sendiri" },
      { time: 19.0, text: "Mengupayakan yang kau bisa" }
    ]
  },
  {
    id: "juicy-luicy-tampar",
    title: "Tampar",
    artist: "Juicy Luicy",
    album: "Tampar - Single",
    year: "2022",
    duration: 228,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/600x600bb.jpg",
    youtubeId: "qmgA_WejI8w",
    plays: "260M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 12.0, text: "Hujan samarkan derasnya" },
      { time: 16.0, text: "Tutup air mata" },
      { time: 20.0, text: "Temani kecewa yang sudah" },
      { time: 26.0, text: "Bukan urusanmu lagi" }
    ]
  },
  {
    id: "tulus-hati-hati-di-jalan",
    title: "Hati-Hati di Jalan",
    artist: "Tulus",
    album: "Manusia",
    year: "2022",
    duration: 242,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/600x600bb.jpg",
    youtubeId: "_N6vSc_mT6I",
    plays: "380M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 15.0, text: "Kukira kita akan bersama" },
      { time: 23.0, text: "Begitu banyak yang sama" },
      { time: 30.0, text: "Latarmu dan latarku" },
      { time: 38.0, text: "Kukira takkan ada kendala" }
    ]
  },
  {
    id: "mahalini-mati-matian",
    title: "Mati-Matian",
    artist: "Mahalini",
    album: "Mati-Matian - Single",
    year: "2024",
    duration: 247,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e6/91/eb/e691eb58-7ae3-cb1b-0a5f-839ad3a010e0/cover.jpg/600x600bb.jpg",
    youtubeId: "LAOxuo6pkdo",
    plays: "245M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Piano)" },
      { time: 12.0, text: "Kukira kita akan bersama selamanya" }
    ]
  },
  {
    id: "adrian-khalif-sialan",
    title: "Sialan (feat. Juicy Luicy)",
    artist: "Adrian Khalif, Juicy Luicy",
    album: "HARAP-HARAP EMAS",
    year: "2023",
    duration: 251,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/16/a8/18/16a81850-ca96-0927-a46d-0d9af767006c/196922358449_Cover.jpg/600x600bb.jpg",
    youtubeId: "_m6l5nKEGIA",
    plays: "280M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 10.0, text: "Dari seribu perempuan mengapa kau yang ku mau" }
    ]
  },
  {
    id: "dewa-19-kangen",
    title: "Kangen",
    artist: "Dewa 19",
    album: "19",
    year: "1992",
    duration: 334,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/39/59/b0/3959b0f9-d9f1-a458-44db-6d1dd2f60a05/190296432903.jpg/600x600bb.jpg",
    youtubeId: "m8cPU4tzGa4",
    plays: "310M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Acoustic Guitar)" },
      { time: 15.0, text: "Kutrima suratmu, tlah kubaca dan aku mengerti" },
      { time: 26.0, text: "Betapa merindunya dirimu akan hadirnya diriku" },
      { time: 38.0, text: "Didalam hari-harimu bersama lagi" },
      { time: 51.0, text: "Semua kata rindumu semakin membuatku tak berdaya" },
      { time: 63.0, text: "Menahan rasa ingin jumpa" },
      { time: 70.0, text: "Percayalah padaku akupun rindu kamu" },
      { time: 78.0, text: "Ku akan pulang melepas semua kerinduan yang terpendam" }
    ]
  },
  {
    id: "sheila-on-7-dan",
    title: "Dan...",
    artist: "Sheila On 7",
    album: "Sheila On 7",
    year: "1999",
    duration: 288,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/90/01/6d/mzi.ywjxtlbq.jpg/600x600bb.jpg",
    youtubeId: "IWvo2fld3s4",
    plays: "350M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Guitar)" },
      { time: 14.0, text: "Dan bila kau hadir bagai mawar yang merekah" }
    ]
  },
  {
    id: "denny-caknan-sigar",
    title: "Sigar",
    artist: "Denny Caknan",
    album: "Sigar - Single",
    year: "2024",
    duration: 275,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/68/33/7a/68337ac5-981a-de0d-8999-a3505f05642f/cover.jpg/600x600bb.jpg",
    youtubeId: "s525A0Bc3z4",
    plays: "190M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Kendang)" },
      { time: 15.0, text: "Meletop ati iki krungu kabarmu" }
    ]
  },
  {
    id: "rio-clappy-bunga-abadi",
    title: "Bunga Abadi",
    artist: "Rio Clappy",
    album: "Bunga Abadi - Single",
    year: "2024",
    duration: 212,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    youtubeId: "fPMB2H450iI",
    plays: "140M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Acoustic)" },
      { time: 14.0, text: "Bila ku bukan yang kau inginkan" }
    ]
  }
];

// Curated Popular Index for Instant Client-Side Fuzzy & Typo Matching (Like Spotify!)
const POPULAR_SEARCH_CATALOG = [
  {
    title: "Gala Bunga Matahari",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 210,
    youtubeId: "kv2WIY8RLQQ",
    tags: ["bunga", "matahari", "gala", "matahri", "sal", "priadi", "markers"]
  },
  {
    title: "Dari Planet Lain",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 290,
    youtubeId: "Xd-L2O4taPI",
    tags: ["dari", "planet", "lain", "sepertinya", "kau", "memang", "sal", "priadi"]
  },
  {
    title: "Mesra-mesraannya kecil-kecilan dulu",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 212,
    youtubeId: "mOlx9vm39Pg",
    tags: ["mesra", "kecil", "kecilan", "sal", "priadi"]
  },
  {
    title: "Satu Bulan",
    artist: "Bernadya",
    album: "Sialnya, Hidup Harus Tetap Berjalan",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg",
    duration: 194,
    youtubeId: "z-XHpftdXEE",
    tags: ["satu", "bulan", "berna", "bernadya", "sialnya", "hidup"]
  },
  {
    title: "Berdansalah, Karir Ini Tak Ada Artinya",
    artist: "Hindia",
    album: "Menari Dengan Bayangan",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
    duration: 224,
    youtubeId: "sx2m0ryInTk",
    tags: ["berdansa", "berdansalah", "karir", "tak", "ada", "artinya", "hindia", "baskara"]
  },
  {
    title: "Untungnya, Hidup Harus Tetap Berjalan",
    artist: "Bernadya",
    album: "Sialnya, Hidup Harus Tetap Berjalan",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg",
    duration: 178,
    youtubeId: "eUx-BHUhGLA",
    tags: ["untung", "untungnya", "bernadya", "berna"]
  },
  {
    title: "Evaluasi",
    artist: "Hindia",
    album: "Menari Dengan Bayangan",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
    duration: 204,
    youtubeId: "saXhrw-7rQI",
    tags: ["eval", "evaluasi", "hindia", "baskara", "menari"]
  },
  {
    title: "Tampar",
    artist: "Juicy Luicy",
    album: "Tampar - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/600x600bb.jpg",
    duration: 228,
    youtubeId: "qmgA_WejI8w",
    tags: ["tampar", "juicy", "luicy", "jusy"]
  },
  {
    title: "Sialan (feat. Juicy Luicy)",
    artist: "Adrian Khalif, Juicy Luicy",
    album: "HARAP-HARAP EMAS",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/16/a8/18/16a81850-ca96-0927-a46d-0d9af767006c/196922358449_Cover.jpg/600x600bb.jpg",
    duration: 251,
    youtubeId: "_m6l5nKEGIA",
    tags: ["sialan", "adrian", "khalif", "juicy", "luicy"]
  },
  {
    title: "Mati-Matian",
    artist: "Mahalini",
    album: "Mati-Matian - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e6/91/eb/e691eb58-7ae3-cb1b-0a5f-839ad3a010e0/cover.jpg/600x600bb.jpg",
    duration: 247,
    youtubeId: "LAOxuo6pkdo",
    tags: ["mati", "matian", "mati-matian", "mahalini", "lini"]
  },
  {
    title: "Hati-Hati di Jalan",
    artist: "Tulus",
    album: "Manusia",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/600x600bb.jpg",
    duration: 242,
    youtubeId: "_N6vSc_mT6I",
    tags: ["hati", "jalan", "hati-hati", "tulus", "manusia"]
  },
  {
    title: "Rayuan Perempuan Gila",
    artist: "Nadin Amizah",
    album: "Untuk Dunia, Cinta, dan Kotornya",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8d/6f/fa/8d6ffae9-5a5f-75bd-d626-756a539e1b78/cover.jpg/600x600bb.jpg",
    duration: 320,
    youtubeId: "Kk02q89_3Y0",
    tags: ["rayuan", "perempuan", "gila", "nadin", "amizah"]
  },
  {
    title: "Sigar",
    artist: "Denny Caknan",
    album: "Sigar - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/68/33/7a/68337ac5-981a-de0d-8999-a3505f05642f/cover.jpg/600x600bb.jpg",
    duration: 275,
    youtubeId: "s525A0Bc3z4",
    tags: ["sigar", "denny", "caknan", "koplo"]
  },
  {
    title: "Dan...",
    artist: "Sheila On 7",
    album: "Sheila On 7",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/90/01/6d/mzi.ywjxtlbq.jpg/600x600bb.jpg",
    duration: 288,
    youtubeId: "IWvo2fld3s4",
    tags: ["dan", "sheila", "so7", "duta"]
  },
  {
    title: "Kangen",
    artist: "Dewa 19",
    album: "19",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/39/59/b0/3959b0f9-d9f1-a458-44db-6d1dd2f60a05/190296432903.jpg/600x600bb.jpg",
    duration: 334,
    youtubeId: "m8cPU4tzGa4",
    tags: ["kangen", "dewa", "dhani", "ari lasso"]
  },
  {
    title: "Cincin",
    artist: "Hindia",
    album: "Lagipula Hidup Akan Berakhir",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7f/5f/99/7f5f99c7-1ddd-93cb-9b79-7efec9d6dd53/cover.jpg/600x600bb.jpg",
    duration: 279,
    youtubeId: "S0Kez6MERGE",
    tags: ["cincin", "hindia"]
  },
  {
    title: "Bunga Abadi",
    artist: "Rio Clappy",
    album: "Bunga Abadi - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 212,
    youtubeId: "fPMB2H450iI",
    tags: ["bunga", "abadi", "rio", "clappy"]
  },
  {
    title: "Die With A Smile",
    artist: "Lady Gaga, Bruno Mars",
    album: "Die With A Smile - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 251,
    youtubeId: "kPa7bsKwL-c",
    tags: ["die", "smile", "bruno", "mars", "lady", "gaga"]
  },
  {
    title: "Helena",
    artist: "My Chemical Romance",
    album: "Three Cheers for Sweet Revenge",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/42/58/f7/4258f7bb-eb5b-62b8-573d-6200df0fe3e1/093624917731.jpg/600x600bb.jpg",
    duration: 206,
    youtubeId: "7SM5laxokpg",
    tags: ["helena", "my", "chemical", "romance", "mcr", "three", "cheers"]
  },
  {
    title: "Welcome to the Black Parade",
    artist: "My Chemical Romance",
    album: "The Black Parade",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7e/ac/69/7eac6998-7fa4-f1ab-9601-e8b791c736fa/mzi.fbpszunc.jpg/600x600bb.jpg",
    duration: 311,
    youtubeId: "G-I9csAflBs",
    tags: ["welcome", "black", "parade", "mcr", "my", "chemical", "romance"]
  },
  {
    title: "Baby (feat. Ludacris)",
    artist: "Justin Bieber",
    album: "My World 2.0",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg",
    duration: 214,
    youtubeId: "TpddIBTiDUc",
    tags: ["baby", "justin", "bieber", "ludacris", "pop"]
  },
  {
    title: "Ghost",
    artist: "Justin Bieber",
    album: "Justice",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg",
    duration: 153,
    youtubeId: "Fp8msa5uYsc",
    tags: ["ghost", "justin", "bieber", "justice"]
  },
  {
    title: "Birds of a Feather",
    artist: "Billie Eilish",
    album: "HIT ME HARD AND SOFT",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg",
    duration: 196,
    youtubeId: "V9PVRfjEBTI",
    tags: ["birds", "feather", "billie", "eilish", "hit", "hard", "soft"]
  },
  {
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0c/82/48/0c8248a8-4a5b-d30d-8056-f32d650d2fc9/190295978068.jpg/600x600bb.jpg",
    duration: 269,
    youtubeId: "mRP72Ib2e9I",
    tags: ["yellow", "coldplay", "parachutes", "look", "at", "the", "stars"]
  },
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b0/ca/05/b0ca05aa-29c9-4e01-5a16-f6fa06bce05c/602527594347.jpg/600x600bb.jpg",
    duration: 354,
    youtubeId: "xG16sdjLtc0",
    tags: ["bohemian", "rhapsody", "queen", "freddie", "mercury", "mama"]
  },
  {
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/91/9d/c6/919dc6db-73f5-48ab-5e68-1d746c3d3042/4550795884898_cover.png/600x600bb.jpg",
    duration: 258,
    youtubeId: "FVdjZYfDuLE",
    tags: ["wonderwall", "oasis", "liam", "gallagher", "today", "is", "gonna"]
  },
  {
    title: "seasons",
    artist: "wave to earth",
    album: "0.1 flaws and all.",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/c5/61/fac561dc-8db4-b2e9-d3db-6e246da72bfa/5054197890017.jpg/600x600bb.jpg",
    duration: 256,
    youtubeId: "CnVVjLOGVoY",
    tags: ["seasons", "wave", "to", "earth", "korean", "indie", "flaws"]
  }
];

// Custom Brnsic Loader Component with user-provided white minimalist logo
const BrnsicLoader: React.FC<{ size?: "sm" | "md" | "lg"; text?: string; className?: string }> = ({
  size = "md",
  text = "Memuat audio...",
  className = ""
}) => {
  const logoSize = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-14 h-14";
  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Soft neon glow */}
        <div className="absolute inset-0 rounded-full bg-[#1ed760]/20 blur-xl animate-pulse"></div>
        {/* Spinning indicator ring */}
        <div className="absolute -inset-2.5 rounded-full border border-white/15 border-t-[#1ed760] animate-spin"></div>
        {/* Brnsic white minimalist logo provided by user */}
        <img
          src="/brnsic-loader-logo.png"
          alt="Brnsic Loader"
          className={`${logoSize} object-contain relative z-10 animate-pulse drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]`}
        />
      </div>
      {/* Equalizer bars */}
      <div className="flex items-end gap-1 h-3 z-10 mt-1">
        <span className="w-1 bg-[#1ed760] bar-1 rounded-full"></span>
        <span className="w-1 bg-white bar-2 rounded-full"></span>
        <span className="w-1 bg-[#1ed760] bar-3 rounded-full"></span>
        <span className="w-1 bg-white bar-2 rounded-full"></span>
      </div>
      {text && (
        <span className="text-[11px] font-bold text-white/80 tracking-wide z-10 text-center">{text}</span>
      )}
    </div>
  );
};

// Helper: Taste Profiler Archetype Derivation
const derivePersona = (artistWeights: Record<string, number>, genres?: string[]): string => {
  if (genres && genres.length > 0) {
    const gText = genres.slice(0, 2).join(" & ");
    const sorted = Object.entries(artistWeights).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return `Pencinta ${gText} • Favorit: ${sorted[0][0]}`;
    }
    return `Pencinta ${gText}`;
  }
  const sorted = Object.entries(artistWeights).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "Penikmat Musik Populer";
  const top = sorted[0][0].toLowerCase();
  if (top.includes("sal priadi") || top.includes("hindia") || top.includes("nadin")) {
    return "Penikmat Indie Pop & Puisi Senja";
  }
  if (top.includes("bernadya") || top.includes("mahalini") || top.includes("juicy")) {
    return "Spesialis Pop Galau & Kisah Cinta";
  }
  if (top.includes("denny") || top.includes("caknan") || top.includes("koplo")) {
    return "Pecinta Dangdut Koplo Modern";
  }
  if (top.includes("sheila") || top.includes("dewa") || top.includes("andra")) {
    return "Pecinta Rock Pop Nostalgia & Legend";
  }
  if (top.includes("bruno") || top.includes("billie") || top.includes("gaga")) {
    return "Pencinta Hits Global & Pop Soul";
  }
  return `Penggemar ${sorted[0][0]}`;
};

// Stable default taste profile: Starts completely clean and neutral
const DEFAULT_INITIAL_TASTE: TasteProfile = {
  userSeed: "brnsic-user-default",
  persona: "Penjelajah Musik",
  artistWeights: {},
  genreWeights: {},
  selectedGenres: [],
  playCounts: {},
  likedArtists: [],
  totalPlays: 0
};

// Initial Cold-Start Taste Profile: Clean fresh slate (learns only from real plays)
const generateInitialTaste = (): TasteProfile => {
  return {
    userSeed: `brnsic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    persona: "Penjelajah Musik",
    artistWeights: {},
    genreWeights: {},
    playCounts: {},
    likedArtists: [],
    totalPlays: 0
  };
};

// Curated Genres
const GENRES = [
  { name: "Top 50 Indonesia", color: "bg-[#bc5900]" },
  { name: "Paling Sering Diputar", color: "bg-[#006450]" },
  { name: "Viral Indonesia", color: "bg-[#e8115b]" },
  { name: "Top Global 50", color: "bg-[#1e3264]" },
  { name: "Pop Indonesia", color: "bg-[#148a08]" },
  { name: "Indie Lokal", color: "bg-[#608108]" },
  { name: "Dangdut & Koplo", color: "bg-[#8d67ab]" },
  { name: "Hip-Hop / Rap", color: "bg-[#ba5d07]" },
  { name: "Rock & Alternatif", color: "bg-[#e91429]" },
  { name: "K-Pop Worldwide", color: "bg-[#dc148c]" },
  { name: "Akustik Santai", color: "bg-[#477d95]" },
  { name: "Nostalgia 2000-an", color: "bg-[#503750]" }
];

// Cold-Start Onboarding Candidates for New & Existing Users (63 Top Global & Indonesian Artists with 100% Verified HD Covers)
const ONBOARDING_ARTISTS = [
  {
    name: "Sal Priadi",
    sub: "Indie Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Bernadya",
    sub: "Pop Galau",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d8/bb/8c/d8bb8c81-ddb9-e427-a18b-c385afae12c2/23UMGIM65225.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Hindia",
    sub: "Indie Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/f8/d2/57f8d295-5ea9-f7b2-70ff-9494ce50fc5c/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Justin Bieber",
    sub: "Global Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Bruno Mars",
    sub: "Global Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg"
  },
  {
    name: "Taylor Swift",
    sub: "Global Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Billie Eilish",
    sub: "Alt Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "The Weeknd",
    sub: "R&B / Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/db/28/e7/db28e7c3-f53a-76c8-eaa4-d92a22e4f160/23UMGIM72115.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Coldplay",
    sub: "Alt Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0c/82/48/0c8248a8-4a5b-d30d-8056-f32d650d2fc9/190295978068.jpg/600x600bb.jpg"
  },
  {
    name: "Ed Sheeran",
    sub: "Pop Acoustic",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f0/bc/a9/f0bca9a9-47bc-ec59-0f28-361b7ef5bfde/12UMDIM01011.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Ariana Grande",
    sub: "Pop R&B",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d6/21/2d/d6212d80-242c-3ddb-8b66-a722b3937b79/26UM1IM38195.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Olivia Rodrigo",
    sub: "Pop Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/1b/f9/1d1bf9b1-44c6-9a6c-6ffb-c158488c06ce/26UMGIM39303.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Sabrina Carpenter",
    sub: "Pop Dance",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ae/c6/58/aec6589c-f5cf-0d81-2727-bc8775e34049/25UMGIM76990.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Dua Lipa",
    sub: "Pop Dance",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/82/89/15/828915ea-d716-61c4-3de7-ef00c1f800fb/5054197853630.jpg/600x600bb.jpg"
  },
  {
    name: "NIKI",
    sub: "R&B / Soul",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6e/ff/43/6eff434b-8a53-3704-41d9-9cf34cb57f41/190296083709.jpg/600x600bb.jpg"
  },
  {
    name: "BTS",
    sub: "K-Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ce/fb/eb/cefbebd4-d53b-8d6c-33cf-2ee55408bd79/8804775077494_Cover.jpg/600x600bb.jpg"
  },
  {
    name: "BLACKPINK",
    sub: "K-Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/5e/74/ee5e747e-52e5-458c-e850-0ed3d703b184/8809519880736.jpg/600x600bb.jpg"
  },
  {
    name: "NewJeans",
    sub: "K-Pop / R&B",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ab/ce/d6/abced6f6-2b90-c230-eb4b-e146734a3a22/196922907821_Cover.jpg/600x600bb.jpg"
  },
  {
    name: "Post Malone",
    sub: "Hip-Hop / Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cd/78/35/cd783589-6ab9-8d51-d99e-308bee672e6f/26UM1IM40196.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Maroon 5",
    sub: "Pop Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/d3/b1/f9/d3b1f91c-f2c0-7cc8-97fb-035db64b0ab2/12UMGIM26179.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Harry Styles",
    sub: "Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/41/6a/07416a78-38b9-2d47-7ce8-8a52a44c510f/196874010112.jpg/600x600bb.jpg"
  },
  {
    name: "Eminem",
    sub: "Hip-Hop/Rap",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/27/79/d5/2779d529-ff10-c15d-1c50-08cd46dd1237/06UMGIM17625.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Drake",
    sub: "Hip-Hop / R&B",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/6d/8f/bb6d8f67-6d04-10b5-dd62-eb5809ac54fc/00602567879152.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Kendrick Lamar",
    sub: "Hip-Hop / Rap",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/c2/cc/50c2cc95-3658-9417-0d4b-831abde44ba1/24UM1IM28978.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Rex Orange County",
    sub: "Indie Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c0/80/be/c080be0b-c579-4dba-27a1-8ac82768e1f2/885288429602.jpg/600x600bb.jpg"
  },
  {
    name: "wave to earth",
    sub: "Indie Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/c5/61/fac561dc-8db4-b2e9-d3db-6e246da72bfa/5054197890017.jpg/600x600bb.jpg"
  },
  {
    name: "SZA",
    sub: "R&B / Soul",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/600x600bb.jpg"
  },
  {
    name: "Avicii",
    sub: "EDM / Dance",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/35/4d/a0/354da058-972b-dcf9-feec-609895ba8cb2/14UMGIM56567.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Alan Walker",
    sub: "EDM / Dance",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/95/14/0d/95140deb-c17e-c44d-b4dc-7fbabf47bee8/8721639532428.png/600x600bb.jpg"
  },
  {
    name: "Queen",
    sub: "Classic Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b0/ca/05/b0ca05aa-29c9-4e01-5a16-f6fa06bce05c/602527594347.jpg/600x600bb.jpg"
  },
  {
    name: "Oasis",
    sub: "Britpop Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/91/9d/c6/919dc6db-73f5-48ab-5e68-1d746c3d3042/4550795884898_cover.png/600x600bb.jpg"
  },
  {
    name: "Nadin Amizah",
    sub: "Folk Akustik",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1d/10/9b/1d109b17-1bbf-1894-e774-4d9ad6baa7b3/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Sheila On 7",
    sub: "Pop Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music/ce/e0/61/mzi.jgqtztab.jpg/600x600bb.jpg"
  },
  {
    name: "Dewa 19",
    sub: "Rock Legend",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Features/v4/64/35/40/643540a2-a05e-3e86-d9ee-da970c76cf8e/V4HttpAssetRepositoryClient-ticket.fxqmvnbz.jpg-3996104797570655989.jpg/600x600bb.jpg"
  },
  {
    name: "Juicy Luicy",
    sub: "Pop Acoustic",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/26/0c/be/260cbe21-9d2d-a2ab-3391-f8fde6ad6840/198704005169_Cover.jpg/600x600bb.jpg"
  },
  {
    name: "Mahalini",
    sub: "Pop Ballad",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/dd/66/bbdd66d0-f0f4-bad8-b15b-ef0b8754da5b/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Tulus",
    sub: "Pop Soul",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/12/3e/bb123e64-7747-78f3-ce81-8b04bfe30e73/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Tiara Andini",
    sub: "Pop Indonesia",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/3e/83/b23e83c3-2abf-28ec-3d04-f51d96ae5284/21UM1IM53102.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Lyodra",
    sub: "Pop Ballad",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5f/4f/68/5f4f6824-86e0-0efa-a2c9-9fbd104b0470/21UMGIM62551.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Denny Caknan",
    sub: "Dangdut Koplo",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/f3/47/f5f3479e-06f4-27cd-4784-15b762104f9d/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Guyon Waton",
    sub: "Koplo Jawa",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/fb/0f/9e/fb0f9e09-0a2b-6d5b-0c70-063c3e2fe1e8/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Happy Asmara",
    sub: "Dangdut Koplo",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ff/12/95/ff129584-32d7-9e77-00a4-f3d3cf5a96e4/cover.jpg/600x600bb.jpg"
  },
  {
    name: "NDX A.K.A.",
    sub: "Hip Hop Dangdut",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4a/98/eb/4a98eba2-bbfd-b4ca-7afc-1ac7e3534e2a/5566.jpg/600x600bb.jpg"
  },
  {
    name: "For Revenge",
    sub: "Modern Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/0f/eb/700feb8e-04ab-9302-8f10-47df720e9121/196872239584.jpg/600x600bb.jpg"
  },
  {
    name: "Feast",
    sub: "Indie Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/95/66/07956604-57ed-5a20-3c98-536c847f8ac2/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Pamungkas",
    sub: "Indie Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/70/60/77/70607770-6c49-ed4f-9827-503eee681c58/8721465617283.png/600x600bb.jpg"
  },
  {
    name: "Fourtwnty",
    sub: "Indie Folk",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/12/67/6a/12676ab7-6d68-0dac-a3ee-aee732198f53/859761675336_cover.jpg/600x600bb.jpg"
  },
  {
    name: "Rio Clappy",
    sub: "Indie Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bd/88/3d/bd883d83-fa7c-ada2-c750-8e2014c225a9/5654.jpg/600x600bb.jpg"
  },
  {
    name: "Nadhif Basalamah",
    sub: "Pop Soul",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9c/56/76/9c567682-493a-1063-d424-14232fea7828/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Raisa",
    sub: "Pop R&B",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/c5/de/e3c5dec9-330c-22d0-6671-42bed632f5b2/25UMGIM58920.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Kunto Aji",
    sub: "Indie Folk",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/c1/32/07/c13207c5-316a-a5e3-863a-29d4b70419aa/20UMGIM30613.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Yura Yunita",
    sub: "Pop Soul",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/36/da/2f/36da2fee-3e4c-fbc9-aa92-4db1216b907f/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Adrian Khalif",
    sub: "R&B Indonesia",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/16/a8/18/16a81850-ca96-0927-a46d-0d9af767006c/196922358449_Cover.jpg/600x600bb.jpg"
  },
  {
    name: "Fabio Asher",
    sub: "Pop Ballad",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a5/04/00/a504005b-61ad-0d6d-9109-2764eeceb549/5447.jpg/600x600bb.jpg"
  },
  {
    name: "Ziva Magnolya",
    sub: "Pop Indonesia",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/aa/03/6b/aa036b46-c982-325e-4c4e-6dabef961760/23UMGIM61528.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Rizky Febian",
    sub: "Pop R&B",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b8/88/0d/b8880d04-e5a6-acc3-25d0-424d6ae806f4/198704756115_Cover.jpg/600x600bb.jpg"
  },
  {
    name: "Keisya Levronka",
    sub: "Pop Ballad",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/a3/cf/50a3cf82-3048-9758-cae6-c91fc6104bd0/26UMGIM31653.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Anggi Marito",
    sub: "Pop Ballad",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/59/b4/b8/59b4b872-6c07-242b-4a46-dffd4aa22f77/22UM1IM34409.rgb.jpg/600x600bb.jpg"
  },
  {
    name: "Idgitaf",
    sub: "Indie Pop",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/78/d2/b3/78d2b35f-8a06-9449-4d95-9416e16b206f/cover.jpg/600x600bb.jpg"
  },
  {
    name: "Barasuara",
    sub: "Indie Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/32/e0/62/32e06291-5849-ee28-bdfa-4fcbe8c76730/859776425711_cover.jpg/600x600bb.jpg"
  },
  {
    name: "Padi",
    sub: "Rock Indonesia",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music/f9/5d/f9/mzi.cqsqbhcm.jpg/600x600bb.jpg"
  },
  {
    name: "Noah",
    sub: "Pop Rock",
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3f/0b/52/3f0b5222-7709-df06-aa80-83bbf7225779/24UMGIM29039.rgb.jpg/600x600bb.jpg"
  }
];

const ONBOARDING_GENRES = [
  "Pop Indonesia",
  "Indie Senja",
  "Dangdut Koplo",
  "Pop Galau",
  "Rock Nostalgia",
  "Hits Global",
  "Akustik Santai",
  "Viral TikTok"
];

// Quick lookup for verified official YouTube video IDs (Strict & Safe matching)
const getVerifiedVideoId = (title: string, artist: string): string | undefined => {
  const normT = (title || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const normA = (artist || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Exact title & artist match
  for (const item of POPULAR_SEARCH_CATALOG) {
    const itemT = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const itemA = item.artist.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (itemT === normT && (normA.includes(itemA) || itemA.includes(normA))) {
      return item.youtubeId;
    }
  }

  // 2. Exact title match (only if title has >= 4 characters to avoid matching short words like "Dan")
  for (const item of POPULAR_SEARCH_CATALOG) {
    const itemT = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (itemT === normT && itemT.length >= 4) {
      return item.youtubeId;
    }
  }

  return undefined;
};

// Helper to normalize any song object (iTunes, YouTube, custom playlist) into strict Track
const normalizeSong = (raw: any): Track => {
  if (!raw) return DEFAULT_CATALOG[0];
  const title = (raw.title || raw.trackName || raw.name || "Lagu Musik").toString().trim();
  const artist = (raw.artist || raw.artistName || "Brnsic Artist").toString().trim();
  const cover =
    raw.cover ||
    raw.albumCover ||
    raw.albumImg ||
    raw.artworkUrl100 ||
    raw.artworkUrl60 ||
    raw.image ||
    raw.canvasImg ||
    FALLBACK_COVER;
  const album = (raw.album || raw.collectionName || "Single").toString().trim();
  const duration =
    typeof raw.duration === "number" && raw.duration > 0
      ? raw.duration
      : typeof raw.trackTimeMillis === "number" && raw.trackTimeMillis > 0
      ? Math.round(raw.trackTimeMillis / 1000)
      : 210;
  const id = (raw.id || raw.trackId || `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`).toString();
  const youtubeId = raw.youtubeId || getVerifiedVideoId(title, artist);
  const plays = raw.plays;
  const collectionId = raw.collectionId;
  const lyrics = Array.isArray(raw.lyrics) && raw.lyrics.length > 0 ? raw.lyrics : [
    { time: 0, text: title },
    { time: 4, text: artist },
    { time: 8, text: "Menyiapkan lirik sinkron & streaming audio..." }
  ];

  return {
    id,
    title,
    artist,
    album,
    duration,
    cover,
    canvasImg: cover,
    youtubeId,
    plays,
    collectionId,
    lyrics,
    isSmartRecommendation: Boolean(raw.isSmartRecommendation)
  };
};

// Mersenne Twister (MT19937) PRNG implementation - the exact RNG algorithm used by Spotify
class MersenneTwister {
  private mt = new Uint32Array(624);
  private mti = 625;

  constructor(seed: number = Date.now()) {
    this.init(seed);
  }

  init(seed: number) {
    this.mt[0] = seed >>> 0;
    for (this.mti = 1; this.mti < 624; this.mti++) {
      const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] =
        (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
          (s & 0x0000ffff) * 1812433253 +
          this.mti) >>>
        0;
    }
  }

  random(): number {
    let y: number;
    const mag01 = [0x0, 0x9908b0df];
    if (this.mti >= 624) {
      let kk: number;
      for (kk = 0; kk < 624 - 397; kk++) {
        y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
        this.mt[kk] = this.mt[kk + 397] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < 623; kk++) {
        y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
        this.mt[kk] = this.mt[kk + (397 - 624)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[623] & 0x80000000) | (this.mt[0] & 0x7fffffff);
      this.mt[623] = this.mt[396] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.mti = 0;
    }
    y = this.mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return (y >>> 0) / 4294967296;
  }
}

// Spotify-grade Balanced Dispersion Shuffle with "Fewer Repeats" (Mersenne Twister Engine)
// 1. Keeps songs within the playlist's relevant genre (Standard Shuffle)
// 2. Spaces out artists to prevent clumping (Balanced Dispersion)
// 3. Evaluates multiple candidate orders and picks the one minimizing repeats of recently played songs (Fewer Repeats)
const balancedShuffle = (tracks: any[], playedTitles: Set<string>): any[] => {
  if (tracks.length <= 2) {
    return [...tracks].sort(() => Math.random() - 0.5);
  }

  const rng = new MersenneTwister(Date.now() + Math.floor(Math.random() * 10000));

  let bestCandidate: any[] = [];
  let lowestPenalty = Infinity;

  const candidateCount = Math.min(8, Math.max(3, tracks.length));

  for (let c = 0; c < candidateCount; c++) {
    // 1. Group tracks by artist to prevent artist clumping
    const artistBuckets: Record<string, any[]> = {};
    for (const track of tracks) {
      const artist = (track.artist || track.artistName || "Artist").toLowerCase().trim();
      if (!artistBuckets[artist]) artistBuckets[artist] = [];
      artistBuckets[artist].push(track);
    }

    // 2. Distribute each artist's songs across [0, 1) with Mersenne Twister dither jitter
    const weighted: Array<{ track: any; sortKey: number }> = [];
    for (const bucket of Object.values(artistBuckets)) {
      const len = bucket.length;
      const shuffledBucket = [...bucket].sort(() => rng.random() - 0.5);
      shuffledBucket.forEach((track, i) => {
        const baseRatio = (i + rng.random() * 0.45) / len;
        weighted.push({ track, sortKey: baseRatio });
      });
    }

    weighted.sort((a, b) => a.sortKey - b.sortKey);
    const candidate = weighted.map((w) => w.track);

    // 3. Score permutation penalty: "Fewer Repeats"
    let penalty = 0;
    const earlyCutoff = Math.ceil(candidate.length * 0.4);
    for (let i = 0; i < earlyCutoff; i++) {
      const cleanTitle = (candidate[i].title || candidate[i].trackName || "").toLowerCase().trim();
      if (playedTitles.has(cleanTitle)) {
        penalty += (earlyCutoff - i) * 3;
      }
    }

    // Penalize adjacent songs by the exact same artist
    for (let i = 1; i < candidate.length; i++) {
      const prevArtist = (candidate[i - 1].artist || candidate[i - 1].artistName || "").toLowerCase().trim();
      const currArtist = (candidate[i].artist || candidate[i].artistName || "").toLowerCase().trim();
      if (prevArtist && prevArtist === currArtist) {
        penalty += 5;
      }
    }

    if (penalty < lowestPenalty) {
      lowestPenalty = penalty;
      bestCandidate = candidate;
    }
  }

  return bestCandidate.length > 0 ? bestCandidate : tracks;
};

// Spotify-grade Hybrid Smart Recommendation Candidate Finder
// Spotify Deep Learning Latent Factor & Multi-Armed Bandit Smart Shuffle Engine
const getSmartShuffleCandidates = (
  currentSeed: any,
  existingQueue: any[],
  playedTitles: Set<string>,
  taste: TasteProfile,
  catalogs: { related: any[]; topIndo: any[]; mostPlayed: any[]; globalTrending: any[] },
  countNeeded: number,
  dislikedTitles: string[] = [],
  userVector?: FeatureVector
): any[] => {
  const existingSet = new Set(
    existingQueue.map((s) => ((s.title || s.trackName || "") as string).toLowerCase().trim())
  );

  // If we have related tracks for the current musical circle, prioritize them to stay in the groove!
  const rawPool = catalogs.related.length >= 4
    ? [...catalogs.related]
    : [
        ...catalogs.related,
        ...catalogs.topIndo,
        ...catalogs.mostPlayed,
        ...catalogs.globalTrending
      ];

  const activeVector =
    userVector ||
    buildUserTasteVector(taste.likedArtists || [], taste.selectedGenres || []);

  const cooldownList = Array.from(playedTitles);
  const candidates = rawPool.filter((t) => {
    const cleanT = ((t.title || t.trackName || "") as string).toLowerCase().trim();
    return cleanT && !existingSet.has(cleanT);
  });

  const ranked = rankTracksByDeepLearning(
    activeVector,
    candidates,
    cooldownList,
    dislikedTitles,
    countNeeded
  );

  return ranked.map((t) => ({
    ...normalizeSong(t),
    isSmartRecommendation: true
  }));
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function BrnsicMusicPage() {
  // 1. Splash Screen State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // 2. Playback State - Restores from cache or starts fresh
  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("brnsic_cached_track");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.title) {
            if (!parsed.youtubeId) {
              const matched = getVerifiedVideoId(parsed.title, parsed.artist);
              if (matched) parsed.youtubeId = matched;
            }
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_CATALOG[0];
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const currentTimeRef = useRef<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // 3. Repeat & Loop Mode: "off" (default - never repeat!), "all" (repeat list), "one" (repeat single track)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [isAlbumLoopMode, setIsAlbumLoopMode] = useState<boolean>(false);

  // 4. Dedicated Queue Engine (Solves endless repeating loop!)
  const [activeQueue, setActiveQueue] = useState<any[]>(DEFAULT_CATALOG);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [relatedQueue, setRelatedQueue] = useState<any[]>([]);
  const [activeAlbumTracks, setActiveAlbumTracks] = useState<any[]>([]);
  const [albumData, setAlbumData] = useState<any | null>(null);

  // 5. Liked & Disliked Songs (Independent state stored in localStorage)
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [dislikedSongIds, setDislikedSongIds] = useState<string[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [hasUserStartedPlayback, setHasUserStartedPlayback] = useState<boolean>(false);
  const [onboardingSearch, setOnboardingSearch] = useState<string>("");
  const recentHistoryRef = useRef<string[]>([]);

  // 6. User Custom Playlists
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [activeCustomPlaylist, setActiveCustomPlaylist] = useState<UserPlaylist | null>(null);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<any | null>(null);
  const [songActionMenu, setSongActionMenu] = useState<{ song: any; playlistId?: string } | null>(null);
  const [topArtistShelfTracks, setTopArtistShelfTracks] = useState<any[]>([]);
  const [searchCorrectedQuery, setSearchCorrectedQuery] = useState<string | null>(null);

  // 7. Charts & Navigation State
  const [indonesiaTop50, setIndonesiaTop50] = useState<TrendingSong[]>([]);
  const [mostPlayedIndonesia, setMostPlayedIndonesia] = useState<TrendingSong[]>([]);
  const [viralIndonesia, setViralIndonesia] = useState<TrendingSong[]>([]);
  const [globalTrending, setGlobalTrending] = useState<TrendingSong[]>([]);
  const [popularArtists, setPopularArtists] = useState<TrendingArtist[]>([]);
  const [lastChartUpdated, setLastChartUpdated] = useState<string>("Baru saja");

  const [currentView, setCurrentView] = useState<
    | "home"
    | "search"
    | "now-playing"
    | "top50-indo"
    | "most-played-indo"
    | "viral-indo"
    | "top50-global"
    | "bruno-radio"
    | "album"
    | "custom-playlist"
    | "queue"
    | "liked"
    | "disliked"
    | "playlists"
  >("home");
  const [homeFilter, setHomeFilter] = useState<"all" | "top-indo" | "most-played" | "viral" | "global">("all");
  const [selectedMood, setSelectedMood] = useState<
    "all" | "energetic" | "cheerful" | "chill" | "nostalgia" | "focus" | "melancholy"
  >("all");

  // 8. Mobile & Fullscreen State
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"queue" | "now-playing" | "lyrics">("now-playing");
  const [mobileNavTab, setMobileNavTab] = useState<"home" | "search" | "library" | "liked">("home");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomMode, setZoomMode] = useState<"both" | "lyrics-only" | "video-only">("both");

  // 9. Instant Live Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTopResult, setSearchTopResult] = useState<any | null>(null);
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchAlbums, setSearchAlbums] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchFilterTab, setSearchFilterTab] = useState<"all" | "songs" | "artists" | "albums">("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userIsScrollingLyrics, setUserIsScrollingLyrics] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // 10. Queue Drag & Reorder State
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [dragOverQueueIndex, setDragOverQueueIndex] = useState<number | null>(null);
  const [queueTab, setQueueTab] = useState<"queue" | "history">("queue");

  // 11. Android Native APK Detection (strictly hides download button only inside native APK)
  const [isInsideNativeApk, setIsInsideNativeApk] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installStatus, setInstallStatus] = useState<string>("Menyiapkan pengunduhan...");
  const [isInstallReady, setIsInstallReady] = useState<boolean>(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const [isDynamicIslandEnabled, setIsDynamicIslandEnabled] = useState<boolean>(true);
  const [islandPosition, setIslandPosition] = useState<"center" | "left" | "right">("center");

  // 12. Update Popup State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    title: string;
    notes: string;
    apkSize?: string;
    minVersionCode?: number;
    forceUpdate?: boolean;
  } | null>(null);

  // 13. Dynamic User Taste Profile (Personalized Learning Engine)
  const [userTaste, setUserTaste] = useState<TasteProfile>(DEFAULT_INITIAL_TASTE);
  const [userTasteVector, setUserTasteVector] = useState<FeatureVector>(() =>
    buildUserTasteVector(DEFAULT_INITIAL_TASTE.likedArtists || [], DEFAULT_INITIAL_TASTE.selectedGenres || [])
  );

  // 14. Spotify Shuffle Tri-State: "off" | "standard" (balanced fewer repeats) | "smart" (hybrid recommendation)
  const [shuffleMode, setShuffleMode] = useState<"off" | "standard" | "smart">("off");
  const [shuffleToast, setShuffleToast] = useState<string | null>(null);

  // 15. User Authentication & Cloud Preference Sync (Mandatory Login - No Guest Mode)
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  // 16. Cold-Start Onboarding (Pick 3+ Artists or Genres)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [selectedOnboardingArtists, setSelectedOnboardingArtists] = useState<string[]>([]);
  const [selectedOnboardingGenres, setSelectedOnboardingGenres] = useState<string[]>([]);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState<boolean>(false);
  const hasLoggedCompletionRef = useRef<boolean>(false);

  // 17. Real PWA Install Step State
  const [installStep, setInstallStep] = useState<"downloading" | "ready" | "installed" | "ios_guide">("downloading");

  // User Top Artist learned from Supabase Taste Profile & Listening History
  const topArtistName = useMemo(() => {
    if (!userTaste || !userTaste.totalPlays || userTaste.totalPlays <= 0) return null;
    const entries = Object.entries(userTaste?.artistWeights || {}).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 && entries[0][1] > 0 ? entries[0][0] : null;
  }, [userTaste?.artistWeights, userTaste?.totalPlays]);

  // Real-time dynamic fetch of artist catalog & related music for user's favorite artist
  useEffect(() => {
    if (!topArtistName) {
      setTopArtistShelfTracks([]);
      return;
    }
    fetch(`/api/related?artist=${encodeURIComponent(topArtistName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.related) && data.related.length > 0) {
          setTopArtistShelfTracks(data.related);
        }
      })
      .catch(() => {});
  }, [topArtistName]);

  // Real-time AI Mood Sentiment & Listening Habit Analyzer (Detects melancholy, nostalgia, energy, chill)
  const currentMoodInsight: MoodInsight = useMemo(() => {
    return detectUserMood(userTasteVector, topArtistName, userTaste?.totalPlays || 0);
  }, [userTasteVector, topArtistName, userTaste?.totalPlays]);

  // Dynamic Mood Vector & Shelf Info based on user's selectedMood or auto-detected mood
  const activeMoodInfo = useMemo(() => {
    if (homeFilter === "most-played") {
      return {
        title: "Lagu Paling Sering Diputar di Indonesia",
        description: "Daftar lagu yang paling banyak diputar dan dicari pecinta musik Indonesia hari ini.",
        vector: [0.35, 0.85, 0.75, 0.85, 0.95, 0.4, 0.6, 0.4, 0.4, 0.4, 0.5, 0.95] as FeatureVector
      };
    }
    if (homeFilter === "viral") {
      return {
        title: "Viral 50 Indonesia",
        description: "Lagu-lagu yang sedang trending viral di media sosial dan platform streaming.",
        vector: [0.25, 0.9, 0.85, 0.95, 0.7, 0.3, 0.3, 0.9, 0.5, 0.6, 0.3, 0.98] as FeatureVector
      };
    }

    switch (selectedMood) {
      case "energetic":
        return {
          title: "Pembangkit Semangat & Energi",
          description: "Irama penuh energi, upbeat, dan tempo bersemangat untuk menemani harimu.",
          vector: [0.15, 0.95, 0.85, 0.95, 0.5, 0.1, 0.4, 0.9, 0.6, 0.7, 0.4, 0.95] as FeatureVector
        };
      case "cheerful":
        return {
          title: "Bergairah & Penuh Ceria",
          description: "Lagu-lagu riang, melodi cerah, dan energi positif untuk mendongkrak harimu.",
          vector: [0.25, 0.85, 0.95, 0.85, 0.85, 0.2, 0.4, 0.5, 0.6, 0.7, 0.3, 0.9] as FeatureVector
        };
      case "chill":
        return {
          title: "Santai & Menenangkan",
          description: "Petikan gitar akustik, harmoni hangat, dan alunan santai menyejukkan hati.",
          vector: [0.95, 0.35, 0.55, 0.4, 0.6, 0.95, 0.2, 0.0, 0.3, 0.2, 0.2, 0.7] as FeatureVector
        };
      case "nostalgia":
        return {
          title: "Nostalgia & Lagu Legendaris",
          description: "Koleksi lagu pop-rock band klasik Indonesia terbaik era 90-an dan 2000-an.",
          vector: [0.35, 0.8, 0.65, 0.6, 0.6, 0.3, 0.95, 0.0, 0.2, 0.2, 0.95, 0.75] as FeatureVector
        };
      case "focus":
        return {
          title: "Fokus & Alur Belajar",
          description: "Ritme stabil, harmoni tenang, dan alur lembut untuk konsentrasi bekerja.",
          vector: [0.75, 0.45, 0.5, 0.45, 0.4, 0.85, 0.2, 0.0, 0.2, 0.2, 0.1, 0.6] as FeatureVector
        };
      case "melancholy":
        return {
          title: "Lagu Penenang Suasana Hati",
          description: "Melodi sendu dan reflektif untuk menemani saat malam dan hening.",
          vector: [0.8, 0.35, 0.15, 0.35, 0.95, 0.9, 0.2, 0.0, 0.2, 0.2, 0.3, 0.85] as FeatureVector
        };
      case "all":
      default:
        return {
          title: currentMoodInsight.shelfTitle,
          description: currentMoodInsight.shelfDescription,
          vector: currentMoodInsight.targetVector || userTasteVector
        };
    }
  }, [homeFilter, selectedMood, currentMoodInsight, userTasteVector]);

  // 18. Memoized Home ML Recommended Shelf (Adaptive Deep Learning + Real-time Mood Alignment)
  const homeMlRanked = useMemo(() => {
    let rawPool: any[] = [];
    if (homeFilter === "most-played") {
      rawPool = [...mostPlayedIndonesia];
    } else if (homeFilter === "viral") {
      rawPool = [...viralIndonesia];
    } else {
      const targetArtist = (topArtistName || "").toLowerCase().trim();
      if (targetArtist) {
        // High-precision real-time artist shelf:
        // Pool consists strictly of real-time tracks from the artist and related circle
        const candidatePool = [...topArtistShelfTracks, ...relatedQueue];
        const artistMatchingTracks = candidatePool.filter((s: any) => {
          const a = ((s as any).artist || (s as any).artistName || "").toLowerCase();
          return a.includes(targetArtist) || targetArtist.includes(a);
        });
        const circleTracks = candidatePool.filter((s: any) => {
          const a = ((s as any).artist || (s as any).artistName || "").toLowerCase();
          return !a.includes(targetArtist) && !targetArtist.includes(a);
        });
        rawPool = [...artistMatchingTracks, ...circleTracks];
        // Only if rawPool is still empty while loading, fallback to real-time global trending, never static dummy catalogs
        if (rawPool.length === 0) {
          rawPool = [...globalTrending];
        }
      } else {
        rawPool = [
          ...relatedQueue,
          ...mostPlayedIndonesia,
          ...indonesiaTop50,
          ...viralIndonesia
        ];
      }
    }
    const seenTitles = new Set<string>();
    const uniquePool: any[] = [];
    for (const s of rawPool) {
      const cleanTitle = ((s as any).title || (s as any).trackName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanTitle && !seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        uniquePool.push(s);
      }
    }
    return rankTracksByDeepLearning(
      activeMoodInfo.vector,
      uniquePool,
      recentHistoryRef.current,
      dislikedSongIds,
      24,
      true // allowRecent = true: boosts user's favorite played songs right to the top!
    );
  }, [homeFilter, mostPlayedIndonesia, indonesiaTop50, viralIndonesia, globalTrending, relatedQueue, topArtistShelfTracks, activeMoodInfo, dislikedSongIds, topArtistName]);

  // Player State Synchronization Refs (prevents stale closure looping & skips)
  const isPlayingRef = useRef<boolean>(false);
  const activeQueueRef = useRef<any[]>(activeQueue);
  const activeQueueIndexRef = useRef<number>(0);
  const repeatModeRef = useRef<"off" | "all" | "one">("off");
  const isAlbumLoopModeRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track>(currentTrack);
  const playNextSongRef = useRef<(userTriggered?: boolean) => void>(() => {});
  const handleSeekSecondsRef = useRef<(sec: number) => void>(() => {});
  const toggleLikeRef = useRef<(id: string) => void>(() => {});
  const checkAppVersionRef = useRef<() => void>(() => {});
  const hasTriggeredEndRef = useRef<boolean>(false);
  const hasSessionPlaybackStartedRef = useRef<boolean>(false);

  // Back Navigation & Modal State Refs for Android hardware Back & browser popstate
  const isAuthModalOpenRef = useRef<boolean>(false);
  const isMobilePlayerOpenRef = useRef<boolean>(false);
  const isZoomedRef = useRef<boolean>(false);
  const currentViewRef = useRef<string>("home");
  const isOnboardingModalOpenRef = useRef<boolean>(false);

  useEffect(() => { isAuthModalOpenRef.current = isAuthModalOpen; }, [isAuthModalOpen]);
  useEffect(() => { isMobilePlayerOpenRef.current = isMobilePlayerOpen; }, [isMobilePlayerOpen]);
  useEffect(() => { isZoomedRef.current = isZoomed; }, [isZoomed]);
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { isOnboardingModalOpenRef.current = isOnboardingModalOpen; }, [isOnboardingModalOpen]);

  // Unified Bulletproof Track Completion Trigger & Anti-Skipping Guard
  const lastTrackChangeTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);

  const handleTrackEnded = (source = "unknown") => {
    const elapsed = Date.now() - lastTrackChangeTimeRef.current;
    // CRITICAL ANTI-SKIPPING SHIELD:
    // A music track cannot legitimately end within 6 seconds of starting/switching!
    // Rejects false triggers from stale player states, buffering resets, or rapid polling loops.
    if (elapsed < 6000) {
      console.warn(`[BrnsicGuard] Blocked premature track end trigger from: ${source} (${elapsed}ms since track change)`);
      return;
    }
    if (hasTriggeredEndRef.current) return;
    hasTriggeredEndRef.current = true;
    if (playNextSongRef.current) {
      playNextSongRef.current(false);
    }
  };

  // References
  const ytPlayerRef = useRef<any>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const activeVideoIdRef = useRef<string | null>(null);
  const availableCandidatesRef = useRef<string[]>([]);
  const candidateIndexRef = useRef<number>(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const mobileActiveLyricRef = useRef<HTMLDivElement | null>(null);
  const zoomedActiveLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileLyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const zoomedLyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playedSongTitlesRef = useRef<Set<string>>(new Set());
  const hasUserStartedPlaybackRef = useRef<boolean>(false);
  const latestSearchQueryRef = useRef<string>("");
  const playRequestIdRef = useRef<number>(0);
  const originalQueueRef = useRef<any[]>([]);
  const shuffleToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize Player Engine Refs
  useEffect(() => {
    activeQueueRef.current = activeQueue;
  }, [activeQueue]);

  useEffect(() => {
    activeQueueIndexRef.current = activeQueueIndex;
  }, [activeQueueIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isAlbumLoopModeRef.current = isAlbumLoopMode;
  }, [isAlbumLoopMode]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // 2. Native APK Detection & Automatic Update Checker
  useEffect(() => {
    // Clean up any old localStorage flags that might hide the button on web
    try {
      localStorage.removeItem("brnsic_is_installed");
    } catch (e) {}

    const checkNativeApk = () => {
      if (typeof window === "undefined") return;
      // Strict detection: ONLY true if physically executing inside the Android APK WebView!
      const isNative =
        Boolean((window as any).BrnsicNative) ||
        navigator.userAgent.includes("BrnsicNative") ||
        (typeof (window as any).Capacitor?.isNativePlatform === "function" && (window as any).Capacitor.isNativePlatform()) ||
        (window as any).Capacitor?.getPlatform?.() === "android";

      setIsInsideNativeApk(Boolean(isNative));
      if (isNative) {
        try {
          const isGranted = (window as any).BrnsicNative?.isPermissionGranted?.();
          if (isGranted === false) {
            setShowPermissionBanner(true);
          }
        } catch (e) {}
      }
    };

    checkNativeApk();
    const nativeTimer = setTimeout(checkNativeApk, 600);

    // Register PWA Service Worker for Offline Cache & Background Audio Engine
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onAppInstalled = () => {
      setInstallStep("installed");
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // Automatic Update Check via /api/version (Force Update for Outdated APK Versions)
    const checkAppVersion = async () => {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUpdateInfo(data);

          const isNative =
            Boolean((window as any).BrnsicNative) ||
            (typeof navigator !== "undefined" && navigator.userAgent.includes("BrnsicNative")) ||
            Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
            (window as any).Capacitor?.getPlatform?.() === "android";

          // 1. Android APK Native Version Guard: Ground truth is nativeCode
          if (isNative) {
            const nativeCode = (window as any).BrnsicNative?.getAppVersionCode?.() ?? null;
            if (nativeCode === null) {
              // Native bridge still binding; retry shortly without prematurely locking modal
              setTimeout(checkAppVersion, 400);
              return;
            }

            if (data.minVersionCode && nativeCode < data.minVersionCode) {
              setIsUpdateModalOpen(true);
            } else {
              // The APK is up to date!
              setIsUpdateModalOpen(false);
              localStorage.setItem("brnsic_app_version", data.version);

              // Live Web OTA Hot-Reload: jika ada buildId baru di server, refresh cache tanpa install ulang APK!
              const currentBuildId = localStorage.getItem("brnsic_build_id");
              if (data.buildId && currentBuildId && currentBuildId !== data.buildId) {
                localStorage.setItem("brnsic_build_id", data.buildId);
                if ("caches" in window) {
                  try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  } catch (e) {}
                }
                window.location.reload();
                return;
              }
              if (data.buildId) {
                localStorage.setItem("brnsic_build_id", data.buildId);
              }
            }
            return;
          }

          // 2. Web version guard (Browser / PWA)
          const currentBuildId = localStorage.getItem("brnsic_build_id");
          if (data.buildId && currentBuildId && currentBuildId !== data.buildId) {
            localStorage.setItem("brnsic_build_id", data.buildId);
            if ("caches" in window) {
              try {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              } catch (e) {}
            }
            window.location.reload();
            return;
          }
          if (data.buildId) {
            localStorage.setItem("brnsic_build_id", data.buildId);
          }
        }
      } catch (e) {}
    };
    checkAppVersionRef.current = checkAppVersion;
    checkAppVersion();
    const updateInterval = setInterval(checkAppVersion, 25000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearInterval(updateInterval);
    };
  }, []);

  const handleInstallClick = () => {
    setIsInstallModalOpen(true);
    setInstallStep("ready");
    if (typeof window !== "undefined") {
      try {
        const apkUrl = "https://brnsic.vercel.app/Brnsic.apk";
        if ((window as any).BrnsicNative?.downloadAndInstallUpdate) {
          (window as any).BrnsicNative.downloadAndInstallUpdate(apkUrl);
          return;
        }
        if ((window as any).BrnsicNative?.openExternalAuth) {
          (window as any).BrnsicNative.openExternalAuth(apkUrl);
          return;
        }
        const link = document.createElement("a");
        link.href = apkUrl;
        link.download = "Brnsic.apk";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Mengunduh Brnsic.apk...");
      } catch (e) {}
    }
  };

  const handlePerformInstall = async () => {
    if (typeof window !== "undefined") {
      const apkUrl = "https://brnsic.vercel.app/Brnsic.apk";
      if ((window as any).BrnsicNative?.downloadAndInstallUpdate) {
        (window as any).BrnsicNative.downloadAndInstallUpdate(apkUrl);
      } else if ((window as any).BrnsicNative?.openExternalAuth) {
        (window as any).BrnsicNative.openExternalAuth(apkUrl);
      } else {
        window.location.href = apkUrl;
      }
    }

    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredInstallPrompt(null);
          setIsAppInstalled(true);
          try {
            localStorage.setItem("brnsic_is_installed", "true");
          } catch (e) {}
          setInstallStep("installed");
        }
      } catch (e) {
        setInstallStep("installed");
      }
    } else {
      setInstallStep("installed");
      setIsAppInstalled(true);
      try {
        localStorage.setItem("brnsic_is_installed", "true");
      } catch (e) {}
    }
  };

  // 3. Load Saved Liked Songs, Playlists & Taste Profile (LocalStorage + Cloud Supabase Session)
  useEffect(() => {
    try {
      const cachedTrack = localStorage.getItem("brnsic_cached_track");
      if (cachedTrack) {
        try {
          const parsed = JSON.parse(cachedTrack);
          if (parsed && parsed.title) {
            if (!parsed.youtubeId) {
              const matched = getVerifiedVideoId(parsed.title, parsed.artist);
              if (matched) parsed.youtubeId = matched;
            }
            setCurrentTrack(parsed);
            currentTrackRef.current = parsed;
            if (parsed.artist) {
              if (!parsed.youtubeId) {
                fetch(`/api/youtube?artist=${encodeURIComponent(parsed.artist)}&title=${encodeURIComponent(parsed.title)}`)
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.videoId) {
                      setCurrentTrack((prev) => ({ ...prev, youtubeId: d.videoId }));
                      if (currentTrackRef.current) currentTrackRef.current.youtubeId = d.videoId;
                      try {
                        localStorage.setItem("brnsic_cached_track", JSON.stringify({ ...parsed, youtubeId: d.videoId }));
                      } catch (e) {}
                    }
                  })
                  .catch(() => {});
              }
              fetch(`/api/related?artist=${encodeURIComponent(parsed.artist)}&title=${encodeURIComponent(parsed.title)}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.related && d.related.length > 0) {
                    setRelatedQueue(d.related);
                  }
                })
                .catch(() => {});
            }
          }
        } catch (e) {}
      }
      const cachedTime = localStorage.getItem("brnsic_cached_time");
      if (cachedTime) {
        const t = parseFloat(cachedTime);
        if (!isNaN(t) && t > 0) {
          setCurrentTime(t);
          currentTimeRef.current = t;
        }
      }
      const cachedQ = localStorage.getItem("brnsic_cached_queue");
      if (cachedQ) {
        try {
          const parsed = JSON.parse(cachedQ);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveQueue(parsed);
            activeQueueRef.current = parsed;
          }
        } catch (e) {}
      }
      const hasPlayed = localStorage.getItem("brnsic_has_user_played") === "true";
      setHasUserStartedPlayback(hasPlayed);
      hasUserStartedPlaybackRef.current = hasPlayed;

      const islandEnabled = localStorage.getItem("brnsic_island_enabled");
      if (islandEnabled !== null) setIsDynamicIslandEnabled(islandEnabled === "true");

      const islandPos = localStorage.getItem("brnsic_island_pos");
      if (islandPos === "left" || islandPos === "right") setIslandPosition(islandPos);

      const cachedUser = localStorage.getItem("brnsic_user_profile");
      const cachedToken = localStorage.getItem("brnsic_auth_token");
      if (cachedUser && cachedToken) {
        try {
          const parsed = JSON.parse(cachedUser);
          if (parsed && !parsed.email?.includes("@guest.") && !parsed.id?.startsWith("dev_")) {
            setCurrentUser(parsed);
          } else {
            localStorage.removeItem("brnsic_user_profile");
            setCurrentUser(null);
          }
        } catch (e) {}
      } else {
        // Without an active auth token, user is in Guest Mode - NEVER show a fake "Pengguna" profile
        localStorage.removeItem("brnsic_user_profile");
        setCurrentUser(null);
      }

      const storedLikes = localStorage.getItem("brnsic_liked_songs");
      if (storedLikes) {
        setLikedSongIds(JSON.parse(storedLikes));
      }
      const storedPlaylists = localStorage.getItem("brnsic_user_playlists");
      if (storedPlaylists) {
        setUserPlaylists(JSON.parse(storedPlaylists));
      }
      const storedDislikes = localStorage.getItem("brnsic_disliked_songs");
      if (storedDislikes) {
        setDislikedSongIds(JSON.parse(storedDislikes));
      }
      const storedDislikedTracks = localStorage.getItem("brnsic_disliked_tracks_list");
      if (storedDislikedTracks) {
        setDislikedTracks(JSON.parse(storedDislikedTracks));
      }
      const storedTaste = localStorage.getItem("brnsic_user_taste_v1");
      if (storedTaste) {
        try {
          const parsed = JSON.parse(storedTaste);
          // Purge any stale dummy seed weights (like old Sal Priadi) if user has no real plays recorded
          if (parsed && (!parsed.totalPlays || parsed.totalPlays === 0)) {
            parsed.artistWeights = {};
            parsed.likedArtists = [];
            parsed.persona = "Penjelajah Musik";
            setUserTaste(parsed);
            localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(parsed));
          } else if (parsed) {
            setUserTaste(parsed);
          }
        } catch (e) {}
      } else {
        const fresh = generateInitialTaste();
        setUserTaste(fresh);
        localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(fresh));
      }
    } catch (e) {}

    // Global touch/click unlock for background audio permission on mobile
    const unlockAudio = () => {
      if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          ctx.resume().catch(() => {});
        } catch (e) {}
      }
    };
    window.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
    window.addEventListener("click", unlockAudio, { once: true });

    // Check Cloud Session (Supabase / Next.js Auth) - Function declaration hoisted safely
    async function checkAuthSession(explicitToken?: string) {
      try {
        const token =
          explicitToken ||
          (typeof window !== "undefined" ? localStorage.getItem("brnsic_auth_token") : null);
        // Allow cookie session fallback if token is not yet in PWA localStorage
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/auth/me", {
          headers,
          cache: "no-store",
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            if (data.token) {
              try {
                localStorage.setItem("brnsic_auth_token", data.token);
              } catch (e) {}
            }
            try {
              localStorage.setItem("brnsic_user_profile", JSON.stringify(data.user));
            } catch (e) {}
            setIsAuthModalOpen(false);

            // OTOMATIS GABUNGKAN DATA TAMU KE AKUN:
            // Menggabungkan lagu disukai, playlist, profil selera AI, dan riwayat aktivitas dari perangkat tamu
            try {
              const guestDevId = localStorage.getItem("brnsic_device_id");
              const localLikes = JSON.parse(localStorage.getItem("brnsic_liked_songs") || "[]");
              const localPls = JSON.parse(localStorage.getItem("brnsic_user_playlists") || "[]");
              const localTaste = JSON.parse(localStorage.getItem("brnsic_user_taste_v1") || "{}");

              if (guestDevId || localLikes.length > 0 || localPls.length > 0) {
                fetch("/api/user/sync", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    deviceId: guestDevId,
                    likedSongs: localLikes,
                    playlists: localPls,
                    taste: localTaste
                  })
                })
                  .then((sRes) => sRes.json())
                  .then((sData) => {
                    if (sData?.user) {
                      setCurrentUser(sData.user);
                      try {
                        localStorage.setItem("brnsic_user_profile", JSON.stringify(sData.user));
                        if (Array.isArray(sData.user.likedSongs)) {
                          setLikedSongIds(sData.user.likedSongs);
                          localStorage.setItem("brnsic_liked_songs", JSON.stringify(sData.user.likedSongs));
                        }
                        if (Array.isArray(sData.user.playlists)) {
                          setUserPlaylists(sData.user.playlists);
                          localStorage.setItem("brnsic_user_playlists", JSON.stringify(sData.user.playlists));
                        }
                      } catch (e) {}
                    }
                  })
                  .catch(() => {});
              }
            } catch (e) {}

            if (data.user.taste) {
              setUserTaste(data.user.taste);
              const dbVector = buildUserTasteVector(
                data.user.taste.likedArtists || [],
                data.user.selectedGenres || Object.keys(data.user.taste.genreWeights || {})
              );
              setUserTasteVector(dbVector);
              try {
                localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(data.user.taste));
              } catch (e) {}
            }
            if (Array.isArray(data.user.likedSongs)) {
              setLikedSongIds(data.user.likedSongs);
              try {
                localStorage.setItem("brnsic_liked_songs", JSON.stringify(data.user.likedSongs));
              } catch (e) {}
            }
            if (Array.isArray(data.user.playlists)) {
              setUserPlaylists(data.user.playlists);
              try {
                localStorage.setItem("brnsic_user_playlists", JSON.stringify(data.user.playlists));
              } catch (e) {}
            }
            if (!data.user.onboardingCompleted && !localStorage.getItem("brnsic_onboarding_done")) {
              setIsOnboardingModalOpen(true);
            }
          } else {
            // Not authenticated: ensure Guest mode has null currentUser
            setCurrentUser(null);
            try {
              localStorage.removeItem("brnsic_user_profile");
              localStorage.removeItem("brnsic_auth_token");
            } catch (e) {}
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    }

    // History Trap: Push an anchor barrier so browser back button never traverses to Google OAuth
    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ page: "home" }, "", window.location.pathname);
      } catch (e) {}

      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      const urlUser = urlParams.get("user");
      if (urlToken) {
        try {
          localStorage.setItem("brnsic_auth_token", urlToken);
        } catch (e) {}
      }
      if (urlUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(urlUser));
          if (parsedUser && parsedUser.id) {
            setCurrentUser(parsedUser);
            try {
              localStorage.setItem("brnsic_user_profile", JSON.stringify(parsedUser));
            } catch (e) {}
            setIsAuthModalOpen(false);
          }
        } catch (e) {}
      }

      if (urlParams.get("login_success") === "true") {
        showToast("Login Google Berhasil! Selamat datang di Brnsic.");
        window.history.replaceState({ page: "home" }, "", "/");
        if (urlToken) {
          checkAuthSession(urlToken);
        }
      } else if (urlToken) {
        window.history.replaceState({ page: "home" }, "", "/");
        checkAuthSession(urlToken);
      } else if (urlParams.get("auth_error")) {
        setAuthError(decodeURIComponent(urlParams.get("auth_error") || "Gagal masuk"));
        setIsAuthModalOpen(true);
        window.history.replaceState({ page: "home" }, "", "/");
      }

      // Handle Shared Playlist URL (?playlist=...)
      const playlistParam = urlParams.get("playlist");
      if (playlistParam) {
        fetch(`/api/playlist?id=${encodeURIComponent(playlistParam)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.playlist) {
              setActiveCustomPlaylist(data.playlist);
              setCurrentView("custom-playlist");
              showToast(`Membuka playlist: ${data.playlist.name}`);
            }
          })
          .catch(() => {});
      }
    }

    // Handle Supabase OAuth return hash (#access_token=...)
    if (typeof window !== "undefined" && window.location.hash && window.location.hash.includes("access_token=")) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken })
        })
          .then((res) => res.json())
          .then((d) => {
            if (d.user) {
              setCurrentUser(d.user);
              try {
                localStorage.setItem("brnsic_user_profile", JSON.stringify(d.user));
              } catch (e) {}
              if (d.token) {
                try {
                  localStorage.setItem("brnsic_auth_token", d.token);
                } catch (e) {}
              }
              if (d.user.taste) {
                setUserTaste(d.user.taste);
                const dbVector = buildUserTasteVector(
                  d.user.taste.likedArtists || [],
                  d.user.selectedGenres || Object.keys(d.user.taste.genreWeights || {})
                );
                setUserTasteVector(dbVector);
              }
              showToast(`Selamat datang, ${d.user.name}! Akun Google terhubung`);
            }
          })
          .catch(() => {})
          .finally(() => {
            window.history.replaceState({ page: "home" }, "", "/");
          });
      }
    }

    (window as any).__handleNativeAuthToken = (token: string, rawUser?: any) => {
      if (token) {
        try {
          localStorage.setItem("brnsic_auth_token", token);
        } catch (e) {}
        if (rawUser) {
          try {
            const parsed = typeof rawUser === "string" ? JSON.parse(decodeURIComponent(rawUser)) : rawUser;
            if (parsed && parsed.id) {
              setCurrentUser(parsed);
              try {
                localStorage.setItem("brnsic_user_profile", JSON.stringify(parsed));
              } catch (e) {}
            }
          } catch (e) {}
        }
        checkAuthSession(token);
        setIsAuthModalOpen(false);
        showToast("Berhasil masuk dengan Google!");
      }
    };

    // Native Android Hardware Back & Web Browser PopState Handler
    // Prevents ever navigating backward into Google OAuth login URL!
    (window as any).__handleNativeBack = () => {
      if (isAuthModalOpenRef.current) {
        setIsAuthModalOpen(false);
        return true;
      }
      if (isMobilePlayerOpenRef.current) {
        setIsMobilePlayerOpen(false);
        return true;
      }
      if (isZoomedRef.current) {
        setIsZoomed(false);
        return true;
      }
      if (currentViewRef.current !== "home") {
        setCurrentView("home");
        setSearchQuery("");
        return true;
      }
      if (isOnboardingModalOpenRef.current) {
        setIsOnboardingModalOpen(false);
        return true;
      }
      return false;
    };

    // Bulletproof History Shield: Keep browser trapped inside Brnsic
    // Never allow pressing Android Back button to navigate to external OAuth / Google Account Chooser!
    const lockHistory = () => {
      try {
        window.history.pushState({ brnsic: "app" }, "", window.location.pathname);
      } catch (e) {}
    };

    lockHistory();

    const handlePopState = () => {
      // Re-push barrier immediately so user can never pop out to Google OAuth!
      lockHistory();

      if (isAuthModalOpenRef.current) {
        setIsAuthModalOpen(false);
        return;
      }
      if (isMobilePlayerOpenRef.current) {
        setIsMobilePlayerOpen(false);
        return;
      }
      if (isZoomedRef.current) {
        setIsZoomed(false);
        return;
      }
      if (currentViewRef.current !== "home") {
        setCurrentView("home");
        setSearchQuery("");
        return;
      }
      if (isOnboardingModalOpenRef.current) {
        setIsOnboardingModalOpen(false);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Popup OAuth Cross-Window Listener
    const handlePopupAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BRNSIC_AUTH_SUCCESS") {
        const { token, user } = event.data;
        if (token) {
          try {
            localStorage.setItem("brnsic_auth_token", token);
          } catch (e) {}
        }
        if (user) {
          setCurrentUser(user);
          try {
            localStorage.setItem("brnsic_user_profile", JSON.stringify(user));
          } catch (e) {}
          if (user.taste) {
            setUserTaste(user.taste);
            const dbVector = buildUserTasteVector(
              user.taste.likedArtists || [],
              user.selectedGenres || Object.keys(user.taste.genreWeights || {})
            );
            setUserTasteVector(dbVector);
          }
          if (Array.isArray(user.likedSongs)) {
            setLikedSongIds(user.likedSongs);
            try {
              localStorage.setItem("brnsic_liked_songs", JSON.stringify(user.likedSongs));
            } catch (e) {}
          }
          if (Array.isArray(user.playlists)) {
            setUserPlaylists(user.playlists);
            try {
              localStorage.setItem("brnsic_user_playlists", JSON.stringify(user.playlists));
            } catch (e) {}
          }
        }
        setIsAuthModalOpen(false);
        setIsAuthSubmitting(false);
        showToast("Login Google Berhasil! Selamat datang di Brnsic.");
      }
    };

    window.addEventListener("message", handlePopupAuthMessage);

    (window as any).__handleNativeTrackCompleted = () => {
      handleTrackEnded("native-android-completed");
    };

    (window as any).__handleNativeNext = () => {
      if (playNextSongRef.current) {
        playNextSongRef.current(true);
      }
    };

    (window as any).__handleNativePrev = () => {
      playPrevSong();
    };

    (window as any).__handleNativeSeekTo = (positionSeconds: number) => {
      if (handleSeekSecondsRef.current) {
        handleSeekSecondsRef.current(positionSeconds);
      }
    };

    (window as any).__handleNativeLike = () => {
      if (currentTrackRef.current?.id && toggleLikeRef.current) {
        toggleLikeRef.current(currentTrackRef.current.id);
      }
    };

    (window as any).__handleNativePlaybackState = (playing: boolean) => {
      if (!playing) {
        isUserExplicitlyPausedRef.current = true;
      } else {
        isUserExplicitlyPausedRef.current = false;
      }
      setIsPlaying(playing);
      isPlayingRef.current = playing;
      if (playing) {
        // Cold-start & Desync Guard: If player doesn't have the active video loaded for currentTrack,
        // trigger playAnySong so the EXACT song currently displayed on the notification is resolved and played!
        const currentTarget = currentTrackRef.current || currentTrack;
        const expectedVid = currentTarget?.youtubeId || (currentTarget ? getVerifiedVideoId(currentTarget.title, currentTarget.artist) : null);
        if (
          !hasSessionPlaybackStartedRef.current ||
          !activeVideoIdRef.current ||
          (expectedVid && activeVideoIdRef.current !== expectedVid)
        ) {
          hasSessionPlaybackStartedRef.current = true;
          if (currentTarget) {
            playAnySong(currentTarget, true);
            return;
          }
        }
        if (ytPlayerRef.current) {
          try {
            if (typeof ytPlayerRef.current.playVideo === "function") {
              ytPlayerRef.current.playVideo();
            }
          } catch (e) {}
        }
      } else {
        if (ytPlayerRef.current) {
          try {
            if (typeof ytPlayerRef.current.pauseVideo === "function") {
              ytPlayerRef.current.pauseVideo();
            }
          } catch (e) {}
        }
      }
    };

    checkAuthSession();

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("message", handlePopupAuthMessage);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 3b. Real-time Caching of Active Queue and Playback Time to LocalStorage
  useEffect(() => {
    if (activeQueue && activeQueue.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem("brnsic_cached_queue", JSON.stringify(activeQueue.slice(0, 40)));
      } catch (e) {}
    }
  }, [activeQueue]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentTimeRef.current > 0 && typeof window !== "undefined") {
        try {
          localStorage.setItem("brnsic_cached_time", Math.round(currentTimeRef.current).toString());
        } catch (e) {}
      }
    }, 4000);

    const handleBeforeUnload = () => {
      try {
        if (currentTimeRef.current > 0) {
          localStorage.setItem("brnsic_cached_time", Math.round(currentTimeRef.current).toString());
        }
        if (currentTrackRef.current) {
          localStorage.setItem("brnsic_cached_track", JSON.stringify(currentTrackRef.current));
        }
      } catch (e) {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Continuous Background Audio Keepalive & Anti-Throttle Shield
  const isUserExplicitlyPausedRef = useRef<boolean>(false);
  const audioContextRef = useRef<any>(null);
  const silentNodeRef = useRef<any>(null);
  const mediaStreamAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamDestRef = useRef<any>(null);

  // GitHub Proven iOS WebKit Background Audio Engine via MediaStreamDestination
  // Tricks iOS Safari into classifying the tab as an active live-audio call,
  // preventing background throttling and forcing the Lock Screen Now Playing widget to appear!
  const startWebAudioKeepalive = () => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }

      if (!mediaStreamDestRef.current && audioContextRef.current.createMediaStreamDestination) {
        const dest = audioContextRef.current.createMediaStreamDestination();
        mediaStreamDestRef.current = dest;

        // Sub-audible sine wave (20Hz, 0.00001 gain) - 100% inaudible to human ears
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.type = "sine";
        osc.frequency.value = 20;
        gain.gain.value = 0.00001;
        osc.connect(gain);
        gain.connect(dest);
        osc.start(0);
        silentNodeRef.current = osc;

        if (!mediaStreamAudioRef.current) {
          const audioEl = document.createElement("audio");
          audioEl.setAttribute("playsinline", "true");
          audioEl.setAttribute("webkit-playsinline", "true");
          audioEl.muted = false; // Must be unmuted so iOS CoreAudio treats it as audible!
          audioEl.volume = 0.01;
          audioEl.srcObject = dest.stream;
          audioEl.play().catch(() => {});
          mediaStreamAudioRef.current = audioEl;
        }
      } else if (mediaStreamAudioRef.current && mediaStreamAudioRef.current.paused) {
        mediaStreamAudioRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn("MediaStream background audio anchor warning:", e);
    }
  };

  const stopWebAudioKeepalive = () => {
    try {
      if (mediaStreamAudioRef.current) {
        mediaStreamAudioRef.current.pause();
      }
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const blockEvent = (e: Event) => {
        e.stopImmediatePropagation();
      };
      window.addEventListener("visibilitychange", blockEvent, true);
      document.addEventListener("visibilitychange", blockEvent, true);

      Object.defineProperty(document, "hidden", {
        get: () => false,
        configurable: true
      });
      Object.defineProperty(document, "visibilityState", {
        get: () => "visible",
        configurable: true
      });
    } catch (e) {}

    const handleBackgroundKeepalive = () => {
      if (!isUserExplicitlyPausedRef.current && isPlayingRef.current && ytPlayerRef.current) {
        try {
          const curr = ytPlayerRef.current.getCurrentTime?.() || 0;
          const dur = ytPlayerRef.current.getDuration?.() || 0;
          if (
            Date.now() - lastTrackChangeTimeRef.current > 8000 &&
            dur > 20 &&
            curr > 15 &&
            curr >= dur - 1.5
          ) {
            handleTrackEnded("keepalive-eof");
            return;
          }
          if (activeVideoIdRef.current && typeof ytPlayerRef.current.playVideo === "function") {
            ytPlayerRef.current.playVideo();
          }
        } catch (e) {}
      }
    };

    window.addEventListener("blur", handleBackgroundKeepalive);
    window.addEventListener("pagehide", handleBackgroundKeepalive);

    return () => {
      window.removeEventListener("blur", handleBackgroundKeepalive);
      window.removeEventListener("pagehide", handleBackgroundKeepalive);
    };
  }, []);

  const startBackgroundKeepalive = () => {
    startWebAudioKeepalive();
    if (typeof window !== "undefined") {
      try {
        const durMs = Math.round((currentTrackRef.current?.duration || 210) * 1000);
        const posMs = Math.round((currentTimeRef.current || 0) * 1000);
        if ((window as any).BrnsicNative?.playAudioWithDuration) {
          (window as any).BrnsicNative.playAudioWithDuration(
            "",
            currentTrackRef.current?.title || "Brnsic Music",
            currentTrackRef.current?.artist || "Memutar di latar belakang",
            posMs,
            currentTrackRef.current?.cover || "",
            durMs
          );
        } else if ((window as any).BrnsicNative?.startPlayback) {
          (window as any).BrnsicNative.startPlayback(
            currentTrackRef.current?.title || "Brnsic Music",
            currentTrackRef.current?.artist || "Memutar di latar belakang",
            currentTrackRef.current?.cover || ""
          );
        }
      } catch (e) {}
    }
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      try {
        (navigator as any).wakeLock?.request("screen").catch(() => {});
      } catch (e) {}
    }
  };

  const stopBackgroundKeepalive = () => {
    stopWebAudioKeepalive();
    if (typeof window !== "undefined") {
      try {
        if ((window as any).BrnsicNative?.pauseAudio) {
          (window as any).BrnsicNative.pauseAudio();
        }
      } catch (e) {}
    }
  };

  // Record User Taste Interaction (Play, Like, Playlist, Skip, Replay, Complete)
  const recordTasteInteraction = (
    song: any,
    action: "play" | "like" | "playlist" | "skip" | "replay" | "complete"
  ) => {
    if (!song || !song.artist) return;
    const artist = song.artist.trim();
    const songId = song.id || song.title;

    setUserTaste((prev) => {
      const nextWeights = { ...prev.artistWeights };
      const nextCounts = { ...prev.playCounts };
      const boost =
        action === "like"
          ? 5
          : action === "playlist"
          ? 4
          : action === "replay"
          ? 4
          : action === "complete"
          ? 3
          : action === "play"
          ? 1
          : -1;
      nextWeights[artist] = Math.max(0, (nextWeights[artist] || 0) + boost);
      if (action === "play") {
        nextCounts[songId] = (nextCounts[songId] || 0) + 1;
      }
      const nextLikedArtists =
        action === "like" && !prev.likedArtists.includes(artist)
          ? [...prev.likedArtists, artist]
          : prev.likedArtists;

      const updated: TasteProfile = {
        ...prev,
        artistWeights: nextWeights,
        playCounts: nextCounts,
        likedArtists: nextLikedArtists,
        persona: derivePersona(nextWeights),
        totalPlays: prev.totalPlays + (action === "play" ? 1 : 0)
      };

      try {
        localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Deep Learning Online Weight Gradient Update
    setUserTasteVector((prevVec) =>
      trainUserVectorOnInteraction(
        prevVec,
        song,
        action === "replay" ? "complete" : (action as any)
      )
    );

    // Also persist interaction to Supabase / Backend Activity Log & Online AI Learning
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("brnsic_auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let devId = "";
      if (typeof window !== "undefined") {
        try {
          devId = localStorage.getItem("brnsic_device_id") || "";
          if (!devId) {
            devId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            localStorage.setItem("brnsic_device_id", devId);
          }
        } catch (e) {}
      }

      fetch("/api/user/activity", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          deviceId: devId,
          songId,
          title: song.title || song.trackName,
          artist,
          genre: song.genre,
          cover: song.cover || currentTrack?.cover || "",
          action,
          duration: currentTrack?.duration || 210,
          listenSeconds: Math.floor(currentTime)
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.taste) {
            setUserTaste(data.taste);
            try {
              localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(data.taste));
            } catch (e) {}
          }
          // ONLY update currentUser if there is an active authenticated token!
          // Unauthenticated guest activity must never overwrite currentUser with a dummy "Pengguna" profile.
          if (data?.user && token) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    } catch (e) {}
  };

  const handleToggleDynamicIsland = (enabled: boolean) => {
    setIsDynamicIslandEnabled(enabled);
    try {
      localStorage.setItem("brnsic_island_enabled", enabled ? "true" : "false");
      if ((window as any).BrnsicNative?.setDynamicIslandEnabled) {
        (window as any).BrnsicNative.setDynamicIslandEnabled(enabled);
      }
    } catch (e) {}
    showToast(enabled ? "Dynamic Island diaktifkan" : "Dynamic Island dinonaktifkan (Solusi jika HP sudah ada capsule bawaan)");
  };

  const handleRestoreDynamicIsland = () => {
    try {
      if ((window as any).BrnsicNative?.restoreDynamicIsland) {
        (window as any).BrnsicNative.restoreDynamicIsland();
      }
    } catch (e) {}
    showToast("Dynamic Island ditampilkan kembali di layar utama");
  };

  const handleChangeIslandPosition = (pos: "center" | "left" | "right") => {
    setIslandPosition(pos);
    try {
      localStorage.setItem("brnsic_island_pos", pos);
      if ((window as any).BrnsicNative?.setDynamicIslandPosition) {
        (window as any).BrnsicNative.setDynamicIslandPosition(pos, 0);
      }
    } catch (e) {}
    showToast(`Posisi Dynamic Island: ${pos === "center" ? "Tengah (Di Bawah Kamera)" : pos === "left" ? "Kiri Atas" : "Kanan Atas"}`);
  };

  const toggleLike = (songId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast("Masuk dengan akun Google untuk menyimpan lagu ke favorit");
      return;
    }
    setLikedSongIds((prev) => {
      const isLiking = !prev.includes(songId);
      const next = isLiking ? [...prev, songId] : prev.filter((id) => id !== songId);
      try {
        localStorage.setItem("brnsic_liked_songs", JSON.stringify(next));
      } catch (e) {}
      if (isLiking && currentTrack && currentTrack.id === songId) {
        recordTasteInteraction(currentTrack, "like");
      }
      if (currentUser) {
        const token = typeof window !== "undefined" ? localStorage.getItem("brnsic_auth_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        fetch("/api/user/sync", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ likedSongs: next, replaceLikes: true })
        }).catch(() => {});
      }
      return next;
    });
  };
  toggleLikeRef.current = toggleLike;

  const toggleDislike = (song: Track) => {
    if (!song) return;
    const songId = song.id || song.title;
    const cleanTitle = (song.title || "").toLowerCase().trim();
    const isDisliked = dislikedSongIds.includes(songId) || dislikedSongIds.includes(cleanTitle);

    if (isDisliked) {
      const nextIds = dislikedSongIds.filter((id) => id !== songId && id !== cleanTitle);
      const nextTracks = dislikedTracks.filter(
        (t) => (t.id || t.title) !== songId && (t.title || "").toLowerCase().trim() !== cleanTitle
      );
      setDislikedSongIds(nextIds);
      setDislikedTracks(nextTracks);
      try {
        localStorage.setItem("brnsic_disliked_songs", JSON.stringify(nextIds));
        localStorage.setItem("brnsic_disliked_tracks_list", JSON.stringify(nextTracks));
      } catch (e) {}
      showToast(`Lagu "${song.title}" dipulihkan (batal disembunyikan)`);
    } else {
      const nextIds = [...dislikedSongIds, songId, cleanTitle];
      const nextTracks = [
        song,
        ...dislikedTracks.filter(
          (t) => (t.id || t.title) !== songId && (t.title || "").toLowerCase().trim() !== cleanTitle
        )
      ];
      setDislikedSongIds(nextIds);
      setDislikedTracks(nextTracks);
      try {
        localStorage.setItem("brnsic_disliked_songs", JSON.stringify(nextIds));
        localStorage.setItem("brnsic_disliked_tracks_list", JSON.stringify(nextTracks));
      } catch (e) {}

      // Heavily penalize artist in user taste
      setUserTaste((prev) => {
        const nextWeights = { ...prev.artistWeights };
        if (song.artist) {
          nextWeights[song.artist] = Math.max(0, (nextWeights[song.artist] || 0) - 12);
        }
        return { ...prev, artistWeights: nextWeights };
      });

      // Train User Taste Vector with harsh negative reinforcement
      setUserTasteVector((prevVec) =>
        trainUserVectorOnInteraction(prevVec, song, "dislike")
      );

      // Remove from upcoming queue immediately
      setActiveQueue((prev) =>
        prev.filter((t) => {
          const tId = t.id || t.title;
          const tTitle = (t.title || t.trackName || "").toLowerCase().trim();
          return tId !== songId && tTitle !== cleanTitle;
        })
      );

      showToast(`Lagu disembunyikan: Brnsic tidak akan memutar "${song.title}" lagi`);

      // If currently playing this song, skip immediately!
      if (currentTrack.id === song.id || (currentTrack.title || "").toLowerCase().trim() === cleanTitle) {
        if (playNextSongRef.current) {
          playNextSongRef.current(true);
        }
      }
    }
  };

  // Queue Reordering Handlers (Drag & Drop + Up/Down Buttons + Remove)
  const reorderQueueItem = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= activeQueue.length ||
      toIdx >= activeQueue.length
    ) {
      return;
    }
    const updated = [...activeQueue];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    let newActiveIdx = activeQueueIndex;
    if (fromIdx === activeQueueIndex) {
      newActiveIdx = toIdx;
    } else if (fromIdx < activeQueueIndex && toIdx >= activeQueueIndex) {
      newActiveIdx--;
    } else if (fromIdx > activeQueueIndex && toIdx <= activeQueueIndex) {
      newActiveIdx++;
    }

    setActiveQueue(updated);
    setActiveQueueIndex(newActiveIdx);
  };

  const moveQueueItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeQueue.length) return;
    reorderQueueItem(index, targetIdx);
  };

  const removeQueueItem = (index: number) => {
    if (index < 0 || index >= activeQueue.length) return;
    if (index === activeQueueIndex) {
      playNextSong(true);
      return;
    }
    const updated = activeQueue.filter((_, i) => i !== index);
    setActiveQueue(updated);
    if (index < activeQueueIndex) {
      setActiveQueueIndex(activeQueueIndex - 1);
    }
  };

  const showToast = (msg: string) => {
    setShuffleToast(msg);
    if (shuffleToastTimeoutRef.current) clearTimeout(shuffleToastTimeoutRef.current);
    shuffleToastTimeoutRef.current = setTimeout(() => {
      setShuffleToast(null);
    }, 2800);
  };

  // Spotify-grade Tri-State Shuffle Controller ("off" -> "standard" -> "smart" -> "off")
  const toggleShuffleMode = () => {
    const nextMode: "off" | "standard" | "smart" =
      shuffleMode === "off" ? "standard" : shuffleMode === "standard" ? "smart" : "off";
    setShuffleMode(nextMode);

    if (nextMode === "standard") {
      if (originalQueueRef.current.length === 0) {
        originalQueueRef.current = [...activeQueue];
      }
      const played = activeQueue.slice(0, activeQueueIndex + 1);
      const upcoming = activeQueue
        .slice(activeQueueIndex + 1)
        .filter((t) => !t.isSmartRecommendation);
      const shuffledUpcoming = balancedShuffle(upcoming, playedSongTitlesRef.current);
      setActiveQueue([...played, ...shuffledUpcoming]);
      showToast("Standard Shuffle: Mengacak playlist via Mersenne Twister & Fewer Repeats");
    } else if (nextMode === "smart") {
      if (originalQueueRef.current.length === 0) {
        originalQueueRef.current = [...activeQueue];
      }
      const played = activeQueue.slice(0, activeQueueIndex + 1);
      const upcoming = activeQueue
        .slice(activeQueueIndex + 1)
        .filter((t) => !t.isSmartRecommendation);
      const shuffledUpcoming = balancedShuffle(upcoming, playedSongTitlesRef.current);

      const discovery = getSmartShuffleCandidates(
        currentTrack,
        activeQueue,
        playedSongTitlesRef.current,
        userTaste,
        {
          related: relatedQueue,
          topIndo: indonesiaTop50,
          mostPlayed: mostPlayedIndonesia,
          globalTrending: globalTrending
        },
        Math.max(3, Math.ceil(shuffledUpcoming.length / 2)),
        dislikedSongIds,
        userTasteVector
      );

      const woven: any[] = [];
      let cIdx = 0;
      shuffledUpcoming.forEach((t, i) => {
        woven.push(t);
        if ((i + 1) % 2 === 0 && cIdx < discovery.length) {
          woven.push(discovery[cIdx++]);
        }
      });
      while (cIdx < discovery.length && woven.length < 25) {
        woven.push(discovery[cIdx++]);
      }

      setActiveQueue([...played, ...woven]);
      showToast("Smart Shuffle aktif: Mengacak dan menyisipkan rekomendasi sesuai selera!");
    } else {
      // Off: Restore original queue
      if (originalQueueRef.current.length > 0) {
        const curTitle = (currentTrack.title || "").toLowerCase().trim();
        const cleanedOriginal = originalQueueRef.current.filter((t) => !t.isSmartRecommendation);
        const curIdx = cleanedOriginal.findIndex(
          (t) => (t.title || "").toLowerCase().trim() === curTitle
        );
        if (curIdx !== -1) {
          setActiveQueue(cleanedOriginal);
          setActiveQueueIndex(curIdx);
        } else {
          const played = activeQueue.slice(0, activeQueueIndex + 1).filter((t) => !t.isSmartRecommendation);
          const upcoming = cleanedOriginal.filter(
            (t) => !played.some((p) => p.title.toLowerCase() === t.title.toLowerCase())
          );
          setActiveQueue([...played, ...upcoming]);
        }
      } else {
        setActiveQueue((prev) => prev.filter((t) => !t.isSmartRecommendation));
      }
      showToast("Shuffle dimatikan: Kembali ke urutan playlist asli");
    }
  };

  const isCurrentTrackLiked = likedSongIds.includes(currentTrack.id);

  const savePlaylists = (playlists: UserPlaylist[]) => {
    setUserPlaylists(playlists);
    try {
      localStorage.setItem("brnsic_user_playlists", JSON.stringify(playlists));
    } catch (e) {}
    if (currentUser) {
      const token = typeof window !== "undefined" ? localStorage.getItem("brnsic_auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      fetch("/api/user/sync", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ playlists, replacePlaylists: true })
      }).catch(() => {});
    }
  };

  // Google Auth Handler (Supports Native Supabase Google OAuth SSO + Email Fallback)
  const handleGoogleSignIn = async (customEmail?: string) => {
    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      // 1. Check if Supabase Google OAuth SSO is enabled (opens accounts.google.com account picker)
      const isNative =
        isInsideNativeApk ||
        (typeof window !== "undefined" && Boolean((window as any).BrnsicNative)) ||
        (typeof navigator !== "undefined" && navigator.userAgent.includes("BrnsicNative")) ||
        (window as any).Capacitor?.getPlatform?.() === "android";

      const oauthRes = await fetch(`/api/auth/google/oauth?platform=${isNative ? "native_apk" : "web"}`).catch(() => null);
      if (oauthRes && oauthRes.ok) {
        const oauthData = await oauthRes.json();
        if (oauthData.url && oauthData.enabled) {
          if (typeof window !== "undefined" && (window as any).BrnsicNative?.openExternalAuth) {
            (window as any).BrnsicNative.openExternalAuth(oauthData.url);
            setIsAuthSubmitting(false);
            return;
          }

          // Open Google OAuth in a popup window so accounts.google.com NEVER enters this tab's history!
          const width = 500;
          const height = 650;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          const popup = window.open(
            oauthData.url,
            "BrnsicGoogleLogin",
            `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1`
          );

          if (popup) {
            // Popup opened! postMessage listener handles the rest
            return;
          }

          // Fallback if popup is blocked
          window.location.replace(oauthData.url);
          return;
        }
      }

      // 2. If Google OAuth toggle is not enabled in Supabase yet, prompt for Gmail input
      const targetEmail = (customEmail || googleEmail).trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes("@")) {
        setAuthError("Masukkan alamat email Gmail kamu, atau aktifkan Google Provider di Supabase.");
        setIsAuthSubmitting(false);
        return;
      }

      // 3. Direct Google Sign In with the user's REAL email (no password needed)
      const targetName = targetEmail.split("@")[0].replace(/[._-]/g, " ");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(targetEmail)}`
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || "Gagal masuk dengan Google");
        return;
      }

      setCurrentUser(data.user);
      try {
        localStorage.setItem("brnsic_user_profile", JSON.stringify(data.user));
      } catch (e) {}
      setIsAuthModalOpen(false);
      setGoogleEmail("");

      if (data.token) {
        try {
          localStorage.setItem("brnsic_auth_token", data.token);
        } catch (e) {}
      }

      try {
        localStorage.setItem("brnsic_last_gmail", targetEmail);
      } catch (e) {}

      if (data.user?.taste) {
        setUserTaste(data.user.taste);
        const dbVector = buildUserTasteVector(
          data.user.taste.likedArtists || [],
          data.user.selectedGenres || Object.keys(data.user.taste.genreWeights || {})
        );
        setUserTasteVector(dbVector);
        try {
          localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(data.user.taste));
        } catch (e) {}
      }

      if (Array.isArray(data.user?.playlists) && data.user.playlists.length > 0) {
        setUserPlaylists(data.user.playlists);
        try {
          localStorage.setItem("brnsic_user_playlists", JSON.stringify(data.user.playlists));
        } catch (e) {}
      } else if (userPlaylists.length > 0) {
        try {
          fetch("/api/user/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(data.token ? { Authorization: `Bearer ${data.token}` } : {})
            },
            credentials: "include",
            body: JSON.stringify({
              likedSongs: likedSongIds.length > 0 ? likedSongIds : undefined,
              playlists: userPlaylists,
              taste: userTaste
            })
          }).catch(() => {});
        } catch (e) {}
      }

      if (Array.isArray(data.user?.likedSongs) && data.user.likedSongs.length > 0) {
        setLikedSongIds(data.user.likedSongs);
        try {
          localStorage.setItem("brnsic_liked_songs", JSON.stringify(data.user.likedSongs));
        } catch (e) {}
      }

      showToast(`Selamat datang, ${data.user.name}! Akun Google terhubung`);

      if (!data.user?.onboardingCompleted && !localStorage.getItem("brnsic_onboarding_done")) {
        setIsOnboardingModalOpen(true);
      }
    } catch (err: any) {
      setAuthError("Koneksi gagal. Coba beberapa saat lagi.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Email & Password Auth Handler (Login & Register)
  const handleEmailAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    if (!authEmail || !authEmail.includes("@")) {
      setAuthError("Masukkan alamat email yang valid");
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError("Kata sandi minimal 6 karakter");
      return;
    }
    if (authMode === "register" && !authName.trim()) {
      setAuthError("Nama lengkap wajib diisi");
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: any = {
        email: authEmail.trim().toLowerCase(),
        password: authPassword
      };
      if (authMode === "register") {
        payload.name = authName.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || "Gagal masuk");
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem("brnsic_auth_token", data.token);
        } catch (e) {}
      }

      if (data.user) {
        setCurrentUser(data.user);
        try {
          localStorage.setItem("brnsic_user_profile", JSON.stringify(data.user));
        } catch (e) {}
        if (data.user.taste) {
          setUserTaste(data.user.taste);
          const dbVector = buildUserTasteVector(
            data.user.taste.likedArtists || [],
            data.user.selectedGenres || Object.keys(data.user.taste.genreWeights || {})
          );
          setUserTasteVector(dbVector);
        }
        if (Array.isArray(data.user.likedSongs)) {
          setLikedSongIds(data.user.likedSongs);
          try {
            localStorage.setItem("brnsic_liked_songs", JSON.stringify(data.user.likedSongs));
          } catch (e) {}
        }
        if (Array.isArray(data.user.playlists)) {
          setUserPlaylists(data.user.playlists);
          try {
            localStorage.setItem("brnsic_user_playlists", JSON.stringify(data.user.playlists));
          } catch (e) {}
        }
        if (!data.user.onboardingCompleted && !localStorage.getItem("brnsic_onboarding_done")) {
          setIsOnboardingModalOpen(true);
        }
        showToast(`Selamat datang, ${data.user.name}!`);
      }
    } catch (err) {
      setAuthError("Gagal menghubungi server. Periksa koneksi internet.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Logout Handler (Stops audio, purges auth token & cached data, locks to Welcome Gate)
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    try {
      localStorage.removeItem("brnsic_auth_token");
      localStorage.removeItem("brnsic_user_profile");
      localStorage.removeItem("brnsic_liked_songs");
      localStorage.removeItem("brnsic_user_playlists");
      localStorage.removeItem("brnsic_user_taste_v1");
    } catch (e) {}
    try {
      if (ytPlayerRef.current?.stopVideo) {
        ytPlayerRef.current.stopVideo();
      }
      if ((window as any).BrnsicNative?.pauseAudio) {
        (window as any).BrnsicNative.pauseAudio();
      }
    } catch (e) {}
    setIsPlaying(false);
    isPlayingRef.current = false;
    hasUserStartedPlaybackRef.current = false;
    setHasUserStartedPlayback(false);
    setCurrentUser(null);
    setLikedSongIds([]);
    setUserPlaylists([]);
    setIsProfileDropdownOpen(false);
    setIsProfileModalOpen(false);
    showToast("Berhasil keluar dari akun.");
  };

  // Cold-Start Onboarding Submit Handler (Saves to state, LocalStorage & Supabase DB)
  const handleOnboardingSubmit = async () => {
    if (selectedOnboardingArtists.length + selectedOnboardingGenres.length < 3) {
      showToast("Pilih minimal 3 artis atau genre favorit untuk melanjutkan");
      return;
    }
    setIsOnboardingSubmitting(true);
    try {
      const nextArtistWeights = { ...userTaste.artistWeights };
      selectedOnboardingArtists.forEach((a) => {
        nextArtistWeights[a] = (nextArtistWeights[a] || 0) + 6;
      });

      const nextGenreWeights = { ...(userTaste.genreWeights || {}) };
      selectedOnboardingGenres.forEach((g) => {
        nextGenreWeights[g] = (nextGenreWeights[g] || 0) + 6;
      });

      const persona = derivePersona(nextArtistWeights, selectedOnboardingGenres);
      const updatedTaste: TasteProfile = {
        ...userTaste,
        persona,
        artistWeights: nextArtistWeights,
        genreWeights: nextGenreWeights,
        likedArtists: Array.from(new Set([...userTaste.likedArtists, ...selectedOnboardingArtists])),
        selectedGenres: selectedOnboardingGenres
      };

      setUserTaste(updatedTaste);
      const nextVector = buildUserTasteVector(
        Array.from(new Set([...userTaste.likedArtists, ...selectedOnboardingArtists])),
        selectedOnboardingGenres
      );
      setUserTasteVector(nextVector);

      localStorage.setItem("brnsic_user_taste_v1", JSON.stringify(updatedTaste));
      localStorage.setItem("brnsic_onboarding_done", "true");

      if (currentUser) {
        await fetch("/api/user/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedArtists: selectedOnboardingArtists,
            selectedGenres: selectedOnboardingGenres
          })
        }).catch(() => {});
      }

      setIsOnboardingModalOpen(false);
      showToast(`Preferensi tersimpan! Selera: ${persona}`);

      // Re-order queue with Deep Learning Latent Factor scoring so current session immediately matches their taste!
      setActiveQueue((prev) => {
        if (prev.length <= 1) return prev;
        const current = prev[activeQueueIndex] || prev[0];
        const rest = prev.filter((_, idx) => idx !== activeQueueIndex);

        const ranked = rankTracksByDeepLearning(
          nextVector,
          rest,
          recentHistoryRef.current,
          dislikedSongIds,
          rest.length
        );

        return [current, ...ranked];
      });
    } catch (e) {
      localStorage.setItem("brnsic_onboarding_done", "true");
      setIsOnboardingModalOpen(false);
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handleDismissOnboarding = () => {
    setIsOnboardingModalOpen(false);
    try {
      localStorage.setItem("brnsic_onboarding_done", "true");
    } catch (e) {}
    if (currentUser) {
      fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedArtists: selectedOnboardingArtists,
          selectedGenres: selectedOnboardingGenres
        })
      }).catch(() => {});
    }
  };

  const handleCreatePlaylist = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast("Masuk dengan akun Google untuk membuat playlist");
      return;
    }
    if (!newPlaylistName.trim()) return;
    const newPl: UserPlaylist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      description: "Playlist Pribadi",
      songs: [],
      createdAt: Date.now()
    };
    const updated = [...userPlaylists, newPl];
    savePlaylists(updated);
    setNewPlaylistName("");
    setIsCreatePlaylistModalOpen(false);
    setActiveCustomPlaylist(newPl);
    setCurrentView("custom-playlist");
  };

  const openCustomPlaylist = (pl: any) => {
    setActiveCustomPlaylist(pl);
    setCurrentView("custom-playlist");
  };

  const handleSharePlaylist = () => {
    if (!activeCustomPlaylist) return;
    const shareUrl = `${window.location.origin}/?playlist=${encodeURIComponent(activeCustomPlaylist.id)}`;

    if (navigator.share) {
      navigator.share({
        title: activeCustomPlaylist.name,
        text: `Dengarkan playlist "${activeCustomPlaylist.name}" di Brnsic!`,
        url: shareUrl
      }).catch(() => {
        try {
          navigator.clipboard?.writeText(shareUrl);
          showToast("Tautan playlist berhasil disalin ke clipboard!");
        } catch (e) {}
      });
    } else {
      try {
        navigator.clipboard.writeText(shareUrl);
        showToast("Tautan playlist berhasil disalin ke clipboard! Kirimkan ke temanmu.");
      } catch (e) {
        showToast(`Tautan: ${shareUrl}`);
      }
    }
  };

  const handleSaveSharedPlaylist = () => {
    if (!activeCustomPlaylist) return;
    if (userPlaylists.some((p) => p.id === activeCustomPlaylist.id)) {
      showToast("Playlist ini sudah ada di koleksimu");
      return;
    }
    const clonedPl: UserPlaylist = {
      ...activeCustomPlaylist,
      id: `pl-${Date.now()}`
    };
    const nextList = [...userPlaylists, clonedPl];
    savePlaylists(nextList);
    setActiveCustomPlaylist(clonedPl);
    showToast(`Playlist "${clonedPl.name}" berhasil disimpan ke koleksimu!`);
  };

  const handleAddSongToPlaylist = (playlistId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast("Masuk dengan akun Google untuk menambahkan lagu ke playlist");
      return;
    }
    if (!songToAddToPlaylist) return;
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        const exists = pl.songs.some((s) => s.title.toLowerCase() === songToAddToPlaylist.title.toLowerCase());
        if (!exists) {
          return {
            ...pl,
            cover: pl.cover || songToAddToPlaylist.cover,
            songs: [...pl.songs, songToAddToPlaylist]
          };
        }
      }
      return pl;
    });
    savePlaylists(updated);
    setSongToAddToPlaylist(null);
  };

  const handleRemoveSongFromPlaylist = (playlistId: string, songId: string) => {
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          songs: pl.songs.filter((s) => s.id !== songId)
        };
      }
      return pl;
    });
    savePlaylists(updated);
    if (activeCustomPlaylist && activeCustomPlaylist.id === playlistId) {
      setActiveCustomPlaylist(updated.find((p) => p.id === playlistId) || null);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const updated = userPlaylists.filter((pl) => pl.id !== playlistId);
    savePlaylists(updated);
    if (activeCustomPlaylist?.id === playlistId) {
      setActiveCustomPlaylist(null);
      setCurrentView("home");
    }
  };

  // 4. Fetch Real-Time Charts on Mount
  const loadTrendingData = async () => {
    try {
      const res = await fetch("/api/trending");
      if (res.ok) {
        const data = await res.json();
        if (data.indonesiaTop50 && data.indonesiaTop50.length > 0) {
          setIndonesiaTop50(data.indonesiaTop50);
          // Initialize activeQueue to Top 50 if currently small
          setActiveQueue((prev) => (prev.length <= 5 ? data.indonesiaTop50 : prev));
        }
        if (data.mostPlayedIndonesia && data.mostPlayedIndonesia.length > 0)
          setMostPlayedIndonesia(data.mostPlayedIndonesia);
        if (data.viralIndonesia && data.viralIndonesia.length > 0) setViralIndonesia(data.viralIndonesia);
        if (data.globalTrending && data.globalTrending.length > 0) setGlobalTrending(data.globalTrending);
        if (data.popularArtists && data.popularArtists.length > 0) setPopularArtists(data.popularArtists);
        const now = new Date();
        setLastChartUpdated(`${now.getHours()}:${now.getMinutes() < 10 ? "0" : ""}${now.getMinutes()}`);
      }
    } catch (err) {
      console.error("Failed to load trending music data", err);
    }
  };

  useEffect(() => {
    loadTrendingData();
  }, []);

  // 5. Initialize YouTube Iframe API Once on Root Player
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        const targetNode = document.getElementById("master-yt-player");
        if (!targetNode) {
          setTimeout(initPlayer, 100);
          return;
        }

        const initialVid =
          currentTrackRef.current?.youtubeId ||
          currentTrack.youtubeId ||
          getVerifiedVideoId(currentTrack.title, currentTrack.artist) ||
          pendingVideoIdRef.current ||
          "";

        ytPlayerRef.current = new window.YT.Player("master-yt-player", {
          host: "https://www.youtube.com",
          videoId: initialVid,
          playerVars: {
            autoplay: 0, // Starts PAUSED! No sudden blast of sound!
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "https://brnsic.vercel.app"
          },
          events: {
            onReady: (event: any) => {
              setIsLoadingSong(false);
              try {
                event.target.unMute();
                event.target.setVolume(volume * 100);
                if (pendingVideoIdRef.current) {
                  activeVideoIdRef.current = pendingVideoIdRef.current;
                  event.target.loadVideoById({
                    videoId: pendingVideoIdRef.current,
                    startSeconds: 0
                  });
                  event.target.playVideo();
                  pendingVideoIdRef.current = null;
                } else if (initialVid) {
                  activeVideoIdRef.current = initialVid;
                }
              } catch (e) {}
            },
            onError: (event: any) => {
              setIsLoadingSong(false);
              console.warn("YouTube player event error:", event.data);
              // CRITICAL: NEVER automatically advance on initial page load before user has pressed play!
              if (!hasUserStartedPlaybackRef.current) {
                return;
              }

              // Guard against rapid skipping loop on network or embed failures
              consecutiveErrorsRef.current += 1;
              if (consecutiveErrorsRef.current >= 3) {
                console.warn("[BrnsicGuard] Stopped auto-skipping: 3 consecutive playback errors.");
                setIsPlaying(false);
                isPlayingRef.current = false;
                showToast("Tidak dapat memutar lagu saat ini. Coba pilih lagu lain.");
                return;
              }

              // Attempt to recover using candidates array or fresh lookup
              if (availableCandidatesRef.current.length > candidateIndexRef.current + 1) {
                candidateIndexRef.current += 1;
                const nextVid = availableCandidatesRef.current[candidateIndexRef.current];
                if (nextVid && ytPlayerRef.current?.loadVideoById) {
                  lastTrackChangeTimeRef.current = Date.now();
                  ytPlayerRef.current.loadVideoById({ videoId: nextVid, startSeconds: 0 });
                  ytPlayerRef.current.playVideo();
                  return;
                }
              }

              const recoveringSong = currentTrackRef.current?.title;
              fetch(
                `/api/youtube?artist=${encodeURIComponent(currentTrackRef.current?.artist || "")}&title=${encodeURIComponent(
                  recoveringSong || ""
                )}&q=${encodeURIComponent(`${currentTrackRef.current?.artist || ""} ${recoveringSong || ""}`)}&duration=${currentTrackRef.current?.duration || 210}`
              )
                .then((r) => r.json())
                .then((d) => {
                  if (d.candidates && Array.isArray(d.candidates) && d.candidates.length > 0) {
                    availableCandidatesRef.current = d.candidates;
                    candidateIndexRef.current = 0;
                  }
                  if (d.videoId && d.videoId !== currentTrackRef.current?.youtubeId && ytPlayerRef.current) {
                    lastTrackChangeTimeRef.current = Date.now();
                    ytPlayerRef.current.loadVideoById({ videoId: d.videoId, startSeconds: 0 });
                    ytPlayerRef.current.playVideo();
                    return;
                  }
                  setTimeout(() => {
                    if (currentTrackRef.current?.title === recoveringSong) {
                      handleTrackEnded("player-error-fallback");
                    }
                  }, 2500);
                })
                .catch(() => {
                  setTimeout(() => {
                    if (currentTrackRef.current?.title === recoveringSong) {
                      handleTrackEnded("player-error-catch");
                    }
                  }, 2500);
                });
            },
            onStateChange: (event: any) => {
              setIsLoadingSong(false);
              if (event.data === 1) {
                // Playing: Audio has successfully started
                isUserExplicitlyPausedRef.current = false;
                setIsPlaying(true);
                isPlayingRef.current = true;
                hasTriggeredEndRef.current = false; // Safely unlock end trigger now that track is actively playing
                consecutiveErrorsRef.current = 0; // Reset error streak on successful playback
                startBackgroundKeepalive();

                // CLIENT-SIDE RUNTIME AUDIO WATCHDOG:
                // Instantly detect and abort non-music videos (> 20 minutes news podcasts / streams)
                try {
                  const actualDur = ytPlayerRef.current?.getDuration?.();
                  if (
                    Date.now() - lastTrackChangeTimeRef.current > 4000 &&
                    typeof actualDur === "number" &&
                    actualDur > 1200
                  ) {
                    console.warn("Disallowed long-form non-music video (>20m) detected on player:", actualDur);
                    ytPlayerRef.current?.stopVideo?.();
                    showToast("Audio tidak sesuai terdeteksi, memulihkan ke versi resmi...");
                    if (availableCandidatesRef.current.length > candidateIndexRef.current + 1) {
                      candidateIndexRef.current += 1;
                      const nextVid = availableCandidatesRef.current[candidateIndexRef.current];
                      if (nextVid && ytPlayerRef.current?.loadVideoById) {
                        lastTrackChangeTimeRef.current = Date.now();
                        ytPlayerRef.current.loadVideoById({ videoId: nextVid, startSeconds: 0 });
                        ytPlayerRef.current.playVideo();
                        return;
                      }
                    }
                    setTimeout(() => {
                      if (playNextSongRef.current) playNextSongRef.current(false);
                    }, 2000);
                    return;
                  }
                } catch (e) {}
              } else if (event.data === 2) {
                // Paused - Check if paused legitimately at or near the end of track!
                try {
                  const curr = ytPlayerRef.current?.getCurrentTime?.() || 0;
                  const dur = ytPlayerRef.current?.getDuration?.() || 0;
                  if (
                    Date.now() - lastTrackChangeTimeRef.current > 8000 &&
                    dur > 20 &&
                    curr > 15 &&
                    curr >= dur - 1.5
                  ) {
                    handleTrackEnded("youtube-paused-at-eof");
                    return;
                  }
                } catch (e) {}

                // CRITICAL SHIELD: If pause was NOT triggered by the user clicking pause
                // (e.g. Chromium / Android OS background keepalive):
                const isNative =
                  (typeof window !== "undefined" && Boolean((window as any).BrnsicNative)) ||
                  (typeof navigator !== "undefined" && navigator.userAgent.includes("BrnsicNative")) ||
                  (window as any).Capacitor?.getPlatform?.() === "android";

                if (isNative && !isUserExplicitlyPausedRef.current && isPlayingRef.current) {
                  // Do NOT kill the native background service! Immediately resume playback!
                  try {
                    if (activeVideoIdRef.current) {
                      ytPlayerRef.current?.playVideo?.();
                    }
                  } catch (e) {}
                  return;
                }

                // For Web & iOS Safari: update state cleanly so Lock Screen widget shows the ▶ Play button properly!
                setIsPlaying(false);
                isPlayingRef.current = false;
                if (typeof window !== "undefined" && "mediaSession" in navigator) {
                  try {
                    navigator.mediaSession.playbackState = "paused";
                  } catch (e) {}
                }
                stopBackgroundKeepalive();
              } else if (event.data === 0) {
                // Ended naturally by YouTube engine
                if (
                  hasUserStartedPlaybackRef.current &&
                  Date.now() - lastTrackChangeTimeRef.current > 6000
                ) {
                  handleTrackEnded("youtube-ended-event");
                }
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 6. Precise Audio Time & Real Duration Polling (Intelligent Adaptive Interval)
  useEffect(() => {
    // Only poll ultra-fast (50ms) if user is actively viewing lyrics or the expanded seekbar player!
    // When browsing / scrolling the home screen, poll at 1000ms so scrolling never drops frames!
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const isHighPrecisionNeeded = isMobilePlayerOpen || isZoomed || mobileTab === "lyrics" || isDesktop;
    const pollInterval = (isMobilePlayerOpen || isZoomed || mobileTab === "lyrics") ? 50 : isDesktop ? 100 : 1000;

    const timer = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const state = ytPlayerRef.current.getPlayerState ? ytPlayerRef.current.getPlayerState() : -1;
          if (state === 1 || state === 3) {
            const exactSeconds = ytPlayerRef.current.getCurrentTime();
            if (typeof exactSeconds === "number" && !isNaN(exactSeconds)) {
              currentTimeRef.current = exactSeconds;
              // Only trigger React state re-render if user actually sees the time/seekbar!
              // When browsing the home screen on mobile, time is updated in ref with ZERO re-render cost!
              const isTimeVisible = isMobilePlayerOpen || isZoomed || mobileTab === "lyrics" || (typeof window !== "undefined" && window.innerWidth >= 768);
              if (isTimeVisible) {
                setCurrentTime(exactSeconds);
              }
            }

            // Sync true live duration directly from active audio player
            if (typeof ytPlayerRef.current.getDuration === "function") {
              const liveDur = ytPlayerRef.current.getDuration();
              if (
                typeof liveDur === "number" &&
                liveDur > 5 &&
                liveDur <= 720 &&
                Math.abs(liveDur - (currentTrack.duration || 0)) > 1
              ) {
                const roundedDur = Math.round(liveDur);
                setCurrentTrack((prev) => ({
                  ...prev,
                  duration: roundedDur
                }));
                if (typeof window !== "undefined" && (window as any).BrnsicNative?.updateNativePlaybackState) {
                  try {
                    (window as any).BrnsicNative.updateNativePlaybackState(
                      true,
                      Math.round(currentTimeRef.current * 1000),
                      roundedDur * 1000
                    );
                  } catch (e) {}
                }
                // Real-time sync to playlists/charts so the list UI duration also updates immediately!
                setIndonesiaTop50((prev) =>
                  prev.map((t) => (t.title === currentTrack.title ? { ...t, duration: roundedDur } : t))
                );
                setActiveQueue((prev) =>
                  prev.map((t) => (t.title === currentTrack.title ? { ...t, duration: roundedDur } : t))
                );
              }
            }

            const effectiveDur =
              (typeof ytPlayerRef.current.getDuration === "function" && ytPlayerRef.current.getDuration()) ||
              currentTrack.duration ||
              210;

            // Automatically log "complete" (+3 taste boost) when listened past 80% duration
            if (
              !hasLoggedCompletionRef.current &&
              effectiveDur > 25 &&
              exactSeconds / effectiveDur >= 0.8
            ) {
              hasLoggedCompletionRef.current = true;
              recordTasteInteraction(currentTrack, "complete");
            }

            // Bulletproof Auto-Advance: only if actively playing and safely near the end of full track
            if (
              state === 1 &&
              !hasTriggeredEndRef.current &&
              hasUserStartedPlaybackRef.current &&
              Date.now() - lastTrackChangeTimeRef.current > 8000 &&
              effectiveDur > 20 &&
              exactSeconds > 15 &&
              exactSeconds >= effectiveDur - 1.0
            ) {
              handleTrackEnded("polling-dur-threshold");
            }
          }
        } catch (e) {}
      }
    }, pollInterval);

    return () => clearInterval(timer);
  }, [currentTrack, isMobilePlayerOpen, isZoomed, mobileTab]);

  // Instantly sync currentTime the moment fullscreen player or lyrics is opened
  useEffect(() => {
    if (isMobilePlayerOpen || isZoomed || mobileTab === "lyrics") {
      setCurrentTime(currentTimeRef.current);
    }
  }, [isMobilePlayerOpen, isZoomed, mobileTab]);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // 8. System MediaSession Integration (Lock screen, notifications, headsets)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      const coverUrl = currentTrack.cover?.startsWith("http")
        ? currentTrack.cover
        : `https://brnsic.vercel.app${currentTrack.cover || "/app-icon.png"}`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Brnsic",
        artwork: [
          { src: coverUrl, sizes: "96x96", type: "image/png" },
          { src: coverUrl, sizes: "128x128", type: "image/png" },
          { src: coverUrl, sizes: "192x192", type: "image/png" },
          { src: coverUrl, sizes: "256x256", type: "image/png" },
          { src: coverUrl, sizes: "512x512", type: "image/png" }
        ]
      });

      navigator.mediaSession.setActionHandler("play", () => {
        isUserExplicitlyPausedRef.current = false;
        isPlayingRef.current = true;
        setIsPlaying(true);
        startBackgroundKeepalive();
        const currentTarget = currentTrackRef.current || currentTrack;
        const expectedVid = currentTarget?.youtubeId || (currentTarget ? getVerifiedVideoId(currentTarget.title, currentTarget.artist) : null);
        if (
          !hasSessionPlaybackStartedRef.current ||
          !activeVideoIdRef.current ||
          (expectedVid && activeVideoIdRef.current !== expectedVid)
        ) {
          hasSessionPlaybackStartedRef.current = true;
          if (currentTarget) {
            playAnySong(currentTarget, true);
            return;
          }
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
          try {
            ytPlayerRef.current.unMute?.();
            ytPlayerRef.current.setVolume?.(volume * 100);
            ytPlayerRef.current.playVideo();
          } catch (e) {}
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        isUserExplicitlyPausedRef.current = true;
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopBackgroundKeepalive();
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => playPrevSong());
      navigator.mediaSession.setActionHandler("nexttrack", () => playNextSong(true));
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          handleSeekSeconds(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        handleSeekSeconds(Math.max(0, currentTime - 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        handleSeekSeconds(Math.min(currentTrack.duration, currentTime + 10));
      });
    } catch (e) {}
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      } catch (e) {}
    }
    if (isPlaying) {
      startBackgroundKeepalive();
    } else {
      stopBackgroundKeepalive();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "mediaSession" in navigator &&
      "setPositionState" in navigator.mediaSession &&
      currentTrack.duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, currentTrack.duration),
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(currentTrack.duration, Math.max(0, currentTime))
        });
      } catch (e) {}
    }
  }, [isPlaying, currentTrack.title, currentTrack.duration]);

  // Universal Player: Plays ANY song with Stale Race-Condition Guard & Taste Intelligence
  const playAnySong = async (
    rawSong: any,
    userInitiated = true
  ) => {
    if (!rawSong) {
      playNextSong();
      return;
    }

    hasLoggedCompletionRef.current = false;
    hasTriggeredEndRef.current = true; // Locked until new song actively reaches PLAYING state
    lastTrackChangeTimeRef.current = Date.now();
    const currentRequestId = ++playRequestIdRef.current;

    if (userInitiated) {
      hasUserStartedPlaybackRef.current = true;
      setHasUserStartedPlayback(true);
    }

    const song = normalizeSong(rawSong);

    // Dynamic Learning: Record play in user's on-device taste profile
    recordTasteInteraction(song, "play");

    // 1. Direct user interaction: immediately un-mute
    if (userInitiated && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }

    setIsLoadingSong(true);
    setCurrentTime(0);
    if (song.title) {
      playedSongTitlesRef.current.add(song.title.toLowerCase().trim());
    }

    const optimisticTrack: Track = { ...song };
    setCurrentTrack(optimisticTrack);
    currentTrackRef.current = optimisticTrack;
    try {
      localStorage.setItem("brnsic_cached_track", JSON.stringify(optimisticTrack));
      localStorage.setItem("brnsic_has_user_played", "true");
    } catch (e) {}

    // Fetch related songs asynchronously
    fetch(`/api/related?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`)
      .then((r) => r.json())
      .then((d) => {
        if (currentRequestId !== playRequestIdRef.current) return;
        if (d.related && d.related.length > 0) {
          const freshRelated = d.related.filter((item: any) => {
            const title = (item.title || item.trackName || "").toLowerCase().trim();
            const id = item.id || item.trackId;
            const isPlayed = playedSongTitlesRef.current.has(title);
            const isDisliked = dislikedSongIds.includes(id) || dislikedSongIds.includes(title);
            return !isPlayed && !isDisliked;
          });
          const safeRelated = freshRelated.length > 0 ? freshRelated : d.related.filter((item: any) => {
            const title = (item.title || item.trackName || "").toLowerCase().trim();
            const id = item.id || item.trackId;
            return !dislikedSongIds.includes(id) && !dislikedSongIds.includes(title);
          });
          setRelatedQueue(safeRelated);
        }
      })
      .catch(() => {});

    // Instant Audio Playback: Verified studio master priority over stale video IDs!
    const directVid = getVerifiedVideoId(song.title, song.artist) || song.youtubeId;
    const startAudio = (vid: string) => {
      if (currentRequestId !== playRequestIdRef.current) return;
      lastTrackChangeTimeRef.current = Date.now();
      hasTriggeredEndRef.current = true; // Kept locked until player fires PLAYING (1) event
      hasSessionPlaybackStartedRef.current = true;
      isUserExplicitlyPausedRef.current = false;
      const updatedTrack: Track = { ...optimisticTrack, ...song, youtubeId: vid };
      setCurrentTrack(updatedTrack);
      currentTrackRef.current = updatedTrack;
      try {
        localStorage.setItem("brnsic_cached_track", JSON.stringify(updatedTrack));
        localStorage.setItem("brnsic_has_user_played", "true");
      } catch (e) {}
      setIsPlaying(true);
      isPlayingRef.current = true;
      startWebAudioKeepalive();

      const isNative = typeof window !== "undefined" && Boolean((window as any).BrnsicNative?.playAudio);

      // 1. Android Native Service Audio Playback (real MediaPlayer with MediaSessionCompat in BackgroundAudioService)
      if (isNative) {
        try {
          if ((window as any).BrnsicNative?.isPermissionGranted && !(window as any).BrnsicNative.isPermissionGranted()) {
            (window as any).BrnsicNative.requestPermissions();
          }
          if ((window as any).BrnsicNative?.isOverlayPermissionGranted && !(window as any).BrnsicNative.isOverlayPermissionGranted()) {
            (window as any).BrnsicNative.requestOverlayPermission();
            showToast("Aktifkan izin 'Tampilkan di atas aplikasi lain' agar Dynamic Island muncul di Home Screen");
          }
          const durMs = Math.round((song.duration || optimisticTrack.duration || 210) * 1000);
          if ((window as any).BrnsicNative?.playAudioWithDuration) {
            (window as any).BrnsicNative.playAudioWithDuration(
              "",
              song.title || "Brnsic Music",
              song.artist || "Memutar di latar belakang",
              0,
              song.cover || optimisticTrack.cover || "",
              durMs
            );
          } else {
            (window as any).BrnsicNative.playAudio(
              "",
              song.title || "Brnsic Music",
              song.artist || "Memutar di latar belakang",
              0,
              song.cover || optimisticTrack.cover || ""
            );
          }
        } catch (e) {}
      }

      // 2. Web Player / UI & Audio Sync
      activeVideoIdRef.current = vid;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: vid,
            startSeconds: 0
          });
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
          ytPlayerRef.current.playVideo();
          setTimeout(() => setIsLoadingSong(false), 1500);
        } catch (e) {
          console.error("Audio playback error", e);
          setIsLoadingSong(false);
        }
      } else {
        pendingVideoIdRef.current = vid;
        setTimeout(() => setIsLoadingSong(false), 1500);
      }
    };

    if (directVid) {
      availableCandidatesRef.current = [directVid];
      candidateIndexRef.current = 0;
      startAudio(directVid);
    } else {
      fetch(
        `/api/youtube?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(
          song.title
        )}&q=${encodeURIComponent(`${song.artist} ${song.title}`)}&duration=${song.duration || 210}`
      )
        .then((r) => r.json())
        .then(async (d) => {
          if (currentRequestId !== playRequestIdRef.current) return;
          if (d.candidates && Array.isArray(d.candidates) && d.candidates.length > 0) {
            availableCandidatesRef.current = d.candidates;
            candidateIndexRef.current = 0;
          }
          if (d.videoId) {
            startAudio(d.videoId);
          } else {
            // Direct client-side device lookup fallback (handles any edge server issues)
            try {
              const clientRes = await fetch("https://www.youtube.com/youtubei/v1/search", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-YouTube-Client-Name": "1",
                  "X-YouTube-Client-Version": "2.20240401.00.00"
                },
                body: JSON.stringify({
                  context: { client: { clientName: "WEB", clientVersion: "2.20240401.00.00", hl: "id", gl: "ID" } },
                  query: `${song.artist} ${song.title} audio`
                })
              });
              if (clientRes.ok) {
                const clientData = await clientRes.json();
                const str = JSON.stringify(clientData);
                const match = /"videoId":"([a-zA-Z0-9_-]{11})"/.exec(str);
                if (match && match[1]) {
                  startAudio(match[1]);
                  return;
                }
              }
            } catch (ce) {}

            consecutiveErrorsRef.current += 1;
            setIsLoadingSong(false);
            if (consecutiveErrorsRef.current >= 3) {
              setIsPlaying(false);
              showToast("Koneksi bermasalah atau audio tidak tersedia");
              return;
            }
            showToast(`Audio resmi "${song.title}" sedang disiapkan`);
          }
        })
        .catch(async () => {
          // Direct client-side device lookup fallback
          try {
            const clientRes = await fetch("https://www.youtube.com/youtubei/v1/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": "2.20240401.00.00"
              },
              body: JSON.stringify({
                context: { client: { clientName: "WEB", clientVersion: "2.20240401.00.00", hl: "id", gl: "ID" } },
                query: `${song.artist} ${song.title} audio`
              })
            });
            if (clientRes.ok) {
              const clientData = await clientRes.json();
              const str = JSON.stringify(clientData);
              const match = /"videoId":"([a-zA-Z0-9_-]{11})"/.exec(str);
              if (match && match[1]) {
                startAudio(match[1]);
                return;
              }
            }
          } catch (ce) {}

          consecutiveErrorsRef.current += 1;
          setIsLoadingSong(false);
          if (consecutiveErrorsRef.current >= 3) {
            setIsPlaying(false);
            showToast("Koneksi bermasalah atau audio tidak tersedia");
            return;
          }
          showToast(`Gagal memuat audio "${song.title}"`);
        });
    }

    // Instant optimistic lyrics, followed by verified studio-synced lyrics from API
    if (song.lyrics && song.lyrics.length > 5) {
      setCurrentTrack((prev) => ({ ...prev, lyrics: song.lyrics }));
    }
    fetch(`/api/lyrics?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}&duration=${song.duration || 210}`)
      .then((r) => r.json())
      .then((d) => {
        if (currentRequestId !== playRequestIdRef.current) return;
        if (d.lyrics && d.lyrics.length > 0) {
          setCurrentTrack((prev) => ({ ...prev, lyrics: d.lyrics }));
        }
      })
      .catch(() => {});
  };

  // Play a song from a specific list (Album, Playlist, Chart) setting activeQueue context
  const handlePlayFromList = (song: any, list: any[], index: number, isAlbum = false) => {
    hasUserStartedPlaybackRef.current = true;
    setHasUserStartedPlayback(true);
    const normalizedList = (list || []).map((item) => normalizeSong(item));
    originalQueueRef.current = [...normalizedList];
    const safeIndex = index >= 0 && index < normalizedList.length ? index : 0;
    const targetSong = normalizedList[safeIndex] || normalizeSong(song);

    if (shuffleMode === "off") {
      activeQueueRef.current = normalizedList;
      activeQueueIndexRef.current = safeIndex;
      setActiveQueue(normalizedList);
      setActiveQueueIndex(safeIndex);
    } else if (shuffleMode === "standard") {
      const others = normalizedList.filter((_, i) => i !== safeIndex);
      const shuffledOthers = balancedShuffle(others, playedSongTitlesRef.current);
      const nextQ = [targetSong, ...shuffledOthers];
      activeQueueRef.current = nextQ;
      activeQueueIndexRef.current = 0;
      setActiveQueue(nextQ);
      setActiveQueueIndex(0);
    } else if (shuffleMode === "smart") {
      const others = normalizedList.filter((_, i) => i !== safeIndex);
      const shuffledOthers = balancedShuffle(others, playedSongTitlesRef.current);
      const discovery = getSmartShuffleCandidates(
        targetSong,
        [targetSong, ...shuffledOthers],
        playedSongTitlesRef.current,
        userTaste,
        {
          related: relatedQueue,
          topIndo: indonesiaTop50,
          mostPlayed: mostPlayedIndonesia,
          globalTrending: globalTrending
        },
        Math.max(3, Math.ceil(shuffledOthers.length / 2)),
        dislikedSongIds
      );
      const woven: any[] = [];
      let cIdx = 0;
      shuffledOthers.forEach((t, i) => {
        woven.push(t);
        if ((i + 1) % 2 === 0 && cIdx < discovery.length) {
          woven.push(discovery[cIdx++]);
        }
      });
      while (cIdx < discovery.length) {
        woven.push(discovery[cIdx++]);
      }
      const nextQ = [targetSong, ...woven];
      activeQueueRef.current = nextQ;
      activeQueueIndexRef.current = 0;
      setActiveQueue(nextQ);
      setActiveQueueIndex(0);
    }

    if (!isAlbum) {
      isAlbumLoopModeRef.current = false;
      setIsAlbumLoopMode(false);
    }
    playAnySong(targetSong, true);
  };

  // Play a single song (e.g. from Home or Search) and immediately build an expansive smart radio queue
  const handlePlaySingleSongWithRadio = async (song: any) => {
    hasUserStartedPlaybackRef.current = true;
    setHasUserStartedPlayback(true);
    isAlbumLoopModeRef.current = false;
    setIsAlbumLoopMode(false);
    repeatModeRef.current = "off";
    setRepeatMode("off");
    playAnySong(song, true);

    // Initial queue starting with this song
    activeQueueRef.current = [song];
    activeQueueIndexRef.current = 0;
    setActiveQueue([song]);
    setActiveQueueIndex(0);

    try {
      const res = await fetch(
        `/api/related?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`
      );
      if (res.ok) {
        const data = await res.json();
        const rawRelated = Array.isArray(data.related) ? data.related : [];
        const incomingRelated = rawRelated.filter((item: any) => {
          const title = (item.title || item.trackName || "").toLowerCase().trim();
          const id = item.id || item.trackId;
          return !dislikedSongIds.includes(id) && !dislikedSongIds.includes(title);
        });
        setRelatedQueue(incomingRelated);

        // Spotify-grade Artist & Genre Radio Queue:
        // If we have strong matching tracks from this artist and related circle (5+ tracks),
        // keep the queue strictly aligned with this musical style without diluting it with unrelated catalogs!
        let radioQueue: any[] = [];
        if (incomingRelated.length >= 5) {
          radioQueue = [song, ...incomingRelated];
        } else {
          const candidatePool = [
            ...incomingRelated,
            ...(globalTrending || []),
            ...(indonesiaTop50 || []),
            ...(mostPlayedIndonesia || [])
          ];

          const cleanSongTitle = (song.title || song.trackName || "").toLowerCase().trim();
          const rankedDiscovery = rankTracksByDeepLearning(
            userTasteVector,
            candidatePool,
            [cleanSongTitle, ...recentHistoryRef.current],
            dislikedSongIds,
            30
          );
          radioQueue = [song, ...rankedDiscovery];
        }

        activeQueueRef.current = radioQueue;
        setActiveQueue(radioQueue);
        try {
          localStorage.setItem("brnsic_cached_queue", JSON.stringify(radioQueue.slice(0, 40)));
        } catch (e) {}
      }
    } catch (e) {}
  };

  // Feature: Add to Queue as Next Song (Putar Berikutnya)
  const addToNextQueue = (rawTrack: any) => {
    const song = normalizeSong(rawTrack);
    const currentQ = activeQueueRef.current && activeQueueRef.current.length > 0 ? [...activeQueueRef.current] : [...activeQueue];
    const currentIdx = activeQueueIndexRef.current;
    const nextQ = [
      ...currentQ.slice(0, currentIdx + 1),
      song,
      ...currentQ.slice(currentIdx + 1)
    ];
    activeQueueRef.current = nextQ;
    setActiveQueue(nextQ);
    try {
      localStorage.setItem("brnsic_cached_queue", JSON.stringify(nextQ.slice(0, 40)));
    } catch (e) {}
    showToast(`"${song.title}" akan diputar berikutnya`);
  };

  // Feature: Add to Queue at End (Tambahkan ke Antrean)
  const addToQueueEnd = (rawTrack: any) => {
    const song = normalizeSong(rawTrack);
    const currentQ = activeQueueRef.current && activeQueueRef.current.length > 0 ? [...activeQueueRef.current] : [...activeQueue];
    const nextQ = [...currentQ, song];
    activeQueueRef.current = nextQ;
    setActiveQueue(nextQ);
    try {
      localStorage.setItem("brnsic_cached_queue", JSON.stringify(nextQ.slice(0, 40)));
    } catch (e) {}
    showToast(`"${song.title}" ditambahkan ke antrean`);
  };

  // Feature: Shuffle Play Entire Playlist (Acak Lagu di Playlist)
  const handleShufflePlayPlaylist = (songs: any[]) => {
    if (!songs || songs.length === 0) return;
    const normalized = songs.map((s) => normalizeSong(s));
    const shuffled = balancedShuffle(normalized, playedSongTitlesRef.current);
    originalQueueRef.current = [...normalized];
    activeQueueRef.current = shuffled;
    activeQueueIndexRef.current = 0;
    setActiveQueue(shuffled);
    setActiveQueueIndex(0);
    setShuffleMode("standard");
    playAnySong(shuffled[0], true);
    showToast(`Mengacak ${songs.length} lagu di playlist`);
  };

  // Open Album View & Fetch Tracklist
  const openAlbumView = async (albumName: string, artistName: string, collectionId?: number | string) => {
    setIsLoadingSong(true);
    try {
      const url = collectionId
        ? `/api/album?collectionId=${collectionId}`
        : `/api/album?album=${encodeURIComponent(albumName)}&artist=${encodeURIComponent(artistName)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlbumData(data);
        setCurrentView("album");
      }
    } catch (err) {
      console.error("Failed to load album", err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Play Album with options
  const playAlbumFull = (albumInfo: any, tracks: any[], loop = false) => {
    if (!tracks || tracks.length === 0) return;
    const normalized = tracks.map((t) => normalizeSong(t));
    originalQueueRef.current = [...normalized];
    setActiveAlbumTracks(normalized);
    isAlbumLoopModeRef.current = loop;
    setIsAlbumLoopMode(loop);
    repeatModeRef.current = loop ? "all" : "off";
    setRepeatMode(loop ? "all" : "off");

    if (shuffleMode === "off") {
      activeQueueRef.current = normalized;
      activeQueueIndexRef.current = 0;
      setActiveQueue(normalized);
      setActiveQueueIndex(0);
      playAnySong(normalized[0]);
    } else if (shuffleMode === "standard") {
      const first = normalized[0];
      const others = normalized.slice(1);
      const shuffled = balancedShuffle(others, playedSongTitlesRef.current);
      const albumQ = [first, ...shuffled];
      activeQueueRef.current = albumQ;
      activeQueueIndexRef.current = 0;
      setActiveQueue(albumQ);
      setActiveQueueIndex(0);
      playAnySong(first);
    } else {
      const first = normalized[0];
      const others = normalized.slice(1);
      const shuffled = balancedShuffle(others, playedSongTitlesRef.current);
      const discovery = getSmartShuffleCandidates(
        first,
        [first, ...shuffled],
        playedSongTitlesRef.current,
        userTaste,
        {
          related: relatedQueue,
          topIndo: indonesiaTop50,
          mostPlayed: mostPlayedIndonesia,
          globalTrending: globalTrending
        },
        Math.max(2, Math.ceil(shuffled.length / 2)),
        dislikedSongIds
      );
      const woven: any[] = [];
      let cIdx = 0;
      shuffled.forEach((t, i) => {
        woven.push(t);
        if ((i + 1) % 2 === 0 && cIdx < discovery.length) {
          woven.push(discovery[cIdx++]);
        }
      });
      while (cIdx < discovery.length) woven.push(discovery[cIdx++]);
      const albumQ = [first, ...woven];
      activeQueueRef.current = albumQ;
      activeQueueIndexRef.current = 0;
      setActiveQueue(albumQ);
      setActiveQueueIndex(0);
      playAnySong(first);
    }
  };

  // INFINITE NEXT SONG ENGINE WITH TASTE PREFERENCE SCORING
  const playNextSong = (userTriggered = true) => {
    // 0. User early-skip behavioral penalty (if user intentionally skipped in first 15 seconds)
    if (userTriggered && currentTrack && currentTime < 15 && currentTime >= 1) {
      recordTasteInteraction(currentTrack, "skip");
    }

    const currentMode = repeatModeRef.current;
    const currentQ = activeQueueRef.current && activeQueueRef.current.length > 0 ? activeQueueRef.current : activeQueue;
    const currentIdx = activeQueueIndexRef.current;
    const isLoopAlbum = isAlbumLoopModeRef.current;

    // 1. If Repeat 1 (Single Track) is active, replay current song from 0
    if (currentMode === "one") {
      recordTasteInteraction(currentTrack, "replay");
      setCurrentTime(0);
      hasTriggeredEndRef.current = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      }
      return;
    }

    // 2. If inside active queue and not at the last track
    if (currentQ && currentQ.length > 0) {
      let nextIdx = currentIdx + 1;
      // Skip any candidate in upcoming queue that the user has disliked!
      while (nextIdx < currentQ.length) {
        const item = currentQ[nextIdx];
        const isDisliked = item && (
          dislikedSongIds.includes(item.id) ||
          dislikedSongIds.includes((item.title || item.trackName || "").toLowerCase().trim())
        );
        if (!isDisliked) break;
        nextIdx++;
      }

      if (nextIdx < currentQ.length) {
        const candidate = currentQ[nextIdx];
        if (candidate) {
          activeQueueIndexRef.current = nextIdx;
          setActiveQueueIndex(nextIdx);
          playAnySong(candidate, userTriggered);

          // If in Smart Shuffle mode and upcoming queue is getting low (<= 3 tracks left),
          // dynamically generate and append more smart recommendations so music never stops!
          if (shuffleMode === "smart" && currentQ.length - nextIdx <= 3) {
            const freshSmartCandidates = getSmartShuffleCandidates(
              candidate,
              currentQ,
              playedSongTitlesRef.current,
              userTaste,
              {
                related: relatedQueue,
                topIndo: indonesiaTop50,
                mostPlayed: mostPlayedIndonesia,
                globalTrending: globalTrending
              },
              4,
              dislikedSongIds
            );
            if (freshSmartCandidates.length > 0) {
              const updated = [...currentQ, ...freshSmartCandidates];
              activeQueueRef.current = updated;
              setActiveQueue(updated);
            }
          }
          return;
        }
      } else {
        // Reached the end of activeQueue!
        if (currentMode === "all" || isLoopAlbum) {
          let loopIdx = 0;
          while (loopIdx < currentQ.length) {
            const item = currentQ[loopIdx];
            const isDisliked = item && (
              dislikedSongIds.includes(item.id) ||
              dislikedSongIds.includes((item.title || item.trackName || "").toLowerCase().trim())
            );
            if (!isDisliked) break;
            loopIdx++;
          }
          if (loopIdx < currentQ.length) {
            activeQueueIndexRef.current = loopIdx;
            setActiveQueueIndex(loopIdx);
            playAnySong(currentQ[loopIdx], userTriggered);
            return;
          }
        }
      }
    }

    // 3. Repeat is OFF: Continue seamlessly to a BRAND NEW, UNPLAYED song weighted by Deep Learning vector taste!
    const markPlayed = (track: any) => {
      const title = (track.title || track.trackName || "").toLowerCase().trim();
      if (title) {
        recentHistoryRef.current.push(title);
        if (recentHistoryRef.current.length > 40) {
          recentHistoryRef.current.shift();
        }
      }
    };

    // A. Pick next unplayed from related recommendations & candidate pool via Deep Learning UCB1
    const candidatePool = (relatedQueue && relatedQueue.length >= 4)
      ? [...relatedQueue]
      : [
          ...(relatedQueue || []),
          ...(globalTrending || []),
          ...(indonesiaTop50 || []),
          ...(mostPlayedIndonesia || []),
          ...(viralIndonesia || [])
        ];

    const currentTitle = (currentTrack.title || "").toLowerCase().trim();
    const rankedCandidates = rankTracksByDeepLearning(
      userTasteVector,
      candidatePool,
      [currentTitle, ...recentHistoryRef.current],
      dislikedSongIds,
      12
    );

    if (rankedCandidates.length > 0) {
      // Pick with slight stochastic top-choice sampling (top 3) to prevent determinism
      const topChoices = rankedCandidates.slice(0, Math.min(3, rankedCandidates.length));
      const nextSong = topChoices[Math.floor(Math.random() * topChoices.length)];
      markPlayed(nextSong);
      const nextQ = [...currentQ, nextSong];
      const nextIdx = nextQ.length - 1;
      activeQueueRef.current = nextQ;
      activeQueueIndexRef.current = nextIdx;
      setActiveQueue(nextQ);
      setActiveQueueIndex(nextIdx);
      playAnySong(nextSong, userTriggered);
      return;
    }

    // B. If all tracks played, reset session history and pick a track different from current
    playedSongTitlesRef.current = new Set([currentTitle]);
    const fallbackPool = relatedQueue.length > 0 ? relatedQueue : (indonesiaTop50.length > 0 ? indonesiaTop50 : globalTrending);
    const fallbackList = (fallbackPool.length > 0 ? fallbackPool : [currentTrack]).filter(
      (t) => !dislikedSongIds.includes(t.id) && !dislikedSongIds.includes((t.title || "").toLowerCase().trim())
    );
    const unvisited = fallbackList.filter((t) => !recentHistoryRef.current.includes((t.title || "").toLowerCase().trim()));
    const validChoices = unvisited.length > 0 ? unvisited : fallbackList;
    const fallbackNext =
      validChoices[Math.floor(Math.random() * validChoices.length)] || currentTrack;

    markPlayed(fallbackNext);
    const fallbackQ = [...currentQ, fallbackNext];
    const fallbackIdx = fallbackQ.length - 1;
    activeQueueRef.current = fallbackQ;
    activeQueueIndexRef.current = fallbackIdx;
    setActiveQueue(fallbackQ);
    setActiveQueueIndex(fallbackIdx);
    playAnySong(fallbackNext, userTriggered);
  };

  // Keep playNextSongRef up to date across all renders
  playNextSongRef.current = playNextSong;

  const playPrevSong = () => {
    if (currentTime > 4) {
      setCurrentTime(0);
      hasTriggeredEndRef.current = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(0, true);
      }
      return;
    }

    const currentQ = activeQueueRef.current && activeQueueRef.current.length > 0 ? activeQueueRef.current : activeQueue;
    const currentIdx = activeQueueIndexRef.current;
    if (currentQ && currentQ.length > 0) {
      let prevIdx = currentIdx - 1;
      while (prevIdx >= 0) {
        const item = currentQ[prevIdx];
        const isDisliked = item && (
          dislikedSongIds.includes(item.id) ||
          dislikedSongIds.includes((item.title || item.trackName || "").toLowerCase().trim())
        );
        if (!isDisliked) break;
        prevIdx--;
      }
      if (prevIdx < 0) {
        prevIdx = 0;
      }
      activeQueueIndexRef.current = prevIdx;
      setActiveQueueIndex(prevIdx);
      playAnySong(currentQ[prevIdx], false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchTopResult(null);
    setSearchArtists([]);
    setSearchAlbums([]);
    setSearchSuggestions([]);
    setSearchFilterTab("all");
    setSearchCorrectedQuery(null);
    setIsSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  // SPOTIFY-LIKE INSTANT SEARCH WITH FUZZY & TYPO MATCHING (0ms Client Response!)
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      handleClearSearch();
      return;
    }

    setCurrentView("search");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileNavTab("search");
    }

    // 1. Instant 0ms Client-Side Fuzzy Matching (No waiting for network!)
    const cleanQ = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const qTokens = cleanQ.split(" ").filter(Boolean);

    const clientPool = [
      ...POPULAR_SEARCH_CATALOG,
      ...topArtistShelfTracks.map((s) => ({
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        youtubeId: s.youtubeId,
        tags: [s.title.toLowerCase(), s.artist.toLowerCase()]
      })),
      ...globalTrending.map((s) => ({
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        youtubeId: s.youtubeId,
        tags: [s.title.toLowerCase(), s.artist.toLowerCase()]
      })),
      ...indonesiaTop50.map((s) => ({
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        youtubeId: s.youtubeId,
        tags: [s.title.toLowerCase(), s.artist.toLowerCase()]
      })),
      ...mostPlayedIndonesia.map((s) => ({
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        youtubeId: s.youtubeId,
        tags: [s.title.toLowerCase(), s.artist.toLowerCase()]
      }))
    ];

    const instantMatches = clientPool.filter((item) => {
      const t = item.title.toLowerCase();
      const a = item.artist.toLowerCase();
      const tags = (item as any).tags || [];

      // Substring match
      if (t.includes(cleanQ) || a.includes(cleanQ)) return true;

      // Token overlap & typo distance (e.g. "matahri" matches "matahari")
      return qTokens.some((tok) => {
        if (tok.length < 2) return false;
        if (t.includes(tok) || a.includes(tok) || tags.some((tag: string) => tag.includes(tok))) return true;
        return tags.some((tag: string) => {
          if (Math.abs(tag.length - tok.length) > 2) return false;
          return tag.startsWith(tok.slice(0, 3)) || tok.startsWith(tag.slice(0, 3));
        });
      });
    }).map((item, idx) => ({
      trackId: `instant-${item.youtubeId || idx}`,
      trackName: item.title,
      artistName: item.artist,
      album: item.album || "Single",
      artworkUrl100: item.cover,
      duration: item.duration,
      youtubeId: item.youtubeId,
      source: "instant-popular"
    }));

    // Balanced Relevance Scorer: respects artist match, title match, and prefixes
    const scoreTitleFirst = (item: any, qStr: string, tokens: string[]) => {
      const t = (item.trackName || item.title || "").toLowerCase().trim();
      const a = (item.artistName || item.artist || "").toLowerCase().trim();

      if (a === qStr) return 3000;
      if (t === qStr) return 2500;
      if (a.startsWith(qStr)) return 2000;
      if (t.startsWith(qStr)) return 1800;
      if (a.includes(qStr)) return 1200;
      if (t.includes(qStr)) return 1000;

      const matchedTokensInTitle = tokens.filter((w) => t.includes(w));
      const matchedTokensInArtist = tokens.filter((w) => a.includes(w));
      return matchedTokensInArtist.length * 400 + matchedTokensInTitle.length * 300;
    };

    // Deduplicate instant matches
    const seen = new Set<string>();
    const uniqueInstant: any[] = [];
    for (const m of instantMatches) {
      const key = `${m.artistName.toLowerCase()} ${m.trackName.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueInstant.push(m);
      }
    }

    uniqueInstant.sort((x, y) => scoreTitleFirst(y, cleanQ, qTokens) - scoreTitleFirst(x, cleanQ, qTokens));

    setSearchResults(uniqueInstant);
    setIsSearching(true);

    // 2. Debounce background network search for expanded discovery & fuzzy correction
    searchDebounceRef.current = setTimeout(() => {
      performSearch(trimmed, uniqueInstant);
    }, 280);
  };

  const performSearch = async (query: string, existingInstant: any[] = []) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchTopResult(null);
      setSearchArtists([]);
      setSearchAlbums([]);
      setSearchSuggestions([]);
      setSearchCorrectedQuery(null);
      setIsSearching(false);
      return;
    }
    latestSearchQueryRef.current = q;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (latestSearchQueryRef.current !== q) return; // Stale keystroke response! Discard!
      const data = await res.json();
      if (latestSearchQueryRef.current === q) {
        if (data.correctedQuery) {
          setSearchCorrectedQuery(data.correctedQuery);
        } else {
          setSearchCorrectedQuery(null);
        }

        const fetchedSongs = data.songs || data.results || [];
        if (fetchedSongs.length > 0) {
          setSearchResults(fetchedSongs);
        } else if (existingInstant.length > 0) {
          setSearchResults(existingInstant);
        } else {
          setSearchResults([]);
        }

        setSearchTopResult(data.topResult || null);
        setSearchArtists(data.artists || []);
        setSearchAlbums(data.albums || []);
        setSearchSuggestions(data.suggestions || []);
      }
    } catch (err) {
      if (latestSearchQueryRef.current === q) {
        setSearchResults(existingInstant);
      }
    } finally {
      if (latestSearchQueryRef.current === q) {
        setIsSearching(false);
      }
    }
  };

  const playSearchedSong = (song: any, index: number) => {
    hasUserStartedPlaybackRef.current = true;
    setHasUserStartedPlayback(true);
    // Build an intelligent radio queue of related songs by this artist & recommendations,
    // instead of playing only other songs matching the raw search query keyword!
    handlePlaySingleSongWithRadio(song);
  };

  const handlePlayArtistTopResult = (artistItem: any) => {
    hasUserStartedPlaybackRef.current = true;
    setHasUserStartedPlayback(true);
    if (artistItem.topTracks && artistItem.topTracks.length > 0) {
      handlePlayFromList(artistItem.topTracks[0], artistItem.topTracks, 0);
    } else {
      const matchingSong = searchResults.find(
        (s) => (s.artistName || "").toLowerCase().includes((artistItem.title || artistItem.name || "").toLowerCase())
      ) || searchResults[0];
      if (matchingSong) {
        handlePlaySingleSongWithRadio(matchingSong);
      }
    }
  };

  const togglePlay = () => {
    hasUserStartedPlaybackRef.current = true;
    setHasUserStartedPlayback(true);

    // Cold-Start & Video Desync Guard:
    // If opening the app fresh or player does not have the video for currentTrack loaded,
    // trigger playAnySong so background audio service, Dynamic Island, and stream start for this exact song!
    const currentTarget = currentTrackRef.current || currentTrack;
    const expectedVid = currentTarget?.youtubeId || (currentTarget ? getVerifiedVideoId(currentTarget.title, currentTarget.artist) : null);
    if (
      !hasSessionPlaybackStartedRef.current ||
      !activeVideoIdRef.current ||
      (expectedVid && activeVideoIdRef.current !== expectedVid)
    ) {
      hasSessionPlaybackStartedRef.current = true;
      if (currentTarget) {
        playAnySong(currentTarget, true);
        return;
      }
    }

    if (!ytPlayerRef.current) {
      setIsPlaying(!isPlaying);
      isPlayingRef.current = !isPlaying;
      return;
    }
    try {
      if (isPlaying) {
        isUserExplicitlyPausedRef.current = true;
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopBackgroundKeepalive();
        if (typeof window !== "undefined" && (window as any).BrnsicNative?.pauseAudio) {
          try {
            (window as any).BrnsicNative.pauseAudio();
          } catch (e) {}
        }
        if (typeof ytPlayerRef.current.pauseVideo === "function") {
          ytPlayerRef.current.pauseVideo();
        }
      } else {
        isUserExplicitlyPausedRef.current = false;
        isPlayingRef.current = true;
        setIsPlaying(true);
        startBackgroundKeepalive();
        if (typeof window !== "undefined" && (window as any).BrnsicNative?.resumeAudio) {
          try {
            (window as any).BrnsicNative.resumeAudio();
          } catch (e) {}
        }
        if (typeof ytPlayerRef.current.playVideo === "function") {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
          ytPlayerRef.current.playVideo();
        }
      }
    } catch (e) {
      setIsPlaying(!isPlaying);
      isPlayingRef.current = !isPlaying;
    }
  };

  const getActiveDuration = () => {
    try {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === "function") {
        const d = ytPlayerRef.current.getDuration();
        if (typeof d === "number" && d > 5) return Math.round(d);
      }
    } catch (e) {}
    return Math.max(1, currentTrack.duration || 215);
  };

  const handleSeekSeconds = (targetSeconds: number) => {
    const totalDuration = getActiveDuration();
    const safeSec = Math.max(0, Math.min(totalDuration, targetSeconds));
    setCurrentTime(safeSec);
    if (typeof window !== "undefined" && (window as any).BrnsicNative?.seekAudio) {
      try {
        (window as any).BrnsicNative.seekAudio(Math.round(safeSec * 1000));
      } catch (e) {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(safeSec, true);
    }
    if (typeof window !== "undefined" && "mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: totalDuration,
          playbackRate: isPlaying ? 1 : 0,
          position: safeSec
        });
      } catch (e) {}
    }
  };
  handleSeekSecondsRef.current = handleSeekSeconds;

  const handleSeekFromClientX = (clientX: number, rect: DOMRect) => {
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = clickX / rect.width;
    const totalDuration = getActiveDuration();
    const targetSeconds = Math.round(pct * totalDuration);
    setCurrentTime(targetSeconds);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(targetSeconds, true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeekFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchSeek = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      handleSeekFromClientX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
    }
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(pct);
    setIsMuted(false);
    if (typeof window !== "undefined" && (window as any).BrnsicNative?.setVolume) {
      try {
        (window as any).BrnsicNative.setVolume(pct);
      } catch (err) {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      ytPlayerRef.current.unMute();
      ytPlayerRef.current.setVolume(pct * 100);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== "undefined" && (window as any).BrnsicNative?.setVolume) {
      try {
        (window as any).BrnsicNative.setVolume(nextMuted ? 0 : volume);
      } catch (err) {}
    }
    if (ytPlayerRef.current) {
      if (nextMuted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Precise lyric index with calibrated vocal anticipation offset (perfect vocal sync, no delay, exact studio timing)
  let activeLyricIdx = 0;
  const vocalTime = currentTime + 0.05;
  currentTrack.lyrics.forEach((line, idx) => {
    if (vocalTime >= line.time) activeLyricIdx = idx;
  });

  // Smoothly center active lyric line WITHOUT rapid 100ms jitter/glitching
  useEffect(() => {
    if (userIsScrollingLyrics) return;

    const smoothCenter = (container: HTMLElement | null, el: HTMLElement | null) => {
      if (!container || !el) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const currentScroll = container.scrollTop;
      const targetTop =
        currentScroll + (elRect.top - containerRect.top) - containerRect.height / 2 + elRect.height / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    };

    if (mobileTab === "lyrics" && mobileActiveLyricRef.current && mobileLyricsScrollRef.current) {
      smoothCenter(mobileLyricsScrollRef.current, mobileActiveLyricRef.current);
    }

    if (isZoomed && zoomedActiveLyricRef.current && zoomedLyricsScrollRef.current) {
      smoothCenter(zoomedLyricsScrollRef.current, zoomedActiveLyricRef.current);
    }
  }, [activeLyricIdx, isZoomed, isMobilePlayerOpen, mobileTab, userIsScrollingLyrics]);

  const handleUserScroll = () => {
    setUserIsScrollingLyrics(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrollingLyrics(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-[100vw] h-screen bg-black text-white flex flex-col p-0 md:p-2 gap-2 overflow-x-hidden overflow-y-hidden font-sans select-none relative">
      
      {/* ====================================================================
          O. MANDATORY AUTHENTICATION: FULLSCREEN WELCOME GATE (OPSI A)
          ==================================================================== */}
      {isAuthChecking ? (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center select-none animate-fadeIn">
          <div className="relative flex flex-col items-center justify-center gap-5">
            <div className="absolute w-72 h-72 bg-[#1ed760]/15 rounded-full blur-[90px] pointer-events-none animate-pulse" />
            <img
              src="/app-icon.png"
              alt="Brnsic"
              className="w-20 h-20 rounded-2xl object-contain shadow-2xl relative z-10"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-ping" />
              <span className="text-xs text-[#b3b3b3] font-bold tracking-widest uppercase">
                Menghubungkan Akun...
              </span>
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="fixed inset-0 z-[110] bg-black text-white flex flex-col justify-between p-6 sm:p-12 overflow-y-auto no-scrollbar font-sans select-none animate-fadeIn">
          {/* Top Brand Bar */}
          <div className="flex items-center w-full max-w-md mx-auto">
            <div className="flex items-center gap-2.5">
              <img src="/app-icon.png" alt="Brnsic" className="w-8 h-8 rounded-lg object-contain shadow" />
              <span className="font-black text-lg text-white">Brnsic</span>
            </div>
          </div>

          {/* Center Hero Content */}
          <div className="relative flex flex-col items-center text-center max-w-sm w-full mx-auto my-auto py-8">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#1ed760]/10 rounded-full blur-[100px] pointer-events-none" />

            <img
              src="/splash-logo.png"
              alt="Brnsic"
              className="w-56 sm:w-64 object-contain relative z-10 drop-shadow-[0_0_35px_rgba(255,255,255,0.35)] mb-4"
            />

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10">
              Musikmu. Tanpa Batas.
            </h1>
            <p className="text-xs text-[#b3b3b3] mt-2 max-w-xs leading-relaxed relative z-10">
              Masuk ke akun untuk menikmati jutaan lagu resmi, lirik tersinkronisasi, dan playlist cerdas.
            </p>

            {authError && (
              <div className="w-full mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center animate-fadeIn relative z-10">
                {authError}
              </div>
            )}

            {/* Auth Actions Container */}
            <div className="w-full flex flex-col gap-3 mt-6 relative z-10">
              {/* Primary 1-Click Google Sign In */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={isAuthSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-neutral-100 active:scale-95 text-black font-extrabold text-sm flex items-center justify-center gap-3 transition shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAuthSubmitting ? "Membuka Google..." : "Lanjutkan dengan Google"}</span>
              </button>

              {/* Subtle Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">atau email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email Form Switcher */}
              <div className="flex bg-[#121212] p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setAuthError(null); }}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${authMode === "login" ? "bg-white text-black shadow" : "text-white/60 hover:text-white"}`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setAuthError(null); }}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${authMode === "register" ? "bg-white text-black shadow" : "text-white/60 hover:text-white"}`}
                >
                  Daftar Baru
                </button>
              </div>

              {/* Email Form Inputs */}
              <form onSubmit={handleEmailAuthSubmit} className="flex flex-col gap-2.5 mt-1">
                {authMode === "register" && (
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs text-white placeholder-white/40 outline-none focus:border-[#1ed760] transition"
                  />
                )}
                <input
                  type="email"
                  placeholder="Alamat Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs text-white placeholder-white/40 outline-none focus:border-[#1ed760] transition"
                  required
                />
                <input
                  type="password"
                  placeholder="Kata Sandi (min. 6 karakter)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs text-white placeholder-white/40 outline-none focus:border-[#1ed760] transition"
                  required
                />
                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-3 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-95 text-black font-extrabold text-xs transition shadow-[0_0_20px_rgba(30,215,96,0.3)] mt-1 cursor-pointer disabled:opacity-50"
                >
                  {isAuthSubmitting
                    ? "Memproses..."
                    : authMode === "register"
                    ? "Buat Akun Baru"
                    : "Masuk ke Akun"}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="w-full max-w-sm mx-auto text-center">
            <p className="text-[11px] text-[#666] leading-relaxed">
              Dengan masuk, preferensi playlist, lagu disukai, dan riwayat akan otomatis tersinkronisasi aman di cloud Brnsic.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ====================================================================
              0. INTRO SPLASH SCREEN (IMAGE 2)
              ==================================================================== */}
          {showSplash && (
            <div
              onClick={() => setShowSplash(false)}
              className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-700 animate-fadeIn"
            >
              <div className="relative flex flex-col items-center justify-center gap-6">
                <div className="absolute w-80 h-80 bg-white/[0.08] rounded-full blur-[100px] pointer-events-none" />
                <img
                  src="/splash-logo.png"
                  alt="Brnsic"
                  className="w-64 sm:w-80 object-contain relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.45)] transform hover:scale-105 transition"
                />
              </div>
            </div>
          )}

      {/* 
        MASTER YOUTUBE AUDIO ENGINE & CONTINUOUS BACKGROUND KEEPALIVE ANCHOR:
        Rendered with opacity: 1 behind the UI (zIndex: -50) so Blink/Chromium never throttles or suspends media decoding.
        Real audio stream holds OS hardware audio session so music plays uninterrupted in the background when switching apps or locking phone!
      */}
      <div
        className="fixed pointer-events-none"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: "240px",
          height: "180px",
          opacity: 1,
          zIndex: -50,
          pointerEvents: "none",
          overflow: "hidden"
        }}
      >
        <div id="master-yt-player" style={{ width: "240px", height: "180px" }}></div>
      </div>

      {/* ====================================================================
          1. TOP HEADER (DESKTOP & IPAD)
          ==================================================================== */}
      <header className="hidden md:flex h-14 items-center justify-between px-3 flex-shrink-0 z-40 bg-black">
        <div className="flex items-center gap-3.5 flex-1 max-w-[720px]">
          {/* Brnsic Logo & Wordmark (Image 2 & 3 Clean Fix) */}
          <div
            onClick={() => {
              setCurrentView("home");
              setSearchQuery("");
            }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition flex-shrink-0 pr-1"
            title="Brnsic Home"
          >
            <img
              src="/app-icon.png"
              alt="Brnsic Icon"
              className="w-8 h-8 rounded-lg object-contain shadow-md"
            />
            <span className="font-black text-xl tracking-tight text-white select-none hidden sm:inline-block">
              Brnsic
            </span>
          </div>

          <button
            onClick={() => {
              setCurrentView("home");
              setSearchQuery("");
            }}
            className="w-10 h-10 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] hover:scale-105 transition flex items-center justify-center flex-shrink-0"
            title="Beranda"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" />
            </svg>
          </button>

          {/* Instant Live Search Input */}
          <div className="flex-1 relative flex items-center">
            <svg
              className="absolute left-4 text-[#b3b3b3] pointer-events-none"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="Cari lagu apa saja (misal: Bernadya, Hindia, Sal Priadi)..."
              value={searchQuery}
              onFocus={() => {
                if (currentView !== "search") setCurrentView("search");
              }}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  performSearch(searchQuery);
                }
              }}
              className="w-full h-11 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] focus:bg-[#1f1f1f] border border-transparent focus:border-white px-11 text-sm text-white placeholder-[#b3b3b3] outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white p-1.5 flex items-center justify-center transition"
                title="Hapus pencarian"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTrendingData}
            className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded-full transition flex items-center gap-1"
            title="Chart Diperbarui Otomatis setiap 15 menit via ISR Background Job"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]"></span>
            <span>Update: {lastChartUpdated}</span>
          </button>
          {!isInsideNativeApk && (
            <button
              onClick={handleInstallClick}
              className="w-9 h-9 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black transition flex items-center justify-center shadow-[0_0_15px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
              title="Download APK Resmi Brnsic (Android)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsCreatePlaylistModalOpen(true)}
            className="bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:scale-105 transition flex items-center gap-1.5 shadow"
          >
            <span>+ Buat Playlist</span>
          </button>

          {/* Account Profile Button (Pure Black & White, perfectly matching download button size) */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 border border-white/20 flex items-center justify-center transition active:scale-95 shadow cursor-pointer flex-shrink-0"
                title={`Profil: ${currentUser.name}`}
              >
                <span className="text-black font-black text-[16px] select-none leading-none">
                  {(currentUser.name?.[0] || currentUser.email?.[0] || "G").toUpperCase()}
                </span>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-12 w-48 bg-[#282828] rounded-md p-1 border border-white/10 shadow-2xl z-50 flex flex-col text-left animate-fadeIn">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Profil
                  </button>
                  <div className="h-[1px] bg-white/10 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthError(null);
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-full hover:scale-105 active:scale-95 transition shadow"
                title="Masuk via Google untuk simpan preferensi di Supabase cloud"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Login</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ====================================================================
          2. MAIN WORKSPACE (SEAMLESS PITCH BLACK)
          ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr_340px] gap-2 overflow-hidden relative z-10 px-0 md:px-0">
        
        {/* --- LEFT SIDEBAR (IPAD & DESKTOP) --- */}
        <aside className="hidden md:flex bg-black border border-white/10 rounded-lg p-3 flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[#b3b3b3] hover:text-white font-bold text-sm transition flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1.5-.866zM20 20h-4V4h4v16zm-10.5.134A1 1 0 0 0 8 19V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1.5.866zM7 18H3V6h4v12z" />
              </svg>
              Koleksi Kamu
            </span>
            <button
              onClick={() => setIsCreatePlaylistModalOpen(true)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
              title="Buat Playlist Baru"
            >
              +
            </button>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1">
            {/* Liked Songs Entry */}
            <div
              onClick={() => setCurrentView("liked")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "liked" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#1ed760] via-[#0f8b3c] to-[#053617] flex items-center justify-center text-black font-black text-xs flex-shrink-0 shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Lagu yang Disukai</div>
                <div className="text-xs text-[#b3b3b3]">{likedSongIds.length} lagu • Favorit</div>
              </div>
            </div>

            {/* Disliked / Hidden Songs Entry */}
            <div
              onClick={() => setCurrentView("disliked")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "disliked" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#e91429] via-[#8a121d] to-[#3a060b] flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Lagu Disembunyikan</div>
                <div className="text-xs text-[#b3b3b3]">{dislikedTracks.length} lagu • Tidak Disukai</div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10 my-1"></div>

            {/* User Custom Playlists */}
            {userPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setActiveCustomPlaylist(pl);
                  setCurrentView("custom-playlist");
                }}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                  currentView === "custom-playlist" && activeCustomPlaylist?.id === pl.id
                    ? "bg-[#282828]"
                    : "hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#1ed760] to-[#004724] flex items-center justify-center text-black font-black text-xs flex-shrink-0">
                  {pl.cover ? (
                    <img src={pl.cover} alt="cover" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{pl.name}</div>
                  <div className="text-xs text-[#b3b3b3]">{pl.songs.length} lagu • Playlist Kamu</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- CENTER MAIN CONTENT --- */}
        <main className="bg-black md:bg-black md:rounded-lg overflow-y-auto custom-scrollbar flex flex-col relative pb-32 md:pb-6 overflow-x-hidden">
          
          {/* MOBILE HEADER (BRNSIC MOBILE BRANDING) */}
          <div className="md:hidden flex flex-col gap-3 p-4 sticky top-0 z-30 bg-black border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/app-icon.png" alt="Brnsic" className="w-8 h-8 rounded-lg object-contain shadow" />
                <span className="font-black text-lg text-white">Brnsic</span>
              </div>
              <div className="flex items-center gap-2">
                {!isInsideNativeApk && (
                  <button
                    onClick={handleInstallClick}
                    className="w-8 h-8 rounded-full bg-[#1ed760] text-black hover:bg-[#1fdf64] shadow-[0_0_15px_rgba(30,215,96,0.4)] hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer flex-shrink-0"
                    title="Download APK Android"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                )}
                {currentUser ? (
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 border border-white/20 flex items-center justify-center transition active:scale-95 shadow cursor-pointer flex-shrink-0"
                    title={currentUser.name}
                  >
                    <span className="text-black font-black text-[15px] select-none leading-none">
                      {(currentUser.name?.[0] || currentUser.email?.[0] || "G").toUpperCase()}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setIsAuthModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-black bg-white text-black px-2.5 py-1 rounded-full shadow active:scale-95 transition"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filter Chips: HANYA DI BERANDA (HOME) */}
            {currentView === "home" && (
              <div
                className="flex items-center gap-2 w-full max-w-full overflow-x-auto no-scrollbar py-1 touch-pan-x flex-nowrap overscroll-x-contain select-none"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <button
                  onClick={() => {
                    setHomeFilter((prev) => (prev === "most-played" ? "all" : "most-played"));
                    setSelectedMood("all");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                    homeFilter === "most-played"
                      ? "bg-white text-black shadow-md"
                      : "bg-black border border-white/20 text-white/90 hover:text-white hover:border-white/40"
                  }`}
                >
                  Sering Diputar
                </button>
                <button
                  onClick={() => {
                    setHomeFilter((prev) => (prev === "viral" ? "all" : "viral"));
                    setSelectedMood("all");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                    homeFilter === "viral"
                      ? "bg-white text-black shadow-md"
                      : "bg-black border border-white/20 text-white/90 hover:text-white hover:border-white/40"
                  }`}
                >
                  Viral
                </button>
              </div>
            )}
          </div>

          {/* VIEW: DEDICATED ALBUM VIEW (ROUNDED ROWS FIX) */}
          {currentView === "album" && albumData && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-black via-black to-black md:to-black flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]">
                <img
                  src={albumData.album?.cover}
                  alt="album cover"
                  onError={handleImgError}
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-2xl object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Album Resmi
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {albumData.album?.title}
                  </h1>
                  <p className="text-sm font-semibold text-white/90">
                    {albumData.album?.artist} • {albumData.album?.releaseDate} • {albumData.tracks?.length} lagu
                  </p>
                  <p className="text-xs text-[#b3b3b3] mt-1">{albumData.album?.genre} • Brnsic Audio</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => playAlbumFull(albumData.album, albumData.tracks, false)}
                  className="px-6 py-3.5 rounded-full bg-[#1ed760] text-black font-extrabold text-sm flex items-center gap-2.5 hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer"
                  title="Putar Album Ini"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Putar Album Ini</span>
                </button>

                {/* Acak Album Button */}
                <button
                  onClick={() => handleShufflePlayPlaylist(albumData.tracks)}
                  className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[#1ed760] hover:text-white font-extrabold text-sm flex items-center gap-2 border border-white/15 hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer"
                  title="Acak Lagu di Album Ini (Shuffle Play)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                  <span>Acak Album</span>
                </button>

                <button
                  onClick={() => {
                    const nextLoop = !isAlbumLoopMode;
                    setIsAlbumLoopMode(nextLoop);
                    setRepeatMode(nextLoop ? "all" : "off");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition border flex items-center gap-2 ${
                    isAlbumLoopMode
                      ? "bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]"
                      : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <span>{isAlbumLoopMode ? "Mode Loop: Aktif (Berulang)" : "Mode Loop: Mati (Lanjut Lagu Lain)"}</span>
                </button>

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Tracklist - ROUNDED ROWS (USER IMAGE 1 REQUEST FIX) */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {albumData.tracks?.map((track: any, i: number) => {
                  const isCurrent = track.title === currentTrack.title;
                  return (
                    <div
                      key={track.id || i}
                      onClick={() => handlePlayFromList(track, albumData.tracks, i, isAlbumLoopMode)}
                      className={`grid grid-cols-[36px_1fr_auto_50px] sm:grid-cols-[40px_1fr_160px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                        isCurrent
                          ? "bg-white/15 text-white shadow-sm"
                          : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                      }`}
                    >
                      <div className="font-semibold text-xs text-center">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-3">
                            <span className="w-0.5 bg-[#1ed760] bar-1 rounded-full"></span>
                            <span className="w-0.5 bg-[#1ed760] bar-2 rounded-full"></span>
                            <span className="w-0.5 bg-[#1ed760] bar-3 rounded-full"></span>
                          </div>
                        ) : (
                          <span>{track.trackNumber || i + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-semibold text-sm truncate ${
                            isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                          }`}
                        >
                          {track.title}
                        </div>
                        <div className="text-xs text-[#b3b3b3] sm:hidden truncate">{track.artist}</div>
                      </div>

                      <div className="hidden sm:block text-xs truncate text-[#b3b3b3]">{track.artist}</div>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueueEnd(track);
                          }}
                          className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-medium transition cursor-pointer"
                          title="Tambahkan ke antrean"
                        >
                          + Antrean
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSongActionMenu({ song: track });
                          }}
                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                          title="Opsi lagu"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      </div>

                      <div className="text-right text-xs font-medium text-[#b3b3b3]">
                        {formatTime(track.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: USER CUSTOM PLAYLIST (ROUNDED ROWS FIX) */}
          {currentView === "custom-playlist" && activeCustomPlaylist && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#148a08] to-black md:to-black flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-2xl bg-gradient-to-br from-[#1ed760] to-[#004724] flex items-center justify-center text-white flex-shrink-0">
                  {activeCustomPlaylist.cover ? (
                    <img src={activeCustomPlaylist.cover} alt="cover" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-5xl font-black">B</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Playlist
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {activeCustomPlaylist.name}
                  </h1>
                  <p className="text-sm text-white/80">
                    Dibuat oleh {activeCustomPlaylist.creator?.name || "Kamu"} • {activeCustomPlaylist.songs.length} lagu
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center gap-3.5 flex-wrap">
                <button
                  onClick={() => {
                    if (activeCustomPlaylist.songs.length > 0) {
                      handlePlayFromList(activeCustomPlaylist.songs[0], activeCustomPlaylist.songs, 0);
                    }
                  }}
                  disabled={activeCustomPlaylist.songs.length === 0}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl disabled:opacity-40 cursor-pointer"
                  title="Putar Berurutan"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                {/* Button Acak Lagu di Playlist (Shuffle Play) */}
                <button
                  onClick={() => handleShufflePlayPlaylist(activeCustomPlaylist.songs)}
                  disabled={activeCustomPlaylist.songs.length === 0}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-[#1ed760] hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl border border-white/15 disabled:opacity-40 cursor-pointer"
                  title="Acak Lagu di Playlist (Shuffle Play)"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                </button>

                {/* Bagikan Playlist Button */}
                <button
                  onClick={handleSharePlaylist}
                  className="text-xs font-bold text-white hover:bg-white/20 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 transition cursor-pointer hover:scale-105 active:scale-95"
                  title="Bagikan Tautan Playlist"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Bagikan</span>
                </button>

                {/* If user is NOT the owner of this playlist, show "Simpan ke Koleksi Saya" */}
                {!userPlaylists.some((p) => p.id === activeCustomPlaylist.id) ? (
                  <button
                    onClick={handleSaveSharedPlaylist}
                    className="text-xs font-bold text-black bg-[#1ed760] hover:bg-[#1fdf64] px-4 py-2.5 rounded-full transition flex items-center gap-1.5 shadow cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>+ Simpan ke Koleksi Saya</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeletePlaylist(activeCustomPlaylist.id)}
                    className="text-xs font-bold text-red-400 hover:text-red-300 px-3.5 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                  >
                    Hapus Playlist
                  </button>
                )}

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Track List */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {activeCustomPlaylist.songs.length === 0 ? (
                  <div className="text-center py-16 text-[#b3b3b3]">
                    <p className="text-base font-bold text-white mb-1">Playlist ini masih kosong</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Cari lagu apa saja atau pilih dari chart lalu klik &quot;+ Playlist&quot; untuk menambahkan lagu favoritmu ke sini.
                    </p>
                  </div>
                ) : (
                  activeCustomPlaylist.songs.map((track: any, i: number) => {
                    const isCurrent = track.title === currentTrack.title;
                    return (
                      <div
                        key={track.id || i}
                        onClick={() => handlePlayFromList(track, activeCustomPlaylist.songs, i)}
                        className={`grid grid-cols-[36px_1fr_auto_40px_50px] sm:grid-cols-[40px_1fr_160px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                          isCurrent
                            ? "bg-white/15 text-white shadow-sm"
                            : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                        }`}
                      >
                        <div className="font-semibold text-xs text-center">{i + 1}</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.cover}
                            alt="thumb"
                            onError={handleImgError}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              className={`font-semibold text-sm truncate ${
                                isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                              }`}
                            >
                              {track.title}
                            </div>
                            <div className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                          </div>
                        </div>

                        <div className="hidden sm:block text-xs truncate text-[#b3b3b3]">{track.album}</div>

                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({
                                song: track,
                                playlistId: activeCustomPlaylist.id
                              });
                            }}
                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                            title="Opsi lagu"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>

                        <div className="text-right text-xs font-medium text-[#b3b3b3]">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW: LIKED SONGS (LAGU YANG DISUKAI) */}
          {currentView === "liked" && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#1ed760]/30 to-black md:to-black flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#1ed760]/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl bg-gradient-to-br from-[#1ed760] via-[#0f8b3c] to-[#053617] flex items-center justify-center text-black flex-shrink-0 relative z-10 shadow-[0_15px_40px_rgba(30,215,96,0.3)]">
                  <svg width="68" height="68" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left relative z-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Playlist Favorit
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    Lagu yang Disukai
                  </h1>
                  <p className="text-sm text-white/80">
                    {currentUser ? currentUser.name : "Koleksi Pribadi"} • {likedSongIds.length} lagu
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center gap-3.5 flex-wrap">
                {(() => {
                  const allLikedPool = [
                    currentTrack,
                    ...activeQueue,
                    ...relatedQueue,
                    ...topArtistShelfTracks,
                    ...mostPlayedIndonesia,
                    ...indonesiaTop50,
                    ...viralIndonesia,
                    ...globalTrending
                  ];
                  const seen = new Set<string>();
                  const likedList = allLikedPool.filter((s) => {
                    const songId = s.id || s.trackId;
                    if (songId && likedSongIds.includes(songId) && !seen.has(songId)) {
                      seen.add(songId);
                      return true;
                    }
                    return false;
                  });
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (likedList.length > 0) {
                            handlePlayFromList(likedList[0], likedList, 0);
                          }
                        }}
                        disabled={likedList.length === 0}
                        className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer disabled:opacity-40"
                        title="Putar Lagu yang Disukai"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>

                      {/* Button Acak Lagu yang Disukai */}
                      <button
                        onClick={() => handleShufflePlayPlaylist(likedList)}
                        disabled={likedList.length === 0}
                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-[#1ed760] hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl border border-white/15 disabled:opacity-40 cursor-pointer"
                        title="Acak Lagu yang Disukai (Shuffle Play)"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="16 3 21 3 21 8"></polyline>
                          <line x1="4" y1="20" x2="21" y2="3"></line>
                          <polyline points="21 16 21 21 16 21"></polyline>
                          <line x1="15" y1="15" x2="21" y2="21"></line>
                          <line x1="4" y1="4" x2="9" y2="9"></line>
                        </svg>
                      </button>
                    </>
                  );
                })()}

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Liked Tracks List */}
              <div className="px-6 pb-28 flex flex-col gap-1">
                {(() => {
                  const allLikedPool = [
                    currentTrack,
                    ...activeQueue,
                    ...relatedQueue,
                    ...topArtistShelfTracks,
                    ...mostPlayedIndonesia,
                    ...indonesiaTop50,
                    ...viralIndonesia,
                    ...globalTrending
                  ];
                  const seen = new Set<string>();
                  const likedList = allLikedPool.filter((s) => {
                    const songId = s.id || s.trackId;
                    if (songId && likedSongIds.includes(songId) && !seen.has(songId)) {
                      seen.add(songId);
                      return true;
                    }
                    return false;
                  });

                  if (likedList.length === 0) {
                    return (
                      <div className="text-center py-20 text-[#b3b3b3]">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#1ed760]">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                          </svg>
                        </div>
                        <p className="text-base font-bold text-white mb-1">Belum ada lagu yang kamu sukai</p>
                        <p className="text-xs max-w-sm mx-auto">
                          Klik ikon hati pada lagu apa saja saat mendengarkan untuk menyimpannya ke koleksi favoritmu di sini.
                        </p>
                      </div>
                    );
                  }

                  return likedList.map((t: any, i: number) => {
                    const isCur = currentTrack?.id === t.id;
                    return (
                      <div
                        key={t.id || i}
                        onClick={() => handlePlayFromList(t, likedList, i)}
                        className={`group px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                          isCur ? "bg-white/10 text-[#1ed760]" : "hover:bg-white/5 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-[#b3b3b3] w-5 text-right font-semibold">
                            {i + 1}
                          </span>
                          <img
                            src={t.cover}
                            alt={t.title}
                            onError={handleImgError}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs sm:text-sm font-bold truncate ${isCur ? "text-[#1ed760]" : "text-white"}`}>
                              {t.title}
                            </div>
                            <div className="text-[11px] text-[#b3b3b3] truncate">
                              {t.artist}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({ song: t });
                            }}
                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                            title="Opsi lagu"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(t.id);
                            }}
                            className="p-1.5 text-[#1ed760] hover:scale-110 transition cursor-pointer"
                            title="Hapus dari Lagu Disukai"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                            </svg>
                          </button>
                          <span className="text-xs text-[#b3b3b3] ml-1 hidden sm:inline">
                            {formatTime(t.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* VIEW: DISLIKED / HIDDEN SONGS (LAGU YANG DISEMBUNYIKAN) */}
          {currentView === "disliked" && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#e91429]/25 via-[#251014]/40 to-black md:to-black flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#e91429]/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl bg-gradient-to-br from-[#e91429] via-[#8a121d] to-[#3a060b] flex items-center justify-center text-white flex-shrink-0 relative z-10 shadow-[0_15px_40px_rgba(233,20,41,0.3)]">
                  <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left relative z-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Filter & Privasi
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    Lagu yang Disembunyikan
                  </h1>
                  <p className="text-sm text-white/80">
                    {dislikedTracks.length} lagu • Brnsic menyembunyikan lagu-lagu ini agar tidak pernah diputar otomatis di rekomendasi, radio, atau autoplay
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-[#b3b3b3]">
                  Klik tombol <strong>Pulihkan</strong> pada lagu untuk membatalkan sembunyikan.
                </div>
                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Disliked Tracks List */}
              <div className="px-6 pb-28 flex flex-col gap-1">
                {dislikedTracks.length === 0 ? (
                  <div className="text-center py-20 text-[#b3b3b3]">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#e91429]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    </div>
                    <p className="text-base font-bold text-white mb-1">Belum ada lagu yang disembunyikan</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Saat kamu menekan ikon tidak suka (dislike) pada lagu, lagu tersebut akan tersimpan di sini dan algoritma Brnsic tidak akan pernah memutarnya kembali.
                    </p>
                  </div>
                ) : (
                  dislikedTracks.map((t: Track, i: number) => (
                    <div
                      key={t.id || `${t.title}-${i}`}
                      className="group px-3 py-2.5 rounded-xl flex items-center justify-between transition hover:bg-white/5 text-white border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs text-[#b3b3b3] w-5 text-right font-semibold">
                          {i + 1}
                        </span>
                        <img
                          src={t.cover || "/app-icon.png"}
                          alt={t.title}
                          onError={handleImgError}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold truncate text-white">
                            {t.title}
                          </div>
                          <div className="text-[11px] text-[#b3b3b3] truncate">
                            {t.artist}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => toggleDislike(t)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 active:scale-95 border border-white/10"
                          title="Batal sembunyikan lagu ini"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                          <span>Pulihkan</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: MY PLAYLIST (KOLEKSI PLAYLIST PRIBADI) */}
          {currentView === "playlists" && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#1ed760]/20 to-black md:to-black flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 min-h-[220px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#1ed760]/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 relative z-10 w-full sm:w-auto text-center sm:text-left">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-2xl bg-gradient-to-br from-[#1ed760] via-[#0f8b3c] to-[#053617] flex items-center justify-center text-black flex-shrink-0 shadow-[0_15px_35px_rgba(30,215,96,0.3)]">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" fill="currentColor" />
                      <circle cx="18" cy="16" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1ed760]">
                      Koleksi Musik
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white my-1.5 tracking-tight">
                      My Playlist
                    </h1>
                    <p className="text-xs sm:text-sm text-white/70">
                      {userPlaylists.length} Playlist • {currentUser ? currentUser.name : "Koleksi Kamu"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreatePlaylistModalOpen(true)}
                  className="bg-white hover:bg-neutral-100 text-black font-bold text-xs px-5 py-3 rounded-full hover:scale-105 active:scale-95 transition shadow flex items-center gap-2 relative z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Buat Playlist Baru</span>
                </button>
              </div>

              {/* Quick Collection Cards: Liked & Disliked Songs */}
              <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setCurrentView("liked")}
                  className="bg-gradient-to-r from-[#1ed760]/20 to-white/5 border border-[#1ed760]/20 hover:border-[#1ed760]/40 p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition hover:scale-[1.01] active:scale-[0.99] shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1ed760] via-[#0f8b3c] to-[#053617] flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-[#1ed760]/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">Lagu yang Disukai</h3>
                    <p className="text-xs text-[#b3b3b3]">{likedSongIds.length} lagu favorit</p>
                  </div>
                </div>

                <div
                  onClick={() => setCurrentView("disliked")}
                  className="bg-gradient-to-r from-[#e91429]/20 to-white/5 border border-[#e91429]/20 hover:border-[#e91429]/40 p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition hover:scale-[1.01] active:scale-[0.99] shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e91429] via-[#8a121d] to-[#3a060b] flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-[#e91429]/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">Lagu yang Disembunyikan</h3>
                    <p className="text-xs text-[#b3b3b3]">{dislikedTracks.length} lagu di-blacklist</p>
                  </div>
                </div>
              </div>

              {/* Playlists Grid */}
              <div className="p-4 sm:p-6 flex flex-col gap-6">
                {userPlaylists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <div className="text-base font-bold text-white">Belum Ada Playlist Pribadi</div>
                    <p className="text-xs text-[#b3b3b3] max-w-sm">
                      Kumpulkan lagu-lagu favoritmu dalam playlist khusus untuk didengarkan kapan saja.
                    </p>
                    <button
                      onClick={() => setIsCreatePlaylistModalOpen(true)}
                      className="mt-2 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition shadow-[0_0_15px_rgba(30,215,96,0.3)]"
                    >
                      + Buat Playlist Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {userPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => openCustomPlaylist(pl)}
                        className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col gap-3 relative border border-white/5 hover:border-white/10"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#242424] shadow-md">
                          <img
                            src={pl.cover || "/app-icon.png"}
                            alt={pl.name}
                            onError={handleImgError}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (pl.songs && pl.songs.length > 0) {
                                handlePlayFromList(pl.songs[0], pl.songs, 0);
                              } else {
                                openCustomPlaylist(pl);
                              }
                            }}
                            className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow-xl"
                            title="Putar Playlist"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </button>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                            {pl.name}
                          </div>
                          <div className="text-xs text-[#b3b3b3] mt-0.5 truncate">
                            Playlist • {pl.songs?.length || 0} lagu
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Access to System Playlists */}
                <div className="mt-4 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-bold text-white mb-3">Koleksi Populer</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setCurrentView("liked")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">Lagu yang Disukai</div>
                        <div className="text-[10px] text-[#b3b3b3]">{likedSongIds.length} lagu</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentView("top50-indo")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#bc5900]/20 text-[#bc5900] flex items-center justify-center font-black text-xs flex-shrink-0">
                        TOP
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">Top 50 Indonesia</div>
                        <div className="text-[10px] text-[#b3b3b3]">Chart harian</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentView("most-played-indo")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#006450]/20 text-[#006450] flex items-center justify-center font-black text-xs flex-shrink-0">
                        HITS
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">Sering Diputar</div>
                        <div className="text-[10px] text-[#b3b3b3]">Bernadya, Hindia</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentView("viral-indo")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#e8115b]/20 text-[#e8115b] flex items-center justify-center font-black text-xs flex-shrink-0">
                        VIRAL
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">Viral 50</div>
                        <div className="text-[10px] text-[#b3b3b3]">TikTok &amp; Reels</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(currentView === "top50-indo" ||
            currentView === "most-played-indo" ||
            currentView === "viral-indo" ||
            currentView === "top50-global") && (
            <div>
              <div
                className={`p-6 sm:p-8 bg-gradient-to-b ${
                  currentView === "top50-indo"
                    ? "from-[#bc5900] to-black md:to-black"
                    : currentView === "most-played-indo"
                    ? "from-[#006450] to-black md:to-black"
                    : currentView === "viral-indo"
                    ? "from-[#e8115b] to-black md:to-black"
                    : "from-[#1e3264] to-black md:to-black"
                } flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]`}
              >
                <div
                  className={`w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-white flex-shrink-0 ${
                    currentView === "top50-indo"
                      ? "bg-gradient-to-br from-[#e91429] to-[#bc5900]"
                      : currentView === "most-played-indo"
                      ? "bg-gradient-to-br from-[#1ed760] to-[#006450]"
                      : currentView === "viral-indo"
                      ? "bg-gradient-to-br from-[#e8115b] to-[#ba5d07]"
                      : "bg-gradient-to-br from-[#1e3264] to-[#8400e7]"
                  }`}
                >
                  <span className="text-2xl font-black uppercase tracking-wider">
                    {currentView === "top50-indo"
                      ? "TOP 50"
                      : currentView === "most-played-indo"
                      ? "HEAVY"
                      : currentView === "viral-indo"
                      ? "VIRAL"
                      : "GLOBAL"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/80 mt-1">
                    BRNSIC
                  </span>
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Playlist Publik
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {currentView === "top50-indo"
                      ? "Top 50 - Indonesia"
                      : currentView === "most-played-indo"
                      ? "Lagu Paling Sering Diputar"
                      : currentView === "viral-indo"
                      ? "Viral 50 - Indonesia"
                      : "Top 50 - Global"}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] max-w-xl">
                    {currentView === "top50-indo"
                      ? "Peringkat harian lagu yang paling banyak diputar di Indonesia. Diperbarui otomatis setiap 15 menit."
                      : currentView === "most-played-indo"
                      ? "Peringkat lagu yang paling sering diputar oleh seluruh pendengar Brnsic berdasarkan pencatatan database real-time."
                      : "Lagu viral media sosial dan trending chart."}
                  </p>
                  <div className="text-xs text-[#b3b3b3] mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <span>Brnsic</span> • <span>Diperbarui otomatis ({lastChartUpdated})</span> •{" "}
                    <span>
                      {currentView === "top50-indo"
                        ? `${indonesiaTop50.length || 50} lagu`
                        : currentView === "most-played-indo"
                        ? `${mostPlayedIndonesia.length} lagu`
                        : `${viralIndonesia.length || 15} lagu`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center gap-3.5 flex-wrap">
                <button
                  onClick={() => {
                    const list =
                      currentView === "top50-indo"
                        ? indonesiaTop50
                        : currentView === "most-played-indo"
                        ? mostPlayedIndonesia
                        : currentView === "viral-indo"
                        ? viralIndonesia
                        : globalTrending;
                    if (list.length > 0) handlePlayFromList(list[0], list, 0);
                  }}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer"
                  title="Putar Semua"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                {/* Button Acak Lagu di Playlist Chart */}
                <button
                  onClick={() => {
                    const list =
                      currentView === "top50-indo"
                        ? indonesiaTop50
                        : currentView === "most-played-indo"
                        ? mostPlayedIndonesia
                        : currentView === "viral-indo"
                        ? viralIndonesia
                        : globalTrending;
                    if (list.length > 0) handleShufflePlayPlaylist(list);
                  }}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-[#1ed760] hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl border border-white/15 cursor-pointer"
                  title="Acak Lagu (Shuffle Play)"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                </button>

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali ke Beranda</span>
                </button>
              </div>

              {/* Numbered Song List - ROUNDED ROWS */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {(() => {
                  const targetList =
                    currentView === "top50-indo"
                      ? indonesiaTop50
                      : currentView === "most-played-indo"
                      ? mostPlayedIndonesia
                      : currentView === "viral-indo"
                      ? viralIndonesia
                      : globalTrending;

                  if (targetList.length === 0) {
                    return (
                      <div className="text-center py-20 text-[#b3b3b3]">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#1ed760]">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                        <p className="text-base font-bold text-white mb-1">Riwayat Telah Direset &amp; Siap Mencatat Real-Time</p>
                        <p className="text-xs max-w-sm mx-auto text-white/60">
                          Mulai putar lagu apa saja di Brnsic sekarang! Setiap lagu yang diputar akan langsung dicatat ke database Supabase dan membentuk urutan lagu paling sering diputar secara nyata.
                        </p>
                      </div>
                    );
                  }

                  return targetList.map((track: any, i) => {
                    const isCurrent = track.title === currentTrack.title;
                    return (
                      <div
                        key={track.id || i}
                        onClick={() => handlePlayFromList(track, targetList, i)}
                        className={`grid grid-cols-[36px_1fr_auto_50px] sm:grid-cols-[40px_1fr_180px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                          isCurrent
                            ? "bg-white/15 text-white shadow-sm"
                            : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                        }`}
                      >
                        <div className="font-semibold text-xs text-center">{i + 1}</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.cover}
                            alt="thumb"
                            onError={handleImgError}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              className={`font-semibold text-sm truncate ${
                                isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                              }`}
                            >
                              {track.title}
                            </div>
                            <div className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                          </div>
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlbumView(track.album, track.artist, track.collectionId);
                          }}
                          className="hidden sm:block text-xs truncate text-[#b3b3b3] hover:text-white hover:underline cursor-pointer"
                        >
                          {track.album}
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToQueueEnd(track);
                            }}
                            className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-medium transition cursor-pointer"
                            title="Tambahkan ke antrean"
                          >
                            + Antrean
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({ song: track });
                            }}
                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                            title="Opsi lagu"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>

                        <div className="text-right text-xs font-medium text-[#b3b3b3]">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* VIEW: HOME VIEW */}
          {currentView === "home" && (
            <div className="p-4 sm:p-6 flex flex-col gap-8">
              
              {/* DESKTOP FILTER CHIPS: HANYA DI BERANDA */}
              <div
                className="hidden md:flex items-center gap-2 w-full max-w-full overflow-x-auto no-scrollbar py-1 touch-pan-x flex-nowrap select-none"
              >
                <button
                  onClick={() => {
                    setHomeFilter((prev) => (prev === "most-played" ? "all" : "most-played"));
                    setSelectedMood("all");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                    homeFilter === "most-played"
                      ? "bg-white text-black shadow-md"
                      : "bg-black border border-white/20 text-white/90 hover:text-white hover:border-white/40"
                  }`}
                >
                  Sering Diputar
                </button>
                <button
                  onClick={() => {
                    setHomeFilter((prev) => (prev === "viral" ? "all" : "viral"));
                    setSelectedMood("all");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                    homeFilter === "viral"
                      ? "bg-white text-black shadow-md"
                      : "bg-black border border-white/20 text-white/90 hover:text-white hover:border-white/40"
                  }`}
                >
                  Viral
                </button>
              </div>

              {/* NATIVE APK BACKGROUND PERMISSION BANNER */}
              {showPermissionBanner && (
                <div className="bg-[#181818] border border-[#1ed760]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-center justify-center text-[#1ed760] flex-shrink-0 mt-0.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-bold text-xs tracking-wide">
                        Aktifkan Izin Latar Belakang & Notifikasi
                      </span>
                      <span className="text-[#b3b3b3] text-[11px] leading-relaxed max-w-xl">
                        Agar audio terus menyala saat layar HP terkunci atau membuka aplikasi lain, izinkan notifikasi pemutar dan kecualikan Brnsic dari penghemat baterai sistem.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => {
                        try {
                          (window as any).BrnsicNative?.requestPermissions?.();
                        } catch (e) {}
                        setShowPermissionBanner(false);
                      }}
                      className="bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs px-4 py-2 rounded-full transition shadow hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Izinkan Sekarang
                    </button>
                    <button
                      onClick={() => setShowPermissionBanner(false)}
                      className="text-[#b3b3b3] hover:text-white text-xs px-2.5 py-2 transition cursor-pointer font-medium"
                    >
                      Nanti
                    </button>
                  </div>
                </div>
              )}
              
              {/* SMART RECOMMENDATION BANNER */}
              {relatedQueue.length > 0 && (
                <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-white/10">
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-wider text-[#1ed760] whitespace-nowrap">
                        Rekomendasi
                      </span>
                    </div>
                    <span
                      className="text-xs text-[#b3b3b3] truncate min-w-0 max-w-[55%] sm:max-w-[70%] text-right select-none"
                      title={`Berdasarkan: ${currentTrack.artist}`}
                    >
                      Berdasarkan:{" "}
                      <strong className="text-white font-bold">{currentTrack.artist}</strong>
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-3 w-full min-w-0 max-w-full overflow-x-auto no-scrollbar py-1 touch-pan-x flex-nowrap overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {relatedQueue.slice(0, 18).map((item, i) => (
                      <div
                        key={item.id || i}
                        onClick={() => handlePlaySingleSongWithRadio(item)}
                        className="flex-shrink-0 w-36 sm:w-40 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl cursor-pointer transition group select-none"
                      >
                        <img
                          src={item.cover}
                          alt={item.title}
                          onError={handleImgError}
                          draggable={false}
                          className="w-full aspect-square rounded-lg object-cover mb-2 shadow pointer-events-none select-none"
                        />
                        <div className="font-bold text-xs text-white truncate select-none">{item.title}</div>
                        <div className="text-[11px] text-[#b3b3b3] truncate mt-0.5 select-none">{item.artist}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SPOTIFY-STYLE QUICK ACCESS SHORTCUT CARDS (SESUAI GAMBAR 2) */}
              <section className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  {
                    title: "Lagu yang Disukai",
                    subtitle: `${likedSongIds.length} lagu`,
                    icon: (
                      <div className="w-12 h-12 bg-[#0c4a2a] rounded-lg flex items-center justify-center text-[#1ed760] flex-shrink-0 shadow-md">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                        </svg>
                      </div>
                    ),
                    action: () => setCurrentView("liked")
                  },
                  {
                    title: "Top 50 Indonesia",
                    subtitle: "Chart harian",
                    icon: (
                      <div className="w-12 h-12 bg-[#3d2400] rounded-lg flex items-center justify-center text-[#d97706] font-black text-xs flex-shrink-0 tracking-wider shadow-md">
                        TOP
                      </div>
                    ),
                    action: () => setCurrentView("top50-indo")
                  },
                  {
                    title: "Sering Diputar",
                    subtitle:
                      mostPlayedIndonesia.length > 0
                        ? mostPlayedIndonesia.slice(0, 2).map((s: any) => s.artist).join(", ")
                        : "Belum ada riwayat",
                    icon: (
                      <div className="w-12 h-12 bg-[#0a3528] rounded-lg flex items-center justify-center text-[#1ed760] font-black text-xs flex-shrink-0 tracking-wider shadow-md">
                        HITS
                      </div>
                    ),
                    action: () => setCurrentView("most-played-indo")
                  },
                  {
                    title: "Viral 50",
                    subtitle: "TikTok & Reels",
                    icon: (
                      <div className="w-12 h-12 bg-[#3b0818] rounded-lg flex items-center justify-center text-[#f43f5e] font-black text-xs flex-shrink-0 tracking-wider shadow-md">
                        VIRAL
                      </div>
                    ),
                    action: () => setCurrentView("viral-indo")
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    className="h-16 bg-[#1f1f1f] hover:bg-[#282828] rounded-xl p-2 flex items-center gap-3 cursor-pointer transition group shadow-md min-w-0 border border-white/5 hover:border-white/10 active:scale-[0.99]"
                  >
                    {item.icon}
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="font-bold text-xs sm:text-sm text-white truncate block leading-snug">
                        {item.title}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[#b3b3b3] truncate block mt-0.5 font-medium">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                ))}
              </section>

              {/* SHELF 0: DIBUAT KHUSUS UNTUK KAMU */}
              <section>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {activeMoodInfo.title}
                    </h2>
                    {activeMoodInfo.description ? (
                      <p className="text-xs text-[#b3b3b3] mt-1">
                        {activeMoodInfo.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {homeMlRanked.map((t: any, i: number) => (
                    <div
                      key={t.id || `${t.title}-${i}`}
                      onClick={() => handlePlayFromList(t, homeMlRanked, i)}
                      className="liquid-glass-card rounded-2xl p-3 flex flex-col group cursor-pointer transition hover:bg-white/10"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md">
                        <img
                          src={t.cover}
                          alt={t.title}
                          loading="lazy"
                          decoding="async"
                          onError={handleImgError}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition duration-300 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                      <div className="font-bold text-sm text-white truncate">{t.title}</div>
                      <div className="text-xs text-[#b3b3b3] truncate mt-1 flex items-center justify-between">
                        <span className="truncate">{t.artist}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSongActionMenu({ song: t });
                          }}
                          className="p-1 text-white/40 hover:text-white transition flex-shrink-0"
                          title="Opsi lagu"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SHELF 1: TOP 50 INDONESIA */}
              <section>
                <div className="flex items-start sm:items-end justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h2
                      onClick={() => setCurrentView("top50-indo")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer leading-tight"
                    >
                      Top 50 - Indonesia
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 sm:line-clamp-none">
                      Diperbarui setiap 15 menit otomatis • Lagu paling banyak diputar hari ini
                    </p>
                  </div>
                  <span
                    onClick={() => setCurrentView("top50-indo")}
                    className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline cursor-pointer whitespace-nowrap flex-shrink-0 pt-1 sm:pt-0"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {indonesiaTop50.length > 0 ? (
                    indonesiaTop50.slice(0, 6).map((t: any, i) => (
                      <div
                        key={t.id || i}
                        onClick={() => handlePlayFromList(t, indonesiaTop50, i)}
                        className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                          <img
                            src={t.cover}
                            alt={t.title}
                            loading="lazy"
                            decoding="async"
                            onError={handleImgError}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                            #{i + 1}
                          </span>
                          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                        <div className="text-xs text-[#b3b3b3] truncate w-full mt-1 flex items-center justify-between">
                          <span className="truncate">{t.artist}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({ song: t });
                            }}
                            className="p-1 text-white/40 hover:text-white transition flex-shrink-0"
                            title="Opsi lagu"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="bg-[#181818] p-3 rounded-xl animate-pulse flex flex-col gap-2">
                        <div className="w-full aspect-square rounded-lg bg-white/10"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* SHELF 2: LAGU PALING SERING DIPUTAR DI INDONESIA */}
              <section>
                <div className="flex items-start sm:items-end justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h2
                      onClick={() => setCurrentView("most-played-indo")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer leading-tight"
                    >
                      Lagu Paling Sering Diputar di Indonesia
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 sm:line-clamp-none">
                      Data tangga lagu real-time streaming pecinta musik Indonesia hari ini
                    </p>
                  </div>
                  <span
                    onClick={() => setCurrentView("most-played-indo")}
                    className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline cursor-pointer whitespace-nowrap flex-shrink-0 pt-1 sm:pt-0"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {(mostPlayedIndonesia.length > 0 ? mostPlayedIndonesia : indonesiaTop50).slice(0, 6).map(
                    (t: any, i) => (
                      <div
                        key={t.id || i}
                        onClick={() => handlePlayFromList(t, mostPlayedIndonesia.length > 0 ? mostPlayedIndonesia : indonesiaTop50, i)}
                        className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                          <img
                            src={t.cover}
                            alt={t.title}
                            loading="lazy"
                            decoding="async"
                            onError={handleImgError}
                            className="w-full h-full object-cover"
                          />
                          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                        <div className="text-xs text-[#b3b3b3] truncate w-full mt-1 flex items-center justify-between">
                          <span className="truncate">{t.artist}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({ song: t });
                            }}
                            className="p-1 text-white/40 hover:text-white transition flex-shrink-0"
                            title="Opsi lagu"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* SHELF 3: TOP GLOBAL DUNIA */}
              <section>
                <div className="flex items-start sm:items-end justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h2
                      onClick={() => setCurrentView("top50-global")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer leading-tight"
                    >
                      Top 50 - Global (Dunia)
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 sm:line-clamp-none">Lagu paling banyak diputar di seluruh dunia</p>
                  </div>
                  <span
                    onClick={() => setCurrentView("top50-global")}
                    className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline cursor-pointer whitespace-nowrap flex-shrink-0 pt-1 sm:pt-0"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {globalTrending.length > 0 ? (
                    globalTrending.slice(0, 6).map((t: any, i) => (
                      <div
                        key={t.id || i}
                        onClick={() => handlePlayFromList(t, globalTrending, i)}
                        className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                          <img
                            src={t.cover}
                            alt={t.title}
                            loading="lazy"
                            decoding="async"
                            onError={handleImgError}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                            #{i + 1}
                          </span>
                          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                        <div className="text-xs text-[#b3b3b3] truncate w-full mt-1 flex items-center justify-between">
                          <span className="truncate">{t.artist}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongActionMenu({ song: t });
                            }}
                            className="p-1 text-white/40 hover:text-white transition flex-shrink-0"
                            title="Opsi lagu"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="bg-[#181818] p-3 rounded-xl animate-pulse flex flex-col gap-2">
                        <div className="w-full aspect-square rounded-lg bg-white/10"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* VIEW: SEARCH RESULTS (UNIVERSAL ITUNES + YOUTUBE INDIE RESULTS) */}
          {currentView === "search" && (
            <div className="p-4 sm:p-6 flex flex-col gap-6">
              <div className="md:hidden">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    performSearch(searchQuery);
                  }}
                  className="relative flex items-center w-full"
                >
                  <svg
                    className="absolute left-4 text-[#b3b3b3] pointer-events-none"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Cari lagu apa saja (misal: Bernadya, Hindia, Sal Priadi)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full h-12 rounded-full bg-[#242424] pl-11 pr-10 text-sm text-white placeholder-[#b3b3b3] outline-none border border-transparent focus:border-white transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white p-1.5 flex items-center justify-center transition"
                      title="Hapus pencarian"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </form>
              </div>

              {/* SEARCH TABS & LIVE SUGGESTIONS BAR */}
              {searchQuery && (
                <div className="flex flex-col gap-2.5 -mt-2">
                  {/* Category Filter Tabs (Spotify Style) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: "all", label: "Semua" },
                      { id: "songs", label: "Lagu" },
                      { id: "artists", label: "Artis" },
                      { id: "albums", label: "Album" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSearchFilterTab(tab.id as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                          searchFilterTab === tab.id
                            ? "bg-white text-black shadow"
                            : "bg-white/10 hover:bg-white/15 text-white/80"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Trending Query Suggestions as user types */}
                  {searchSuggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pt-1">
                      <span className="text-white/40 text-[11px] font-bold flex-shrink-0">
                        Sering dicari:
                      </span>
                      {searchSuggestions.slice(0, 5).map((sugg, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(sugg);
                            performSearch(sugg);
                          }}
                          className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/5 text-[11px] font-medium transition cursor-pointer flex-shrink-0 flex items-center gap-1"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#1ed760]">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                          <span>{sugg}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchQuery ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-xl font-black text-white">
                        {isSearching && searchResults.length === 0 ? "Mencari di seluruh dunia..." : `Hasil untuk "${searchQuery}"`}
                      </h1>
                      {searchCorrectedQuery && (
                        <p className="text-xs text-[#1ed760] font-semibold mt-1 flex items-center gap-1.5">
                          <span>Menampilkan hasil teratas untuk</span>
                          <span className="font-bold underline italic capitalize">&quot;{searchCorrectedQuery}&quot;</span>
                          <span className="text-white/40 text-[10px]">(koreksi otomatis ejaan)</span>
                        </p>
                      )}
                    </div>
                    {isSearching && (
                      <div className="flex items-center gap-2 text-xs text-[#1ed760] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-ping"></span>
                        <span>Mencocokkan lagu...</span>
                      </div>
                    )}
                  </div>

                  {isSearching && searchResults.length === 0 ? (
                    <div className="py-20 flex items-center justify-center">
                      <BrnsicLoader size="lg" text="Mencari lagu, artis &amp; album terverifikasi..." />
                    </div>
                  ) : searchResults.length > 0 || searchArtists.length > 0 || searchAlbums.length > 0 ? (
                    <>
                      {/* ============================================================== */}
                      {/* VIEW: ALL (TAB "SEMUA") - SPOTIFY SPLIT & RICH MULTI-SHELF */}
                      {/* ============================================================== */}
                      {searchFilterTab === "all" && (
                        <div className="flex flex-col gap-8">
                          {/* 1. TOP RESULT & TOP SONGS SPLIT */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* TOP RESULT CARD */}
                            {searchTopResult && (
                              <div className="col-span-12 md:col-span-5 flex flex-col gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-white/50">
                                  Hasil Teratas
                                </span>

                                {searchTopResult.type === "artist" ? (
                                  /* TOP RESULT: ARTIST CARD */
                                  <div
                                    onClick={() => handlePlayArtistTopResult(searchTopResult)}
                                    className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl flex flex-col justify-between group cursor-pointer transition relative border border-white/5 h-full min-h-[240px]"
                                  >
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-2xl relative mb-4 ring-2 ring-transparent group-hover:ring-[#1ed760] transition duration-500">
                                      <img
                                        src={searchTopResult.avatar}
                                        alt={searchTopResult.title}
                                        onError={handleImgError}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                      />
                                    </div>
                                    <div className="pr-16 min-w-0 max-w-full">
                                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-[#1ed760] transition truncate">
                                        {searchTopResult.title}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[11px] bg-[#1ed760] text-black font-extrabold px-2.5 py-0.5 rounded-full flex-shrink-0">
                                          Artis
                                        </span>
                                        <span className="text-xs text-[#b3b3b3] font-semibold truncate">
                                          {searchTopResult.artist || "Penyanyi Populer"}
                                        </span>
                                      </div>
                                    </div>
                                    {/* Play Artist Discography Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayArtistTopResult(searchTopResult);
                                      }}
                                      className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer"
                                      title={`Putar semua lagu ${searchTopResult.title}`}
                                    >
                                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  /* TOP RESULT: SONG CARD */
                                  <div
                                    onClick={() => playSearchedSong(searchTopResult, 0)}
                                    className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col justify-between group cursor-pointer transition relative border border-white/5 h-full min-h-[220px]"
                                  >
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl relative mb-3">
                                      <img
                                        src={searchTopResult.artworkUrl100}
                                        alt="top result thumb"
                                        onError={handleImgError}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                      />
                                    </div>
                                    <div className="pr-16 min-w-0 max-w-full">
                                      <MarqueeText
                                        text={searchTopResult.trackName}
                                        className="text-2xl font-black text-white tracking-tight group-hover:text-[#1ed760] transition"
                                      />
                                      <div className="flex items-center gap-2 mt-1 min-w-0">
                                        <span className="text-xs bg-white/10 text-white font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                          Lagu
                                        </span>
                                        <span className="text-xs text-[#b3b3b3] font-semibold truncate min-w-0">
                                          {searchTopResult.artistName}
                                        </span>
                                      </div>

                                      {/* Quick Queue Controls */}
                                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToNextQueue({
                                              id: searchTopResult.trackId,
                                              title: searchTopResult.trackName,
                                              artist: searchTopResult.artistName,
                                              album: searchTopResult.album || "Single",
                                              cover: searchTopResult.artworkUrl100,
                                              duration: searchTopResult.duration
                                            });
                                          }}
                                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                          title="Putar lagu ini berikutnya"
                                        >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                            <line x1="19" y1="5" x2="19" y2="19"></line>
                                          </svg>
                                          <span>Putar Berikutnya</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToQueueEnd({
                                              id: searchTopResult.trackId,
                                              title: searchTopResult.trackName,
                                              artist: searchTopResult.artistName,
                                              album: searchTopResult.album || "Single",
                                              cover: searchTopResult.artworkUrl100,
                                              duration: searchTopResult.duration
                                            });
                                          }}
                                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 font-semibold transition cursor-pointer"
                                          title="Tambahkan ke antrean"
                                        >
                                          + Antrean
                                        </button>
                                      </div>
                                    </div>

                                    {/* Floating Play Button */}
                                    <button
                                      className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
                                      title="Putar Lagu Ini"
                                    >
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* MATCHING SONGS LIST (TOP 4 TRACKS) */}
                            <div className={`col-span-12 ${searchTopResult ? "md:col-span-7" : "md:col-span-12"} flex flex-col gap-2`}>
                              <span className="text-xs font-black uppercase tracking-wider text-white/50">
                                {searchTopResult?.type === "artist" ? `Lagu Terpopuler ${searchTopResult.title}` : "Lagu Terkait"}
                              </span>
                              <div className="flex flex-col gap-1">
                                {searchResults.slice(0, 4).map((song, i) => (
                                  <div
                                    key={song.trackId || i}
                                    onClick={() => playSearchedSong(song, i)}
                                    className="grid grid-cols-[32px_1fr_auto_45px] items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                                  >
                                    <span className="text-[#b3b3b3] text-xs text-center font-medium">{i + 1}</span>
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img
                                        src={song.artworkUrl100}
                                        alt="thumb"
                                        onError={handleImgError}
                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-white truncate group-hover:text-[#1ed760]">
                                          {song.trackName}
                                        </div>
                                        <div className="text-xs text-[#b3b3b3] truncate">
                                          {song.artistName}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToQueueEnd({
                                            id: song.trackId,
                                            title: song.trackName,
                                            artist: song.artistName,
                                            album: song.album || "Single",
                                            cover: song.artworkUrl100,
                                            duration: song.duration
                                          });
                                        }}
                                        className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-medium transition cursor-pointer"
                                        title="Tambahkan ke antrean"
                                      >
                                        + Antrean
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSongActionMenu({
                                            song: {
                                              id: song.trackId,
                                              title: song.trackName,
                                              artist: song.artistName,
                                              album: song.album || "Single",
                                              cover: song.artworkUrl100,
                                              duration: song.duration
                                            }
                                          });
                                        }}
                                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                                        title="Opsi lagu lainnya"
                                      >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                          <circle cx="5" cy="12" r="2" />
                                          <circle cx="12" cy="12" r="2" />
                                          <circle cx="19" cy="12" r="2" />
                                        </svg>
                                      </button>
                                    </div>
                                    <span className="text-xs text-[#b3b3b3] text-right">
                                      {formatTime(song.duration)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 2. ARTISTS SECTION (PROFIL ARTIS SPOTIFY) */}
                          {searchArtists.length > 0 && (
                            <section className="flex flex-col gap-3 pt-2 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-white tracking-tight">Artis Terkait</h2>
                                <button
                                  onClick={() => setSearchFilterTab("artists")}
                                  className="text-xs text-white/50 hover:text-white font-bold transition cursor-pointer"
                                >
                                  Lihat semua
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                                {searchArtists.slice(0, 6).map((artist) => (
                                  <div
                                    key={artist.id}
                                    onClick={() => {
                                      setSearchQuery(artist.name);
                                      performSearch(artist.name);
                                    }}
                                    className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center text-center group cursor-pointer transition border border-white/5"
                                  >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-xl mb-3 relative ring-2 ring-transparent group-hover:ring-[#1ed760] transition duration-300">
                                      <img
                                        src={artist.avatar}
                                        alt={artist.name}
                                        onError={handleImgError}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                      />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#1ed760] transition truncate max-w-full">
                                      {artist.name}
                                    </span>
                                    <span className="text-[10px] text-white/50 capitalize mt-0.5">
                                      Artis
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          {/* 3. ALBUMS SECTION (ALBUM RESMI SPOTIFY) */}
                          {searchAlbums.length > 0 && (
                            <section className="flex flex-col gap-3 pt-2 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-white tracking-tight">Album &amp; Single</h2>
                                <button
                                  onClick={() => setSearchFilterTab("albums")}
                                  className="text-xs text-white/50 hover:text-white font-bold transition cursor-pointer"
                                >
                                  Lihat semua
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                                {searchAlbums.slice(0, 4).map((album) => (
                                  <div
                                    key={album.id}
                                    onClick={() => openAlbumView(album.name, album.artist, album.collectionId)}
                                    className="bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl flex flex-col group cursor-pointer transition border border-white/5 relative"
                                  >
                                    <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-3 relative">
                                      <img
                                        src={album.cover}
                                        alt={album.name}
                                        onError={handleImgError}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAlbumView(album.name, album.artist, album.collectionId);
                                        }}
                                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                                        title="Buka Album"
                                      >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </button>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#1ed760] transition truncate max-w-full">
                                      {album.name}
                                    </span>
                                    <span className="text-[11px] text-white/50 truncate max-w-full mt-0.5">
                                      {album.year ? `${album.year} • ` : ""}{album.artist}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          {/* 4. REMAINING SONGS FULL LIST */}
                          {searchResults.length > 4 && (
                            <section className="flex flex-col gap-2 pt-2 border-t border-white/5">
                              <span className="text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                                Semua Lagu Lainnya
                              </span>
                              <div className="flex flex-col gap-1">
                                {searchResults.slice(4).map((song, i) => (
                                  <div
                                    key={song.trackId || i + 4}
                                    onClick={() => playSearchedSong(song, i + 4)}
                                    className="grid grid-cols-[32px_1fr_auto_45px] items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                                  >
                                    <span className="text-[#b3b3b3] text-xs text-center font-medium">{i + 5}</span>
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img
                                        src={song.artworkUrl100}
                                        alt="thumb"
                                        onError={handleImgError}
                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-white truncate group-hover:text-[#1ed760]">
                                          {song.trackName}
                                        </div>
                                        <div className="text-xs text-[#b3b3b3] truncate">
                                          {song.artistName}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToQueueEnd({
                                            id: song.trackId,
                                            title: song.trackName,
                                            artist: song.artistName,
                                            album: song.album || "Single",
                                            cover: song.artworkUrl100,
                                            duration: song.duration
                                          });
                                        }}
                                        className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-medium transition cursor-pointer"
                                        title="Tambahkan ke antrean"
                                      >
                                        + Antrean
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSongActionMenu({
                                            song: {
                                              id: song.trackId,
                                              title: song.trackName,
                                              artist: song.artistName,
                                              album: song.album || "Single",
                                              cover: song.artworkUrl100,
                                              duration: song.duration
                                            }
                                          });
                                        }}
                                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                                        title="Opsi lagu lainnya"
                                      >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                          <circle cx="5" cy="12" r="2" />
                                          <circle cx="12" cy="12" r="2" />
                                          <circle cx="19" cy="12" r="2" />
                                        </svg>
                                      </button>
                                    </div>
                                    <span className="text-xs text-[#b3b3b3] text-right">
                                      {formatTime(song.duration)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* VIEW: ONLY SONGS (TAB "LAGU") */}
                      {/* ============================================================== */}
                      {searchFilterTab === "songs" && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                            Daftar Semua Lagu ({searchResults.length})
                          </span>
                          <div className="flex flex-col gap-1">
                            {searchResults.map((song, i) => (
                              <div
                                key={song.trackId || i}
                                onClick={() => playSearchedSong(song, i)}
                                className="grid grid-cols-[32px_1fr_auto_45px] items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                              >
                                <span className="text-[#b3b3b3] text-xs text-center font-medium">{i + 1}</span>
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={song.artworkUrl100}
                                    alt="thumb"
                                    onError={handleImgError}
                                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white truncate group-hover:text-[#1ed760]">
                                      {song.trackName}
                                    </div>
                                    <div className="text-xs text-[#b3b3b3] truncate">
                                      {song.artistName} {song.album ? `• ${song.album}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToQueueEnd({
                                        id: song.trackId,
                                        title: song.trackName,
                                        artist: song.artistName,
                                        album: song.album || "Single",
                                        cover: song.artworkUrl100,
                                        duration: song.duration
                                      });
                                    }}
                                    className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#1ed760] hover:text-black text-white font-medium transition cursor-pointer"
                                    title="Tambahkan ke antrean"
                                  >
                                    + Antrean
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSongActionMenu({
                                        song: {
                                          id: song.trackId,
                                          title: song.trackName,
                                          artist: song.artistName,
                                          album: song.album || "Single",
                                          cover: song.artworkUrl100,
                                          duration: song.duration
                                        }
                                      });
                                    }}
                                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                                    title="Opsi lagu lainnya"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="5" cy="12" r="2" />
                                      <circle cx="12" cy="12" r="2" />
                                      <circle cx="19" cy="12" r="2" />
                                    </svg>
                                  </button>
                                </div>
                                <span className="text-xs text-[#b3b3b3] text-right">
                                  {formatTime(song.duration)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* VIEW: ONLY ARTISTS (TAB "ARTIS") */}
                      {/* ============================================================== */}
                      {searchFilterTab === "artists" && (
                        <div className="flex flex-col gap-4">
                          <span className="text-xs font-black uppercase tracking-wider text-white/50">
                            Semua Artis Terkait ({searchArtists.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {searchArtists.map((artist) => (
                              <div
                                key={artist.id}
                                onClick={() => {
                                  setSearchQuery(artist.name);
                                  performSearch(artist.name);
                                  setSearchFilterTab("all");
                                }}
                                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col items-center text-center group cursor-pointer transition border border-white/5 relative"
                              >
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-2xl mb-4 relative ring-2 ring-transparent group-hover:ring-[#1ed760] transition duration-300">
                                  <img
                                    src={artist.avatar}
                                    alt={artist.name}
                                    onError={handleImgError}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                  />
                                </div>
                                <span className="text-sm sm:text-base font-bold text-white group-hover:text-[#1ed760] transition truncate max-w-full">
                                  {artist.name}
                                </span>
                                <span className="text-xs text-white/50 capitalize mt-1">
                                  {artist.genre || "Artis"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* VIEW: ONLY ALBUMS (TAB "ALBUM") */}
                      {/* ============================================================== */}
                      {searchFilterTab === "albums" && (
                        <div className="flex flex-col gap-4">
                          <span className="text-xs font-black uppercase tracking-wider text-white/50">
                            Semua Album &amp; Single ({searchAlbums.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {searchAlbums.map((album) => (
                              <div
                                key={album.id}
                                onClick={() => openAlbumView(album.name, album.artist, album.collectionId)}
                                className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col group cursor-pointer transition border border-white/5 relative"
                              >
                                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-3 relative">
                                  <img
                                    src={album.cover}
                                    alt={album.name}
                                    onError={handleImgError}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAlbumView(album.name, album.artist, album.collectionId);
                                    }}
                                    className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                                    title="Buka Album"
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                </div>
                                <span className="text-sm font-bold text-white group-hover:text-[#1ed760] transition truncate max-w-full">
                                  {album.name}
                                </span>
                                <span className="text-xs text-white/50 truncate max-w-full mt-1">
                                  {album.year ? `${album.year} • ` : ""}{album.artist}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    !isSearching && (
                      <div className="text-center py-12 text-[#b3b3b3]">
                        <p className="text-base font-bold text-white mb-1">Lagu tidak ditemukan</p>
                        <p className="text-xs max-w-sm mx-auto">
                          Coba ketik kata kunci pendek seperti &quot;bunga&quot;, &quot;berna&quot;, &quot;eval&quot;, atau nama artis favoritmu.
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* TRENDING QUICK SEARCH CHIPS */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-white/50 mb-3">
                      Paling Sering Dicari Pengguna
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Justin Bieber",
                        "Bernadya",
                        "Helena",
                        "Welcome to the Black Parade",
                        "Sal Priadi",
                        "Coldplay",
                        "Taylor Swift",
                        "Billie Eilish",
                        "Satu Bulan",
                        "Gala Bunga Matahari",
                        "Evaluasi",
                        "Tampar",
                        "Dan...",
                        "Die With A Smile",
                        "Birds of a Feather",
                        "Queen",
                        "Oasis"
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(chip);
                            performSearch(chip);
                          }}
                          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/5 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h1 className="text-xl font-bold text-white mb-4">Jelajahi Semua Genre</h1>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {GENRES.map((g, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (g.name.includes("Top 50 Indonesia")) setCurrentView("top50-indo");
                            else if (g.name.includes("Paling Sering Diputar")) setCurrentView("most-played-indo");
                            else if (g.name.includes("Viral Indonesia")) setCurrentView("viral-indo");
                            else if (g.name.includes("Top Global")) setCurrentView("top50-global");
                            else handleSearchInput(g.name);
                          }}
                          className={`${g.color} h-32 rounded-xl p-4 font-black text-lg text-white relative overflow-hidden cursor-pointer shadow-lg`}
                        >
                          <span>{g.name}</span>
                          <div className="w-16 h-16 rounded-md bg-white/20 absolute -bottom-2 -right-2 rotate-25 shadow" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: DEDICATED QUEUE & PLAYBACK REORDER VIEW */}
          {currentView === "queue" && (
            <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1ed760]">
                      ANTREAN AKTIF &bull; GESER URUTAN
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Antrean Pemutaran</h1>
                  <p className="text-xs text-[#b3b3b3] mt-0.5">
                    Tahan &amp; geser ikon titik enam atau klik tombol panah naik/turun untuk mengatur urutan lagu
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali ke Beranda</span>
                </button>
              </div>

              {/* Tab Selector: Antrean Pemutaran vs Riwayat Baru Diputar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQueueTab("queue")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                    queueTab === "queue"
                      ? "bg-white text-black shadow"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  Antrean Pemutaran
                </button>
                <button
                  onClick={() => setQueueTab("history")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                    queueTab === "history"
                      ? "bg-white text-black shadow"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  <span>Riwayat Baru Diputar (Database)</span>
                  {currentUser?.history && currentUser.history.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        queueTab === "history" ? "bg-black/20 text-black" : "bg-[#1ed760]/20 text-[#1ed760]"
                      }`}
                    >
                      {currentUser.history.length}
                    </span>
                  )}
                </button>
              </div>

              {queueTab === "history" ? (
                <div className="flex flex-col gap-4">
                  {!currentUser ? (
                    <div className="liquid-glass rounded-3xl p-8 text-center flex flex-col items-center gap-3 border border-white/10">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <h3 className="text-base font-black text-white">Riwayat Tersimpan di Database</h3>
                      <p className="text-xs text-[#b3b3b3] max-w-sm">
                        Masuk dengan akun Google agar setiap lagu yang kamu dengarkan otomatis tercatat dan tersimpan rapi di database Supabase PostgreSQL.
                      </p>
                      <button
                        onClick={() => {
                          setAuthError(null);
                          setIsAuthModalOpen(true);
                        }}
                        className="py-2.5 px-6 rounded-full bg-white hover:bg-neutral-100 text-black font-extrabold text-xs transition"
                      >
                        Masuk dengan Akun Google
                      </button>
                    </div>
                  ) : currentUser.history && currentUser.history.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-white/50 px-2 pb-1 border-b border-white/10">
                        <span>Lagu &amp; Artis</span>
                        <span>Aktivitas</span>
                      </div>
                      {currentUser.history.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => handlePlaySingleSongWithRadio({ title: item.title, artist: item.artist, id: item.songId })}
                          className="liquid-glass rounded-2xl p-3 flex items-center justify-between hover:bg-white/10 cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 group-hover:text-[#1ed760] group-hover:bg-[#1ed760]/10 flex-shrink-0 transition">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition">
                                {item.title}
                              </div>
                              <div className="text-xs text-[#b3b3b3] truncate">{item.artist}</div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] uppercase font-bold text-[#1ed760] bg-[#1ed760]/10 px-2 py-0.5 rounded-full">
                              {item.action === "like" ? "Disukai" : item.action === "complete" ? "Selesai" : "Diputar"}
                            </span>
                            <span className="text-[10px] text-white/40 mt-1">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="liquid-glass rounded-3xl p-8 text-center text-[#b3b3b3] text-xs border border-white/10">
                      Belum ada riwayat lagu yang tercatat. Putar lagu apa saja untuk mulai mencatat riwayat ke database Supabase!
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Now Playing Card */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white/50 block mb-2">
                  Sedang Diputar
                </span>
                <div className="liquid-glass rounded-2xl p-4 flex items-center justify-between shadow-xl border border-white/10">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <img
                        src={currentTrack.cover}
                        alt="thumb"
                        onError={handleImgError}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                        <span className="w-1 bg-[#1ed760] bar-1 rounded-full"></span>
                        <span className="w-1 bg-[#1ed760] bar-2 rounded-full"></span>
                        <span className="w-1 bg-[#1ed760] bar-3 rounded-full"></span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-black text-white truncate">{currentTrack.title}</div>
                      <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist} • {currentTrack.album}</div>
                    </div>
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition flex-shrink-0"
                    title={isPlaying ? "Jeda" : "Putar"}
                  >
                    {isPlaying ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Upcoming Reorderable Queue */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1ed760]">
                    Berikutnya Dalam Antrean ({Math.max(0, activeQueue.length - activeQueueIndex - 1)} lagu)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const pool = [...relatedQueue, ...mostPlayedIndonesia, ...indonesiaTop50];
                        const fresh = pool.filter((s) => !activeQueue.some((a) => a.title.toLowerCase() === s.title.toLowerCase()));
                        setActiveQueue((prev) => [...prev, ...fresh.slice(0, 10)]);
                      }}
                      className="text-xs font-bold text-white/70 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition"
                    >
                      + Tambah 10 Rekomendasi
                    </button>
                  </div>
                </div>

                {activeQueue.length <= activeQueueIndex + 1 ? (
                  <div className="liquid-glass rounded-2xl p-8 text-center text-[#b3b3b3]">
                    <p className="text-sm font-bold text-white mb-1">Antrean berikutnya kosong</p>
                    <p className="text-xs mb-4">
                      Lagu berikutnya akan dipilihkan secara otomatis sesuai selera musikmu ({userTaste.persona}).
                    </p>
                    <button
                      onClick={() => {
                        const pool = relatedQueue.length > 0 ? relatedQueue : (globalTrending.length > 0 ? globalTrending : (indonesiaTop50.length > 0 ? indonesiaTop50 : mostPlayedIndonesia));
                        setActiveQueue((prev) => [...prev, ...pool.slice(0, 8)]);
                      }}
                      className="px-4 py-2 rounded-full bg-[#1ed760] text-black font-black text-xs hover:scale-105 transition"
                    >
                      Isi Antrean Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeQueue.slice(activeQueueIndex + 1).map((song, relativeIdx) => {
                      const actualIdx = activeQueueIndex + 1 + relativeIdx;
                      return (
                        <div
                          key={`${song.id || song.title}-${actualIdx}`}
                          draggable
                          onDragStart={() => setDraggedQueueIndex(actualIdx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverQueueIndex(actualIdx);
                          }}
                          onDragEnd={() => {
                            if (
                              draggedQueueIndex !== null &&
                              dragOverQueueIndex !== null &&
                              draggedQueueIndex !== dragOverQueueIndex
                            ) {
                              reorderQueueItem(draggedQueueIndex, dragOverQueueIndex);
                            }
                            setDraggedQueueIndex(null);
                            setDragOverQueueIndex(null);
                          }}
                          className={`liquid-glass rounded-xl p-3 flex items-center justify-between transition group border border-white/5 ${
                            draggedQueueIndex === actualIdx
                              ? "opacity-30 border-[#1ed760]"
                              : dragOverQueueIndex === actualIdx
                              ? "border-[#1ed760] bg-white/10"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Drag Handle 6-dots */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white p-1"
                              title="Tahan &amp; geser untuk ubah urutan"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="6" r="2" />
                                <circle cx="15" cy="6" r="2" />
                                <circle cx="9" cy="12" r="2" />
                                <circle cx="15" cy="12" r="2" />
                                <circle cx="9" cy="18" r="2" />
                                <circle cx="15" cy="18" r="2" />
                              </svg>
                            </div>

                            <span className="text-[#b3b3b3] text-xs font-medium w-4 text-center">
                              {relativeIdx + 1}
                            </span>

                            <img
                              src={song.cover || song.artworkUrl100 || FALLBACK_COVER}
                              alt="thumb"
                              onError={handleImgError}
                              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                              onClick={() => handlePlayFromList(song, activeQueue, actualIdx)}
                            />

                            <div
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => handlePlayFromList(song, activeQueue, actualIdx)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition">
                                  {song.title || song.trackName}
                                </div>
                                {song.isSmartRecommendation && (
                                  <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]"></span>
                                    <span>Smart Shuffle</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#b3b3b3] truncate">{song.artist || song.artistName}</div>
                            </div>
                          </div>

                          {/* Tactile Reordering Actions (Up / Down / Remove) */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(actualIdx, "up");
                              }}
                              disabled={actualIdx <= activeQueueIndex + 1}
                              className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-white/10 transition"
                              title="Geser Naik"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="18 15 12 9 6 15"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(actualIdx, "down");
                              }}
                              disabled={actualIdx >= activeQueue.length - 1}
                              className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-white/10 transition"
                              title="Geser Turun"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQueueItem(actualIdx);
                              }}
                              className="p-1.5 text-white/30 hover:text-red-400 rounded hover:bg-white/10 transition ml-1"
                              title="Hapus dari antrean"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

          {/* VIEW: NOW PLAYING FOCUS */}
          {currentView === "now-playing" && (
            <div className="p-6">
              <div className="bg-gradient-to-b from-[#4a1219] to-black md:to-black p-6 rounded-2xl flex items-center gap-4 mb-6">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition"
                >
                  {isPlaying ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">Sedang Diputar</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{currentTrack.title}</h1>
                  <p className="text-sm text-[#b3b3b3]">{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* --- RIGHT SIDEBAR: DESKTOP ONLY BRNSIC NOW PLAYING PANEL --- */}
        <aside
          className="hidden lg:flex bg-black border border-white/10 rounded-lg p-4 flex-col overflow-y-auto custom-scrollbar"
          ref={lyricsScrollContainerRef}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="font-bold text-sm text-white truncate">{currentTrack.title}</span>
            <button
              onClick={() => setIsZoomed(true)}
              className="text-[#b3b3b3] hover:text-white p-1 transition"
              title="Layar Penuh"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>

          {/* Brnsic Native Now Playing Artwork Card */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-[#181818] mb-4 shadow-2xl flex-shrink-0 border border-white/5 group">
            <img
              src={currentTrack.canvasImg || currentTrack.cover}
              alt={currentTrack.title}
              onError={handleImgError}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Live Playing Waveform Indicator */}
            {isPlaying && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Playing</span>
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-[#1ed760] bar-1 rounded-full"></span>
                  <span className="w-0.5 bg-[#1ed760] bar-2 rounded-full"></span>
                  <span className="w-0.5 bg-[#1ed760] bar-3 rounded-full"></span>
                </div>
              </div>
            )}

            {isLoadingSong && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-xl animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
                <span className="text-white text-[11px] font-semibold">Menyiapkan audio...</span>
              </div>
            )}
          </div>

          {/* Song Info Row */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                className="font-black text-lg text-white truncate hover:underline cursor-pointer"
                onClick={() => setIsZoomed(true)}
              >
                {currentTrack.title}
              </h2>
              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist}</p>
              {currentTrack.album && (
                <p
                  onClick={() => openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId)}
                  className="text-[11px] text-[#1ed760] hover:underline cursor-pointer truncate mt-0.5"
                  title="Lihat & Putar Satu Album Ini"
                >
                  Album: {currentTrack.album} ↗
                </p>
              )}
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`p-1.5 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`}
              title={isCurrentTrackLiked ? "Hapus dari Favorit" : "Suka Lagu Ini"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
              </svg>
            </button>
          </div>

          {/* Burgundy Lyrics Preview Box */}
          <div
            onClick={() => setIsZoomed(true)}
            className="bg-gradient-to-br from-[#781926] to-[#450c14] rounded-2xl p-4 flex flex-col gap-2.5 cursor-pointer hover:brightness-105 transition mb-4 shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">Lirik</span>
              <span className="text-xs bg-black/40 px-2.5 py-0.5 rounded-full text-white/90 font-bold flex items-center gap-1">
                <span>Layar Penuh</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                </svg>
              </span>
            </div>
            {(() => {
              const total = currentTrack.lyrics.length;
              if (total === 0) return null;
              // Sliding window of 4 lines that dynamically follows the song's playback progress
              const startIdx = Math.max(0, Math.min(total - 4, activeLyricIdx - 1));
              const sliceCount = Math.min(4, total);
              const visible = currentTrack.lyrics.slice(startIdx, startIdx + sliceCount);

              return visible.map((l, relIdx) => {
                const actualIdx = startIdx + relIdx;
                const isActive = actualIdx === activeLyricIdx;
                return (
                  <div
                    key={`${actualIdx}-${l.time}`}
                    className={`leading-snug transition-all duration-300 ${
                      isActive
                        ? "text-white font-extrabold text-base scale-[1.02] origin-left"
                        : "text-white/50 font-medium text-sm"
                    }`}
                  >
                    {l.text}
                  </div>
                );
              });
            })()}
          </div>

          {/* Smart Next Up Recommendation Preview */}
          {relatedQueue.length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Berikutnya dari Rekomendasi</span>
                <span className="text-[10px] text-[#1ed760] font-bold">Autoplay</span>
              </div>
              <div
                onClick={() => handlePlaySingleSongWithRadio(relatedQueue[0])}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition"
              >
                <img
                  src={relatedQueue[0].cover}
                  alt="next"
                  onError={handleImgError}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{relatedQueue[0].title}</div>
                  <div className="text-[10px] text-[#b3b3b3] truncate">{relatedQueue[0].artist}</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ====================================================================
          3. MASTER BOTTOM DOCK (BRNSIC STANDARD WEB LAYOUT)
          ==================================================================== */}
      <footer className="hidden md:flex h-20 items-center justify-between px-4 bg-black z-40 flex-shrink-0">
        {/* Left Column: Track Info */}
        <div className="flex items-center gap-3.5 w-[30%] min-w-[180px]">
          {hasUserStartedPlayback ? (
            <>
              <img
                src={currentTrack.cover}
                alt="thumb"
                onError={handleImgError}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 max-w-[200px] lg:max-w-[280px]">
                <div
                  onClick={() => setIsZoomed(true)}
                  className="hover:underline cursor-pointer"
                >
                  <MarqueeText
                    text={currentTrack.title}
                    className="text-sm font-semibold text-white"
                  />
                </div>
                <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist}</div>
                {currentTrack.album && (
                  <div
                    onClick={() => openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId)}
                    className="text-[10px] text-white/50 hover:text-[#1ed760] hover:underline cursor-pointer truncate"
                  >
                    {currentTrack.album}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className={`p-1.5 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`}
                title={isCurrentTrackLiked ? "Hapus dari Favorit" : "Suka Lagu Ini"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                </svg>
              </button>
              <button
                onClick={() => toggleDislike(currentTrack)}
                className="p-1.5 transition text-[#b3b3b3] hover:text-red-400"
                title="Tidak Suka / Sembunyikan Lagu Ini (Dislike)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-white/40 text-xs">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <span className="font-semibold text-white/50">Pilih lagu untuk memutar musik</span>
            </div>
          )}
        </div>

        {/* Center Column: Official Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[720px]">
          <div className="flex items-center gap-5">
            {/* Spotify Tri-State Shuffle: Off / Standard / Smart */}
            <button
              onClick={toggleShuffleMode}
              className={`p-1.5 transition relative ${
                shuffleMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
              }`}
              title={
                shuffleMode === "off"
                  ? "Aktifkan Shuffle (Acak lagu)"
                  : shuffleMode === "standard"
                  ? "Shuffle Biasa Aktif: Mengacak seimbang & Fewer Repeats (Klik untuk Smart Shuffle)"
                  : "Smart Shuffle Aktif: Rekomendasi lagu disisipkan otomatis sesuai seleramu (Klik untuk Matikan)"
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
              {shuffleMode === "standard" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></span>
              )}
              {shuffleMode === "smart" && (
                <span className="absolute -top-1 -right-1 leading-none text-[#1ed760]">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                  </svg>
                </span>
              )}
            </button>

            <button onClick={playPrevSong} className="text-[#b3b3b3] hover:text-white" title="Lagu sebelumnya">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 transition flex items-center justify-center shadow-md"
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button onClick={() => playNextSong(true)} className="text-[#b3b3b3] hover:text-white" title="Lagu berikutnya">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* 3-State Repeat Button: Off / All / One */}
            <button
              onClick={() => {
                const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
                repeatModeRef.current = nextMode;
                isAlbumLoopModeRef.current = nextMode === "all";
                setRepeatMode(nextMode);
                setIsAlbumLoopMode(nextMode === "all");
              }}
              className={`p-1 transition relative ${
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
              }`}
              title={
                repeatMode === "off"
                  ? "Ulangi: Mati (Lanjut memutar lagu lain)"
                  : repeatMode === "all"
                  ? "Ulangi: Semua Lagu / Album"
                  : "Ulangi: 1 Lagu Ini"
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
              {repeatMode === "one" && (
                <span className="absolute -top-1 -right-1 bg-[#1ed760] text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  1
                </span>
              )}
              {repeatMode === "all" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full text-[11px] text-[#b3b3b3]">
            <span className="w-8 text-right font-medium">{formatTime(Math.floor(currentTime))}</span>
            <div
              onClick={handleSeek}
              onTouchStart={handleTouchSeek}
              onTouchMove={handleTouchSeek}
              className="flex-1 h-3 flex items-center cursor-pointer group"
            >
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${Math.min(100, (currentTime / getActiveDuration()) * 100)}%` }}
                />
              </div>
            </div>
            <span className="w-8 font-medium">{formatTime(getActiveDuration())}</span>
          </div>
        </div>

        {/* Right Column: Brnsic Action Icons */}
        <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
          {currentTrack.album && (
            <button
              onClick={() => {
                if (currentTrack.collectionId || currentTrack.album) {
                  openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId);
                }
              }}
              className="text-[#b3b3b3] hover:text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white/20 transition truncate max-w-[100px]"
              title="Buka Halaman Album Lagu Ini"
            >
              Album
            </button>
          )}
          <button
            onClick={() => setSongToAddToPlaylist(currentTrack)}
            title="Tambah ke Playlist"
            className="text-[#b3b3b3] hover:text-white p-1 text-xs font-bold"
          >
            + Playlist
          </button>

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            title="Lirik Lagu"
            className="text-[#1ed760] hover:scale-110 transition p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          <button
            onClick={() => setCurrentView(currentView === "queue" ? "home" : "queue")}
            className={`p-1 transition ${currentView === "queue" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`}
            title="Antrean Pemutaran (Queue)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <button
            onClick={() => setSongActionMenu({ song: currentTrack })}
            className="p-1 text-[#b3b3b3] hover:text-white transition cursor-pointer"
            title="Opsi Lagu Saat Ini"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          <div className="flex items-center gap-2 w-28">
            <button onClick={toggleMute} className="text-[#b3b3b3] hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            <div onClick={handleVolume} className="flex-1 h-3 flex items-center cursor-pointer group">
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            title="Layar Penuh"
            className="text-[#b3b3b3] hover:text-white hover:scale-110 transition p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        </div>
      </footer>

      {/* ====================================================================
          4. MOBILE & TABLET FLOATING MINI-PLAYER + LIQUID GLASS TAB BAR (IMAGE 1)
          ==================================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-none pb-3 sm:pb-4">
        {!isMobilePlayerOpen && hasUserStartedPlayback && (
          <div
            onClick={() => setIsMobilePlayerOpen(true)}
            className="pointer-events-auto mx-3 mb-2.5 max-w-lg w-[calc(100%-24px)] self-center bg-black/95 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl cursor-pointer active:scale-[0.99] transition border border-white/10"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={currentTrack.cover}
                alt="thumb"
                onError={handleImgError}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <MarqueeText
                  text={currentTrack.title}
                  className="text-xs font-bold text-white"
                />
                <div className="text-[11px] text-[#b3b3b3] truncate flex items-center gap-1.5">
                  <span>{currentTrack.artist}</span>
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-2">
                      <span className="w-0.5 bg-white bar-1 rounded-full"></span>
                      <span className="w-0.5 bg-white bar-2 rounded-full"></span>
                      <span className="w-0.5 bg-white bar-3 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(currentTrack.id);
                }}
                className={`p-1 ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3]"}`}
                title="Suka Lagu Ini"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDislike(currentTrack);
                }}
                className="p-1 text-[#b3b3b3] hover:text-red-400 active:scale-90 transition"
                title="Sembunyikan / Tidak Suka Lagu Ini (Dislike)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNextSong();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition"
                title="Lagu Berikutnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Floating Liquid Glass Tab Bar (Mobile & iPad - Image 1) */}
        {!isMobilePlayerOpen && (
          <div className="flex justify-center px-4 w-full">
            <nav className="pointer-events-auto bg-black/95 rounded-full px-3 py-1.5 flex items-center justify-between gap-4 sm:gap-6 shadow-[0_15px_35px_rgba(0,0,0,0.85)] border border-white/15 max-w-[280px] sm:max-w-xs w-full">
              {/* Tab 1: Home */}
              <button
                onClick={() => {
                  setMobileNavTab("home");
                  setCurrentView("home");
                }}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  currentView === "home"
                    ? "w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.5)] scale-105 font-black"
                    : "w-11 h-11 rounded-full text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title="Home"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === "home" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === "home" ? "0" : "2"}>
                  <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" fill={currentView === "home" ? "currentColor" : "none"} />
                </svg>
              </button>

              {/* Tab 2: Liked Songs (Heart) */}
              <button
                onClick={() => {
                  setMobileNavTab("liked");
                  setCurrentView("liked");
                }}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  currentView === "liked"
                    ? "w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.5)] scale-105 font-black"
                    : "w-11 h-11 rounded-full text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title="Lagu yang Disukai"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === "liked" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                </svg>
              </button>

              {/* Tab 3: Search (Cari) */}
              <button
                onClick={() => {
                  setMobileNavTab("search");
                  setCurrentView("search");
                }}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  currentView === "search"
                    ? "w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.5)] scale-105 font-black"
                    : "w-11 h-11 rounded-full text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title="Cari"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === "search" ? "2.8" : "2"}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              {/* Tab 4: My Playlist */}
              <button
                onClick={() => {
                  setMobileNavTab("library");
                  setCurrentView("playlists");
                }}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  currentView === "playlists" || currentView === "custom-playlist"
                    ? "w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.5)] scale-105 font-black"
                    : "w-11 h-11 rounded-full text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title="My Playlist"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === "playlists" || currentView === "custom-playlist" ? "2.5" : "2"}>
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" fill={currentView === "playlists" || currentView === "custom-playlist" ? "currentColor" : "none"} />
                  <circle cx="18" cy="16" r="3" fill={currentView === "playlists" || currentView === "custom-playlist" ? "currentColor" : "none"} />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* ====================================================================
          5. THE EXACT "LIQUID AUDIO" FULLSCREEN EXPERIENCE
          ==================================================================== */}
      {isMobilePlayerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col p-4 md:p-6 overflow-hidden animate-fadeIn border-0">
          {/* DYNAMIC AMBIENT BLURRED ALBUM ARTWORK BACKDROP */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img
              src={currentTrack.canvasImg || currentTrack.cover}
              alt="ambient-bg"
              onError={handleImgError}
              className="w-full h-full object-cover scale-150 blur-3xl opacity-45 brightness-75 contrast-125 transform transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
          </div>

          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] md:w-[600px] h-[340px] md:h-[600px] bg-white/[0.04] rounded-full blur-[120px] pointer-events-none z-0" />

          {/* Top Bar matching Brnsic Mobile */}
          <header className="relative z-10 flex items-center justify-between pb-2 flex-shrink-0">
            <button
              onClick={() => setIsMobilePlayerOpen(false)}
              className="w-10 h-10 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 hover:text-white"
              title="Tutup Player"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div className="text-center min-w-0 px-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block truncate">
                {repeatMode === "all" ? "MODE ULANGI (LOOP)" : "BRNSIC AUDIO PLAYER"}
              </span>
              <span className="text-xs font-black text-white truncate max-w-[200px] block">
                {currentTrack.album || currentTrack.artist}
              </span>
            </div>

            <button
              onClick={() => {
                setIsMobilePlayerOpen(false);
                setCurrentView("search");
              }}
              className="w-10 h-10 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </header>

          {/* Body Content by Tab */}
          <div className="relative z-10 flex-1 overflow-hidden flex flex-col pb-20">
            
            {/* TAB 1: QUEUE */}
            {mobileTab === "queue" && (
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      ANTREAN AKTIF
                    </span>
                    <h2 className="text-xl font-black text-white">
                      {isAlbumLoopMode ? `Album: ${currentTrack.album}` : "Antrean & Rekomendasi"}
                    </h2>
                  </div>
                  {isAlbumLoopMode && (
                    <button
                      onClick={() => {
                        setIsAlbumLoopMode(false);
                        setRepeatMode("off");
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300"
                    >
                      Matikan Loop Album
                    </button>
                  )}
                </div>

                {/* Now Playing Card */}
                <div className="liquid-glass-borderless rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={currentTrack.cover}
                        alt="thumb"
                        onError={handleImgError}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                        <span className="w-1 bg-white bar-1 rounded-full"></span>
                        <span className="w-1 bg-white bar-2 rounded-full"></span>
                        <span className="w-1 bg-white bar-3 rounded-full"></span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">{currentTrack.title}</div>
                      <div className="text-xs text-white/60 truncate">{currentTrack.artist}</div>
                    </div>
                  </div>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md flex-shrink-0"
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Reorderable Upcoming Queue */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#1ed760]">
                      Berikutnya dalam Antrean ({Math.max(0, activeQueue.length - activeQueueIndex - 1)})
                    </span>
                    <span className="text-[10px] text-white/40">Geser / Panah untuk urutan</span>
                  </div>

                  {activeQueue.length <= activeQueueIndex + 1 ? (
                    <div className="liquid-glass-card rounded-xl p-6 text-center text-[#b3b3b3]">
                      <p className="text-xs font-bold text-white mb-1">Antrean berikutnya kosong</p>
                      <p className="text-[11px] mb-3">Lagu berikutnya akan otomatis menyesuaikan seleramu ({userTaste.persona})</p>
                      <button
                        onClick={() => {
                          const pool = relatedQueue.length > 0 ? relatedQueue : (globalTrending.length > 0 ? globalTrending : (indonesiaTop50.length > 0 ? indonesiaTop50 : mostPlayedIndonesia));
                          setActiveQueue((prev) => [...prev, ...pool.slice(0, 6)]);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#1ed760] text-black font-black text-xs"
                      >
                        + Isi Antrean
                      </button>
                    </div>
                  ) : (
                    activeQueue.slice(activeQueueIndex + 1).map((song, relativeIdx) => {
                      const actualIdx = activeQueueIndex + 1 + relativeIdx;
                      return (
                        <div
                          key={`${song.id || song.title}-${actualIdx}`}
                          draggable
                          onDragStart={() => setDraggedQueueIndex(actualIdx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverQueueIndex(actualIdx);
                          }}
                          onDragEnd={() => {
                            if (
                              draggedQueueIndex !== null &&
                              dragOverQueueIndex !== null &&
                              draggedQueueIndex !== dragOverQueueIndex
                            ) {
                              reorderQueueItem(draggedQueueIndex, dragOverQueueIndex);
                            }
                            setDraggedQueueIndex(null);
                            setDragOverQueueIndex(null);
                          }}
                          className={`liquid-glass-card rounded-xl p-2.5 flex items-center justify-between transition group ${
                            draggedQueueIndex === actualIdx
                              ? "opacity-30 border border-[#1ed760]"
                              : dragOverQueueIndex === actualIdx
                              ? "border border-[#1ed760] bg-white/10"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Drag Handle 6-dots */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white p-1"
                              title="Tahan &amp; geser urutan"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="6" r="2" />
                                <circle cx="15" cy="6" r="2" />
                                <circle cx="9" cy="12" r="2" />
                                <circle cx="15" cy="12" r="2" />
                                <circle cx="9" cy="18" r="2" />
                                <circle cx="15" cy="18" r="2" />
                              </svg>
                            </div>

                            <img
                              src={song.cover || song.artworkUrl100 || FALLBACK_COVER}
                              alt="thumb"
                              onError={handleImgError}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                              onClick={() => handlePlayFromList(song, activeQueue, actualIdx)}
                            />

                            <div
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => handlePlayFromList(song, activeQueue, actualIdx)}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className="text-xs font-bold text-white truncate">{song.title || song.trackName}</div>
                                {song.isSmartRecommendation && (
                                  <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]"></span>
                                    <span>Smart</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-white/50 truncate">
                                {song.artist || song.artistName}
                              </div>
                            </div>
                          </div>

                          {/* Tactile Reordering Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(actualIdx, "up");
                              }}
                              disabled={actualIdx <= activeQueueIndex + 1}
                              className="p-1 text-white/40 hover:text-white disabled:opacity-20 rounded"
                              title="Geser Naik"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="18 15 12 9 6 15"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(actualIdx, "down");
                              }}
                              disabled={actualIdx >= activeQueue.length - 1}
                              className="p-1 text-white/40 hover:text-white disabled:opacity-20 rounded"
                              title="Geser Turun"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQueueItem(actualIdx);
                              }}
                              className="p-1 text-white/30 hover:text-red-400 rounded ml-1"
                              title="Hapus"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: NOW PLAYING */}
            {mobileTab === "now-playing" && (
              <div className="flex-1 flex flex-col items-center justify-between max-w-sm mx-auto w-full pt-1">
                {/* Artwork Canvas */}
                <div className="w-full aspect-square max-h-[44vh] rounded-3xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] my-auto group">
                  <img
                    src={currentTrack.canvasImg || currentTrack.cover}
                    alt={currentTrack.title}
                    onError={handleImgError}
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {isLoadingSong && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center gap-2 shadow-2xl animate-fadeIn">
                      <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
                      <span className="text-white text-[11px] font-bold tracking-wide">Menyiapkan audio...</span>
                    </div>
                  )}
                </div>

                {/* Title, Artist, & Like Button Row */}
                <div className="w-full flex items-center justify-between mt-3 px-1">
                  <div className="min-w-0 flex-1 pr-3">
                    <MarqueeText
                      text={currentTrack.title}
                      className="text-xl md:text-2xl font-black text-white tracking-tight"
                    />
                    <p className="text-xs md:text-sm text-white/60 font-medium truncate mt-0.5">{currentTrack.artist}</p>
                    {currentTrack.album && (
                      <button
                        onClick={() => {
                          setIsMobilePlayerOpen(false);
                          openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId);
                        }}
                        className="text-[11px] text-[#1ed760] font-bold hover:underline truncate block mt-0.5"
                      >
                        Album: {currentTrack.album} ↗
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLike(currentTrack.id)}
                      className={`p-2 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-white/60 hover:text-white"}`}
                      title={isCurrentTrackLiked ? "Hapus dari Favorit" : "Suka Lagu Ini"}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleDislike(currentTrack)}
                      className="p-2 transition text-white/50 hover:text-red-400 active:scale-95"
                      title="Sembunyikan / Tidak Suka Lagu Ini (Dislike)"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Timeline & Scrubber */}
                <div className="w-full flex flex-col gap-1 mt-3">
                  <div
                    onClick={handleSeek}
                    onTouchStart={handleTouchSeek}
                    onTouchMove={handleTouchSeek}
                    className="w-full h-4 flex items-center cursor-pointer group"
                  >
                    <div className="w-full h-1 bg-white/20 rounded-full relative">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${Math.min(100, (currentTime / getActiveDuration()) * 100)}%` }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] absolute top-1/2 -translate-y-1/2 -ml-1.5"
                        style={{ left: `${Math.min(100, (currentTime / getActiveDuration()) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/50 font-medium px-0.5">
                    <span>{formatTime(Math.floor(currentTime))}</span>
                    <span>{formatTime(getActiveDuration())}</span>
                  </div>
                </div>

                {/* Playback Controls Bar (Spotify Standard 5 Controls) */}
                <div className="w-full flex items-center justify-between mt-2 px-2">
                  {/* Spotify Tri-State Shuffle: Off / Standard / Smart */}
                  <button
                    onClick={toggleShuffleMode}
                    className={`p-1 relative transition ${
                      shuffleMode !== "off" ? "text-[#1ed760]" : "text-white/50 hover:text-white"
                    }`}
                    title={
                      shuffleMode === "off"
                        ? "Aktifkan Shuffle (Acak)"
                        : shuffleMode === "standard"
                        ? "Shuffle Biasa Aktif: Fewer Repeats (Klik untuk Smart Shuffle)"
                        : "Smart Shuffle Aktif: Rekomendasi otomatis sesuai selera (Klik untuk Matikan)"
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"></polyline>
                      <line x1="4" y1="20" x2="21" y2="3"></line>
                      <polyline points="21 16 21 21 16 21"></polyline>
                      <line x1="15" y1="15" x2="21" y2="21"></line>
                      <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                    {shuffleMode === "standard" && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></span>
                    )}
                    {shuffleMode === "smart" && (
                      <span className="absolute -top-1 -right-1 leading-none text-[#1ed760]">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                        </svg>
                      </span>
                    )}
                  </button>

                  <button onClick={playPrevSong} className="text-white hover:scale-110 transition p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button onClick={() => playNextSong(true)} className="text-white hover:scale-110 transition p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>

                  {/* 3-State Repeat Button: Off / All / One */}
                  <button
                    onClick={() => {
                      const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
                      repeatModeRef.current = nextMode;
                      isAlbumLoopModeRef.current = nextMode === "all";
                      setRepeatMode(nextMode);
                      setIsAlbumLoopMode(nextMode === "all");
                    }}
                    className={`p-1 relative transition ${repeatMode !== "off" ? "text-[#1ed760]" : "text-white/50 hover:text-white"}`}
                    title={
                      repeatMode === "off"
                        ? "Ulangi: Mati (Lanjut lagu lain)"
                        : repeatMode === "all"
                        ? "Ulangi: Semua Lagu"
                        : "Ulangi: 1 Lagu Ini"
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"></polyline>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                      <polyline points="7 23 3 19 7 15"></polyline>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                    {repeatMode === "one" && (
                      <span className="absolute -top-1 -right-1 bg-[#1ed760] text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        1
                      </span>
                    )}
                    {repeatMode === "all" && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></span>
                    )}
                  </button>
                </div>

                {/* Bottom Utility Row */}
                <div className="w-full flex items-center justify-between mt-3 px-1 text-white/60">
                  <button className="flex items-center gap-2 text-xs font-semibold hover:text-white transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>Brnsic Audio Engine</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSongActionMenu({ song: currentTrack })}
                      className="p-1 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold text-white/70 cursor-pointer"
                      title="Opsi Lagu & Antrean"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                      <span>Opsi</span>
                    </button>

                    <button
                      onClick={() => setSongToAddToPlaylist(currentTrack)}
                      className="p-1 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold text-white/70 cursor-pointer"
                      title="Tambah ke Playlist"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Playlist</span>
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: currentTrack.title,
                            text: `Dengarkan lagu ${currentTrack.title} oleh ${currentTrack.artist} di Brnsic!`,
                            url: window.location.href
                          });
                        }
                      }}
                      className="p-1 hover:text-white transition"
                      title="Bagikan"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LYRICS */}
            {mobileTab === "lyrics" && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="liquid-glass-borderless rounded-xl p-2.5 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentTrack.cover}
                      alt="thumb"
                      onError={handleImgError}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                      <div className="text-[10px] text-white/60 truncate">{currentTrack.artist}</div>
                    </div>
                  </div>
                  <button onClick={() => toggleLike(currentTrack.id)} className={`p-1.5 ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-white/40"}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                    </svg>
                  </button>
                </div>

                <div
                  ref={mobileLyricsScrollRef}
                  onWheel={handleUserScroll}
                  onTouchMove={handleUserScroll}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 py-12 px-4 text-center"
                >
                  {currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIdx;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? mobileActiveLyricRef : null}
                        onClick={() => {
                          setCurrentTime(line.time);
                          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
                            ytPlayerRef.current.seekTo(line.time, true);
                          }
                          setUserIsScrollingLyrics(false);
                        }}
                        className={`transition-colors duration-300 cursor-pointer select-none leading-relaxed text-xl sm:text-2xl font-bold ${
                          isActive
                            ? "text-white font-black opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.85)]"
                            : "text-white/35 opacity-40 hover:opacity-75"
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>

                <div className="liquid-glass-pill rounded-full py-2 px-6 flex items-center justify-around mt-2 max-w-xs mx-auto w-full">
                  <button onClick={playPrevSong} className="text-white hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md"
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => playNextSong(true)} className="text-white hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Master 3-Tab Floating Pill */}
          <footer className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto h-12 bg-black/95 border border-white/10 rounded-full p-1.5 flex items-center justify-between z-30 shadow-2xl">
            <button
              onClick={() => setMobileTab("queue")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "queue"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
              </svg>
              <span>Antrean</span>
            </button>

            <button
              onClick={() => setMobileTab("now-playing")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "now-playing"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              <span>Lagu</span>
            </button>

            <button
              onClick={() => setMobileTab("lyrics")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "lyrics"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
              <span>Lirik</span>
            </button>
          </footer>

        </div>
      )}

      {/* ====================================================================
          6. DESKTOP CINEMA ZOOM (FULLSCREEN)
          ==================================================================== */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col p-6 animate-fadeIn overflow-hidden">
          {/* DYNAMIC AMBIENT BLURRED ALBUM ARTWORK BACKDROP */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img
              src={currentTrack.canvasImg || currentTrack.cover}
              alt="ambient-bg"
              onError={handleImgError}
              className="w-full h-full object-cover scale-150 blur-3xl opacity-45 brightness-75 contrast-125 transform transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
          </div>
          <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 flex-shrink-0">
            {/* Top Row on Mobile / Left & Right on Desktop */}
            <div className="flex items-center justify-between gap-3 w-full md:w-auto md:flex-1 md:min-w-0 md:max-w-md">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={currentTrack.cover}
                  alt="thumb"
                  onError={handleImgError}
                  className="w-11 h-11 rounded-xl object-cover shadow-lg flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-[#b3b3b3] font-medium truncate mt-0.5">
                    {currentTrack.artist} • {currentTrack.album}
                  </div>
                </div>
              </div>

              {/* Mobile Close Button (Top-Right) */}
              <button
                onClick={() => setIsZoomed(false)}
                className="md:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition shadow border border-white/10 flex-shrink-0"
                title="Tutup Layar Penuh (Esc)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Mode Switcher Pills (Responsive & Clean) */}
            <div className="flex items-center justify-center bg-[#1f1f1f]/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg w-full md:w-auto self-center">
              <button
                onClick={() => setZoomMode("both")}
                className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition text-center whitespace-nowrap ${
                  zoomMode === "both" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Lirik &amp; Video
              </button>
              <button
                onClick={() => setZoomMode("lyrics-only")}
                className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition text-center whitespace-nowrap ${
                  zoomMode === "lyrics-only" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Fokus Lirik
              </button>
              <button
                onClick={() => setZoomMode("video-only")}
                className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition text-center whitespace-nowrap ${
                  zoomMode === "video-only" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Fokus Video
              </button>
            </div>

            {/* Desktop Close Button (Right) */}
            <div className="hidden md:flex items-center justify-end flex-shrink-0">
              <button
                onClick={() => setIsZoomed(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition shadow border border-white/10"
                title="Tutup Layar Penuh (Esc)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </header>

          <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 pb-20 overflow-hidden">
            {(zoomMode === "both" || zoomMode === "video-only") && (
              <div
                className={`${
                  zoomMode === "video-only" ? "md:col-span-12 max-w-3xl mx-auto" : "md:col-span-5"
                } flex flex-col items-center justify-center h-full`}
              >
                <div className="w-full max-w-[460px] aspect-[9/13] rounded-3xl overflow-hidden shadow-2xl bg-black/60 border border-white/10 relative group">
                  <img
                    src={currentTrack.canvasImg || currentTrack.cover}
                    alt={currentTrack.title}
                    onError={handleImgError}
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  {isLoadingSong && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center gap-2 shadow-2xl animate-fadeIn">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                      <span className="text-white text-xs font-bold tracking-wide">Menyiapkan audio...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(zoomMode === "both" || zoomMode === "lyrics-only") && (
              <div
                className={`${
                  zoomMode === "lyrics-only" ? "md:col-span-12 max-w-3xl mx-auto" : "md:col-span-7"
                } flex flex-col h-full relative overflow-hidden`}
              >
                <div
                  ref={zoomedLyricsScrollRef}
                  onWheel={handleUserScroll}
                  onTouchMove={handleUserScroll}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 px-8 py-16 text-left"
                >
                  {currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIdx;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? zoomedActiveLyricRef : null}
                        onClick={() => {
                          setCurrentTime(line.time);
                          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
                            ytPlayerRef.current.seekTo(line.time, true);
                          }
                          setUserIsScrollingLyrics(false);
                        }}
                        className={`transition-colors duration-300 cursor-pointer select-none leading-relaxed text-2xl sm:text-4xl font-bold ${
                          isActive
                            ? "text-white font-black opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
                            : "text-white/30 opacity-40 hover:opacity-75"
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          7. MODAL: BUAT PLAYLIST BARU
          ==================================================================== */}
      {isCreatePlaylistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-white/10 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-black text-white">Buat Playlist Baru</h2>
            <input
              type="text"
              placeholder="Beri nama playlist kamu (misal: Hindia & Indie)"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/10 px-4 text-white text-sm outline-none border border-white/10 focus:border-[#1ed760] transition"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setIsCreatePlaylistModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white transition"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-5 py-2.5 rounded-full bg-[#1ed760] text-black font-extrabold text-xs hover:scale-105 transition shadow-lg"
              >
                Simpan Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          7.5. MODAL: OPSI & KELOLA ANTREAN LAGU (SPOTIFY-GRADE ACTION SHEET)
          ==================================================================== */}
      {songActionMenu && (
        <div
          onClick={() => setSongActionMenu(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#181818] border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-2xl animate-slideUp sm:animate-fadeIn"
          >
            {/* Header: Track Info */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <img
                  src={songActionMenu.song.cover || songActionMenu.song.artworkUrl100 || FALLBACK_COVER}
                  alt="cover"
                  onError={handleImgError}
                  className="w-13 h-13 rounded-xl object-cover flex-shrink-0 shadow-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">{songActionMenu.song.title}</div>
                  <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{songActionMenu.song.artist}</div>
                </div>
              </div>
              <button
                onClick={() => setSongActionMenu(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-lg font-bold transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-1 pt-1">
              {/* Option 1: Putar Berikutnya */}
              <button
                onClick={() => {
                  addToNextQueue(songActionMenu.song);
                  setSongActionMenu(null);
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3.5 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-[#1ed760] group-hover:text-black text-white flex items-center justify-center transition flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-[#1ed760] transition">
                    Putar Berikutnya
                  </div>
                  <div className="text-[11px] text-[#b3b3b3]">
                    Akan diputar tepat setelah lagu yang sedang berjalan saat ini
                  </div>
                </div>
              </button>

              {/* Option 2: Tambahkan ke Antrean */}
              <button
                onClick={() => {
                  addToQueueEnd(songActionMenu.song);
                  setSongActionMenu(null);
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3.5 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-[#1ed760] group-hover:text-black text-white flex items-center justify-center transition flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-[#1ed760] transition">
                    Tambahkan ke Antrean
                  </div>
                  <div className="text-[11px] text-[#b3b3b3]">
                    Masukkan ke daftar antrean paling akhir
                  </div>
                </div>
              </button>

              {/* Option 3: Tambahkan ke Playlist */}
              <button
                onClick={() => {
                  const targetSong = songActionMenu.song;
                  setSongActionMenu(null);
                  setSongToAddToPlaylist(targetSong);
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3.5 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-white/20 text-white flex items-center justify-center transition flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">Tambahkan ke Playlist</div>
                  <div className="text-[11px] text-[#b3b3b3]">Simpan ke koleksi playlist pribadimu</div>
                </div>
              </button>

              {/* Option 4: Suka / Batal Suka */}
              <button
                onClick={() => {
                  toggleLike(songActionMenu.song.id);
                  setSongActionMenu(null);
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3.5 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-white/20 text-[#1ed760] flex items-center justify-center transition flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={likedSongIds.includes(songActionMenu.song.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">
                    {likedSongIds.includes(songActionMenu.song.id) ? "Hapus dari Lagu Disukai" : "Sukai Lagu Ini"}
                  </div>
                  <div className="text-[11px] text-[#b3b3b3]">
                    {likedSongIds.includes(songActionMenu.song.id) ? "Dihapus dari koleksi favorit" : "Simpan ke daftar lagu favoritmu"}
                  </div>
                </div>
              </button>

              {/* Option 5: Buka Album (if album info available) */}
              {songActionMenu.song.album && songActionMenu.song.album !== "Single" && (
                <button
                  onClick={() => {
                    const s = songActionMenu.song;
                    setSongActionMenu(null);
                    openAlbumView(s.album, s.artist, s.collectionId);
                  }}
                  className="w-full px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3.5 text-left transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-white/20 text-white flex items-center justify-center transition flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white">Buka Album Lengkap</div>
                    <div className="text-[11px] text-[#b3b3b3] truncate">{songActionMenu.song.album}</div>
                  </div>
                </button>
              )}

              {/* Option 6: Hapus dari Playlist (if inside custom playlist) */}
              {songActionMenu.playlistId && (
                <button
                  onClick={() => {
                    handleRemoveSongFromPlaylist(songActionMenu.playlistId!, songActionMenu.song.id);
                    setSongActionMenu(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl hover:bg-red-500/10 flex items-center gap-3.5 text-left transition group cursor-pointer text-red-400"
                >
                  <div className="w-9 h-9 rounded-full bg-red-500/10 group-hover:bg-red-500/20 text-red-400 flex items-center justify-center transition flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-red-400">Hapus dari Playlist Ini</div>
                    <div className="text-[11px] text-red-400/70">Keluarkan lagu dari playlist</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          8. MODAL: TAMBAH KE PLAYLIST
          ==================================================================== */}
      {songToAddToPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-white/10 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Tambahkan ke Playlist</h2>
              <button
                onClick={() => setSongToAddToPlaylist(null)}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
              <img
                src={songToAddToPlaylist.cover}
                alt="cover"
                onError={handleImgError}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{songToAddToPlaylist.title}</div>
                <div className="text-xs text-[#b3b3b3] truncate">{songToAddToPlaylist.artist}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {userPlaylists.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#b3b3b3]">
                  Belum ada playlist yang dibuat. Buat playlist baru terlebih dahulu.
                </div>
              ) : (
                userPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleAddSongToPlaylist(pl.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
                  >
                    <span className="font-bold text-sm text-white truncate">{pl.name}</span>
                    <span className="text-xs text-[#1ed760] font-semibold">+ Tambahkan</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setSongToAddToPlaylist(null);
                setIsCreatePlaylistModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-xs font-bold text-white/80 hover:text-white transition"
            >
              + Buat Playlist Baru Sekarang
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          9. MODAL: PROFIL PENGGUNA RESMI (SPOTIFY DESIGN)
          ==================================================================== */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-black rounded-3xl p-6 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-5"
          >
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition z-10"
              title="Tutup"
            >
              &times;
            </button>

            {/* Spotify Hero Header */}
            <div className="flex items-center gap-4 pt-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#282828] to-[#181818] border-2 border-white/10 shadow-2xl flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                {currentUser?.avatar && !currentUser.avatar.includes("identicon") ? (
                  <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[#1ed760]">
                    {(currentUser?.name?.[0] || "T").toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
                  PROFIL
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate mt-0.5">
                  {currentUser?.name || "Tamu (Belum Masuk)"}
                </h1>
                <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                  {currentUser?.email || "Masuk dengan Google untuk simpan & sinkronkan riwayat"}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#b3b3b3] mt-2 font-medium flex-wrap">
                  <span>{userPlaylists.length} Playlist</span>
                  <span>•</span>
                  <span>{likedSongIds.length} Disukai</span>
                  <span>•</span>
                  <span>{dislikedTracks.length} Disembunyikan</span>
                  <span>•</span>
                  <span>{userTaste.totalPlays} Diputar</span>
                </div>
              </div>
            </div>

            {/* Section: Artis Teratas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Artis Teratas</h3>
                <span className="text-[11px] text-white/40">Bulan ini</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const sorted = Object.entries(userTaste.artistWeights)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4);
                  const displayArtists =
                    sorted.length > 0
                      ? sorted.map(([name]) => name)
                      : ["Sal Priadi", "Bernadya", "Hindia", "Sheila On 7"];

                  return displayArtists.map((artistName) => {
                    const match = ONBOARDING_ARTISTS.find(
                      (a) => a.name.toLowerCase() === artistName.toLowerCase()
                    );
                    const photo =
                      match?.img ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artistName)}`;

                    return (
                      <div key={artistName} className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-lg border border-white/10 mb-1.5">
                          <img
                            src={photo}
                            alt={artistName}
                            onError={handleImgError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white/90 truncate max-w-[70px]">
                          {artistName}
                        </span>
                        <span className="text-[9px] text-white/40">Artis</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Section: Pengaturan Akun */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setCurrentView("disliked");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition flex items-center justify-between cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <span>Lagu yang Disembunyikan</span>
                </div>
                <span className="text-white/40 text-[11px]">{dislikedTracks.length} lagu</span>
              </button>

              {/* Dynamic Island Settings Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                    <span className="text-xs font-bold text-white">Dynamic Island (Layar Utama)</span>
                  </div>
                  <button
                    onClick={() => handleToggleDynamicIsland(!isDynamicIslandEnabled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                      isDynamicIslandEnabled ? "bg-[#1ed760]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                        isDynamicIslandEnabled ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-[#b3b3b3] leading-relaxed">
                  Kapsul mengambang di layar HP saat memutar musik di latar belakang.
                  Matikan jika HP kamu sudah memiliki Dynamic Island bawaan.
                </p>

                {isDynamicIslandEnabled && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/70">Posisi Kapsul:</span>
                      <button
                        onClick={handleRestoreDynamicIsland}
                        className="text-[10px] font-bold text-[#1ed760] hover:underline cursor-pointer"
                      >
                        + Tampilkan Kembali
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleChangeIslandPosition("left")}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition text-center ${
                          islandPosition === "left"
                            ? "bg-[#1ed760] text-black shadow-sm"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                        }`}
                        title="Untuk HP dengan kamera di tengah atau kanan"
                      >
                        Kiri Atas
                      </button>
                      <button
                        onClick={() => handleChangeIslandPosition("center")}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition text-center ${
                          islandPosition === "center"
                            ? "bg-[#1ed760] text-black shadow-sm"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                        }`}
                        title="Tengah di bawah kamera punch-hole"
                      >
                        Tengah
                      </button>
                      <button
                        onClick={() => handleChangeIslandPosition("right")}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition text-center ${
                          islandPosition === "right"
                            ? "bg-[#1ed760] text-black shadow-sm"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                        }`}
                        title="Untuk HP dengan kamera di kiri"
                      >
                        Kanan Atas
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isInsideNativeApk && (
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleInstallClick();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1ed760]/10 hover:bg-[#1ed760]/20 text-[#1ed760] font-bold text-xs transition flex items-center justify-between cursor-pointer"
                >
                  <span>Download APK Android</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              )}

              {!currentUser ? (
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setAuthError(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 mt-1"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Masuk dengan Akun Google</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition text-center mt-1"
                >
                  Keluar dari Akun (Logout)
                </button>
              )}
            </div>

            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs hover:scale-105 active:scale-95 transition shadow-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          9B. MODAL: AUTENTIKASI GOOGLE ONLY (LOGIN VIA GOOGLE SAJA)
          ==================================================================== */}
      {isAuthModalOpen && (
        <div
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm liquid-glass rounded-3xl p-6 flex flex-col gap-5 border border-white/10 shadow-2xl relative"
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
            >
              &times;
            </button>

            {/* Header with Larger Transparent Brnsic Wordmark Logo (No Background Box) */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative flex items-center justify-center my-3 w-full max-w-[220px]">
                <div className="absolute inset-0 bg-[#1ed760]/20 blur-2xl rounded-full scale-110 pointer-events-none"></div>
                <img
                  src="/brnsic-logo-white-transparent.png"
                  alt="Brnsic"
                  className="w-full h-auto max-h-14 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Masuk ke Brnsic</h2>
              <p className="text-xs text-[#b3b3b3] max-w-[260px] leading-relaxed">
                Simpan lagu favorit dan sinkronkan playlist musikmu.
              </p>
            </div>

            {/* Official Google Cloud 1-Click SSO Action */}
            <div className="flex flex-col gap-3 my-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={isAuthSubmitting}
                className="w-full py-4 px-6 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-black text-sm flex items-center justify-center gap-3 transition shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAuthSubmitting ? "Membuka Akun Google..." : "Lanjutkan dengan Google"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          9C. MODAL: SPOTIFY-GRADE ONBOARDING (PILIH ARTIS & GENRE FAVORIT)
          ==================================================================== */}
      {isOnboardingModalOpen && (
        <div
          onClick={handleDismissOnboarding}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-black/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl relative max-h-[92vh] flex flex-col"
          >
            <button
              onClick={handleDismissOnboarding}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition z-10 cursor-pointer"
              title="Tutup"
            >
              &times;
            </button>

            {/* Header */}
            <div className="flex flex-col gap-1.5 flex-shrink-0 pr-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Artis apa saja yang kamu sukai?
              </h2>

              {/* Spotify Live Artist Search Bar */}
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Cari artis favoritmu..."
                  value={onboardingSearch}
                  onChange={(e) => setOnboardingSearch(e.target.value)}
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] text-white text-xs sm:text-sm px-10 py-2.5 rounded-full border border-transparent focus:border-white outline-none placeholder-[#727272] transition"
                />
                <svg
                  className="w-4 h-4 text-[#b3b3b3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                {onboardingSearch && (
                  <button
                    onClick={() => setOnboardingSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white font-bold text-sm"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Artists & Genres Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar my-3 pr-1">
              {/* Circular Artists Grid (Spotify UI) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 pt-1">
                {ONBOARDING_ARTISTS.filter(
                  (a) =>
                    a.name.toLowerCase().includes(onboardingSearch.toLowerCase()) ||
                    a.sub.toLowerCase().includes(onboardingSearch.toLowerCase())
                ).map((artist) => {
                  const isSelected = selectedOnboardingArtists.includes(artist.name);
                  return (
                    <button
                      key={artist.name}
                      type="button"
                      onClick={() => {
                        setSelectedOnboardingArtists((prev) =>
                          isSelected ? prev.filter((a) => a !== artist.name) : [...prev, artist.name]
                        );
                      }}
                      className="flex flex-col items-center text-center group cursor-pointer transition transform active:scale-95"
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-1.5">
                        <img
                          src={artist.img || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artist.name)}`}
                          alt={artist.name}
                          onError={handleImgError}
                          className={`w-full h-full rounded-full object-cover transition-all duration-300 shadow-lg ${
                            isSelected
                              ? "ring-4 ring-[#1ed760] scale-95 brightness-110"
                              : "group-hover:scale-105 opacity-85 group-hover:opacity-100"
                          }`}
                        />
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#1ed760] text-black font-black text-xs flex items-center justify-center shadow-lg animate-scaleIn">
                            ✓
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold leading-tight truncate max-w-[95px] transition ${
                          isSelected ? "text-white font-extrabold" : "text-[#b3b3b3] group-hover:text-white"
                        }`}
                      >
                        {artist.name}
                      </span>
                      <span className="text-[10px] text-white/40 truncate max-w-[90px] mt-0.5">
                        {artist.sub}
                      </span>
                    </button>
                  );
                })}

                {ONBOARDING_ARTISTS.filter(
                  (a) =>
                    a.name.toLowerCase().includes(onboardingSearch.toLowerCase()) ||
                    a.sub.toLowerCase().includes(onboardingSearch.toLowerCase())
                ).length === 0 && onboardingSearch.trim() && (
                  <div className="col-span-full py-8 flex flex-col items-center justify-center text-center gap-2.5">
                    <p className="text-xs text-[#b3b3b3]">
                      Artis &ldquo;{onboardingSearch.trim()}&rdquo; belum ada di daftar pilihan cepat.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const customName = onboardingSearch.trim();
                        if (!selectedOnboardingArtists.includes(customName)) {
                          setSelectedOnboardingArtists((prev) => [...prev, customName]);
                        }
                        setOnboardingSearch("");
                      }}
                      className="py-2 px-5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-extrabold text-xs transition shadow cursor-pointer active:scale-95"
                    >
                      + Tambahkan &ldquo;{onboardingSearch.trim()}&rdquo; ke Artis Favorit
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Spotify Genre Pills */}
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
                <div className="w-full text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                  Genre &amp; Suasana Musik Favorit
                </div>
                {ONBOARDING_GENRES.map((genre) => {
                  const isSelected = selectedOnboardingGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        setSelectedOnboardingGenres((prev) =>
                          isSelected ? prev.filter((g) => g !== genre) : [...prev, genre]
                        );
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                        isSelected
                          ? "bg-[#1ed760] text-black border-[#1ed760] shadow"
                          : "bg-[#242424] text-white/80 border-white/10 hover:text-white hover:bg-[#2a2a2a]"
                      }`}
                    >
                      {genre} {isSelected ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions & Sticky Bottom Bar (Spotify Clean Pill Button) */}
            <div className="flex items-center justify-center pt-3 border-t border-white/10 flex-shrink-0">
              <button
                onClick={handleOnboardingSubmit}
                disabled={
                  isOnboardingSubmitting ||
                  selectedOnboardingArtists.length + selectedOnboardingGenres.length < 3
                }
                className="py-3 px-12 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-25 disabled:pointer-events-none text-black font-extrabold text-sm hover:scale-105 active:scale-95 transition shadow-2xl"
              >
                {isOnboardingSubmitting ? "Menyimpan..." : "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          10. MODAL: DOWNLOAD APK RESMI (CLEAN, MINIMALIST & CONCISE)
          ==================================================================== */}
      {isInstallModalOpen && (
        <div
          onClick={() => setIsInstallModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs sm:max-w-sm bg-[#181818] border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl relative text-center"
          >
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              aria-label="Tutup"
            >
              &times;
            </button>

            {/* Ambient Logo Header */}
            <div className="relative flex items-center justify-center pt-3 pb-1">
              <div className="absolute inset-0 rounded-full bg-[#1ed760]/25 blur-2xl scale-110"></div>
              <img
                src="/brnsic-loader-logo.png"
                alt="Brnsic"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain relative z-10 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* ANDROID APK DOWNLOAD */}
            {installStep === "ready" && (
              <div className="w-full flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Download Brnsic</h2>
                  <p className="text-xs text-[#b3b3b3] mt-1.5 leading-relaxed">
                    Putar musik di latar belakang dan kontrol dari layar kunci.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-[#b3b3b3] font-medium">
                  <span>Android</span>
                  <span>•</span>
                  <span>{updateInfo?.apkSize || "8.9 MB"}</span>
                  <span>•</span>
                  <span>Gratis</span>
                </div>

                <div className="flex flex-col gap-2 w-full pt-1">
                  <a
                    href="/Brnsic.apk"
                    download="Brnsic.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      showToast("Mengunduh Brnsic.apk...");
                    }}
                    className="w-full py-3.5 px-5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-extrabold text-sm hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-[#1ed760]/20 cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download APK</span>
                  </a>

                  <button
                    onClick={() => setIsInstallModalOpen(false)}
                    className="w-full py-2 text-xs text-[#b3b3b3] hover:text-white font-medium transition"
                  >
                    Nanti saja
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: INSTALLED SUCCESS */}
            {installStep === "installed" && (
              <div className="w-full flex flex-col gap-4 py-2">
                <div className="w-12 h-12 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-xl font-black flex items-center justify-center mx-auto">
                  ✓
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Aplikasi Terpasang</h2>
                  <p className="text-xs text-[#b3b3b3] mt-1 leading-relaxed">
                    Brnsic siap digunakan di HP kamu.
                  </p>
                </div>

                <button
                  onClick={() => setIsInstallModalOpen(false)}
                  className="w-full py-3 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition shadow"
                >
                  Mulai Mendengarkan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          11. MODAL: NOTIFIKASI UPDATE WAJIB / FORCE UPDATE (UNCLOSABLE)
          ==================================================================== */}
      {isUpdateModalOpen && updateInfo && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col items-center gap-4 border border-[#1ed760]/30 shadow-[0_0_50px_rgba(30,215,96,0.2)] relative text-center"
          >
            {/* Ambient Logo Glow */}
            <div className="relative flex items-center justify-center my-3 w-full">
              <div className="absolute inset-0 rounded-full bg-[#1ed760]/20 blur-3xl scale-150"></div>
              <img
                src="/brnsic-logo-white-transparent.png"
                alt="Brnsic"
                className="w-48 sm:w-56 h-auto max-h-16 object-contain relative z-10 drop-shadow-[0_4px_25px_rgba(255,255,255,0.4)]"
              />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">{updateInfo.title || "Pembaruan Aplikasi Diperlukan"}</h2>
              <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-[#888] font-semibold">
                <span>Android</span>
                <span>•</span>
                <span>{updateInfo.apkSize || "9.1 MB"}</span>
                <span>•</span>
                <span>Wajib Diperbarui</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
              {isInsideNativeApk ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const apkUrl = `https://brnsic.vercel.app/Brnsic.apk?t=${Date.now()}`;
                      showToast("Mengunduh Brnsic.apk... Buka notifikasi untuk memasang setelah selesai");

                      // 1. Try native downloadAndInstallUpdate (v3.4+)
                      if (typeof window !== "undefined" && (window as any).BrnsicNative?.downloadAndInstallUpdate) {
                        try {
                          (window as any).BrnsicNative.downloadAndInstallUpdate(apkUrl);
                          return;
                        } catch (e) {}
                      }

                      // 2. Try native openExternalAuth (available in all installed versions v3.0+)
                      if (typeof window !== "undefined" && (window as any).BrnsicNative?.openExternalAuth) {
                        try {
                          (window as any).BrnsicNative.openExternalAuth(apkUrl);
                          return;
                        } catch (e) {}
                      }

                      // 3. Fallback: window.open or location.href
                      try {
                        window.open(apkUrl, "_system");
                      } catch (e) {}
                      window.location.href = apkUrl;
                    }}
                    className="w-full py-3.5 px-5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(30,215,96,0.4)] cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <span>Perbarui Aplikasi Sekarang</span>
                  </button>
                  <p className="text-[11px] text-[#b3b3b3] mt-1.5 leading-relaxed">
                    Setelah unduhan selesai, penginstal paket akan terbuka otomatis. Jika belum terbuka, tarik notifikasi atas HP atau buka folder <span className="text-white font-bold">Download</span> lalu ketuk <span className="text-white font-bold">Brnsic.apk</span> untuk memasang pembaruan.
                  </p>
                </>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      localStorage.setItem("brnsic_app_version", updateInfo.version);
                      if ("caches" in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map((k) => caches.delete(k)));
                      }
                      if ("serviceWorker" in navigator) {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        for (const reg of regs) {
                          await reg.update().catch(() => {});
                        }
                      }
                    } catch (e) {}
                    window.location.reload();
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(30,215,96,0.4)] cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  <span>Perbarui Aplikasi Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          12. TOAST: NOTIFIKASI INTERAKTIF SHUFFLE & TASTE MODE
          ==================================================================== */}
      {shuffleToast && (
        <div className="fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none animate-fadeIn max-w-[90vw]">
          <div className="bg-black/95 border border-white/20 px-4 py-2.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold text-white max-w-sm text-center">
            <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse flex-shrink-0"></span>
            <span className="truncate">{shuffleToast}</span>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
}
