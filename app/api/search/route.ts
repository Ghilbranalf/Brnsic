import { NextResponse } from "next/server";

// Curated top popular & trending tracks indexed for instant smart search
const POPULAR_SEARCH_INDEX = [
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
    title: "Penjaga Hati",
    artist: "Nadhif Basalamah",
    album: "Penjaga Hati - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/600x600bb.jpg",
    duration: 250,
    youtubeId: "fFm-Hn7vEaU",
    tags: ["penjaga", "hati", "nadhif", "basalamah"]
  },
  {
    title: "Komang",
    artist: "Raim Laode",
    album: "Komang - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8d/6f/fa/8d6ffae9-5a5f-75bd-d626-756a539e1b78/cover.jpg/600x600bb.jpg",
    duration: 222,
    youtubeId: "sNqB3a8B99Q",
    tags: ["komang", "raim", "laode"]
  },
  {
    title: "Die With A Smile",
    artist: "Lady Gaga, Bruno Mars",
    album: "Die With A Smile - Single",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    duration: 251,
    youtubeId: "kPa7bsKwL-c",
    tags: ["die", "smile", "bruno", "mars", "lady", "gaga"]
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const queryClean = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const queryWords = queryClean.split(" ").filter(Boolean);

  // 1. Instant match against verified popular songs (fuzzy token matching for typos & partial titles)
  const popularMatches = POPULAR_SEARCH_INDEX.filter((song) => {
    const t = song.title.toLowerCase();
    const a = song.artist.toLowerCase();
    const tags = song.tags || [];

    // Direct substring in title or artist
    if (t.includes(queryClean) || a.includes(queryClean)) return true;

    // Word/Token overlap
    return queryWords.some((word) => {
      if (word.length < 2) return false;
      if (t.includes(word) || a.includes(word) || tags.some((tag) => tag.includes(word))) return true;
      // Handle typo variations (e.g. "matahri" -> "matahari", "berna" -> "bernadya")
      return tags.some((tag) => {
        if (Math.abs(tag.length - word.length) > 2) return false;
        return tag.startsWith(word.slice(0, 3)) || word.startsWith(tag.slice(0, 3));
      });
    });
  }).map((song) => ({
    trackId: `popular-${song.youtubeId}`,
    trackName: song.title,
    artistName: song.artist,
    album: song.album,
    artworkUrl100: song.cover,
    duration: song.duration,
    youtubeId: song.youtubeId,
    source: "popular-verified",
    isPopular: true
  }));

  try {
    // 2. Fetch iTunes Music API
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      q.trim()
    )}&country=id&entity=song&limit=25`;
    const itunesRes = await fetch(itunesUrl, { next: { revalidate: 3600 } });
    let itunesItems: any[] = [];
    if (itunesRes.ok) {
      const iData = await itunesRes.json();
      itunesItems = (iData.results || []).map((t: any) => ({
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
    }

    // 3. Fetch YouTube Indie / Local Search
    let ytItems: any[] = [];
    try {
      const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        q.trim() + " audio"
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
          
          for (const item of contents) {
            const video = item.videoRenderer;
            if (video && video.videoId && video.title?.runs?.[0]?.text) {
              const fullTitle = video.title.runs[0].text;
              const lower = fullTitle.toLowerCase();
              if (
                lower.includes("reaction") ||
                lower.includes("cover live") ||
                lower.includes("mr bean") ||
                lower.includes("bean") ||
                lower.includes("meme") ||
                lower.includes("parodi") ||
                lower.includes("parody") ||
                lower.includes("kartun") ||
                lower.includes("cartoon") ||
                lower.includes("animasi") ||
                lower.includes("jedag jedug") ||
                lower.includes("dj tiktok") ||
                lower.includes("short") ||
                lower.includes("6sentani") ||
                lower.includes("only siji")
              ) {
                continue;
              }

              let artist = video.ownerText?.runs?.[0]?.text || "Indie Artist";
              let title = fullTitle;
              if (fullTitle.includes(" - ")) {
                const parts = fullTitle.split(" - ");
                artist = parts[0].trim();
                title = parts.slice(1).join(" - ").replace(/\(Official.*?\)/gi, "").replace(/\[Official.*?\]/gi, "").trim();
              }

              ytItems.push({
                trackId: `yt-${video.videoId}`,
                trackName: title,
                artistName: artist,
                album: "YouTube Single",
                artworkUrl100: video.thumbnail?.thumbnails?.[0]?.url || "",
                duration: 210,
                youtubeId: video.videoId,
                source: "youtube"
              });

              if (ytItems.length >= 6) break;
            }
          }
        }
      }
    } catch (e) {}

    // Combine results and rank TITLE MATCHES first before artist matches
    const seen = new Set<string>();
    const combined: any[] = [];

    const listToMerge = [...popularMatches, ...itunesItems, ...ytItems];

    for (const item of listToMerge) {
      const t = (item.trackName || "").toLowerCase();
      const a = (item.artistName || "").toLowerCase();
      if (t.includes("6sentani") || t.includes("only siji") || a.includes("6sentani") || a.includes("only siji")) {
        continue;
      }

      const cleanKey = `${(item.artistName || "").toLowerCase()} ${(item.trackName || "").toLowerCase()}`.replace(
        /[^a-z0-9]/g,
        ""
      );
      if (!seen.has(cleanKey)) {
        seen.add(cleanKey);
        combined.push(item);
      }
    }

    // Rank TITLE matches first, then artist matches!
    const getScore = (item: any) => {
      const t = (item.trackName || "").toLowerCase().trim();
      const a = (item.artistName || "").toLowerCase().trim();

      if (t === queryClean) return 2000;
      if (t.startsWith(queryClean)) return 1500;
      if (t.includes(queryClean)) return 1000;

      const matchedTokensInTitle = queryWords.filter((w) => t.includes(w));
      if (matchedTokensInTitle.length > 0) return 500 + matchedTokensInTitle.length * 100;

      if (a === queryClean) return 200;
      if (a.includes(queryClean)) return 100;
      return 10;
    };

    combined.sort((x, y) => getScore(y) - getScore(x));

    return NextResponse.json({ results: combined.slice(0, 30) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: popularMatches }, { status: 500 });
  }
}
