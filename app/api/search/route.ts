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
  "justin bieber", "bernadya", "sal priadi", "hindia", "juicy luicy", "mahalini", "tulus",
  "sheila on 7", "dewa 19", "nadin amizah", "denny caknan", "guyon waton",
  "happy asmara", "ndx a.k.a.", "for revenge", ".feast", "pamungkas", "fourtwnty",
  "rio clappy", "nadhif basalamah", "raisa", "kunto aji", "yura yunita",
  "adrian khalif", "fabio asher", "ziva magnolya", "rizky febian", "keisya levronka",
  "anggi marito", "idgitaf", "barasuara", "padi", "noah", "peterpan", "ari lasso",
  "anji", "the lantis", "d'masiv", "letto", "ungu", "kerispatih", "naif",
  "gilga sahid", "ndarboy genk", "woro widowati", "maliq & d'essentials",
  "tiara andini", "lyodra", "raim laode", "slank", "gigi", "ada band",
  "my chemical romance", "mcr", "coldplay", "taylor swift", "billie eilish",
  "bruno mars", "lady gaga", "queen", "oasis", "the weeknd", "ed sheeran",
  "ariana grande", "olivia rodrigo", "sabrina carpenter", "post malone", "maroon 5",
  "bts", "blackpink", "newjeans", "dua lipa", "harry styles", "eminem", "drake",
  "kendrick lamar", "rex orange county", "wave to earth", "sza", "avicii", "alan walker",
  "green day", "linkin park", "nirvana", "twenty one pilots", "radiohead", "the 1975"
];

// Verified High-Res Artist Avatars (600x600 HD)
const VERIFIED_ARTIST_AVATARS: Record<string, string> = {
  "sal priadi": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
  "bernadya": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d8/bb/8c/d8bb8c81-ddb9-e427-a18b-c385afae12c2/23UMGIM65225.rgb.jpg/600x600bb.jpg",
  "hindia": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/f8/d2/57f8d295-5ea9-f7b2-70ff-9494ce50fc5c/cover.jpg/600x600bb.jpg",
  "justin bieber": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg",
  "bruno mars": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg",
  "taylor swift": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg",
  "billie eilish": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg",
  "the weeknd": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/db/28/e7/db28e7c3-f53a-76c8-eaa4-d92a22e4f160/23UMGIM72115.rgb.jpg/600x600bb.jpg",
  "coldplay": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0c/82/48/0c8248a8-4a5b-d30d-8056-f32d650d2fc9/190295978068.jpg/600x600bb.jpg",
  "ed sheeran": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f0/bc/a9/f0bca9a9-47bc-ec59-0f28-361b7ef5bfde/12UMDIM01011.rgb.jpg/600x600bb.jpg",
  "ariana grande": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d6/21/2d/d6212d80-242c-3ddb-8b66-a722b3937b79/26UM1IM38195.rgb.jpg/600x600bb.jpg",
  "olivia rodrigo": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/1b/f9/1d1bf9b1-44c6-9a6c-6ffb-c158488c06ce/26UMGIM39303.rgb.jpg/600x600bb.jpg",
  "sabrina carpenter": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ae/c6/58/aec6589c-f5cf-0d81-2727-bc8775e34049/25UMGIM76990.rgb.jpg/600x600bb.jpg",
  "dua lipa": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/82/89/15/828915ea-d716-61c4-3de7-ef00c1f800fb/5054197853630.jpg/600x600bb.jpg",
  "niki": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6e/ff/43/6eff434b-8a53-3704-41d9-9cf34cb57f41/190296083709.jpg/600x600bb.jpg",
  "bts": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ce/fb/eb/cefbebd4-d53b-8d6c-33cf-2ee55408bd79/8804775077494_Cover.jpg/600x600bb.jpg",
  "blackpink": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/5e/74/ee5e747e-52e5-458c-e850-0ed3d703b184/8809519880736.jpg/600x600bb.jpg",
  "newjeans": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ab/ce/d6/abced6f6-2b90-c230-eb4b-e146734a3a22/196922907821_Cover.jpg/600x600bb.jpg",
  "post malone": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cd/78/35/cd783589-6ab9-8d51-d99e-308bee672e6f/26UM1IM40196.rgb.jpg/600x600bb.jpg",
  "maroon 5": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/d3/b1/f9/d3b1f91c-f2c0-7cc8-97fb-035db64b0ab2/12UMGIM26179.rgb.jpg/600x600bb.jpg",
  "my chemical romance": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/42/58/f7/4258f7bb-eb5b-62b8-573d-6200df0fe3e1/093624917731.jpg/600x600bb.jpg",
  "mcr": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/42/58/f7/4258f7bb-eb5b-62b8-573d-6200df0fe3e1/093624917731.jpg/600x600bb.jpg",
  "queen": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b0/ca/05/b0ca05aa-29c9-4e01-5a16-f6fa06bce05c/602527594347.jpg/600x600bb.jpg",
  "oasis": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/91/9d/c6/919dc6db-73f5-48ab-5e68-1d746c3d3042/4550795884898_cover.png/600x600bb.jpg",
  "sheila on 7": "https://is1-ssl.mzstatic.com/image/thumb/Music/ce/e0/61/mzi.jgqtztab.jpg/600x600bb.jpg",
  "dewa 19": "https://is1-ssl.mzstatic.com/image/thumb/Features/v4/64/35/40/643540a2-a05e-3e86-d9ee-da970c76cf8e/V4HttpAssetRepositoryClient-ticket.fxqmvnbz.jpg-3996104797570655989.jpg/600x600bb.jpg",
  "tulus": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/12/3e/bb123e64-7747-78f3-ce81-8b04bfe30e73/cover.jpg/600x600bb.jpg",
  "juicy luicy": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/26/0c/be/260cbe21-9d2d-a2ab-3391-f8fde6ad6840/198704005169_Cover.jpg/600x600bb.jpg",
  "mahalini": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/dd/66/bbdd66d0-f0f4-bad8-b15b-ef0b8754da5b/cover.jpg/600x600bb.jpg",
  "nadin amizah": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1d/10/9b/1d109b17-1bbf-1894-e774-4d9ad6baa7b3/cover.jpg/600x600bb.jpg"
};

const KNOWN_TOP_SONGS: Array<{ title: string; artist: string; popularity: number }> = [
  { title: "Helena", artist: "My Chemical Romance", popularity: 100 },
  { title: "Welcome to the Black Parade", artist: "My Chemical Romance", popularity: 100 },
  { title: "Baby", artist: "Justin Bieber", popularity: 100 },
  { title: "STAY", artist: "The Kid LAROI & Justin Bieber", popularity: 100 },
  { title: "Ghost", artist: "Justin Bieber", popularity: 98 },
  { title: "Peaches", artist: "Justin Bieber", popularity: 97 },
  { title: "Gala Bunga Matahari", artist: "Sal Priadi", popularity: 100 },
  { title: "Dari Planet Lain", artist: "Sal Priadi", popularity: 95 },
  { title: "Mesra-mesraannya kecil-kecilan dulu", artist: "Sal Priadi", popularity: 90 },
  { title: "Satu Bulan", artist: "Bernadya", popularity: 100 },
  { title: "Untungnya, Hidup Harus Tetap Berjalan", artist: "Bernadya", popularity: 98 },
  { title: "Kata Mereka Ini Berlebihan", artist: "Bernadya", popularity: 92 },
  { title: "Kini Mereka Tahu", artist: "Bernadya", popularity: 90 },
  { title: "Apa Mungkin", artist: "Bernadya", popularity: 92 },
  { title: "Evaluasi", artist: "Hindia", popularity: 98 },
  { title: "Cincin", artist: "Hindia", popularity: 94 },
  { title: "Secukupnya", artist: "Hindia", popularity: 92 },
  { title: "Rumah Ke Rumah", artist: "Hindia", popularity: 92 },
  { title: "Berdansalah, Karir Ini Tak Ada Artinya", artist: "Hindia", popularity: 95 },
  { title: "Tampar", artist: "Juicy Luicy", popularity: 98 },
  { title: "Lantas", artist: "Juicy Luicy", popularity: 96 },
  { title: "Sialan", artist: "Adrian Khalif, Juicy Luicy", popularity: 98 },
  { title: "Mati-Matian", artist: "Mahalini", popularity: 97 },
  { title: "Sial", artist: "Mahalini", popularity: 96 },
  { title: "Hati-Hati di Jalan", artist: "Tulus", popularity: 99 },
  { title: "Monokrom", artist: "Tulus", popularity: 95 },
  { title: "Rayuan Perempuan Gila", artist: "Nadin Amizah", popularity: 96 },
  { title: "Dan...", artist: "Sheila On 7", popularity: 99 },
  { title: "Sephia", artist: "Sheila On 7", popularity: 96 },
  { title: "Kangen", artist: "Dewa 19", popularity: 99 },
  { title: "Pupus", artist: "Dewa 19", popularity: 98 },
  { title: "Risalah Hati", artist: "Dewa 19", popularity: 97 },
  { title: "Separuh Nafas", artist: "Dewa 19", popularity: 97 },
  { title: "Die With A Smile", artist: "Lady Gaga, Bruno Mars", popularity: 100 },
  { title: "Birds of a Feather", artist: "Billie Eilish", popularity: 100 },
  { title: "Espresso", artist: "Sabrina Carpenter", popularity: 100 },
  { title: "Taste", artist: "Sabrina Carpenter", popularity: 98 },
  { title: "Yellow", artist: "Coldplay", popularity: 99 },
  { title: "Fix You", artist: "Coldplay", popularity: 98 },
  { title: "Viva La Vida", artist: "Coldplay", popularity: 99 },
  { title: "Bohemian Rhapsody", artist: "Queen", popularity: 100 },
  { title: "Wonderwall", artist: "Oasis", popularity: 100 },
  { title: "Seasons", artist: "wave to earth", popularity: 98 },
  { title: "bad", artist: "wave to earth", popularity: 96 }
];

// As-you-type trending suggestions directly from YouTube & Google Complete API
async function fetchTrendingSearchSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const text = await res.text();
    const match = text.match(/window\.google\.ac\.h\((.*)\)/);
    if (match) {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data[1])) {
        return data[1].map((item: any) => item[0]).filter((s: any) => typeof s === "string" && s.trim());
      }
    }
  } catch (e) {}
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({
      results: [],
      songs: [],
      artists: [],
      albums: [],
      topResult: null,
      suggestions: [],
      correctedQuery: null
    });
  }

  const queryRaw = q.trim();
  const queryClean = queryRaw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Live Popular Query Resolution (Translates prefix "berna" -> "Bernadya", "mcr" -> "My Chemical Romance")
  let correctedQuery: string | null = null;
  let detectedArtistName: string | null = null;

  // Local Dictionary Match
  for (const artist of KNOWN_ARTISTS) {
    if (artist === queryClean) {
      detectedArtistName = artist;
      break;
    }
    if (artist.startsWith(queryClean) && queryClean.length >= 3) {
      correctedQuery = artist;
      detectedArtistName = artist;
      break;
    }
    const maxDist = Math.min(2, Math.floor(artist.length * 0.35));
    const dist = levenshteinDistance(queryClean, artist);
    if (dist > 0 && dist <= maxDist) {
      correctedQuery = artist;
      detectedArtistName = artist;
      break;
    }
  }

  // Known Song Title Match
  if (!detectedArtistName) {
    for (const song of KNOWN_TOP_SONGS) {
      const tClean = song.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (tClean === queryClean) break;
      if (tClean.startsWith(queryClean) && queryClean.length >= 3) {
        correctedQuery = song.title;
        break;
      }
      const dist = levenshteinDistance(queryClean, tClean);
      if (dist > 0 && dist <= 2) {
        correctedQuery = song.title;
        break;
      }
    }
  }

  // 2. Fetch live real-time popular suggestions from Google/YouTube
  const liveSuggestionsPromise = fetchTrendingSearchSuggestions(queryRaw);

  const searchTerms = [queryRaw];
  if (correctedQuery && correctedQuery.toLowerCase() !== queryClean) {
    searchTerms.unshift(correctedQuery);
  }

  try {
    const liveSuggestions = await liveSuggestionsPromise;
    if (liveSuggestions.length > 0 && !detectedArtistName) {
      const topSugg = liveSuggestions[0].toLowerCase().trim();
      if (topSugg.startsWith(queryClean) && topSugg.length > queryClean.length && !searchTerms.includes(liveSuggestions[0])) {
        searchTerms.push(liveSuggestions[0]);
      }
    }

    const primaryQuery = searchTerms[0];

    // 3. Multi-Entity Parallel Search on iTunes Worldwide & Local Catalog
    const [songRes, artistRes, albumRes, indoSongRes] = await Promise.all([
      // Songs (Worldwide)
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(primaryQuery)}&entity=song&limit=30`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] })),
      // Artists
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(primaryQuery)}&entity=musicArtist&limit=5&country=id`, { next: { revalidate: 86400 } })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] })),
      // Albums
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(primaryQuery)}&entity=album&limit=8&country=id`, { next: { revalidate: 86400 } })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] })),
      // Secondary local Indonesian search
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(primaryQuery)}&country=id&entity=song&limit=25`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] }))
    ]);

    // 4. Parse & Deduplicate Artists
    const rawArtists = (artistRes.results || []).filter((a: any) => a.artistName);
    const artists: Array<{ id: string; name: string; genre: string; avatar: string }> = [];
    const seenArtists = new Set<string>();

    for (const a of rawArtists) {
      const norm = a.artistName.toLowerCase().trim();
      if (!seenArtists.has(norm)) {
        seenArtists.add(norm);
        const avatar =
          VERIFIED_ARTIST_AVATARS[norm] ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.artistName)}&backgroundColor=1f1f1f&textColor=ffffff`;
        artists.push({
          id: `artist-${a.artistId || norm}`,
          name: a.artistName,
          genre: a.primaryGenreName || "Artis Populer",
          avatar
        });
      }
    }

    // 5. Parse & Deduplicate Albums
    const rawAlbums = (albumRes.results || []).filter((al: any) => al.collectionName);
    const albums: Array<{
      id: string;
      collectionId: number;
      name: string;
      artist: string;
      cover: string;
      year: string;
      trackCount: number;
    }> = [];
    const seenAlbums = new Set<string>();

    for (const al of rawAlbums) {
      const norm = `${al.artistName} ${al.collectionName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seenAlbums.has(norm)) {
        seenAlbums.add(norm);
        albums.push({
          id: `album-${al.collectionId}`,
          collectionId: al.collectionId,
          name: al.collectionName,
          artist: al.artistName,
          cover: (al.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
          year: (al.releaseDate || "").slice(0, 4),
          trackCount: al.trackCount || 10
        });
      }
    }

    // 6. If Top Artist is strongly matched, fetch their official top streaming hits via Apple Music lookup
    let artistTopTracks: any[] = [];
    const matchedArtistObj = rawArtists.find((a: any) => {
      const aName = a.artistName.toLowerCase();
      return aName === queryClean || aName.startsWith(queryClean) || queryClean.startsWith(aName);
    });

    if (matchedArtistObj && matchedArtistObj.artistId) {
      try {
        const lookupRes = await fetch(
          `https://itunes.apple.com/lookup?id=${matchedArtistObj.artistId}&country=id&entity=song&limit=10`,
          { next: { revalidate: 86400 } }
        );
        if (lookupRes.ok) {
          const lData = await lookupRes.json();
          artistTopTracks = (lData.results || [])
            .filter((r: any) => r.wrapperType === "track")
            .map((t: any) => ({
              trackId: `itunes-${t.trackId}`,
              trackName: t.trackName,
              artistName: t.artistName,
              album: t.collectionName || "Single",
              collectionId: t.collectionId,
              artworkUrl100: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
              duration: Math.round((t.trackTimeMillis || 210000) / 1000),
              previewUrl: t.previewUrl,
              source: "itunes-top"
            }));
        }
      } catch (e) {}
    }

    // 7. Parse & Normalize Song Candidates
    const rawSongs = [...(artistTopTracks || []), ...(indoSongRes.results || []), ...(songRes.results || [])];
    const uniqueSongs: any[] = [];
    const seenSongs = new Set<string>();

    for (const t of rawSongs) {
      const title = (t.trackName || "").trim();
      const artist = (t.artistName || "").trim();
      if (!title || !artist) continue;

      // Penalize spam / parody
      if (/karaoke|parody|parodi|remix tribute|cover by|reaction|6sentani|only siji/i.test(title)) {
        continue;
      }

      const dedupeKey = `${artist.toLowerCase()} ${title.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
      if (!seenSongs.has(dedupeKey)) {
        seenSongs.add(dedupeKey);
        uniqueSongs.push({
          trackId: `itunes-${t.trackId}`,
          trackName: title,
          artistName: artist,
          album: t.collectionName || t.album || "Single",
          collectionId: t.collectionId,
          artworkUrl100: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
          duration: Math.round((t.trackTimeMillis || t.duration || 210000) / 1000),
          previewUrl: t.previewUrl,
          source: t.source || "itunes"
        });
      }
    }

    // 8. Spotify-Grade Relevance & Popularity Scoring Function
    const computeRelevance = (item: any): number => {
      const t = item.trackName.toLowerCase().trim();
      const a = item.artistName.toLowerCase().trim();
      let score = 0;

      // Artist top hits lookup bonus
      if (item.source === "itunes-top") {
        score += 5000;
      }

      // Check against known top hits dictionary for stream popularity boost
      for (const hit of KNOWN_TOP_SONGS) {
        const hTitle = hit.title.toLowerCase();
        const hArtist = hit.artist.toLowerCase();
        if (t === hTitle || (t.includes(hTitle) && a.includes(hArtist))) {
          score += hit.popularity * 25; // Massive boost for verified hits
          break;
        }
      }

      // Target terms matching (handles both prefix & corrected full terms)
      for (const term of [queryClean, ...(correctedQuery ? [correctedQuery.toLowerCase()] : [])]) {
        if (!term) continue;

        // Exact matches
        if (a === term) score += 4000;
        else if (a.startsWith(term)) score += 3000;
        else if (a.includes(term)) score += 1500;

        if (t === term) score += 4500;
        else if (t.startsWith(term)) score += 3200;
        else if (t.includes(term)) score += 1800;

        // Token match
        const tokens = term.split(" ").filter(Boolean);
        const titleTokensMatch = tokens.filter((tok) => t.includes(tok)).length;
        const artistTokensMatch = tokens.filter((tok) => a.includes(tok)).length;
        score += titleTokensMatch * 500;
        score += artistTokensMatch * 600;
      }

      return score;
    };

    uniqueSongs.sort((x, y) => computeRelevance(y) - computeRelevance(x));

    // 9. Spotify-Grade Top Result (Hasil Teratas) Determination
    let topResult: any = null;

    if (matchedArtistObj) {
      const artistName = matchedArtistObj.artistName;
      const avatar =
        VERIFIED_ARTIST_AVATARS[artistName.toLowerCase()] ||
        uniqueSongs.find((s) => s.artistName.toLowerCase() === artistName.toLowerCase())?.artworkUrl100 ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artistName)}&backgroundColor=1f1f1f&textColor=ffffff`;

      topResult = {
        type: "artist",
        id: `artist-${matchedArtistObj.artistId}`,
        artistId: matchedArtistObj.artistId,
        title: artistName,
        artist: matchedArtistObj.primaryGenreName || "Artis Terverifikasi",
        avatar,
        topTracks: uniqueSongs.filter((s) => s.artistName.toLowerCase() === artistName.toLowerCase()).slice(0, 5)
      };
    } else if (uniqueSongs.length > 0) {
      topResult = {
        type: "song",
        ...uniqueSongs[0]
      };
    }

    return NextResponse.json({
      topResult,
      songs: uniqueSongs.slice(0, 30),
      artists: artists.slice(0, 6),
      albums: albums.slice(0, 8),
      suggestions: liveSuggestions.slice(0, 8),
      correctedQuery: correctedQuery && correctedQuery.toLowerCase() !== queryClean ? correctedQuery : null,
      originalQuery: queryRaw,
      results: uniqueSongs.slice(0, 30) // Backwards compatible with legacy frontend
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [], songs: [], artists: [], albums: [] }, { status: 500 });
  }
}
