import { NextResponse } from "next/server";

// Curated network of Indonesian & Global artists for high-relevance musical relationships
const ARTIST_RELATIONS: Record<string, string[]> = {
  hindia: [".Feast", "Lomba Sihir", "Nadin Amizah", "Bernadya", "Sal Priadi", "Kunto Aji", "Baskara Putra"],
  ".feast": ["Hindia", "Lomba Sihir", "Barasuara", "Kelompok Penerbang Roket", "Seringai"],
  "lomba sihir": ["Hindia", ".Feast", "Nadin Amizah", "Idgitaf"],
  bernadya: ["Sal Priadi", "Juicy Luicy", "Mahalini", "Nadin Amizah", "Hindia", "Anggi Marito"],
  "sal priadi": ["Bernadya", "Hindia", "Kunto Aji", "Nadin Amizah", "Tulus", "Dere"],
  "juicy luicy": ["Adrian Khalif", "Mahalini", "Fabio Asher", "Bernadya", "Tiara Andini"],
  mahalini: ["Juicy Luicy", "Tiara Andini", "Ziva Magnolya", "Lyodra", "Rizky Febian", "Keisya Levronka"],
  tulus: ["Glenn Fredly", "Kunto Aji", "Sal Priadi", "Yura Yunita", "Afgan", "Pamungkas"],
  "sheila on 7": ["Dewa 19", "Padi", "Gigi", "Noah", "Peterpan", "Ada Band", "Ungu"],
  "dewa 19": ["Sheila On 7", "Ari Lasso", "Padi", "Andra and the BackBone", "Slank"],
  "denny caknan": ["Happy Asmara", "Ndarboy Genk", "Guyon Waton", "Gilga Sahid", "Woro Widowati"],
  "bruno mars": ["Lady Gaga", "The Weeknd", "Silk Sonic", "Anderson .Paak", "Michael Jackson"],
  "lady gaga": ["Bruno Mars", "Ariana Grande", "Katy Perry", "Madonna", "Beyonce"],
  "taylor swift": ["Sabrina Carpenter", "Olivia Rodrigo", "Gracie Abrams", "Billie Eilish", "Lana Del Rey"],
  coldplay: ["The 1975", "Imagine Dragons", "OneRepublic", "Maroon 5", "Keane"],
  "the 1975": ["Coldplay", "The Neighbourhood", "Arctic Monkeys", "LANY", "Bleachers"]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";

  if (!artist) {
    return NextResponse.json({ related: [] });
  }

  const artistLower = artist.toLowerCase().trim();
  let relatedArtists: string[] = [];

  for (const [key, list] of Object.entries(ARTIST_RELATIONS)) {
    if (artistLower.includes(key) || key.includes(artistLower)) {
      relatedArtists = list;
      break;
    }
  }

  try {
    // 1. Fetch other top tracks by the same artist
    const sameArtistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      artist
    )}&country=id&entity=song&limit=10`;
    
    // 2. Fetch top track from related artists if found
    const targetQuery = relatedArtists.length > 0 ? relatedArtists[0] : artist;
    const relatedArtistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      targetQuery
    )}&country=id&entity=song&limit=8`;

    const [sameRes, relatedRes] = await Promise.allSettled([
      fetch(sameArtistUrl, { next: { revalidate: 3600 } }),
      fetch(relatedArtistUrl, { next: { revalidate: 3600 } })
    ]);

    const collectedTracks: any[] = [];
    const seenTitles = new Set<string>([title.toLowerCase()]);

    if (sameRes.status === "fulfilled" && sameRes.value.ok) {
      const data = await sameRes.value.json();
      const sameList = (data.results || []).filter(
        (t: any) => !seenTitles.has(t.trackName.toLowerCase().trim())
      );
      // Pick up to 2 songs from same artist
      sameList.slice(0, 2).forEach((t: any) => {
        seenTitles.add(t.trackName.toLowerCase().trim());
        collectedTracks.push({
          id: `itunes-${t.trackId}`,
          title: t.trackName,
          artist: t.artistName,
          album: t.collectionName || "Single",
          duration: Math.round((t.trackTimeMillis || 210000) / 1000),
          cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
          collectionId: t.collectionId,
          reason: `Lagu lain dari ${artist}`
        });
      });
    }

    if (relatedRes.status === "fulfilled" && relatedRes.value.ok) {
      const data = await relatedRes.value.json();
      (data.results || []).forEach((t: any) => {
        const tLower = t.trackName.toLowerCase().trim();
        if (!seenTitles.has(tLower)) {
          seenTitles.add(tLower);
          collectedTracks.push({
            id: `itunes-${t.trackId}`,
            title: t.trackName,
            artist: t.artistName,
            album: t.collectionName || "Single",
            duration: Math.round((t.trackTimeMillis || 210000) / 1000),
            cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
            collectionId: t.collectionId,
            reason: `Terkait genre/lingkaran ${artist}`
          });
        }
      });
    }

    // Shuffle collected recommendations so the same track is never locked at index 0
    const randomized = [...collectedTracks].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      related: randomized,
      artistNetwork: relatedArtists
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, related: [] }, { status: 500 });
  }
}
