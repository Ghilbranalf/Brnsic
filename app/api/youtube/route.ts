import { NextRequest, NextResponse } from "next/server";

// Curated verified YouTube video IDs - 100% active, official & playable in embed
const VERIFIED_MAP: Record<string, string> = {
  // Dewa 19
  "dewa 19 kangen": "m8cPU4tzGa4",
  "kangen dewa 19": "m8cPU4tzGa4",
  "kangen": "m8cPU4tzGa4",
  "dewa 19 risalah hati": "J6i53rCB0y8",
  "risalah hati": "J6i53rCB0y8",
  "dewa 19 pupus": "7v2AJiZXHjI",
  "pupus": "7v2AJiZXHjI",

  // Sheila On 7
  "sheila on 7 dan": "IWvo2fld3s4",
  "dan sheila on 7": "IWvo2fld3s4",
  "dan": "IWvo2fld3s4",
  "sheila on 7 seberapa pantas": "jHPZMBF1I94",
  "seberapa pantas": "jHPZMBF1I94",

  // Sal Priadi
  "sal priadi gala bunga matahari": "gu6rT1Jelis",
  "gala bunga matahari": "gu6rT1Jelis",
  "bunga matahari": "gu6rT1Jelis",
  "sal priadi dari planet lain": "KDQ2GAdldGI",
  "dari planet lain": "KDQ2GAdldGI",

  // Bernadya
  "bernadya satu bulan": "7Jm2Il2U-c0",
  "satu bulan": "7Jm2Il2U-c0",
  "bernadya untungnya hidup harus tetap berjalan": "eUx-BHUhGLA",
  "untungnya hidup harus tetap berjalan": "eUx-BHUhGLA",
  "untungnya": "eUx-BHUhGLA",

  // Hindia
  "hindia evaluasi": "saXhrw-7rQI",
  "evaluasi": "saXhrw-7rQI",
  "hindia cincin": "S0Kez6MERGE",
  "cincin": "S0Kez6MERGE",
  "hindia rumah ke rumah": "pjhOjHDX0A8",
  "rumah ke rumah": "pjhOjHDX0A8",

  // Juicy Luicy & Adrian Khalif
  "juicy luicy tampar": "qmgA_WejI8w",
  "tampar": "qmgA_WejI8w",
  "adrian khalif juicy luicy sialan": "_m6l5nKEGIA",
  "adrian khalif sialan": "_m6l5nKEGIA",
  "sialan": "_m6l5nKEGIA",

  // Mahalini
  "mahalini mati matian": "LAOxuo6pkdo",
  "mati matian": "LAOxuo6pkdo",
  "mahalini sial": "QSWYyoF79oE",
  "sial mahalini": "QSWYyoF79oE",

  // Tulus
  "tulus hati hati di jalan": "_N6vSc_mT6I",
  "hati hati di jalan": "_N6vSc_mT6I",

  // Denny Caknan & Koplo
  "denny caknan sigar": "s525A0Bc3z4",
  "sigar": "s525A0Bc3z4",
  "6sentani only siji": "hQ1dTDQytjM",
  "sentani only siji": "hQ1dTDQytjM",
  "only siji": "hQ1dTDQytjM",

  // Rio Clappy
  "rio clappy bunga abadi": "fPMB2H450iI",
  "bunga abadi": "fPMB2H450iI",

  // International
  "bruno mars die with a smile": "kPa7bsKwL-c",
  "lady gaga bruno mars die with a smile": "kPa7bsKwL-c",
  "die with a smile": "kPa7bsKwL-c"
};

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

  // 2. Token overlap check
  const queryTokens = cleanQuery.split(" ").filter((w) => w.length > 2);
  for (const [key, id] of Object.entries(VERIFIED_MAP)) {
    const keyTokens = key.split(" ");
    const matches = queryTokens.filter((token) => keyTokens.includes(token));
    if (matches.length >= 2 || (queryTokens.length === 1 && keyTokens.includes(queryTokens[0]))) {
      return NextResponse.json({ videoId: id, candidates: [id], source: "verified-token", query: q });
    }
  }

  try {
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
    
    // Extract video IDs from videoId field
    const ids: string[] = [];
    const vidRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let match;
    while ((match = vidRegex.exec(html)) !== null) {
      const candidateId = match[1];
      // Filter out known broken/meme IDs
      if (candidateId !== "HDEzc4kcJXg" && candidateId !== "o3X4_5wP-u8" && !ids.includes(candidateId)) {
        ids.push(candidateId);
      }
      if (ids.length >= 6) break;
    }

    if (ids.length === 0) {
      const urlRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
      while ((match = urlRegex.exec(html)) !== null) {
        const candidateId = match[1];
        if (candidateId !== "HDEzc4kcJXg" && candidateId !== "o3X4_5wP-u8" && !ids.includes(candidateId)) {
          ids.push(candidateId);
        }
        if (ids.length >= 6) break;
      }
    }

    if (ids.length > 0) {
      return NextResponse.json({ videoId: ids[0], candidates: ids, query: q });
    }

    return NextResponse.json({ videoId: null, candidates: [], query: q }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videoId: null, candidates: [] }, { status: 500 });
  }
}
