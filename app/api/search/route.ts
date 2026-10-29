import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Damerau-Levenshtein Distance with transpose support for typo tolerance
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Transposition (e.g. "teh" -> "the", "blach" -> "bleach")
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[m][n];
}

// Global & Indonesian Music Lexicon for instant typo auto-correction & prefix search
const KNOWN_ARTISTS: string[] = [
  "bleachers", "the 1975", "lorde", "lana del rey", "taylor swift", "billie eilish",
  "bruno mars", "coldplay", "arctic monkeys", "olivia rodrigo", "sabrina carpenter",
  "sza", "the weeknd", "kendrick lamar", "dua lipa", "queen", "oasis", "wallows",
  "coin", "fun.", "clairo", "phoebe bridgers", "chappell roan", "gracie abrams",
  "ed sheeran", "harry styles", "adele", "maroon 5", "imagine dragons", "one direction",
  "radiohead", "the strokes", "paramore", "green day", "linkin park", "nirvana",
  "twenty one pilots", "conan gray", "girl in red", "finneas", "lady gaga",
  "bernadya", "sal priadi", "hindia", "juicy luicy", "mahalini", "tulus",
  "sheila on 7", "dewa 19", "nadin amizah", "denny caknan", "guyon waton",
  "happy asmara", "ndx a.k.a.", "for revenge", ".feast", "pamungkas", "fourtwnty",
  "rio clappy", "nadhif basalamah", "raisa", "kunto aji", "yura yunita",
  "adrian khalif", "fabio asher", "ziva magnolya", "rizky febian", "keisya levronka",
  "anggi marito", "idgitaf", "barasuara", "padi", "noah", "peterpan", "ari lasso",
  "anji", "the lantis", "d'masiv", "letto", "ungu", "kerispatih", "naif",
  "gilga sahid", "ndarboy genk", "woro widowati", "maliq & d'essentials",
  "tiara andini", "lyodra", "raim laode", "slank", "gigi", "ada band"
];

const KNOWN_TOP_SONGS: Array<{ title: string; artist: string; popularity: number }> = [
  { title: "Gala Bunga Matahari", artist: "Sal Priadi", popularity: 100 },
  { title: "Dari Planet Lain", artist: "Sal Priadi", popularity: 95 },
  { title: "Mesra-mesraannya kecil-kecilan dulu", artist: "Sal Priadi", popularity: 90 },
  { title: "Satu Bulan", artist: "Bernadya", popularity: 100 },
  { title: "Untungnya, Hidup Harus Tetap Berjalan", artist: "Bernadya", popularity: 95 },
  { title: "Kata Mereka Ini Berlebihan", artist: "Bernadya", popularity: 90 },
  { title: "Kini Mereka Tahu", artist: "Bernadya", popularity: 88 },
  { title: "Evaluasi", artist: "Hindia", popularity: 98 },
  { title: "Cincin", artist: "Hindia", popularity: 94 },
  { title: "Secukupnya", artist: "Hindia", popularity: 92 },
  { title: "Rumah Ke Rumah", artist: "Hindia", popularity: 92 },
  { title: "Tampar", artist: "Juicy Luicy", popularity: 98 },
  { title: "Lantas", artist: "Juicy Luicy", popularity: 96 },
  { title: "Asing", artist: "Juicy Luicy", popularity: 92 },
  { title: "Sialan", artist: "Adrian Khalif, Juicy Luicy", popularity: 98 },
  { title: "Mati-Matian", artist: "Mahalini", popularity: 97 },
  { title: "Sial", artist: "Mahalini", popularity: 96 },
  { title: "Bawa Dia Kembali", artist: "Mahalini", popularity: 88 },
  { title: "Hati-Hati di Jalan", artist: "Tulus", popularity: 99 },
  { title: "Monokrom", artist: "Tulus", popularity: 95 },
  { title: "Diri", artist: "Tulus", popularity: 90 },
  { title: "Rayuan Perempuan Gila", artist: "Nadin Amizah", popularity: 96 },
  { title: "Sorai", artist: "Nadin Amizah", popularity: 92 },
  { title: "Bertaut", artist: "Nadin Amizah", popularity: 94 },
  { title: "Sigar", artist: "Denny Caknan", popularity: 95 },
  { title: "Wirang", artist: "Denny Caknan", popularity: 93 },
  { title: "Dan...", artist: "Sheila On 7", popularity: 99 },
  { title: "Sephia", artist: "Sheila On 7", popularity: 96 },
  { title: "Kita", artist: "Sheila On 7", popularity: 94 },
  { title: "Kangen", artist: "Dewa 19", popularity: 99 },
  { title: "Pupus", artist: "Dewa 19", popularity: 98 },
  { title: "Separuh Nafas", artist: "Dewa 19", popularity: 97 },
  { title: "Risalah Hati", artist: "Dewa 19", popularity: 97 },
  { title: "Bunga Abadi", artist: "Rio Clappy", popularity: 90 },
  { title: "Penjaga Hati", artist: "Nadhif Basalamah", popularity: 92 },
  { title: "Komang", artist: "Raim Laode", popularity: 95 },
  { title: "Die With A Smile", artist: "Lady Gaga, Bruno Mars", popularity: 100 },
  { title: "Birds of a Feather", artist: "Billie Eilish", popularity: 100 },
  { title: "Espresso", artist: "Sabrina Carpenter", popularity: 100 },
  { title: "Taste", artist: "Sabrina Carpenter", popularity: 98 },
  { title: "Rollercoaster", artist: "Bleachers", popularity: 95 },
  { title: "I Wanna Get Better", artist: "Bleachers", popularity: 96 },
  { title: "Don't Take The Money", artist: "Bleachers", popularity: 95 },
  { title: "Modern Girl", artist: "Bleachers", popularity: 92 },
  { title: "Stop Making This Hurt", artist: "Bleachers", popularity: 90 },
  { title: "About You", artist: "The 1975", popularity: 98 },
  { title: "Robbers", artist: "The 1975", popularity: 97 },
  { title: "Chocolate", artist: "The 1975", popularity: 95 },
  { title: "Somebody Else", artist: "The 1975", popularity: 96 },
  { title: "Yellow", artist: "Coldplay", popularity: 99 },
  { title: "Fix You", artist: "Coldplay", popularity: 98 },
  { title: "Viva La Vida", artist: "Coldplay", popularity: 99 },
  { title: "Cruel Summer", artist: "Taylor Swift", popularity: 100 },
  { title: "As It Was", artist: "Harry Styles", popularity: 99 },
  { title: "Starboy", artist: "The Weeknd", popularity: 99 }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [], correctedQuery: null });
  }

  const queryRaw = q.trim();
  const queryClean = queryRaw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const queryTokens = queryClean.split(" ").filter(Boolean);

  // 1. AI Spell Corrector & Typo Tolerance (Fuzzy Matcher)
  // Handles typos like "blacher" -> "bleachers", "sal priady" -> "sal priadi", "dwa 19" -> "dewa 19"
  let correctedQuery: string | null = null;
  let detectedArtist: string | null = null;

  // Check against known artists
  for (const artist of KNOWN_ARTISTS) {
    if (artist === queryClean) {
      detectedArtist = artist;
      break;
    }
    // Prefix match as user types (e.g. "bleach", "bernad", "juicy")
    if (artist.startsWith(queryClean) && queryClean.length >= 3) {
      correctedQuery = artist;
      detectedArtist = artist;
      break;
    }
    // Typo match (e.g. "blacher" -> "bleachers", "tampr" -> "tampar")
    const maxDistance = Math.min(2, Math.floor(artist.length * 0.35));
    const dist = levenshteinDistance(queryClean, artist);
    if (dist > 0 && dist <= maxDistance) {
      correctedQuery = artist;
      detectedArtist = artist;
      break;
    }
  }

  // Check against known song titles if no artist matched
  if (!detectedArtist) {
    for (const song of KNOWN_TOP_SONGS) {
      const tClean = song.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (tClean === queryClean) break;
      if (tClean.startsWith(queryClean) && queryClean.length >= 4) {
        correctedQuery = song.title;
        break;
      }
      const maxDistance = Math.min(2, Math.floor(tClean.length * 0.25));
      const dist = levenshteinDistance(queryClean, tClean);
      if (dist > 0 && dist <= maxDistance) {
        correctedQuery = song.title;
        break;
      }
    }
  }

  // Effective queries to search in parallel
  const searchQueries = [queryRaw];
  if (correctedQuery && correctedQuery.toLowerCase() !== queryClean) {
    searchQueries.unshift(correctedQuery);
  }

  try {
    // 2. Multi-Storefront Worldwide Apple Music search in parallel
    const itunesPromises = searchQueries.map(async (queryStr) => {
      try {
        // Query worldwide iTunes catalog without country lock, plus high-res artwork
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          queryStr
        )}&entity=song&limit=30`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          return data.results || [];
        }
      } catch (e) {}
      return [];
    });

    // Also query Indonesian iTunes store if query contains local Indonesian terms
    const isIndoCandidate = queryTokens.some((tok) =>
      /bunga|matahari|bulan|hidup|evaluasi|tampar|sialan|mati|jalan|gila|sigar|kangen|cincin|dan|sheila|dewa|hindia|bernadya|tulus|juicy|mahalini/i.test(tok)
    );
    if (isIndoCandidate) {
      itunesPromises.push(
        (async () => {
          try {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
              searchQueries[0]
            )}&country=id&entity=song&limit=25`;
            const res = await fetch(url, { next: { revalidate: 3600 } });
            if (res.ok) {
              const data = await res.json();
              return data.results || [];
            }
          } catch (e) {}
          return [];
        })()
      );
    }

    // 3. YouTube Indie search for obscure / local single audio
    const ytPromise = (async () => {
      try {
        const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          searchQueries[0] + " official audio"
        )}`;
        const ytRes = await fetch(ytSearchUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        if (ytRes.ok) {
          const html = await ytRes.text();
          const jsonMatch = html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/);
          if (jsonMatch) {
            const ytData = JSON.parse(jsonMatch[1]);
            const contents =
              ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
                ?.contents?.[0]?.itemSectionRenderer?.contents || [];
            
            const ytHits: any[] = [];
            for (const item of contents) {
              const video = item.videoRenderer;
              if (video && video.videoId && video.title?.runs?.[0]?.text) {
                const fullTitle = video.title.runs[0].text;
                const lower = fullTitle.toLowerCase();
                if (/reaction|cover live|meme|parodi|parody|kartun|cartoon|animasi|jedag jedug|dj tiktok|short|6sentani|only siji/i.test(lower)) {
                  continue;
                }

                let artist = video.ownerText?.runs?.[0]?.text || "Indie Artist";
                let title = fullTitle;
                if (fullTitle.includes(" - ")) {
                  const parts = fullTitle.split(" - ");
                  artist = parts[0].trim();
                  title = parts.slice(1).join(" - ").replace(/\(Official.*?\)/gi, "").replace(/\[Official.*?\]/gi, "").trim();
                }

                ytHits.push({
                  trackId: `yt-${video.videoId}`,
                  trackName: title,
                  artistName: artist,
                  album: "YouTube Single",
                  artworkUrl100: video.thumbnail?.thumbnails?.[0]?.url || "",
                  duration: 210,
                  youtubeId: video.videoId,
                  source: "youtube"
                });
                if (ytHits.length >= 6) break;
              }
            }
            return ytHits;
          }
        }
      } catch (e) {}
      return [];
    })();

    const [itunesArrays, ytItems] = await Promise.all([
      Promise.all(itunesPromises),
      ytPromise
    ]);

    // Flatten & normalize iTunes results
    const rawItunesList = itunesArrays.flat();
    const itunesItems = rawItunesList.map((t: any) => ({
      trackId: `itunes-${t.trackId}`,
      trackName: t.trackName,
      artistName: t.artistName,
      album: t.collectionName || "Single",
      collectionId: t.collectionId,
      artworkUrl100: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
      duration: Math.round((t.trackTimeMillis || 210000) / 1000),
      previewUrl: t.previewUrl,
      source: "itunes"
    }));

    // 4. Spotify-Grade Relevance & Popularity Scoring Function
    // Crowns the most famous / most streamed song or artist directly to #1
    const candidatePool = [...itunesItems, ...ytItems];
    const seen = new Set<string>();
    const uniqueCandidates: any[] = [];

    for (const item of candidatePool) {
      const t = (item.trackName || "").toLowerCase().trim();
      const a = (item.artistName || "").toLowerCase().trim();
      if (!t) continue;
      if (t.includes("6sentani") || t.includes("only siji") || a.includes("6sentani") || a.includes("only siji")) {
        continue;
      }

      const dedupeKey = `${a} ${t}`.replace(/[^a-z0-9]/g, "");
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        uniqueCandidates.push(item);
      }
    }

    // Scoring engine evaluates both user query and corrected query
    const targetTerms = [queryClean, ...(correctedQuery ? [correctedQuery.toLowerCase()] : [])];

    const computeRelevance = (item: any): number => {
      const t = (item.trackName || "").toLowerCase().trim();
      const a = (item.artistName || "").toLowerCase().trim();
      let score = 0;

      // Check against known top hits dictionary for popularity stream boost (+500 to +1000)
      for (const hit of KNOWN_TOP_SONGS) {
        const hTitle = hit.title.toLowerCase();
        const hArtist = hit.artist.toLowerCase();
        if (t === hTitle || (t.includes(hTitle) && a.includes(hArtist))) {
          score += hit.popularity * 10; // Max +1000 stream popularity boost
          break;
        }
      }

      for (const term of targetTerms) {
        // 1. ARTIST MATCH (When user searches for an artist e.g. "bleachers", "sal priadi", "coldplay")
        if (a === term) {
          score += 4000; // Giant priority for songs actually sung by this artist!
        } else if (a.startsWith(term)) {
          score += 3000;
        } else if (a.includes(term)) {
          score += 1500;
        }

        // 2. TITLE MATCH (When user searches for a song title e.g. "gala bunga matahari", "rollercoaster")
        if (t === term) {
          score += 3500;
        } else if (t.startsWith(term)) {
          score += 2500;
        } else if (t.includes(term)) {
          score += 1200;
        }

        // Token-level matching for multi-word queries
        const tokens = term.split(" ").filter(Boolean);
        const titleTokensMatch = tokens.filter((tok) => t.includes(tok)).length;
        const artistTokensMatch = tokens.filter((tok) => a.includes(tok)).length;
        score += titleTokensMatch * 400;
        score += artistTokensMatch * 500;
      }

      // Bonus for high-definition studio versions from iTunes over random YouTube rips
      if (item.source === "itunes") {
        score += 300;
      }

      return score;
    };

    uniqueCandidates.sort((x, y) => computeRelevance(y) - computeRelevance(x));

    return NextResponse.json({
      results: uniqueCandidates.slice(0, 30),
      correctedQuery: correctedQuery && correctedQuery.toLowerCase() !== queryClean ? correctedQuery : null,
      originalQuery: queryRaw
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
