import { NextRequest, NextResponse } from "next/server";

// Curated verified YouTube Studio Master IDs (100% Official Audio, 0s movie/dialogue intro)
const VERIFIED_MAP: Record<string, string> = {
  // Sal Priadi (100% Pure Label Studio Master)
  "sal priadi gala bunga matahari": "lABZ_-uhC0E",
  "gala bunga matahari": "lABZ_-uhC0E",
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

function cleanString(str: string): string {
  return (str || "")
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

function parseCleanVideoResults(html: string): Array<{ id: string; title: string; score: number }> {
  const jsonMatch =
    html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
    html.match(/ytInitialData = ({[\s\S]+?});/);

  const candidates: Array<{ id: string; title: string; score: number }> = [];

  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const contentsStr = JSON.stringify(data);
      const videoRegex =
        /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g;

      let m: RegExpExecArray | null;
      while ((m = videoRegex.exec(contentsStr)) !== null) {
        const id = m[1];
        const rawTitle = m[2];
        const lower = rawTitle.toLowerCase();

        // Calculate studio master score
        let score = 50;
        if (lower.includes("- topic")) score += 60; // Auto-generated YouTube Music studio master
        if (lower.includes("official audio")) score += 40;
        if (lower.includes("provided to youtube")) score += 50;
        if (lower.includes("audio")) score += 20;

        // Apply heavy penalties for MVs with dialogue intros or memes
        for (const bad of PENALIZED_WORDS) {
          if (lower.includes(bad)) {
            score -= 60;
          }
        }

        if (score > 0 && !candidates.some((c) => c.id === id)) {
          candidates.push({ id, title: rawTitle, score });
        }
      }
    } catch (e) {}
  }

  // Fallback regex matching
  if (candidates.length === 0) {
    const titleVidRegex =
      /"title":\{"runs":\[\{"text":"(.*?)"\}\]}.*?"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let tm: RegExpExecArray | null;
    while ((tm = titleVidRegex.exec(html)) !== null) {
      const rawTitle = tm[1];
      const lower = rawTitle.toLowerCase();
      const id = tm[2];

      let score = 40;
      if (lower.includes("topic") || lower.includes("official audio")) score += 40;
      for (const bad of PENALIZED_WORDS) {
        if (lower.includes(bad)) score -= 50;
      }

      if (score > 0 && !candidates.some((c) => c.id === id)) {
        candidates.push({ id, title: rawTitle, score });
      }
    }
  }

  // Sort descending by highest studio audio score
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistParam = searchParams.get("artist") || "";
  const titleParam = searchParams.get("title") || "";
  const qParam = searchParams.get("q") || "";

  const cleanArtist = cleanString(artistParam);
  const cleanTitle = cleanString(titleParam);
  const fullClean = cleanString(qParam || `${cleanArtist} ${cleanTitle}`);

  if (!fullClean) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // 1. Direct Exact & Substring Match in Verified Studio Dictionary
  const exactKey = `${cleanArtist} ${cleanTitle}`.trim();
  if (VERIFIED_MAP[exactKey]) {
    return NextResponse.json({
      videoId: VERIFIED_MAP[exactKey],
      candidates: [VERIFIED_MAP[exactKey]],
      source: "verified-exact",
      query: fullClean
    });
  }

  if (cleanTitle && VERIFIED_MAP[cleanTitle]) {
    return NextResponse.json({
      videoId: VERIFIED_MAP[cleanTitle],
      candidates: [VERIFIED_MAP[cleanTitle]],
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
    // 2. High-Precision Query 1: YouTube Music Topic (Pure Label Master, 0 movie intros)
    const topicSearch = `"${cleanTitle}" "${cleanArtist}" "Provided to YouTube"`;
    const topicUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topicSearch)}`;

    const topicRes = await fetch(topicUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 86400 }
    });

    const topicHtml = await topicRes.text();
    const topicResults = parseCleanVideoResults(topicHtml);
    if (topicResults.length > 0 && topicResults[0].score >= 30) {
      const ids = topicResults.map((r) => r.id);
      return NextResponse.json({
        videoId: ids[0],
        title: topicResults[0].title,
        candidates: ids,
        source: "topic-label-master",
        query: fullClean
      });
    }

    // 3. High-Precision Query 2: Official Audio
    const audioSearch = `"${cleanArtist}" "${cleanTitle}" "Official Audio"`;
    const audioUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(audioSearch)}`;

    const audioRes = await fetch(audioUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 86400 }
    });

    const audioHtml = await audioRes.text();
    const audioResults = parseCleanVideoResults(audioHtml);
    if (audioResults.length > 0 && audioResults[0].score >= 20) {
      const ids = audioResults.map((r) => r.id);
      return NextResponse.json({
        videoId: ids[0],
        title: audioResults[0].title,
        candidates: ids,
        source: "official-audio-master",
        query: fullClean
      });
    }

    // 4. Fallback: Clean query without music video intro
    const fallbackSearch = `${cleanArtist} ${cleanTitle} audio`;
    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(fallbackSearch)}`;

    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 86400 }
    });

    const fallbackHtml = await fallbackRes.text();
    const fallbackResults = parseCleanVideoResults(fallbackHtml);

    if (fallbackResults.length > 0) {
      const ids = fallbackResults.map((r) => r.id);
      return NextResponse.json({
        videoId: ids[0],
        title: fallbackResults[0].title,
        candidates: ids,
        source: "audio-fallback",
        query: fullClean
      });
    }

    return NextResponse.json({ videoId: null, candidates: [], query: fullClean }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videoId: null, candidates: [] }, { status: 500 });
  }
}
