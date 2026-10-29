import { NextResponse } from "next/server";

// Curated network of Indonesian & Global artists for high-relevance musical relationships
const ARTIST_RELATIONS: Record<string, string[]> = {
  bleachers: ["The 1975", "Lorde", "Lana Del Rey", "Fun.", "COIN", "Wallows", "St. Vincent"],
  "the 1975": ["Bleachers", "Coldplay", "The Neighbourhood", "Arctic Monkeys", "LANY", "The Japanese House"],
  lorde: ["Bleachers", "Billie Eilish", "Lana Del Rey", "Phoebe Bridgers", "Clairo"],
  "lana del rey": ["Lorde", "Billie Eilish", "Taylor Swift", "Bleachers", "The Neighbourhood"],
  "arctic monkeys": ["The Strokes", "The 1975", "The Neighbourhood", "Cage The Elephant", "Oasis"],
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
  "billie eilish": ["Finneas", "Olivia Rodrigo", "Lorde", "Lana Del Rey", "Girl in Red"],
  "olivia rodrigo": ["Sabrina Carpenter", "Taylor Swift", "Billie Eilish", "Conan Gray", "Gracie Abrams"],
  "sabrina carpenter": ["Olivia Rodrigo", "Taylor Swift", "Chappell Roan", "Dua Lipa", "Ariana Grande"]
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
    // 1. Fetch other top tracks by the exact same artist worldwide
    const sameArtistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      artist
    )}&entity=song&limit=25`;

    // 2. Query target: either related artist or artist + genre
    const targetQuery = relatedArtists.length > 0 ? relatedArtists[0] : `${artist} popular`;
    const relatedArtistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      targetQuery
    )}&entity=song&limit=20`;

    const [sameRes, relatedRes] = await Promise.allSettled([
      fetch(sameArtistUrl, { next: { revalidate: 3600 } }),
      fetch(relatedArtistUrl, { next: { revalidate: 3600 } })
    ]);

    const collectedTracks: any[] = [];
    const seenTitles = new Set<string>([title.toLowerCase().trim()]);
    let detectedGenre = "";

    if (sameRes.status === "fulfilled" && sameRes.value.ok) {
      const data = await sameRes.value.json();
      // Filter strictly to tracks where the artist actually matches
      const sameList = (data.results || []).filter((t: any) => {
        const aName = (t.artistName || "").toLowerCase();
        return (
          (aName.includes(artistLower) || artistLower.includes(aName)) &&
          !seenTitles.has(t.trackName.toLowerCase().trim())
        );
      });

      if (sameList.length > 0 && sameList[0].primaryGenreName) {
        detectedGenre = sameList[0].primaryGenreName;
      }

      // Pick up to 12 top tracks from the same artist
      sameList.slice(0, 12).forEach((t: any) => {
        seenTitles.add(t.trackName.toLowerCase().trim());
        collectedTracks.push({
          id: `itunes-${t.trackId}`,
          title: t.trackName,
          artist: t.artistName,
          album: t.collectionName || "Single",
          duration: Math.round((t.trackTimeMillis || 210000) / 1000),
          cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
          collectionId: t.collectionId,
          genre: t.primaryGenreName,
          reason: `Lagu lain dari ${artist}`
        });
      });
    }

    if (relatedRes.status === "fulfilled" && relatedRes.value.ok) {
      const data = await relatedRes.value.json();
      (data.results || []).forEach((t: any) => {
        const tLower = t.trackName.toLowerCase().trim();
        if (!seenTitles.has(tLower) && collectedTracks.length < 24) {
          seenTitles.add(tLower);
          collectedTracks.push({
            id: `itunes-${t.trackId}`,
            title: t.trackName,
            artist: t.artistName,
            album: t.collectionName || "Single",
            duration: Math.round((t.trackTimeMillis || 210000) / 1000),
            cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
            collectionId: t.collectionId,
            genre: t.primaryGenreName,
            reason: `Terkait genre/lingkaran ${artist}`
          });
        }
      });
    }

    // 3. Fallback: If still under 8 tracks, search by the detected primary genre
    if (collectedTracks.length < 8 && detectedGenre) {
      try {
        const genreRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(detectedGenre)}&entity=song&limit=15`,
          { next: { revalidate: 3600 } }
        );
        if (genreRes.ok) {
          const gData = await genreRes.json();
          (gData.results || []).forEach((t: any) => {
            const tLower = t.trackName.toLowerCase().trim();
            if (!seenTitles.has(tLower) && collectedTracks.length < 20) {
              seenTitles.add(tLower);
              collectedTracks.push({
                id: `itunes-${t.trackId}`,
                title: t.trackName,
                artist: t.artistName,
                album: t.collectionName || "Single",
                duration: Math.round((t.trackTimeMillis || 210000) / 1000),
                cover: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
                collectionId: t.collectionId,
                genre: t.primaryGenreName,
                reason: `Genre serupa: ${detectedGenre}`
              });
            }
          });
        }
      } catch (e) {}
    }

    // Keep songs from same artist first, followed by genre-matched recommendations
    return NextResponse.json({
      related: collectedTracks,
      artistNetwork: relatedArtists,
      detectedGenre
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, related: [] }, { status: 500 });
  }
}
