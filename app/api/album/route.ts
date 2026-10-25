import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const collectionId = searchParams.get("collectionId");
  const albumName = searchParams.get("album") || "";
  const artistName = searchParams.get("artist") || "";

  try {
    let targetCollectionId = collectionId;

    // If no direct collectionId, search for album by name + artist
    if (!targetCollectionId && albumName) {
      const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        `${artistName} ${albumName}`
      )}&country=id&entity=album&limit=3`;
      const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          targetCollectionId = searchData.results[0].collectionId;
        }
      }
    }

    if (!targetCollectionId) {
      return NextResponse.json({ error: "Album not found", tracks: [] }, { status: 404 });
    }

    // Lookup full album tracks in official sequence
    const lookupUrl = `https://itunes.apple.com/lookup?id=${targetCollectionId}&country=id&entity=song`;
    const lookupRes = await fetch(lookupUrl, { next: { revalidate: 86400 } });
    if (!lookupRes.ok) {
      return NextResponse.json({ error: "Failed to load album tracks", tracks: [] }, { status: 500 });
    }

    const data = await lookupRes.json();
    const albumMeta = data.results?.find((r: any) => r.wrapperType === "collection") || {};
    const songEntries = (data.results || []).filter((r: any) => r.wrapperType === "track");

    const tracks = songEntries.map((t: any) => ({
      id: `itunes-${t.trackId}`,
      trackNumber: t.trackNumber || 1,
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      duration: Math.round((t.trackTimeMillis || 210000) / 1000),
      cover: (t.artworkUrl100 || albumMeta.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
      collectionId: t.collectionId,
      previewUrl: t.previewUrl,
      youtubeQuery: `${t.artistName} - ${t.trackName}`
    }));

    return NextResponse.json({
      album: {
        id: targetCollectionId,
        title: albumMeta.collectionName || albumName,
        artist: albumMeta.artistName || artistName,
        cover: (albumMeta.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
        trackCount: albumMeta.trackCount || tracks.length,
        releaseDate: albumMeta.releaseDate?.slice(0, 4) || "2024",
        genre: albumMeta.primaryGenreName || "Pop",
        copyright: albumMeta.copyright || ""
      },
      tracks
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tracks: [] }, { status: 500 });
  }
}
