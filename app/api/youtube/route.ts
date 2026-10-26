import { NextRequest, NextResponse } from "next/server";

// Curated verified YouTube video IDs - 100% active, official & playable in embed
const VERIFIED_MAP: Record<string, string> = {
  // Sal Priadi (100% Pure Studio Master - Direct from Record Label Orang Pertunjukan)
  "sal priadi gala bunga matahari": "lABZ_-uhC0E",
  "gala bunga matahari sal priadi": "lABZ_-uhC0E",
  "gala bunga matahari": "lABZ_-uhC0E",
  "bunga matahari": "lABZ_-uhC0E",
  "sal priadi dari planet lain": "Xd-L2O4taPI",
  "dari planet lain sal priadi": "Xd-L2O4taPI",
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
  "ada titik titik di ujung doa": "63H7pcUUm6s",

  // Bernadya (Direct Label Studio Masters - JUNI Records)
  "bernadya satu bulan": "z-XHpftdXEE",
  "satu bulan bernadya": "z-XHpftdXEE",
  "satu bulan": "z-XHpftdXEE",
  "bernadya untungnya hidup harus tetap berjalan": "hc-8aB0Dkkw",
  "untungnya hidup harus tetap berjalan": "hc-8aB0Dkkw",
  "untungnya": "hc-8aB0Dkkw",
  "bernadya kini mereka tahu": "IqVSxkOxboE",
  "kini mereka tahu": "IqVSxkOxboE",
  "bernadya kata mereka ini berlebihan": "7lY30YdGfF0",
  "kata mereka ini berlebihan": "7lY30YdGfF0",
  "bernadya lama lama": "57r6QkK0o0E",

  // Hindia
  "hindia evaluasi": "cWrSjCZ5AeE",
  "evaluasi hindia": "cWrSjCZ5AeE",
  "evaluasi": "cWrSjCZ5AeE",
  "hindia cincin": "RtK4E61x3Fs",
  "cincin hindia": "RtK4E61x3Fs",
  "cincin": "RtK4E61x3Fs",
  "hindia rumah ke rumah": "pjhOjHDX0A8",
  "rumah ke rumah": "pjhOjHDX0A8",
  "hindia secukupnya": "6D59nZzG6-s",
  "secukupnya": "6D59nZzG6-s",

  // Juicy Luicy
  "juicy luicy tampar": "DqJN5Pg3As4",
  "tampar juicy luicy": "DqJN5Pg3As4",
  "tampar": "DqJN5Pg3As4",

  // Rio Clappy
  "rio clappy bunga abadi": "dPktgrR8L6k",
  "bunga abadi": "dPktgrR8L6k",

  // Denny Caknan
  "denny caknan sigar": "Z3E3AamV2to",
  "sigar": "Z3E3AamV2to",

  // Sheila On 7
  "sheila on 7 dan": "k1BfsO0mxWQ",
  "dan sheila on 7": "k1BfsO0mxWQ",
  "dan": "k1BfsO0mxWQ",

  // Dewa 19
  "dewa 19 kangen": "utgn0LCDirk",
  "kangen dewa 19": "utgn0LCDirk",
  "kangen": "utgn0LCDirk",

  // Nadin Amizah
  "nadin amizah rayuan perempuan gila": "Kk02q89_3Y0",
  "rayuan perempuan gila": "Kk02q89_3Y0",
  "nadin amizah semua aku dirayakan": "oKqH2N96M14",
  "semua aku dirayakan": "oKqH2N96M14",
  "nadin amizah bertaut": "YmB5Kj5p3rU",
  "bertaut": "YmB5Kj5p3rU",

  // Dewa 19 - Extra
  "dewa 19 risalah hati": "J6i53rCB0y8",
  "risalah hati": "J6i53rCB0y8",
  "dewa 19 pupus": "7v2AJiZXHjI",
  "pupus": "7v2AJiZXHjI",
  "dewa 19 separuh nafas": "6zZ_E51c56k",
  "separuh nafas": "6zZ_E51c56k",

  // Sheila On 7 - Extra
  "sheila on 7 seberapa pantas": "jHPZMBF1I94",
  "seberapa pantas": "jHPZMBF1I94",
  "sheila on 7 melompat lebih tinggi": "Ym17pYwW2zE",

  // Juicy Luicy & Adrian Khalif
  "juicy luicy lantas": "s2U6M_74r4E",
  "lantas": "s2U6M_74r4E",
  "adrian khalif juicy luicy sialan": "_m6l5nKEGIA",
  "adrian khalif sialan": "_m6l5nKEGIA",
  "sialan": "_m6l5nKEGIA",

  // Denny Caknan - Extra
  "denny caknan wirang": "4n9W1z26nC8",
  "wirang": "4n9W1z26nC8",

  // Nadhif Basalamah & Raim Laode
  "nadhif basalamah penjaga hati": "fFm-Hn7vEaU",
  "penjaga hati": "fFm-Hn7vEaU",
  "raim laode komang": "sNqB3a8B99Q",
  "komang": "sNqB3a8B99Q",

  // International
  "bruno mars die with a smile": "kPa7bsKwL-c",
  "lady gaga bruno mars die with a smile": "kPa7bsKwL-c",
  "die with a smile": "kPa7bsKwL-c"
};

const BLOCKED_WORDS = [
  "mr bean", "bean", "meme", "parodi", "parody", "reaction", "reaksi",
  "animasi", "cartoon", "kartun", "short", "shorts", "jedag jedug", "dj tiktok",
  "funny", "kompilasi", "speed up", "slowed", "remix meme", "6sentani", "only siji"
];

function parseCleanVideoResults(html: string): Array<{ id: string; title: string }> {
  const jsonMatch =
    html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
    html.match(/ytInitialData = ({[\s\S]+?});/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const contentsStr = JSON.stringify(data);
      const videoRegex =
        /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g;

      const filtered: Array<{ id: string; title: string }> = [];
      let m: RegExpExecArray | null;
      while ((m = videoRegex.exec(contentsStr)) !== null) {
        const id = m[1];
        const title = m[2].toLowerCase();
        const hasBlocked = BLOCKED_WORDS.some((w) => title.includes(w));
        if (!hasBlocked && !filtered.some((f) => f.id === id)) {
          filtered.push({ id, title: m[2] });
        }
      }
      if (filtered.length > 0) return filtered;
    } catch (e) {}
  }

  // Fallback regex matching
  const titleVidRegex =
    /"title":\{"runs":\[\{"text":"(.*?)"\}\]}.*?"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const results: Array<{ id: string; title: string }> = [];
  let tm: RegExpExecArray | null;
  while ((tm = titleVidRegex.exec(html)) !== null) {
    const title = tm[1].toLowerCase();
    const id = tm[2];
    if (!BLOCKED_WORDS.some((w) => title.includes(w)) && !results.some((r) => r.id === id)) {
      results.push({ id, title: tm[1] });
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const cleanQuery = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Direct key match in verified table
  for (const [key, id] of Object.entries(VERIFIED_MAP)) {
    if (cleanQuery === key || cleanQuery.includes(key) || key.includes(cleanQuery)) {
      return NextResponse.json({ videoId: id, candidates: [id], source: "verified", query: q });
    }
  }

  // 2. Token overlap check (Minimum 2 distinct words)
  const queryTokens = cleanQuery.split(" ").filter((w) => w.length > 2);
  for (const [key, id] of Object.entries(VERIFIED_MAP)) {
    const keyTokens = key.split(" ");
    const matches = queryTokens.filter((token) => keyTokens.includes(token));
    if (matches.length >= 2) {
      return NextResponse.json({ videoId: id, candidates: [id], source: "verified-token", query: q });
    }
  }

  try {
    // 1. Search for official studio master topic track (Provided to YouTube by label)
    const topicUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      q.trim() + ' "Provided to YouTube"'
    )}`;
    
    const topicRes = await fetch(topicUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 3600 }
    });

    const topicHtml = await topicRes.text();
    const topicResults = parseCleanVideoResults(topicHtml);
    if (topicResults.length > 0) {
      const ids = topicResults.map((r) => r.id);
      return NextResponse.json({
        videoId: ids[0],
        title: topicResults[0].title,
        candidates: ids,
        source: "topic-master",
        query: q
      });
    }

    // 2. Fallback to clean official audio
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      q.trim() + " official audio"
    )}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 3600 }
    });

    const html = await response.text();
    const cleanResults = parseCleanVideoResults(html);

    if (cleanResults.length > 0) {
      const ids = cleanResults.map((r) => r.id);
      return NextResponse.json({
        videoId: ids[0],
        title: cleanResults[0].title,
        candidates: ids,
        source: "search-clean",
        query: q
      });
    }

    return NextResponse.json({ videoId: null, candidates: [], query: q }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videoId: null, candidates: [] }, { status: 500 });
  }
}
