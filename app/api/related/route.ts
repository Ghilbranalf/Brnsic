import { NextResponse } from "next/server";
import { filterTracksWithLyrics } from "@/lib/lyrics";

// Curated network of Indonesian & Global artists for high-relevance musical relationships (augments live Deezer graph)
const ARTIST_RELATIONS: Record<string, string[]> = {
  bleachers: ["The 1975", "Lorde", "Lana Del Rey", "Fun.", "COIN", "Wallows", "St. Vincent"],
  "the 1975": ["Bleachers", "Coldplay", "The Neighbourhood", "Arctic Monkeys", "LANY", "The Japanese House"],
  lorde: ["Bleachers", "Billie Eilish", "Lana Del Rey", "Phoebe Bridgers", "Clairo"],
  "lana del rey": ["Lorde", "Billie Eilish", "Taylor Swift", "Bleachers", "The Neighbourhood", "Mitski"],
  "arctic monkeys": ["The Strokes", "The 1975", "The Neighbourhood", "Cage The Elephant", "Oasis"],
  hindia: [".Feast", "Lomba Sihir", "Nadin Amizah", "Bernadya", "Sal Priadi", "Kunto Aji", "Reality Club"],
  ".feast": ["Hindia", "Lomba Sihir", "Barasuara", "Kelompok Penerbang Roket", "Seringai", "Perunggu"],
  "lomba sihir": ["Hindia", ".Feast", "Nadin Amizah", "Idgitaf", "Reality Club"],
  bernadya: ["Sal Priadi", "Juicy Luicy", "Mahalini", "Nadin Amizah", "Hindia", "Anggi Marito", "Fabio Asher"],
  "sal priadi": ["Bernadya", "Hindia", "Kunto Aji", "Nadin Amizah", "Tulus", "Dere", "Idgitaf"],
  "juicy luicy": ["Adrian Khalif", "Mahalini", "Fabio Asher", "Bernadya", "Tiara Andini", "Yura Yunita"],
  mahalini: ["Juicy Luicy", "Tiara Andini", "Ziva Magnolya", "Lyodra", "Rizky Febian", "Keisya Levronka"],
  tulus: ["Glenn Fredly", "Kunto Aji", "Sal Priadi", "Yura Yunita", "Afgan", "Pamungkas", "Raisa"],
  "sheila on 7": ["Dewa 19", "Padi", "Gigi", "Noah", "Peterpan", "Ada Band", "Ungu", "Naif"],
  "dewa 19": ["Sheila On 7", "Ari Lasso", "Padi", "Andra and the BackBone", "Slank", "Gigi"],
  "denny caknan": ["Happy Asmara", "Ndarboy Genk", "Guyon Waton", "Gilga Sahid", "Woro Widowati", "NDX A.K.A."],
  "bruno mars": ["Lady Gaga", "The Weeknd", "Silk Sonic", "Anderson .Paak", "Michael Jackson", "Dua Lipa"],
  "lady gaga": ["Bruno Mars", "Ariana Grande", "Katy Perry", "Madonna", "Beyonce", "Dua Lipa"],
  "taylor swift": ["Sabrina Carpenter", "Olivia Rodrigo", "Gracie Abrams", "Billie Eilish", "Lana Del Rey"],
  coldplay: ["The 1975", "Imagine Dragons", "OneRepublic", "Maroon 5", "Keane", "U2"],
  "billie eilish": ["Finneas", "Olivia Rodrigo", "Lorde", "Lana Del Rey", "Girl in Red", "Clairo"],
  "olivia rodrigo": ["Sabrina Carpenter", "Taylor Swift", "Billie Eilish", "Conan Gray", "Gracie Abrams"],
  "sabrina carpenter": ["Olivia Rodrigo", "Taylor Swift", "Chappell Roan", "Dua Lipa", "Ariana Grande"],
  "nadin amizah": ["Sal Priadi", "Hindia", "Bernadya", "Dere", "Feby Putri", "Pamungkas", "Danilla"],
  "fourtwnty": ["Payung Teduh", "Efek Rumah Kaca", "Fiersa Besari", "Banda Neira", "Dialog Dini Hari"],
  "reality club": ["Hindia", "Lomba Sihir", "Pamungkas", "The Adams", "White Shoes & The Couples Company"],
  "for revenge": ["Last Child", "Vierra", "Vierratale", "Killing Me Inside", "Pee Wee Gaskins"],
  xxxtentacion: ["Juice WRLD", "Lil Peep", "Trippie Redd", "Ski Mask The Slump God", "Travis Scott"],
  "juice wrld": ["XXXTENTACION", "Lil Uzi Vert", "Trippie Redd", "Post Malone", "The Kid LAROI"],
  "the weeknd": ["Bruno Mars", "Drake", "SZA", "Frank Ocean", "Kendrick Lamar", "Ariana Grande"],
  niki: ["Rich Brian", "Keshi", "88rising", "Joji", "Daniel Caesar", "Pamungkas"],
  keshi: ["Joji", "NIKI", "Daniel Caesar", "Jeremy Zucker", "Lauv", "dhruv"]
};

const JUNK_VERSION_PATTERN = /\b(karaoke|instrumental|tribute|cover|sped up|slowed|reverb|8d audio|nightcore|ringtone|8-bit|lullaby)\b/i;

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[\(\[].*?[\)\]]\s*/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isJunkTrack(title: string, seedTitle: string): boolean {
  if (JUNK_VERSION_PATTERN.test(seedTitle)) return false;
  return JUNK_VERSION_PATTERN.test(title);
}

interface RelatedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  collectionId?: number;
  genre?: string;
  reason: string;
  tier: "same_artist" | "related_artist" | "genre_mood";
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 3200): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 }
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchDeezerArtistGraph(artist: string): Promise<{
  deezerArtistId: number | null;
  relatedArtists: Array<{ id: number; name: string }>;
  sameArtistTracks: RelatedTrack[];
  radioTracks: RelatedTrack[];
}> {
  const searchData = await fetchJsonWithTimeout(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}&limit=5`
  );
  const candidates = Array.isArray(searchData?.data) ? searchData.data : [];
  if (candidates.length === 0) {
    return { deezerArtistId: null, relatedArtists: [], sameArtistTracks: [], radioTracks: [] };
  }

  const artistLower = artist.toLowerCase().trim();
  const exactMatch =
    candidates.find((c: any) => (c.name || "").toLowerCase().trim() === artistLower) ||
    candidates.find((c: any) => (c.name || "").toLowerCase().includes(artistLower)) ||
    candidates[0];

  const artistId = exactMatch?.id;
  if (!artistId) {
    return { deezerArtistId: null, relatedArtists: [], sameArtistTracks: [], radioTracks: [] };
  }

  const [relatedData, topData, radioData] = await Promise.all([
    fetchJsonWithTimeout(`https://api.deezer.com/artist/${artistId}/related?limit=12`),
    fetchJsonWithTimeout(`https://api.deezer.com/artist/${artistId}/top?limit=10`),
    fetchJsonWithTimeout(`https://api.deezer.com/artist/${artistId}/radio?limit=20`)
  ]);

  const relatedArtists: Array<{ id: number; name: string }> = (relatedData?.data || [])
    .filter((a: any) => a?.id && a?.name)
    .map((a: any) => ({ id: a.id, name: a.name }));

  const sameArtistTracks: RelatedTrack[] = (topData?.data || []).map((t: any) => ({
    id: `deezer-${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || exactMatch.name || artist,
    album: t.album?.title || "Single",
    duration: t.duration || 210,
    cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || "",
    genre: "",
    reason: `Lagu populer dari ${exactMatch.name || artist}`,
    tier: "same_artist" as const
  }));

  const radioTracks: RelatedTrack[] = (radioData?.data || []).map((t: any) => ({
    id: `deezer-${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || artist,
    album: t.album?.title || "Single",
    duration: t.duration || 210,
    cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || "",
    genre: "",
    reason: `Radio ${exactMatch.name || artist}`,
    tier: "related_artist" as const
  }));

  return { deezerArtistId: artistId, relatedArtists, sameArtistTracks, radioTracks };
}

async function fetchDeezerArtistTopTracks(
  artistId: number,
  artistName: string,
  seedArtist: string
): Promise<RelatedTrack[]> {
  const data = await fetchJsonWithTimeout(`https://api.deezer.com/artist/${artistId}/top?limit=5`);
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((t: any) => ({
    id: `deezer-${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || artistName,
    album: t.album?.title || "Single",
    duration: t.duration || 210,
    cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || "",
    genre: "",
    reason: `Mirip dengan ${seedArtist}`,
    tier: "related_artist" as const
  }));
}

async function fetchYouTubeRelatedMix(
  artist: string,
  title: string,
  genre: string
): Promise<RelatedTrack[]> {
  try {
    const query = title
      ? `${artist} ${title} similar songs ${genre}`.trim()
      : `${artist} ${genre} music`.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const ytRes = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240410.01.00", hl: "en", gl: "US" }
        },
        query
      }),
      signal: controller.signal,
      next: { revalidate: 3600 }
    });
    clearTimeout(timer);
    if (!ytRes.ok) return [];
    const data = await ytRes.json();
    const items: RelatedTrack[] = [];
    const walk = (o: any) => {
      if (!o || typeof o !== "object" || items.length >= 16) return;
      if (o.videoRenderer) {
        const vr = o.videoRenderer;
        const vid = vr.videoId;
        let rawTitle = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
        let rawArtist = vr.ownerText?.runs?.[0]?.text || "";
        const durStr = vr.lengthText?.simpleText || "";
        const thumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url;
        if (vid && rawTitle) {
          let durSec = 210;
          if (durStr) {
            const dp = durStr.split(".").join(":").split(":");
            if (dp.length === 2) durSec = parseInt(dp[0], 10) * 60 + parseInt(dp[1], 10);
            else if (dp.length === 3) durSec = parseInt(dp[0], 10) * 3600 + parseInt(dp[1], 10) * 60 + parseInt(dp[2], 10);
          }
          if (durSec < 60 || durSec > 480) return;
          if (rawTitle.includes(" - ")) {
            const parts = rawTitle.split(" - ");
            rawArtist = parts[0].trim();
            rawTitle = parts.slice(1).join(" - ").trim();
          }
          rawTitle = rawTitle
            .replace(/\s*[\(\[](official|audio|music video|video|lyric|lyrics|mv|visualizer|lirik)[\)\]]/gi, "")
            .replace(/#\S+/g, "")
            .trim();
          rawArtist = rawArtist.replace(/\s*-\s*topic/i, "").trim();
          if (rawTitle && rawArtist) {
            items.push({
              id: `yt-${vid}`,
              title: rawTitle,
              artist: rawArtist,
              album: "Single",
              duration: durSec,
              cover: thumb || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              genre: genre || "",
              reason: `Mirip dengan ${artist}`,
              tier: "genre_mood"
            });
          }
        }
      }
      for (const k of Object.keys(o)) walk(o[k]);
    };
    walk(data);
    return items;
  } catch {
    return [];
  }
}

async function fetchItunesTracksForArtist(
  artistQuery: string,
  reason: string,
  tier: "same_artist" | "related_artist" | "genre_mood",
  strictArtistMatch: boolean,
  limit = 8
): Promise<{ tracks: RelatedTrack[]; detectedGenre: string }> {
  const data = await fetchJsonWithTimeout(
    `https://itunes.apple.com/search?term=${encodeURIComponent(artistQuery)}&entity=song&limit=${limit}`
  );
  const results = Array.isArray(data?.results) ? data.results : [];
  const queryLower = artistQuery.toLowerCase().trim();
  let detectedGenre = "";

  const tracks: RelatedTrack[] = [];
  for (const t of results) {
    if (!t.trackName || !t.artistName) continue;
    const aName = t.artistName.toLowerCase().trim();
    if (strictArtistMatch && !aName.includes(queryLower) && !queryLower.includes(aName)) {
      continue;
    }
    if (!detectedGenre && t.primaryGenreName) {
      detectedGenre = t.primaryGenreName;
    }
    tracks.push({
      id: `itunes-${t.trackId}`,
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName || "Single",
      duration: Math.round((t.trackTimeMillis || 210000) / 1000),
      cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
      collectionId: t.collectionId,
      genre: t.primaryGenreName,
      reason,
      tier
    });
  }
  return { tracks, detectedGenre };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";

  if (!artist) {
    return NextResponse.json({ related: [] });
  }

  // Handle collab strings like "Hindia, Nadin Amizah" or "Bruno Mars & Lady Gaga"
  const primaryArtist = artist.split(/,|&|feat\.|ft\.|x /i)[0].trim() || artist.trim();
  const artistLower = primaryArtist.toLowerCase().trim();

  let curatedRelated: string[] = [];
  for (const [key, list] of Object.entries(ARTIST_RELATIONS)) {
    if (artistLower.includes(key) || key.includes(artistLower)) {
      curatedRelated = list;
      break;
    }
  }

  try {
    // 1. Live collaborative-filtering graph via Deezer + iTunes fallback for genre & metadata
    const [deezerGraph, itunesSame] = await Promise.all([
      fetchDeezerArtistGraph(primaryArtist),
      fetchItunesTracksForArtist(
        primaryArtist,
        `Lagu populer dari ${primaryArtist}`,
        "same_artist",
        true,
        12
      )
    ]);

    const seedGenreParam = searchParams.get("genre") || "";
    const detectedGenre = itunesSame.detectedGenre || seedGenreParam;
    const deezerArtistMap = new Map<string, { id: number; name: string }>();
    for (const rel of deezerGraph.relatedArtists) {
      deezerArtistMap.set(rel.name.toLowerCase().trim(), rel);
    }

    // Merge curated + live Deezer related artists (preserving uniqueness, prioritizing overlap/live)
    const combinedRelatedNames: string[] = [];
    const seenArtistNames = new Set<string>([artistLower]);

    for (const rel of deezerGraph.relatedArtists) {
      const k = rel.name.toLowerCase().trim();
      if (!seenArtistNames.has(k)) {
        seenArtistNames.add(k);
        combinedRelatedNames.push(rel.name);
      }
    }
    for (const name of curatedRelated) {
      const k = name.toLowerCase().trim();
      if (!seenArtistNames.has(k)) {
        seenArtistNames.add(k);
        combinedRelatedNames.push(name);
      }
    }

    // 2. Multi-artist fan-out: fetch top tracks from up to 6 related artists in parallel
    const targetRelatedArtists = combinedRelatedNames.slice(0, 6);
    const relatedBuckets = await Promise.all(
      targetRelatedArtists.map(async (relName) => {
        const dz = deezerArtistMap.get(relName.toLowerCase().trim());
        if (dz) {
          const dzTracks = await fetchDeezerArtistTopTracks(dz.id, dz.name, primaryArtist);
          if (dzTracks.length > 0) return dzTracks;
        }
        const itunesRes = await fetchItunesTracksForArtist(
          relName,
          `Mirip dengan ${primaryArtist}`,
          "related_artist",
          true,
          6
        );
        return itunesRes.tracks;
      })
    );

    // 3. Same-genre radio & fallback bucket (Deezer Artist Radio first, then strict genre-matched iTunes, then YT InnerTube mix)
    let genreBucket: RelatedTrack[] = [...(deezerGraph.radioTracks || [])];
    if (relatedBuckets.flat().length + genreBucket.length < 8 && detectedGenre) {
      const gRes = await fetchItunesTracksForArtist(
        detectedGenre,
        `Genre serupa: ${detectedGenre}`,
        "genre_mood",
        false,
        25
      );
      const genreLower = detectedGenre.toLowerCase().trim();
      const strictlyMatchedGenre = gRes.tracks.filter(
        (t) => (t.genre || "").toLowerCase().includes(genreLower) || genreLower.includes((t.genre || "").toLowerCase())
      );
      genreBucket.push(...strictlyMatchedGenre);
    }
    if (relatedBuckets.flat().length + genreBucket.length < 8) {
      const ytMix = await fetchYouTubeRelatedMix(primaryArtist, title, detectedGenre);
      genreBucket.push(...ytMix);
    }

    // 4. Deduplicate & filter junk (karaoke, slowed+reverb, covers)
    const seedTitleKey = normalizeTitleKey(title);
    const seenTitleKeys = new Set<string>(seedTitleKey ? [seedTitleKey] : []);

    const filterValid = (list: RelatedTrack[]): RelatedTrack[] => {
      const out: RelatedTrack[] = [];
      for (const item of list) {
        if (!item.title || !item.artist) continue;
        if (isJunkTrack(item.title, title)) continue;
        const key = normalizeTitleKey(item.title);
        if (!key || seenTitleKeys.has(key)) continue;
        seenTitleKeys.add(key);
        // Propagate detectedGenre if Deezer track lacks genre metadata
        if (!item.genre && detectedGenre) {
          item.genre = detectedGenre;
        }
        out.push(item);
      }
      return out;
    };

    const sameArtistPool = filterValid([
      ...deezerGraph.sameArtistTracks,
      ...itunesSame.tracks
    ]).slice(0, 4); // Cap same-artist tracks in radio so it doesn't monopolize the queue

    const cleanRelatedBuckets = relatedBuckets.map((b) => filterValid(b).slice(0, 4));
    const cleanGenreBucket = filterValid(genreBucket).slice(0, 6);

    // 5. Spotify/YT-Music style Round-Robin Interleaving:
    // Alternate across related artists with occasional seed-artist tracks sprinkled in!
    const collectedTracks: RelatedTrack[] = [];
    const maxRounds = 4;
    for (let r = 0; r < maxRounds; r++) {
      for (const bucket of cleanRelatedBuckets) {
        if (bucket[r]) collectedTracks.push(bucket[r]);
      }
      // Sprinkle 1 track from the seed artist on round 0 and round 2
      if ((r === 0 || r === 2) && sameArtistPool.length > 0) {
        const same = sameArtistPool.shift();
        if (same) collectedTracks.push(same);
      }
    }
    // Append any remaining same-artist or genre tracks at the tail
    collectedTracks.push(...sameArtistPool, ...cleanGenreBucket);

    const filteredRelated = await filterTracksWithLyrics(collectedTracks.slice(0, 36), 10, 2000);

    return NextResponse.json({
      related: filteredRelated.slice(0, 32),
      artistNetwork: combinedRelatedNames.slice(0, 10),
      detectedGenre
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, related: [] }, { status: 500 });
  }
}
