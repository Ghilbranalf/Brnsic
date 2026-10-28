import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated verified YouTube Studio Master IDs (100% Official Audio, 0s movie/dialogue intro)
const VERIFIED_MAP: Record<string, string> = {
  // eńau / Enau
  "enau ijazah": "tYGGKG6CRls",
  "ijazah": "tYGGKG6CRls",
  "enau bersamaku akan sedikit susah": "ohVuxEok7s8",
  "bersamaku akan sedikit susah": "ohVuxEok7s8",
  "enau rakyat biasa": "2yS7ERldKtE",
  "rakyat biasa": "2yS7ERldKtE",

  // The Lantis
  "the lantis lampu merah": "IP57OKJlywA",
  "lampu merah": "IP57OKJlywA",
  "the lantis bunga maaf": "1v3DqMSm-uY",
  "bunga maaf": "1v3DqMSm-uY",

  // Melly Mono / Anji
  "melly mono berhenti di kamu": "Vq7zgLz7qpw",
  "anji berhenti di kamu": "Vq7zgLz7qpw",
  "berhenti di kamu": "Vq7zgLz7qpw",

  // Sal Priadi (100% Pure Label Studio Master)
  "sal priadi gala bunga matahari": "kv2WIY8RLQQ",
  "gala bunga matahari": "kv2WIY8RLQQ",
  "sal priadi dari planet lain": "Xd-L2O4taPI",
  "dari planet lain": "Xd-L2O4taPI",
  "sal priadi mesra mesraannya kecil kecilan dulu": "cezEWo5WlIE",
  "mesra mesraannya kecil kecilan dulu": "cezEWo5WlIE",
  "sal priadi kita usahakan rumah itu": "qkNHIcwrNxg",
  "kita usahakan rumah itu": "qkNHIcwrNxg",
  "sal priadi besok kita pergi makan": "fCENI-ZaMQM",
  "besok kita pergi makan": "fCENI-ZaMQM",
  "sal priadi amin paling serius": "9h1Qs9o7TOI",
  "amin paling serius": "9h1Qs9o7TOI",
  "sal priadi irama laot teduh": "NAjYWikwSTE",
  "sal priadi ada titik titik di ujung doa": "63H7pcUUm6s",

  // Bernadya (Direct Label Studio Masters - JUNI Records)
  "bernadya satu bulan": "z-XHpftdXEE",
  "satu bulan": "z-XHpftdXEE",
  "bernadya untungnya hidup harus tetap berjalan": "hc-8aB0Dkkw",
  "untungnya hidup harus tetap berjalan": "hc-8aB0Dkkw",
  "bernadya kini mereka tahu": "IqVSxkOxboE",
  "kini mereka tahu": "IqVSxkOxboE",
  "bernadya kata mereka ini berlebihan": "7lY30YdGfF0",
  "kata mereka ini berlebihan": "7lY30YdGfF0",
  "bernadya lama lama": "57r6QkK0o0E",
  "lama lama": "57r6QkK0o0E",
  "bernadya apa mungkin": "B91xN2B0M8A",
  "apa mungkin": "B91xN2B0M8A",

  // Hindia
  "hindia evaluasi": "cWrSjCZ5AeE",
  "evaluasi": "cWrSjCZ5AeE",
  "hindia cincin": "RtK4E61x3Fs",
  "cincin": "RtK4E61x3Fs",
  "hindia rumah ke rumah": "pjhOjHDX0A8",
  "rumah ke rumah": "pjhOjHDX0A8",
  "hindia secukupnya": "6D59nZzG6-s",
  "secukupnya": "6D59nZzG6-s",
  "hindia berdansalah karir ini tak ada artinya": "sx2m0ryInTk",
  "berdansalah karir ini tak ada artinya": "sx2m0ryInTk",
  "hindia berdansalah karir tak ada artinya": "sx2m0ryInTk",
  "berdansalah karir tak ada artinya": "sx2m0ryInTk",
  "berdansalah": "sx2m0ryInTk",

  // Juicy Luicy & Adrian Khalif
  "juicy luicy tampar": "DqJN5Pg3As4",
  "tampar": "DqJN5Pg3As4",
  "juicy luicy lantas": "s2U6M_74r4E",
  "lantas": "s2U6M_74r4E",
  "adrian khalif juicy luicy sialan": "_m6l5nKEGIA",
  "adrian khalif sialan": "_m6l5nKEGIA",
  "sialan": "_m6l5nKEGIA",
  "juicy luicy sayang tapi tak bersama": "wXy4P4eM04w",

  // Mahalini
  "mahalini mati matian": "LAOxuo6pkdo",
  "mati matian": "LAOxuo6pkdo",
  "mahalini sial": "T-sZ_vR_M8c",
  "sial": "T-sZ_vR_M8c",
  "mahalini sisa rasa": "r9T3m77s6kI",
  "sisa rasa": "r9T3m77s6kI",

  // Tulus
  "tulus hati hati di jalan": "_N6vSc_mT6I",
  "hati hati di jalan": "_N6vSc_mT6I",
  "tulus diri": "C_l5gN3xVwU",
  "tulus monokrom": "2wR_r6s8FqU",
  "monokrom": "2wR_r6s8FqU",

  // Rio Clappy & Nadhif Basalamah & Raim Laode
  "rio clappy bunga abadi": "dPktgrR8L6k",
  "bunga abadi": "dPktgrR8L6k",
  "nadhif basalamah penjaga hati": "fFm-Hn7vEaU",
  "penjaga hati": "fFm-Hn7vEaU",
  "raim laode komang": "sNqB3a8B99Q",
  "komang": "sNqB3a8B99Q",

  // Denny Caknan & Dangdut Hits
  "denny caknan sigar": "Z3E3AamV2to",
  "sigar": "Z3E3AamV2to",
  "denny caknan wirang": "4n9W1z26nC8",
  "wirang": "4n9W1z26nC8",
  "denny caknan kalih welasku": "i8g3r6p2k9s",
  "kalih welasku": "i8g3r6p2k9s",
  "guyon waton wirang": "4n9W1z26nC8",

  // Sheila On 7
  "sheila on 7 dan": "k1BfsO0mxWQ",
  "dan": "k1BfsO0mxWQ",
  "sheila on 7 seberapa pantas": "jHPZMBF1I94",
  "seberapa pantas": "jHPZMBF1I94",
  "sheila on 7 melompat lebih tinggi": "Ym17pYwW2zE",
  "melompat lebih tinggi": "Ym17pYwW2zE",
  "sheila on 7 film favorit": "0_iJ4P2b7uQ",

  // Dewa 19
  "dewa 19 kangen": "utgn0LCDirk",
  "kangen": "utgn0LCDirk",
  "dewa 19 risalah hati": "J6i53rCB0y8",
  "risalah hati": "J6i53rCB0y8",
  "dewa 19 pupus": "7v2AJiZXHjI",
  "pupus": "7v2AJiZXHjI",
  "dewa 19 separuh nafas": "6zZ_E51c56k",
  "separuh nafas": "6zZ_E51c56k",

  // Nadin Amizah
  "nadin amizah rayuan perempuan gila": "Kk02q89_3Y0",
  "rayuan perempuan gila": "Kk02q89_3Y0",
  "nadin amizah semua aku dirayakan": "oKqH2N96M14",
  "semua aku dirayakan": "oKqH2N96M14",
  "nadin amizah bertaut": "YmB5Kj5p3rU",
  "bertaut": "YmB5Kj5p3rU",

  // Curated Indonesian Storytelling Podcasts (Rintik Sedu)
  "rintik sedu nanti kita akan sampai": "mqNhPq10w8k",
  "rintik sedu aneh banget kita pisah gitu aja": "G-MhvHm_-HA",
  "rintik sedu capek gak sih salam kenal mulu": "5_jiR9_xg5Y",

  // International Studio Audio
  "lady gaga bruno mars die with a smile": "kPa7bsKwL-c",
  "bruno mars die with a smile": "kPa7bsKwL-c",
  "die with a smile": "kPa7bsKwL-c",
  "billie eilish birds of a feather": "V9PVRfjEBTI",
  "birds of a feather": "V9PVRfjEBTI",
  "sabrina carpenter espresso": "eVli-tstM5E",
  "espresso": "eVli-tstM5E",
  "sabrina carpenter please please please": "cF1Na4AIecM",
  "please please please": "cF1Na4AIecM"
};

// Strict list of words that indicate non-studio audio (movie intros, skits, memes, covers, parodies)
const PENALIZED_WORDS = [
  "official music video", "official video", "music video", "video klip",
  "short film", "film pendek", "clip officiel", "teaser", "trailer",
  "behind the scenes", "behind the scene", "bts", "making of",
  "meme", "parodi", "parody", "reaction", "reaksi", "animasi", "cartoon",
  "kartun", "short", "shorts", "jedag jedug", "dj tiktok", "funny",
  "kompilasi", "speed up", "slowed", "live session", "live acoustic",
  "konser", "cover by", "karaoke"
];

// Spoken word / podcast exclusions (Blocks news talk shows, podcasts, crime hearings)
const PODCAST_EXCLUSIONS = [
  "podcast", "talkshow", "talk show", "interview", "wawancara",
  "full episode", "episode", "eps.", "audiobook", "stand up comedy",
  "terkuak", "berita", "kasus", "polisi", "sidang", "debat", "viral news",
  "fakta mengejutkan", "klarifikasi", "pengakuan", "dokumenter", "investigasi",
  "tvone", "kompastv", "metrotv", "tribun", "detikcom", "inews", "breaking news",
  "alur cerita", "bedah lagu", "reaksi", "reaction", "vlog", "sinopsis"
];

function cleanString(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Removes diacritics: eńau -> enau, Beyoncé -> Beyonce
    .toLowerCase()
    .replace(/\(feat.*?\)/gi, "")
    .replace(/\[feat.*?\]/gi, "")
    .replace(/feat\..*?$/gi, "")
    .replace(/ft\..*?$/gi, "")
    .replace(/\(official.*?\)/gi, "")
    .replace(/\[official.*?\]/gi, "")
    .replace(/\(audio\)/gi, "")
    .replace(/\(lyrics\)/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPureTitle(title: string): string {
  let cleaned = cleanString(title);
  cleaned = cleaned
    .replace(/\b(single|remastered|remaster|album version|original mix|bonus track|anniversary edition)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || cleanString(title);
}

function parseDurationSeconds(durStr: string): number | null {
  if (!durStr || typeof durStr !== "string") return null;
  const parts = durStr.trim().replace(/\./g, ":").split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return null;
}

interface ScoredCandidate {
  id: string;
  title: string;
  durStr: string;
  durSec: number | null;
  channel: string;
  score: number;
}

function parseCleanVideoResults(
  html: string,
  artist: string,
  title: string,
  expectedDuration?: number
): ScoredCandidate[] {
  const jsonMatch =
    html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
    html.match(/ytInitialData = ({[\s\S]+?});/);

  const candidates: ScoredCandidate[] = [];
  const cleanA = cleanString(artist);
  const cleanT = cleanString(title);

  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);

      const walk = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (obj.videoRenderer) {
          const vr = obj.videoRenderer;
          const id = vr.videoId;
          if (!id || typeof id !== "string") return;
          const rawTitle = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
          const durStr = vr.lengthText?.simpleText || "";
          const durSec = parseDurationSeconds(durStr);
          const channel = vr.ownerText?.runs?.[0]?.text || "";
          const lower = (rawTitle + " " + channel).toLowerCase();

          // 1. HARD DURATION FILTER:
          // Strictly reject any video longer than 12 mins (720s) or shorter than 45s.
          // This eliminates 200-minute podcasts, 3-hour news shows, documentaries, and memes!
          if (durSec !== null) {
            if (durSec < 45 || durSec > 720) return;
          }

          // 2. RELEVANCE FILTER:
          // Video title MUST contain at least one meaningful keyword from the song title!
          const titleWords = cleanT.split(" ").filter((w) => w.length > 1);
          const artistWords = cleanA.split(" ").filter((w) => w.length > 1);

          const hasTitleMatch = titleWords.length > 0 && titleWords.some((w) => lower.includes(w));
          if (!hasTitleMatch) {
            // Discard videos that don't even have the song's title
            return;
          }

          const hasArtistMatch = artistWords.length === 0 || artistWords.some((w) => lower.includes(w));

          let score = 50;

          // Title match density
          const matchedTitleWords = titleWords.filter((w) => lower.includes(w)).length;
          score += matchedTitleWords * 30;

          if (hasArtistMatch) score += 40;
          if (channel.toLowerCase().includes(cleanA)) score += 30;

          // Official Audio / Topic / Lyric bonuses
          if (lower.includes("- topic")) score += 70;
          if (lower.includes("official audio")) score += 60;
          if (lower.includes("provided to youtube")) score += 50;
          if (lower.includes("official lyric video") || lower.includes("lyric video")) score += 40;
          if (lower.includes("audio")) score += 20;

          // Penalize MVs with skits or memes
          for (const bad of PENALIZED_WORDS) {
            if (lower.includes(bad)) score -= 20;
          }

          // Disqualify talkshows/news
          for (const pod of PODCAST_EXCLUSIONS) {
            if (lower.includes(pod) && !lower.includes("rintik sedu")) {
              score -= 300;
            }
          }

          // Bonus for duration closeness to expected track duration
          if (expectedDuration && durSec) {
            const diff = Math.abs(durSec - expectedDuration);
            if (diff <= 25) score += 30;
            else if (diff <= 60) score += 15;
            else if (diff > 150) score -= 30;
          }

          if (score > 0 && !candidates.some((c) => c.id === id)) {
            candidates.push({ id, title: rawTitle, durStr, durSec, channel, score });
          }
        }
        for (const k of Object.keys(obj)) {
          walk(obj[k]);
        }
      }

      walk(data);
    } catch (e) {}
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistParam = searchParams.get("artist") || "";
  const titleParam = searchParams.get("title") || "";
  const qParam = searchParams.get("q") || "";
  const durationParam = searchParams.get("duration") || "";

  const cleanArtist = cleanString(artistParam);
  const pureTitle = extractPureTitle(titleParam);
  const cleanTitle = cleanString(titleParam);
  const fullClean = cleanString(qParam || `${cleanArtist} ${pureTitle}`);

  const rawDur = parseFloat(durationParam);
  const expectedDuration = !isNaN(rawDur) && rawDur > 20 ? rawDur : 240;

  if (!fullClean) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // 1. Direct Exact & Substring Match in Verified Studio Dictionary
  const exactKey = `${cleanArtist} ${pureTitle}`.trim();
  if (VERIFIED_MAP[exactKey]) {
    return NextResponse.json({
      videoId: VERIFIED_MAP[exactKey],
      candidates: [VERIFIED_MAP[exactKey]],
      source: "verified-exact",
      query: fullClean
    });
  }

  if (pureTitle && VERIFIED_MAP[pureTitle]) {
    return NextResponse.json({
      videoId: VERIFIED_MAP[pureTitle],
      candidates: [VERIFIED_MAP[pureTitle]],
      source: "verified-title",
      query: fullClean
    });
  }

  if (VERIFIED_MAP[fullClean]) {
    return NextResponse.json({
      videoId: VERIFIED_MAP[fullClean],
      candidates: [VERIFIED_MAP[fullClean]],
      source: "verified-full",
      query: fullClean
    });
  }

  try {
    const fetchHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    };

    // Multi-tier Clean Search Sequence (No rigid quotes that break non-major indie artists!)
    const queries = [
      `${cleanArtist} ${pureTitle} audio`,
      `${cleanArtist} ${pureTitle}`,
      `${pureTitle} ${cleanArtist}`,
      `${cleanArtist} ${pureTitle} topic`
    ];

    for (const q of queries) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const res = await fetch(searchUrl, {
        headers: fetchHeaders,
        next: { revalidate: 86400 }
      });

      if (res.ok) {
        const html = await res.text();
        const results = parseCleanVideoResults(html, cleanArtist, pureTitle, expectedDuration);
        if (results.length > 0 && results[0].score >= 40) {
          const ids = results.map((r) => r.id);
          return NextResponse.json({
            videoId: ids[0],
            title: results[0].title,
            candidates: ids,
            duration: results[0].durStr,
            source: "audio-matched-master",
            query: q
          });
        }
      }
    }

    // Fallback: search by title alone if artist query yielded no song
    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${pureTitle} audio`)}`;
    const fbRes = await fetch(fallbackUrl, {
      headers: fetchHeaders,
      next: { revalidate: 86400 }
    });
    if (fbRes.ok) {
      const fbHtml = await fbRes.text();
      const fbResults = parseCleanVideoResults(fbHtml, cleanArtist, pureTitle, expectedDuration);
      if (fbResults.length > 0) {
        const ids = fbResults.map((r) => r.id);
        return NextResponse.json({
          videoId: ids[0],
          title: fbResults[0].title,
          candidates: ids,
          duration: fbResults[0].durStr,
          source: "audio-fallback",
          query: `${pureTitle} audio`
        });
      }
    }

    return NextResponse.json({ videoId: null, candidates: [], query: fullClean }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videoId: null, candidates: [] }, { status: 500 });
  }
}
