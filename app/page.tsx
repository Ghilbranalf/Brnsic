"use client";

import React, { useState, useEffect, useRef } from "react";

// --- Types ---
interface LyricLine {
  time: number;
  text: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  duration: number; // in seconds
  cover: string;
  canvasImg?: string;
  youtubeId?: string;
  previewUrl?: string;
  plays?: string;
  collectionId?: number | string;
  lyrics: LyricLine[];
}

interface TrendingSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  previewUrl?: string;
  rank?: number;
  plays?: string;
  genre?: string;
  releaseDate?: string;
  collectionId?: number | string;
  reason?: string;
  youtubeId?: string;
  youtubeQuery: string;
}

interface TrendingArtist {
  id: string;
  name: string;
  image: string;
  position: number;
}

interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  songs: any[];
  createdAt: number;
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== FALLBACK_COVER) {
    target.src = FALLBACK_COVER;
  }
};

// Rich Master Catalog (Diverse hits so playback never feels empty or repetitive)
const DEFAULT_CATALOG: Track[] = [
  {
    id: "bernadya-satu-bulan",
    title: "Satu Bulan",
    artist: "Bernadya",
    album: "Sialnya, Hidup Harus Tetap Berjalan",
    year: "2024",
    duration: 194,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg",
    collectionId: 1749876880,
    youtubeId: "7Jm2Il2U-c0",
    plays: "320M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Acoustic Guitar)" },
      { time: 7.8, text: "Belum ada satu bulan" },
      { time: 12.91, text: "Ku yakin masih ada sisa wangiku di bajumu" },
      { time: 18.96, text: "Namun kau tampak baik saja" },
      { time: 23.04, text: "Bahkan senyummu lebih lepas" },
      { time: 25.77, text: "Sedang aku di sini hampir gila" },
      { time: 31.62, text: "Kita tak temukan jalan" },
      { time: 37.16, text: "Sepakat akhiri setelah beribu debat panjang" },
      { time: 43.46, text: "Namun kau tampak baik saja" },
      { time: 48.08, text: "Bahkan senyummu lebih lepas" },
      { time: 50.37, text: "Sedang aku di sini belum terima" },
      { time: 56.16, text: "Bohong kah tangismu sore itu di pelukku?" },
      { time: 62.08, text: "Nyatanya pergi ku pun tak lagi mengganggumu" },
      { time: 67.17, text: "Apa sudah ada kabar lain yang kau tunggu?" },
      { time: 72.42, text: "Sudah adakah yang gantikanku?" },
      { time: 77.72, text: "Yang khawatirkanmu setiap waktu?" }
    ]
  },
  {
    id: "hindia-evaluasi",
    title: "Evaluasi",
    artist: "Hindia",
    album: "Menari Dengan Bayangan",
    year: "2019",
    duration: 215,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
    collectionId: 1481804269,
    youtubeId: "saXhrw-7rQI",
    plays: "310M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Music)" },
      { time: 12.0, text: "Yang tak bisa terobati" },
      { time: 15.5, text: "Biar mengering sendiri" },
      { time: 19.0, text: "Mengupayakan yang kau bisa" },
      { time: 24.0, text: "Biar reda gelisahmu" },
      { time: 28.0, text: "Kukira kita akan bersama" },
      { time: 34.0, text: "Begitu banyak yang sama" },
      { time: 40.0, text: "Masalah yang mengeruh" },
      { time: 45.0, text: "Semoga lekas membaik" }
    ]
  },
  {
    id: "sal-priadi-gala-bunga-matahari",
    title: "Gala Bunga Matahari",
    artist: "Sal Priadi",
    album: "MARKERS AND SUCH PENS FLASHDISKS",
    year: "2024",
    duration: 234,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
    youtubeId: "gu6rT1Jelis",
    plays: "290M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro Piano)" },
      { time: 10.0, text: "Mungkinkah kau bisa mampir hari ini?" },
      { time: 18.0, text: "Bila tidak sekarang, bisakah nanti?" },
      { time: 26.0, text: "Kabar baik ku sampaikan padamu" },
      { time: 35.0, text: "Bunga matahari mekar di taman" }
    ]
  },
  {
    id: "juicy-luicy-tampar",
    title: "Tampar",
    artist: "Juicy Luicy",
    album: "Tampar - Single",
    year: "2022",
    duration: 228,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/600x600bb.jpg",
    youtubeId: "qmgA_WejI8w",
    plays: "260M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 12.0, text: "Hujan samarkan derasnya" },
      { time: 16.0, text: "Tutup air mata" },
      { time: 20.0, text: "Temani kecewa yang sudah" },
      { time: 26.0, text: "Bukan urusanmu lagi" }
    ]
  },
  {
    id: "tulus-hati-hati-di-jalan",
    title: "Hati-Hati di Jalan",
    artist: "Tulus",
    album: "Manusia",
    year: "2022",
    duration: 242,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/600x600bb.jpg",
    youtubeId: "_N6vSc_mT6I",
    plays: "380M+ Streams",
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 15.0, text: "Kukira kita akan bersama" },
      { time: 23.0, text: "Begitu banyak yang sama" },
      { time: 30.0, text: "Latarmu dan latarku" },
      { time: 38.0, text: "Kukira takkan ada kendala" }
    ]
  }
];

// Curated Genres
const GENRES = [
  { name: "Top 50 Indonesia", color: "bg-[#bc5900]" },
  { name: "Paling Sering Diputar", color: "bg-[#006450]" },
  { name: "Viral Indonesia", color: "bg-[#e8115b]" },
  { name: "Top Global 50", color: "bg-[#1e3264]" },
  { name: "Pop Indonesia", color: "bg-[#148a08]" },
  { name: "Indie Lokal", color: "bg-[#608108]" },
  { name: "Dangdut & Koplo", color: "bg-[#8d67ab]" },
  { name: "Hip-Hop / Rap", color: "bg-[#ba5d07]" },
  { name: "Rock & Alternatif", color: "bg-[#e91429]" },
  { name: "K-Pop Worldwide", color: "bg-[#dc148c]" },
  { name: "Akustik Santai", color: "bg-[#477d95]" },
  { name: "Nostalgia 2000-an", color: "bg-[#503750]" }
];

// Helper to normalize any song object (iTunes, YouTube, custom playlist) into strict Track
const normalizeSong = (raw: any): Track => {
  if (!raw) return DEFAULT_CATALOG[0];
  const title = (raw.title || raw.trackName || raw.name || "Lagu Musik").toString().trim();
  const artist = (raw.artist || raw.artistName || "Brnsic Artist").toString().trim();
  const cover = raw.cover || raw.artworkUrl100 || raw.artworkUrl60 || raw.image || raw.canvasImg || FALLBACK_COVER;
  const album = (raw.album || raw.collectionName || "Single").toString().trim();
  const duration =
    typeof raw.duration === "number" && raw.duration > 0
      ? raw.duration
      : typeof raw.trackTimeMillis === "number" && raw.trackTimeMillis > 0
      ? Math.round(raw.trackTimeMillis / 1000)
      : 210;
  const id = (raw.id || raw.trackId || `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`).toString();
  const youtubeId = raw.youtubeId;
  const plays = raw.plays;
  const collectionId = raw.collectionId;
  const lyrics = Array.isArray(raw.lyrics) && raw.lyrics.length > 0 ? raw.lyrics : [
    { time: 0, text: title },
    { time: 4, text: artist },
    { time: 8, text: "Menyiapkan lirik sinkron & streaming audio..." }
  ];

  return {
    id,
    title,
    artist,
    album,
    duration,
    cover,
    canvasImg: cover,
    youtubeId,
    plays,
    collectionId,
    lyrics
  };
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function BrnsicMusicPage() {
  // 1. Splash Screen State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // 2. Playback State - Starts PAUSED on initial page load (No unprompted noise!)
  const [currentTrack, setCurrentTrack] = useState<Track>(DEFAULT_CATALOG[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // 3. Repeat & Loop Mode: "off" (default - never repeat!), "all" (repeat list), "one" (repeat single track)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [isAlbumLoopMode, setIsAlbumLoopMode] = useState<boolean>(false);

  // 4. Dedicated Queue Engine (Solves endless repeating loop!)
  const [activeQueue, setActiveQueue] = useState<any[]>(DEFAULT_CATALOG);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [relatedQueue, setRelatedQueue] = useState<any[]>([]);
  const [activeAlbumTracks, setActiveAlbumTracks] = useState<any[]>([]);
  const [albumData, setAlbumData] = useState<any | null>(null);

  // 5. Liked Songs (Independent state stored in localStorage)
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);

  // 6. User Custom Playlists
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [activeCustomPlaylist, setActiveCustomPlaylist] = useState<UserPlaylist | null>(null);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<any | null>(null);

  // 7. Charts & Navigation State
  const [indonesiaTop50, setIndonesiaTop50] = useState<TrendingSong[]>([]);
  const [mostPlayedIndonesia, setMostPlayedIndonesia] = useState<TrendingSong[]>([]);
  const [viralIndonesia, setViralIndonesia] = useState<TrendingSong[]>([]);
  const [globalTrending, setGlobalTrending] = useState<TrendingSong[]>([]);
  const [popularArtists, setPopularArtists] = useState<TrendingArtist[]>([]);
  const [lastChartUpdated, setLastChartUpdated] = useState<string>("Baru saja");

  const [currentView, setCurrentView] = useState<
    | "home"
    | "search"
    | "now-playing"
    | "top50-indo"
    | "most-played-indo"
    | "viral-indo"
    | "top50-global"
    | "bruno-radio"
    | "album"
    | "custom-playlist"
  >("home");
  const [homeFilter, setHomeFilter] = useState<"all" | "top-indo" | "most-played" | "viral" | "global">("all");

  // 8. Mobile & Fullscreen State
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"queue" | "now-playing" | "lyrics">("now-playing");
  const [mobileNavTab, setMobileNavTab] = useState<"home" | "search" | "library">("home");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomMode, setZoomMode] = useState<"both" | "lyrics-only" | "video-only">("both");

  // 9. Instant Live Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userIsScrollingLyrics, setUserIsScrollingLyrics] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // References
  const ytPlayerRef = useRef<any>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const mobileActiveLyricRef = useRef<HTMLDivElement | null>(null);
  const zoomedActiveLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileLyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const zoomedLyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playedSongTitlesRef = useRef<Set<string>>(new Set());
  const hasUserStartedPlaybackRef = useRef<boolean>(false);
  const latestSearchQueryRef = useRef<string>("");

  // 1. Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // 2. PWA Install Event Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredInstallPrompt(null);
      }
    } else {
      alert(
        "Untuk menginstall Brnsic di HP atau Komputer Anda: Ketuk menu browser (titik tiga atau ikon Bagikan), lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'. Logonya adalah ikon B resmi."
      );
    }
  };

  // 3. Load Saved Liked Songs & Playlists from LocalStorage
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem("brnsic_liked_songs");
      if (storedLikes) {
        setLikedSongIds(JSON.parse(storedLikes));
      }
      const storedPlaylists = localStorage.getItem("brnsic_user_playlists");
      if (storedPlaylists) {
        setUserPlaylists(JSON.parse(storedPlaylists));
      }
    } catch (e) {}
  }, []);

  const toggleLike = (songId: string) => {
    setLikedSongIds((prev) => {
      const next = prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem("brnsic_liked_songs", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isCurrentTrackLiked = likedSongIds.includes(currentTrack.id);

  const savePlaylists = (playlists: UserPlaylist[]) => {
    setUserPlaylists(playlists);
    try {
      localStorage.setItem("brnsic_user_playlists", JSON.stringify(playlists));
    } catch (e) {}
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPl: UserPlaylist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      description: "Playlist Pribadi",
      songs: [],
      createdAt: Date.now()
    };
    const updated = [...userPlaylists, newPl];
    savePlaylists(updated);
    setNewPlaylistName("");
    setIsCreatePlaylistModalOpen(false);
    setActiveCustomPlaylist(newPl);
    setCurrentView("custom-playlist");
  };

  const handleAddSongToPlaylist = (playlistId: string) => {
    if (!songToAddToPlaylist) return;
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        const exists = pl.songs.some((s) => s.title.toLowerCase() === songToAddToPlaylist.title.toLowerCase());
        if (!exists) {
          return {
            ...pl,
            cover: pl.cover || songToAddToPlaylist.cover,
            songs: [...pl.songs, songToAddToPlaylist]
          };
        }
      }
      return pl;
    });
    savePlaylists(updated);
    setSongToAddToPlaylist(null);
  };

  const handleRemoveSongFromPlaylist = (playlistId: string, songId: string) => {
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          songs: pl.songs.filter((s) => s.id !== songId)
        };
      }
      return pl;
    });
    savePlaylists(updated);
    if (activeCustomPlaylist && activeCustomPlaylist.id === playlistId) {
      setActiveCustomPlaylist(updated.find((p) => p.id === playlistId) || null);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const updated = userPlaylists.filter((pl) => pl.id !== playlistId);
    savePlaylists(updated);
    if (activeCustomPlaylist?.id === playlistId) {
      setActiveCustomPlaylist(null);
      setCurrentView("home");
    }
  };

  // 4. Fetch Real-Time Charts on Mount
  const loadTrendingData = async () => {
    try {
      const res = await fetch("/api/trending");
      if (res.ok) {
        const data = await res.json();
        if (data.indonesiaTop50 && data.indonesiaTop50.length > 0) {
          setIndonesiaTop50(data.indonesiaTop50);
          // Initialize activeQueue to Top 50 if currently small
          setActiveQueue((prev) => (prev.length <= 5 ? data.indonesiaTop50 : prev));
        }
        if (data.mostPlayedIndonesia && data.mostPlayedIndonesia.length > 0)
          setMostPlayedIndonesia(data.mostPlayedIndonesia);
        if (data.viralIndonesia && data.viralIndonesia.length > 0) setViralIndonesia(data.viralIndonesia);
        if (data.globalTrending && data.globalTrending.length > 0) setGlobalTrending(data.globalTrending);
        if (data.popularArtists && data.popularArtists.length > 0) setPopularArtists(data.popularArtists);
        const now = new Date();
        setLastChartUpdated(`${now.getHours()}:${now.getMinutes() < 10 ? "0" : ""}${now.getMinutes()}`);
      }
    } catch (err) {
      console.error("Failed to load trending music data", err);
    }
  };

  useEffect(() => {
    loadTrendingData();
  }, []);

  // 5. Initialize YouTube Iframe API Once on Root Player
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        const targetNode = document.getElementById("master-yt-player");
        if (!targetNode) {
          setTimeout(initPlayer, 100);
          return;
        }

        ytPlayerRef.current = new window.YT.Player("master-yt-player", {
          videoId: currentTrack.youtubeId || "7Jm2Il2U-c0",
          playerVars: {
            autoplay: 0, // Starts PAUSED! No sudden blast of sound!
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : ""
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.unMute();
                event.target.setVolume(volume * 100);
                if (pendingVideoIdRef.current) {
                  event.target.loadVideoById({
                    videoId: pendingVideoIdRef.current,
                    startSeconds: 0
                  });
                  event.target.playVideo();
                  pendingVideoIdRef.current = null;
                }
              } catch (e) {}
            },
            onError: (event: any) => {
              // Handle 100, 101, 150 embedding restrictions on YouTube videos or blocked ad pings
              console.warn("YouTube player event:", event.data);
              // CRITICAL: NEVER automatically advance on initial page load before user has pressed play!
              if (!hasUserStartedPlaybackRef.current) {
                console.log("Ignoring initial YouTube player event before user interaction.");
                return;
              }
              setTimeout(() => {
                playNextSong(false);
              }, 400);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) setIsPlaying(true);
              else if (event.data === 2) setIsPlaying(false);
              else if (event.data === 0) {
                if (hasUserStartedPlaybackRef.current) {
                  playNextSong(false);
                }
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 6. Precise High-Frequency Audio Time Polling (NO Math.floor delay!)
  useEffect(() => {
    const timer = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const state = ytPlayerRef.current.getPlayerState();
          if (state === 1) {
            const exactSeconds = ytPlayerRef.current.getCurrentTime();
            setCurrentTime(exactSeconds);
          }
        } catch (e) {}
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Universal Player: Plays ANY song and manages audio queue
  const playAnySong = async (
    rawSong: any,
    userInitiated = true
  ) => {
    if (!rawSong) {
      playNextSong();
      return;
    }

    if (userInitiated) {
      hasUserStartedPlaybackRef.current = true;
    }

    const song = normalizeSong(rawSong);

    // 1. Direct user interaction: immediately un-mute
    if (userInitiated && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }

    setIsLoadingSong(true);
    setCurrentTime(0);
    if (song.title) {
      playedSongTitlesRef.current.add(song.title.toLowerCase().trim());
    }

    const optimisticTrack: Track = { ...song };
    setCurrentTrack(optimisticTrack);

    // Fetch related songs asynchronously
    fetch(`/api/related?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.related && d.related.length > 0) {
          const freshRelated = d.related.filter(
            (item: any) => !playedSongTitlesRef.current.has(item.title.toLowerCase().trim())
          );
          setRelatedQueue(freshRelated.length > 0 ? freshRelated : d.related);
        }
      })
      .catch(() => {});

    const promises: [Promise<string | null>, Promise<LyricLine[]>] = [
      song.youtubeId
        ? Promise.resolve(song.youtubeId)
        : fetch(`/api/youtube?q=${encodeURIComponent(`${song.artist} ${song.title}`)}`)
            .then(async (r) => {
              if (!r.ok) return "7Jm2Il2U-c0";
              const d = await r.json();
              return d.videoId || "7Jm2Il2U-c0";
            })
            .catch(() => "7Jm2Il2U-c0"),

      song.lyrics && song.lyrics.length > 3
        ? Promise.resolve(song.lyrics)
        : fetch(`/api/lyrics?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`)
            .then((r) => r.json())
            .then((d) => d.lyrics || [])
            .catch(() => [])
    ];

    try {
      const [resolvedVid, resolvedLyrics] = await Promise.all(promises);

      const finalLyrics =
        resolvedLyrics && resolvedLyrics.length > 0
          ? resolvedLyrics
          : [
              { time: 0, text: song.title },
              { time: 6, text: song.artist },
              { time: 12, text: "Lirik instrumental atau sinkronisasi..." }
            ];

      const finalizedTrack: Track = {
        ...optimisticTrack,
        youtubeId: resolvedVid || "7Jm2Il2U-c0",
        lyrics: finalLyrics
      };

      setCurrentTrack(finalizedTrack);

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: resolvedVid || "7Jm2Il2U-c0",
            startSeconds: 0
          });
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (e) {
          console.error("Player load error", e);
        }
      } else {
        pendingVideoIdRef.current = resolvedVid || "7Jm2Il2U-c0";
      }
    } catch (err) {
      console.error("Error loading track", err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Play a song from a specific list (Album, Playlist, Chart) setting activeQueue context
  const handlePlayFromList = (song: any, list: any[], index: number, isAlbum = false) => {
    hasUserStartedPlaybackRef.current = true;
    const normalizedList = (list || []).map((item) => normalizeSong(item));
    const safeIndex = index >= 0 && index < normalizedList.length ? index : 0;
    const targetSong = normalizedList[safeIndex] || normalizeSong(song);
    setActiveQueue(normalizedList);
    setActiveQueueIndex(safeIndex);
    if (!isAlbum) {
      setIsAlbumLoopMode(false);
    }
    playAnySong(targetSong, true);
  };

  // Play a single song (e.g. from Home or Search) and immediately build an expansive smart radio queue
  const handlePlaySingleSongWithRadio = async (song: any) => {
    hasUserStartedPlaybackRef.current = true;
    setIsAlbumLoopMode(false);
    setRepeatMode("off");
    playAnySong(song, true);

    // Initial queue starting with this song
    setActiveQueue([song]);
    setActiveQueueIndex(0);

    try {
      const res = await fetch(
        `/api/related?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.related && data.related.length > 0) {
          const freshRelated = data.related.filter(
            (item: any) => !playedSongTitlesRef.current.has(item.title.toLowerCase().trim())
          );
          setRelatedQueue(freshRelated.length > 0 ? freshRelated : data.related);
          // Combine: Current song + Related songs + Top 50 tracks for infinite uninterrupted variety!
          const combinedQueue = [song, ...(freshRelated.length > 0 ? freshRelated : data.related), ...(indonesiaTop50 || []).slice(0, 25)];
          setActiveQueue(combinedQueue);
        }
      }
    } catch (e) {}
  };

  // Open Album View & Fetch Tracklist
  const openAlbumView = async (albumName: string, artistName: string, collectionId?: number | string) => {
    setIsLoadingSong(true);
    try {
      const url = collectionId
        ? `/api/album?collectionId=${collectionId}`
        : `/api/album?album=${encodeURIComponent(albumName)}&artist=${encodeURIComponent(artistName)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlbumData(data);
        setCurrentView("album");
      }
    } catch (err) {
      console.error("Failed to load album", err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Play Album with options
  const playAlbumFull = (albumInfo: any, tracks: any[], loop = false) => {
    if (!tracks || tracks.length === 0) return;
    setActiveAlbumTracks(tracks);
    setActiveQueue(tracks);
    setActiveQueueIndex(0);
    setIsAlbumLoopMode(loop);
    setRepeatMode(loop ? "all" : "off");
    playAnySong(tracks[0]);
  };

  // INFINITE NEXT SONG ENGINE (ALWAYS PLAYS A NEW, EXCITING, RELEVANT SONG - NEVER BOUNCES BACK!)
  const playNextSong = (userTriggered = true) => {
    // 1. If Repeat 1 (Single Track) is active, replay current song from 0
    if (repeatMode === "one") {
      setCurrentTime(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      }
      return;
    }

    // 2. If inside active queue and not at the last track
    if (activeQueue && activeQueue.length > 0) {
      if (activeQueueIndex < activeQueue.length - 1) {
        const nextIdx = activeQueueIndex + 1;
        const candidate = activeQueue[nextIdx];
        if (candidate) {
          setActiveQueueIndex(nextIdx);
          playAnySong(candidate, userTriggered);
          return;
        }
      } else {
        // Reached the end of activeQueue!
        if (repeatMode === "all" || isAlbumLoopMode) {
          // Explicit loop mode enabled by user: Loop back to track 1
          setActiveQueueIndex(0);
          playAnySong(activeQueue[0], userTriggered);
          return;
        }
      }
    }

    // 3. Repeat is OFF: Continue seamlessly to a BRAND NEW, UNPLAYED song! Never loop!
    const isUnplayed = (t: any) => {
      if (!t) return false;
      const cleanTitle = (t.title || t.trackName || t.name || "").toString().toLowerCase().trim();
      return cleanTitle.length > 0 && !playedSongTitlesRef.current.has(cleanTitle);
    };

    // A. Pick next unplayed from related recommendations
    const nextRelated = relatedQueue.find(isUnplayed);
    if (nextRelated) {
      setRelatedQueue((prev) =>
        prev.filter((item) => item.title.toLowerCase().trim() !== nextRelated.title.toLowerCase().trim())
      );
      setActiveQueue((prev) => [...prev, nextRelated]);
      setActiveQueueIndex(activeQueue.length);
      playAnySong(nextRelated, userTriggered);
      return;
    }

    // B. Pick next unplayed from Top 50 Indonesia
    const nextTopIndo = indonesiaTop50.find(isUnplayed);
    if (nextTopIndo) {
      setActiveQueue((prev) => [...prev, nextTopIndo]);
      setActiveQueueIndex(activeQueue.length);
      playAnySong(nextTopIndo, userTriggered);
      return;
    }

    // C. Pick next unplayed from Most Played Indonesia
    const nextMostPlayed = mostPlayedIndonesia.find(isUnplayed);
    if (nextMostPlayed) {
      setActiveQueue((prev) => [...prev, nextMostPlayed]);
      setActiveQueueIndex(activeQueue.length);
      playAnySong(nextMostPlayed, userTriggered);
      return;
    }

    // D. Pick next unplayed from Viral Indonesia or Global Trending
    const nextViral = viralIndonesia.find(isUnplayed) || globalTrending.find(isUnplayed);
    if (nextViral) {
      setActiveQueue((prev) => [...prev, nextViral]);
      setActiveQueueIndex(activeQueue.length);
      playAnySong(nextViral, userTriggered);
      return;
    }

    // E. Pick next unplayed from Default Master Catalog
    const nextCatalog = DEFAULT_CATALOG.find(isUnplayed);
    if (nextCatalog) {
      setActiveQueue((prev) => [...prev, nextCatalog]);
      setActiveQueueIndex(activeQueue.length);
      playAnySong(nextCatalog, userTriggered);
      return;
    }

    // F. If literally all 150+ tracks in history were already played, reset history and pick a track different from current
    playedSongTitlesRef.current = new Set([currentTrack.title.toLowerCase().trim()]);
    const fallbackList = indonesiaTop50.length > 0 ? indonesiaTop50 : DEFAULT_CATALOG;
    const fallbackNext =
      fallbackList.find((t) => t.title.toLowerCase().trim() !== currentTrack.title.toLowerCase().trim()) ||
      fallbackList[0];
    setActiveQueue((prev) => [...prev, fallbackNext]);
    setActiveQueueIndex(activeQueue.length);
    playAnySong(fallbackNext, userTriggered);
  };

  const playPrevSong = () => {
    if (currentTime > 4) {
      setCurrentTime(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(0, true);
      }
      return;
    }

    if (activeQueue && activeQueue.length > 0) {
      const prevIdx = (activeQueueIndex - 1 + activeQueue.length) % activeQueue.length;
      setActiveQueueIndex(prevIdx);
      playAnySong(activeQueue[prevIdx], false);
    }
  };

  // Instant Live Search with stale race-condition protection
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setCurrentView("search");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileNavTab("search");
    }

    // 250ms debounce
    searchDebounceRef.current = setTimeout(() => {
      performSearch(trimmed);
    }, 250);
  };

  const performSearch = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    latestSearchQueryRef.current = q;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (latestSearchQueryRef.current !== q) return; // Stale keystroke response! Discard!
      const data = await res.json();
      if (latestSearchQueryRef.current === q) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Search fetch failed", err);
    } finally {
      if (latestSearchQueryRef.current === q) {
        setIsSearching(false);
      }
    }
  };

  const playSearchedSong = (song: any, index: number) => {
    hasUserStartedPlaybackRef.current = true;
    handlePlayFromList(song, searchResults, index);
  };

  const togglePlay = () => {
    hasUserStartedPlaybackRef.current = true;
    if (!ytPlayerRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }
    try {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = Math.round(pct * currentTrack.duration);
    setCurrentTime(targetSeconds);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(targetSeconds, true);
    }
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(pct);
    setIsMuted(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      ytPlayerRef.current.unMute();
      ytPlayerRef.current.setVolume(pct * 100);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (ytPlayerRef.current) {
      if (nextMuted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    }
  };

  // Center active lyric line smoothly
  useEffect(() => {
    if (!userIsScrollingLyrics) {
      if (activeLyricRef.current && lyricsScrollContainerRef.current) {
        const el = activeLyricRef.current;
        const container = lyricsScrollContainerRef.current;
        const target = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }

      if (mobileActiveLyricRef.current && mobileLyricsScrollRef.current) {
        const el = mobileActiveLyricRef.current;
        const container = mobileLyricsScrollRef.current;
        const target = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }

      if (zoomedActiveLyricRef.current && zoomedLyricsScrollRef.current) {
        const el = zoomedActiveLyricRef.current;
        const container = zoomedLyricsScrollRef.current;
        const target = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  }, [currentTime, isZoomed, isMobilePlayerOpen, mobileTab, userIsScrollingLyrics]);

  const handleUserScroll = () => {
    setUserIsScrollingLyrics(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrollingLyrics(false);
    }, 5000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Precise lyric index with subtle 0.15s vocal anticipation offset
  let activeLyricIdx = 0;
  const vocalTime = currentTime + 0.15;
  currentTrack.lyrics.forEach((line, idx) => {
    if (vocalTime >= line.time) activeLyricIdx = idx;
  });

  return (
    <div className="w-full max-w-[100vw] h-screen bg-black text-white flex flex-col p-0 md:p-2 gap-2 overflow-x-hidden overflow-y-hidden font-sans select-none relative">
      
      {/* ====================================================================
          0. INTRO SPLASH SCREEN (IMAGE 2)
          ==================================================================== */}
      {showSplash && (
        <div
          onClick={() => setShowSplash(false)}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-700 animate-fadeIn"
        >
          <div className="relative flex flex-col items-center justify-center gap-6">
            <div className="absolute w-80 h-80 bg-white/[0.08] rounded-full blur-[100px] pointer-events-none" />
            <img
              src="/splash-logo.png"
              alt="Brnsic"
              className="w-64 sm:w-80 object-contain relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.45)] transform hover:scale-105 transition"
            />
            <div className="flex items-center gap-2 relative z-10 mt-3">
              <span className="w-2 h-2 bg-[#1ed760] rounded-full animate-ping"></span>
              <span className="text-xs text-white/60 font-semibold tracking-widest uppercase">
                Menghubungkan ke Audio Berkualitas...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 
        MASTER YOUTUBE AUDIO ENGINE:
        Always rendered at valid dimensions (240x240) so mobile WebKit/Blink never suspends audio playback.
        Positioned behind the solid pitch-black layout (z-index: -999).
      */}
      <div
        className="fixed bottom-0 left-0 pointer-events-none overflow-hidden"
        style={{ position: "fixed", bottom: 0, left: 0, width: 240, height: 240, opacity: 0.02, zIndex: -999 }}
        aria-hidden="true"
      >
        <div id="master-yt-player" className="w-full h-full"></div>
      </div>

      {/* ====================================================================
          1. TOP HEADER (DESKTOP & IPAD)
          ==================================================================== */}
      <header className="hidden md:flex h-14 items-center justify-between px-3 flex-shrink-0 z-40 bg-black">
        <div className="flex items-center gap-3.5 flex-1 max-w-[720px]">
          {/* Brnsic Logo & Wordmark (Image 2 & 3 Clean Fix) */}
          <div
            onClick={() => {
              setCurrentView("home");
              setSearchQuery("");
            }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition flex-shrink-0 pr-1"
            title="Brnsic Home"
          >
            <img
              src="/app-icon.png"
              alt="Brnsic Icon"
              className="w-8 h-8 rounded-lg object-contain shadow-md"
            />
            <span className="font-black text-xl tracking-tight text-white select-none hidden sm:inline-block">
              Brnsic
            </span>
          </div>

          <button
            onClick={() => {
              setCurrentView("home");
              setSearchQuery("");
            }}
            className="w-10 h-10 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] hover:scale-105 transition flex items-center justify-center flex-shrink-0"
            title="Beranda"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" />
            </svg>
          </button>

          {/* Instant Live Search Input */}
          <div className="flex-1 relative flex items-center">
            <svg
              className="absolute left-4 text-[#b3b3b3] pointer-events-none"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Cari lagu apa saja (misal: Only Siji 6sentani, Hindia, Bernadya)..."
              value={searchQuery}
              onFocus={() => {
                if (currentView !== "search") setCurrentView("search");
              }}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  performSearch(searchQuery);
                }
              }}
              className="w-full h-11 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] focus:bg-[#1f1f1f] border border-transparent focus:border-white px-11 text-sm text-white placeholder-[#b3b3b3] outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-4 text-[#b3b3b3] hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTrendingData}
            className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded-full transition flex items-center gap-1"
            title="Chart Diperbarui Otomatis setiap 15 menit via ISR Background Job"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]"></span>
            <span>Update: {lastChartUpdated}</span>
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-full transition border border-white/10"
            title="Download / Install Brnsic"
          >
            <img src="/app-icon.png" alt="icon" className="w-4 h-4 rounded object-contain" />
            <span>Install App</span>
          </button>
          <button
            onClick={() => setIsCreatePlaylistModalOpen(true)}
            className="bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:scale-105 transition flex items-center gap-1.5 shadow"
          >
            <span>+ Buat Playlist</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#1ed760] text-black font-black flex items-center justify-center cursor-pointer shadow-md text-xs">
            G
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. MAIN WORKSPACE (SEAMLESS PITCH BLACK)
          ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr_340px] gap-2 overflow-hidden relative z-10 px-0 md:px-0">
        
        {/* --- LEFT SIDEBAR (IPAD & DESKTOP) --- */}
        <aside className="hidden md:flex bg-[#121212] rounded-lg p-3 flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[#b3b3b3] hover:text-white font-bold text-sm transition flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1.5-.866zM20 20h-4V4h4v16zm-10.5.134A1 1 0 0 0 8 19V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1.5.866zM7 18H3V6h4v12z" />
              </svg>
              Koleksi Kamu
            </span>
            <button
              onClick={() => setIsCreatePlaylistModalOpen(true)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
              title="Buat Playlist Baru"
            >
              +
            </button>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1">
            {/* User Custom Playlists */}
            {userPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setActiveCustomPlaylist(pl);
                  setCurrentView("custom-playlist");
                }}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                  currentView === "custom-playlist" && activeCustomPlaylist?.id === pl.id
                    ? "bg-[#282828]"
                    : "hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#1ed760] to-[#004724] flex items-center justify-center text-black font-black text-xs flex-shrink-0">
                  {pl.cover ? (
                    <img src={pl.cover} alt="cover" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{pl.name}</div>
                  <div className="text-xs text-[#b3b3b3]">{pl.songs.length} lagu • Playlist Kamu</div>
                </div>
              </div>
            ))}

            {/* Top 50 Indonesia Card */}
            <div
              onClick={() => setCurrentView("top50-indo")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "top50-indo" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#bc5900] via-[#e91429] to-[#5a161f] flex flex-col items-center justify-center text-white font-black text-[9px] flex-shrink-0">
                TOP 50
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Top 50 - Indonesia</div>
                <div className="text-xs text-[#b3b3b3]">Playlist • Update harian</div>
              </div>
            </div>

            {/* Paling Sering Diputar Card */}
            <div
              onClick={() => setCurrentView("most-played-indo")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "most-played-indo" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#006450] via-[#148a08] to-[#1e3264] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                HEAVY
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Paling Sering Diputar</div>
                <div className="text-xs text-[#b3b3b3]">Playlist • Bernadya, Hindia, dll</div>
              </div>
            </div>

            {/* Viral 50 Indo */}
            <div
              onClick={() => setCurrentView("viral-indo")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "viral-indo" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#e8115b] to-[#ba5d07] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                VIRAL
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Viral 50 Indonesia</div>
                <div className="text-xs text-[#b3b3b3]">Playlist • TikTok &amp; Reels</div>
              </div>
            </div>

            {/* Top 50 Global */}
            <div
              onClick={() => setCurrentView("top50-global")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                currentView === "top50-global" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#1e3264] to-[#8400e7] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                GLOBAL
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Top 50 - Global</div>
                <div className="text-xs text-[#b3b3b3]">Playlist • Chart Dunia</div>
              </div>
            </div>

            {/* Hindia - Menari Dengan Bayangan */}
            <div
              onClick={() => openAlbumView("Menari Dengan Bayangan", "Hindia", 1481804269)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] cursor-pointer transition"
            >
              <img
                src="https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg"
                alt="hindia"
                onError={handleImgError}
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Menari Dengan Bayangan</div>
                <div className="text-xs text-[#b3b3b3]">Album • Hindia</div>
              </div>
            </div>

            {/* Bernadya - Sialnya Hidup Harus Tetap Berjalan */}
            <div
              onClick={() => openAlbumView("Sialnya, Hidup Harus Tetap Berjalan", "Bernadya", 1749876880)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] cursor-pointer transition"
            >
              <img
                src="https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg"
                alt="bernadya"
                onError={handleImgError}
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">Sialnya Hidup Harus Tetap Berjalan</div>
                <div className="text-xs text-[#b3b3b3]">Album • Bernadya</div>
              </div>
            </div>
          </div>
        </aside>

        {/* --- CENTER MAIN CONTENT --- */}
        <main className="bg-black md:bg-[#121212] md:rounded-lg overflow-y-auto custom-scrollbar flex flex-col relative pb-32 md:pb-6 overflow-x-hidden">
          
          {/* MOBILE HEADER (BRNSIC MOBILE BRANDING) */}
          <div className="md:hidden flex flex-col gap-3 p-4 sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/app-icon.png" alt="Brnsic" className="w-8 h-8 rounded-lg object-contain shadow" />
                <span className="font-black text-lg text-white">Brnsic</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="text-[10px] font-bold bg-white text-black px-2.5 py-1 rounded-full shadow"
                >
                  Install
                </button>
                <div className="w-8 h-8 rounded-full bg-[#1ed760] text-black font-black flex items-center justify-center text-xs shadow-md">
                  G
                </div>
              </div>
            </div>

            {/* Mobile Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => {
                  setHomeFilter("all");
                  setCurrentView("home");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  homeFilter === "all" && currentView === "home"
                    ? "bg-white text-black"
                    : "bg-[#242424] text-white hover:bg-[#2e2e2e]"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setCurrentView("top50-indo")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  currentView === "top50-indo" ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2e2e2e]"
                }`}
              >
                Top 50 Indonesia
              </button>
              <button
                onClick={() => setCurrentView("most-played-indo")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  currentView === "most-played-indo" ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2e2e2e]"
                }`}
              >
                Sering Diputar
              </button>
              <button
                onClick={() => setCurrentView("viral-indo")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  currentView === "viral-indo" ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2e2e2e]"
                }`}
              >
                Viral
              </button>
            </div>
          </div>

          {/* VIEW: DEDICATED ALBUM VIEW (ROUNDED ROWS FIX) */}
          {currentView === "album" && albumData && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#2d2d2d] to-black md:to-[#121212] flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]">
                <img
                  src={albumData.album?.cover}
                  alt="album cover"
                  onError={handleImgError}
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-2xl object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Album Resmi
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {albumData.album?.title}
                  </h1>
                  <p className="text-sm font-semibold text-white/90">
                    {albumData.album?.artist} • {albumData.album?.releaseDate} • {albumData.tracks?.length} lagu
                  </p>
                  <p className="text-xs text-[#b3b3b3] mt-1">{albumData.album?.genre} • Brnsic Audio</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => playAlbumFull(albumData.album, albumData.tracks, false)}
                  className="px-6 py-3.5 rounded-full bg-[#1ed760] text-black font-extrabold text-sm flex items-center gap-2.5 hover:scale-105 transition shadow-xl"
                  title="Putar Album Ini"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Putar Album Ini</span>
                </button>

                <button
                  onClick={() => {
                    const nextLoop = !isAlbumLoopMode;
                    setIsAlbumLoopMode(nextLoop);
                    setRepeatMode(nextLoop ? "all" : "off");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition border flex items-center gap-2 ${
                    isAlbumLoopMode
                      ? "bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]"
                      : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <span>{isAlbumLoopMode ? "Mode Loop: Aktif (Berulang)" : "Mode Loop: Mati (Lanjut Lagu Lain)"}</span>
                </button>

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Tracklist - ROUNDED ROWS (USER IMAGE 1 REQUEST FIX) */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {albumData.tracks?.map((track: any, i: number) => {
                  const isCurrent = track.title === currentTrack.title;
                  return (
                    <div
                      key={track.id || i}
                      onClick={() => handlePlayFromList(track, albumData.tracks, i, isAlbumLoopMode)}
                      className={`grid grid-cols-[36px_1fr_auto_50px] sm:grid-cols-[40px_1fr_160px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                        isCurrent
                          ? "bg-white/15 text-white shadow-sm"
                          : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                      }`}
                    >
                      <div className="font-semibold text-xs text-center">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-3">
                            <span className="w-0.5 bg-[#1ed760] bar-1 rounded-full"></span>
                            <span className="w-0.5 bg-[#1ed760] bar-2 rounded-full"></span>
                            <span className="w-0.5 bg-[#1ed760] bar-3 rounded-full"></span>
                          </div>
                        ) : (
                          <span>{track.trackNumber || i + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-semibold text-sm truncate ${
                            isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                          }`}
                        >
                          {track.title}
                        </div>
                        <div className="text-xs text-[#b3b3b3] sm:hidden truncate">{track.artist}</div>
                      </div>

                      <div className="hidden sm:block text-xs truncate text-[#b3b3b3]">{track.artist}</div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSongToAddToPlaylist(track);
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition"
                          title="Tambah ke Playlist"
                        >
                          + Playlist
                        </button>
                      </div>

                      <div className="text-right text-xs font-medium text-[#b3b3b3]">
                        {formatTime(track.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: USER CUSTOM PLAYLIST (ROUNDED ROWS FIX) */}
          {currentView === "custom-playlist" && activeCustomPlaylist && (
            <div>
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#148a08] to-black md:to-[#121212] flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-2xl bg-gradient-to-br from-[#1ed760] to-[#004724] flex items-center justify-center text-white flex-shrink-0">
                  {activeCustomPlaylist.cover ? (
                    <img src={activeCustomPlaylist.cover} alt="cover" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-5xl font-black">B</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Playlist Pengguna
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {activeCustomPlaylist.name}
                  </h1>
                  <p className="text-sm text-white/80">
                    Dibuat oleh Kamu • {activeCustomPlaylist.songs.length} lagu
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center gap-4">
                <button
                  onClick={() => {
                    if (activeCustomPlaylist.songs.length > 0) {
                      handlePlayFromList(activeCustomPlaylist.songs[0], activeCustomPlaylist.songs, 0);
                    }
                  }}
                  disabled={activeCustomPlaylist.songs.length === 0}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 transition shadow-xl disabled:opacity-40"
                  title="Putar Semua"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDeletePlaylist(activeCustomPlaylist.id)}
                  className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 transition"
                >
                  Hapus Playlist
                </button>

                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition ml-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>
              </div>

              {/* Track List */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {activeCustomPlaylist.songs.length === 0 ? (
                  <div className="text-center py-16 text-[#b3b3b3]">
                    <p className="text-base font-bold text-white mb-1">Playlist ini masih kosong</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Cari lagu apa saja atau pilih dari chart lalu klik &quot;+ Playlist&quot; untuk menambahkan lagu favoritmu ke sini.
                    </p>
                  </div>
                ) : (
                  activeCustomPlaylist.songs.map((track: any, i: number) => {
                    const isCurrent = track.title === currentTrack.title;
                    return (
                      <div
                        key={track.id || i}
                        onClick={() => handlePlayFromList(track, activeCustomPlaylist.songs, i)}
                        className={`grid grid-cols-[36px_1fr_auto_40px_50px] sm:grid-cols-[40px_1fr_160px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                          isCurrent
                            ? "bg-white/15 text-white shadow-sm"
                            : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                        }`}
                      >
                        <div className="font-semibold text-xs text-center">{i + 1}</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.cover}
                            alt="thumb"
                            onError={handleImgError}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              className={`font-semibold text-sm truncate ${
                                isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                              }`}
                            >
                              {track.title}
                            </div>
                            <div className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                          </div>
                        </div>

                        <div className="hidden sm:block text-xs truncate text-[#b3b3b3]">{track.album}</div>

                        <div className="flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSongFromPlaylist(activeCustomPlaylist.id, track.id);
                            }}
                            className="text-xs text-red-400 hover:text-red-300 p-1"
                            title="Hapus dari playlist"
                          >
                            &times;
                          </button>
                        </div>

                        <div className="text-right text-xs font-medium text-[#b3b3b3]">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW: DEDICATED PLAYLIST VIEW (TOP 50, HEAVY ROTATION, VIRAL) */}
          {(currentView === "top50-indo" ||
            currentView === "most-played-indo" ||
            currentView === "viral-indo" ||
            currentView === "top50-global") && (
            <div>
              <div
                className={`p-6 sm:p-8 bg-gradient-to-b ${
                  currentView === "top50-indo"
                    ? "from-[#bc5900] to-black md:to-[#121212]"
                    : currentView === "most-played-indo"
                    ? "from-[#006450] to-black md:to-[#121212]"
                    : currentView === "viral-indo"
                    ? "from-[#e8115b] to-black md:to-[#121212]"
                    : "from-[#1e3264] to-black md:to-[#121212]"
                } flex flex-col sm:flex-row items-center sm:items-end gap-6 min-h-[260px]`}
              >
                <div
                  className={`w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-white flex-shrink-0 ${
                    currentView === "top50-indo"
                      ? "bg-gradient-to-br from-[#e91429] to-[#bc5900]"
                      : currentView === "most-played-indo"
                      ? "bg-gradient-to-br from-[#1ed760] to-[#006450]"
                      : currentView === "viral-indo"
                      ? "bg-gradient-to-br from-[#e8115b] to-[#ba5d07]"
                      : "bg-gradient-to-br from-[#1e3264] to-[#8400e7]"
                  }`}
                >
                  <span className="text-2xl font-black uppercase tracking-wider">
                    {currentView === "top50-indo"
                      ? "TOP 50"
                      : currentView === "most-played-indo"
                      ? "HEAVY"
                      : currentView === "viral-indo"
                      ? "VIRAL"
                      : "GLOBAL"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/80 mt-1">
                    BRNSIC
                  </span>
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Playlist Publik
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white my-2 tracking-tight">
                    {currentView === "top50-indo"
                      ? "Top 50 - Indonesia"
                      : currentView === "most-played-indo"
                      ? "Lagu Paling Sering Diputar"
                      : currentView === "viral-indo"
                      ? "Viral 50 - Indonesia"
                      : "Top 50 - Global"}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] max-w-xl">
                    {currentView === "top50-indo"
                      ? "Peringkat harian lagu yang paling banyak diputar di Indonesia. Diperbarui otomatis setiap 15 menit."
                      : currentView === "most-played-indo"
                      ? "Daftar lagu paling sering diputar penikmat musik Indonesia: Bernadya, Hindia, Sal Priadi, Juicy Luicy, Mahalini, Tulus, Sheila On 7."
                      : "Lagu viral media sosial dan trending chart."}
                  </p>
                  <div className="text-xs text-[#b3b3b3] mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <span>Brnsic</span> • <span>Diperbarui otomatis ({lastChartUpdated})</span> •{" "}
                    <span>
                      {currentView === "top50-indo"
                        ? `${indonesiaTop50.length || 50} lagu`
                        : currentView === "most-played-indo"
                        ? `${mostPlayedIndonesia.length} lagu`
                        : `${viralIndonesia.length || 15} lagu`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 flex items-center gap-6">
                <button
                  onClick={() => {
                    const list =
                      currentView === "top50-indo"
                        ? indonesiaTop50
                        : currentView === "most-played-indo"
                        ? mostPlayedIndonesia
                        : currentView === "viral-indo"
                        ? viralIndonesia
                        : globalTrending;
                    if (list.length > 0) handlePlayFromList(list[0], list, 0);
                  }}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 transition shadow-xl"
                  title="Putar Semua"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentView("home")}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-white flex items-center gap-1.5 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Kembali ke Beranda</span>
                </button>
              </div>

              {/* Numbered Song List - ROUNDED ROWS */}
              <div className="px-6 pb-6 flex flex-col gap-1">
                {(currentView === "top50-indo"
                  ? indonesiaTop50
                  : currentView === "most-played-indo"
                  ? mostPlayedIndonesia
                  : currentView === "viral-indo"
                  ? viralIndonesia
                  : globalTrending
                ).map((track: any, i) => {
                  const isCurrent = track.title === currentTrack.title;
                  const targetList =
                    currentView === "top50-indo"
                      ? indonesiaTop50
                      : currentView === "most-played-indo"
                      ? mostPlayedIndonesia
                      : currentView === "viral-indo"
                      ? viralIndonesia
                      : globalTrending;

                  return (
                    <div
                      key={track.id || i}
                      onClick={() => handlePlayFromList(track, targetList, i)}
                      className={`grid grid-cols-[36px_1fr_auto_50px] sm:grid-cols-[40px_1fr_180px_auto_60px] items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition group ${
                        isCurrent
                          ? "bg-white/15 text-white shadow-sm"
                          : "hover:bg-white/10 text-[#b3b3b3] hover:text-white"
                      }`}
                    >
                      <div className="font-semibold text-xs text-center">{i + 1}</div>
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.cover}
                          alt="thumb"
                          onError={handleImgError}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div
                            className={`font-semibold text-sm truncate ${
                              isCurrent ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                            }`}
                          >
                            {track.title}
                          </div>
                          <div className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                        </div>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openAlbumView(track.album, track.artist, track.collectionId);
                        }}
                        className="hidden sm:block text-xs truncate text-[#b3b3b3] hover:text-white hover:underline cursor-pointer"
                      >
                        {track.album}
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSongToAddToPlaylist(track);
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition"
                        >
                          + Playlist
                        </button>
                      </div>

                      <div className="text-right text-xs font-medium text-[#b3b3b3]">
                        {formatTime(track.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: HOME VIEW */}
          {currentView === "home" && (
            <div className="p-4 sm:p-6 flex flex-col gap-8">
              
              {/* SMART RECOMMENDATION BANNER */}
              {relatedQueue.length > 0 && (
                <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-wider text-[#1ed760]">
                        Rekomendasi Cerdas Sesuai Selera Kamu
                      </span>
                    </div>
                    <span className="text-xs text-[#b3b3b3]">
                      Berdasarkan: <strong className="text-white">{currentTrack.artist}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                    {relatedQueue.slice(0, 6).map((item, i) => (
                      <div
                        key={item.id || i}
                        onClick={() => handlePlaySingleSongWithRadio(item)}
                        className="flex-shrink-0 w-36 sm:w-40 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl cursor-pointer transition group"
                      >
                        <img
                          src={item.cover}
                          alt={item.title}
                          onError={handleImgError}
                          className="w-full aspect-square rounded-lg object-cover mb-2 shadow"
                        />
                        <div className="font-bold text-xs text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-[#b3b3b3] truncate mt-0.5">{item.artist}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BRNSIC NATIVE 6-CARD QUICK ACCESS GRID (EXPANSIVE SMART RADIO PLAY) */}
              <section className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  {
                    title: "Top 50 Indonesia",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/600x600bb.jpg",
                    action: () => setCurrentView("top50-indo")
                  },
                  {
                    title: "Paling Sering Diputar",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/600x600bb.jpg",
                    action: () => setCurrentView("most-played-indo")
                  },
                  {
                    title: "Hindia - Evaluasi",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
                    action: () => handlePlaySingleSongWithRadio(DEFAULT_CATALOG[1])
                  },
                  {
                    title: "Satu Bulan",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/b3/7f/04/b37f04d1-8ead-36df-0e8f-37be5828b625/23UM1IM02870.crop.jpg/600x600bb.jpg",
                    action: () => handlePlaySingleSongWithRadio(DEFAULT_CATALOG[0])
                  },
                  {
                    title: "Viral 50 Indonesia",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/68/33/7a/68337ac5-981a-de0d-8999-a3505f05642f/cover.jpg/600x600bb.jpg",
                    action: () => setCurrentView("viral-indo")
                  },
                  {
                    title: "Menari Dengan Bayangan (Album)",
                    img: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/600x600bb.jpg",
                    action: () => openAlbumView("Menari Dengan Bayangan", "Hindia", 1481804269)
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    className="h-14 bg-[#282828]/60 hover:bg-[#383838] rounded-xl overflow-hidden flex items-center justify-between pr-3 cursor-pointer transition group shadow-md min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.img}
                        alt={item.title}
                        onError={handleImgError}
                        className="w-14 h-14 object-cover flex-shrink-0"
                      />
                      <span className="font-bold text-xs sm:text-sm text-white line-clamp-2 pr-1 leading-snug">
                        {item.title}
                      </span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </section>

              {/* SHELF 1: TOP 50 INDONESIA */}
              <section>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2
                      onClick={() => setCurrentView("top50-indo")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer"
                    >
                      Top 50 - Indonesia
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1">
                      Diperbarui setiap 15 menit otomatis • Lagu paling banyak diputar hari ini
                    </p>
                  </div>
                  <span
                    onClick={() => setCurrentView("top50-indo")}
                    className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {(indonesiaTop50.length > 0 ? indonesiaTop50.slice(0, 6) : DEFAULT_CATALOG).map((t: any, i) => (
                    <div
                      key={t.id || i}
                      onClick={() => handlePlayFromList(t, indonesiaTop50, i)}
                      className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                        <img
                          src={t.cover}
                          alt={t.title}
                          onError={handleImgError}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/80 backdrop-blur text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                          #{i + 1}
                        </span>
                        <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                      <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                      <div className="text-xs text-[#b3b3b3] truncate w-full mt-1">{t.artist}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SHELF 2: LAGU PALING SERING DIPUTAR DI INDONESIA */}
              <section>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2
                      onClick={() => setCurrentView("most-played-indo")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer"
                    >
                      Lagu Paling Sering Diputar di Indonesia
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1">
                      Bernadya, Hindia, Sal Priadi, Juicy Luicy, Mahalini, Tulus, Sheila On 7
                    </p>
                  </div>
                  <span
                    onClick={() => setCurrentView("most-played-indo")}
                    className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {(mostPlayedIndonesia.length > 0 ? mostPlayedIndonesia.slice(0, 6) : DEFAULT_CATALOG).map(
                    (t: any, i) => (
                      <div
                        key={t.id || i}
                        onClick={() => handlePlayFromList(t, mostPlayedIndonesia, i)}
                        className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                          <img
                            src={t.cover}
                            alt={t.title}
                            onError={handleImgError}
                            className="w-full h-full object-cover"
                          />
                          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                        <div className="text-xs text-[#b3b3b3] truncate w-full mt-1">{t.artist}</div>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* SHELF 3: TOP GLOBAL DUNIA */}
              <section>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2
                      onClick={() => setCurrentView("top50-global")}
                      className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer"
                    >
                      Top 50 - Global (Dunia)
                    </h2>
                    <p className="text-xs text-[#b3b3b3] mt-1">Lagu paling banyak diputar di seluruh dunia</p>
                  </div>
                  <span
                    onClick={() => setCurrentView("top50-global")}
                    className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
                  >
                    Lihat semua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {(globalTrending.length > 0 ? globalTrending.slice(0, 6) : DEFAULT_CATALOG).map((t: any, i) => (
                    <div
                      key={t.id || i}
                      onClick={() => handlePlayFromList(t, globalTrending, i)}
                      className="bg-[#181818] hover:bg-[#282828] p-3 rounded-xl cursor-pointer transition group min-w-0 flex flex-col"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                        <img
                          src={t.cover}
                          alt={t.title}
                          onError={handleImgError}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/80 backdrop-blur text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                          #{i + 1}
                        </span>
                        <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black hidden sm:group-hover:flex items-center justify-center transition shadow-lg hover:scale-105">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                      <div className="font-bold text-sm text-white truncate w-full">{t.title}</div>
                      <div className="text-xs text-[#b3b3b3] truncate w-full mt-1">{t.artist}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* VIEW: SEARCH RESULTS (UNIVERSAL ITUNES + YOUTUBE INDIE RESULTS) */}
          {currentView === "search" && (
            <div className="p-4 sm:p-6 flex flex-col gap-6">
              <div className="md:hidden">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    performSearch(searchQuery);
                  }}
                  className="relative flex items-center w-full"
                >
                  <svg
                    className="absolute left-4 text-[#b3b3b3] pointer-events-none"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Cari lagu apa saja (misal: Hindia, Bernadya, Only Siji)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full h-12 rounded-full bg-[#242424] pl-11 pr-10 text-sm text-white placeholder-[#b3b3b3] outline-none border border-transparent focus:border-white transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3.5 text-[#b3b3b3] hover:text-white font-bold text-lg p-1"
                    >
                      &times;
                    </button>
                  )}
                </form>
              </div>

              {searchQuery ? (
                <div>
                  <h1 className="text-xl font-bold mb-4">
                    {isSearching ? "Mencari di seluruh dunia..." : `Hasil untuk "${searchQuery}"`}
                  </h1>

                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {searchResults.map((song, i) => (
                        <div
                          key={song.trackId || i}
                          onClick={() => playSearchedSong(song, i)}
                          className="grid grid-cols-[36px_1fr_auto_50px] items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                        >
                          <span className="text-[#b3b3b3] text-sm text-center font-medium">{i + 1}</span>
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={song.artworkUrl100}
                              alt="thumb"
                              onError={handleImgError}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate group-hover:text-[#1ed760]">
                                {song.trackName}
                              </div>
                              <div className="text-xs text-[#b3b3b3] truncate">
                                {song.artistName} {song.source === "youtube" ? "• YouTube Indie" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSongToAddToPlaylist({
                                  id: song.trackId,
                                  title: song.trackName,
                                  artist: song.artistName,
                                  album: song.album || "Single",
                                  cover: song.artworkUrl100,
                                  duration: song.duration
                                });
                              }}
                              className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium"
                            >
                              + Playlist
                            </button>
                          </div>
                          <span className="text-xs text-[#b3b3b3] text-right">
                            {formatTime(song.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isSearching && <div className="text-[#b3b3b3] text-sm">Tidak ada lagu yang ditemukan.</div>
                  )}
                </div>
              ) : (
                <div>
                  <h1 className="text-xl font-bold text-white mb-4">Jelajahi Semua Genre</h1>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {GENRES.map((g, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (g.name.includes("Top 50 Indonesia")) setCurrentView("top50-indo");
                          else if (g.name.includes("Paling Sering Diputar")) setCurrentView("most-played-indo");
                          else if (g.name.includes("Viral Indonesia")) setCurrentView("viral-indo");
                          else if (g.name.includes("Top Global")) setCurrentView("top50-global");
                          else handleSearchInput(g.name);
                        }}
                        className={`${g.color} h-32 rounded-xl p-4 font-black text-lg text-white relative overflow-hidden cursor-pointer shadow-lg`}
                      >
                        <span>{g.name}</span>
                        <div className="w-16 h-16 rounded-md bg-white/20 absolute -bottom-2 -right-2 rotate-25 shadow" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: NOW PLAYING FOCUS */}
          {currentView === "now-playing" && (
            <div className="p-6">
              <div className="bg-gradient-to-b from-[#4a1219] to-black md:to-[#121212] p-6 rounded-2xl flex items-center gap-4 mb-6">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition"
                >
                  {isPlaying ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">Sedang Diputar</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{currentTrack.title}</h1>
                  <p className="text-sm text-[#b3b3b3]">{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* --- RIGHT SIDEBAR: DESKTOP ONLY BRNSIC NOW PLAYING PANEL --- */}
        <aside
          className="hidden lg:flex bg-[#121212] rounded-lg p-4 flex-col overflow-y-auto custom-scrollbar"
          ref={lyricsScrollContainerRef}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="font-bold text-sm text-white truncate">{currentTrack.title}</span>
            <button
              onClick={() => setIsZoomed(true)}
              className="text-[#b3b3b3] hover:text-white p-1 transition"
              title="Layar Penuh"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>

          {/* Brnsic Native Now Playing Artwork Card */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-[#181818] mb-4 shadow-2xl flex-shrink-0 border border-white/5 group">
            <img
              src={currentTrack.canvasImg || currentTrack.cover}
              alt={currentTrack.title}
              onError={handleImgError}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Live Playing Waveform Indicator */}
            {isPlaying && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Playing</span>
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-[#1ed760] bar-1 rounded-full"></span>
                  <span className="w-0.5 bg-[#1ed760] bar-2 rounded-full"></span>
                  <span className="w-0.5 bg-[#1ed760] bar-3 rounded-full"></span>
                </div>
              </div>
            )}

            {isLoadingSong && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10 backdrop-blur-sm">
                <div className="w-8 h-8 border-3 border-[#1ed760] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-white">Memuat audio...</span>
              </div>
            )}
          </div>

          {/* Song Info Row */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                className="font-black text-lg text-white truncate hover:underline cursor-pointer"
                onClick={() => setIsZoomed(true)}
              >
                {currentTrack.title}
              </h2>
              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist}</p>
              {currentTrack.album && (
                <p
                  onClick={() => openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId)}
                  className="text-[11px] text-[#1ed760] hover:underline cursor-pointer truncate mt-0.5"
                  title="Lihat & Putar Satu Album Ini"
                >
                  Album: {currentTrack.album} ↗
                </p>
              )}
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`p-1.5 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`}
              title={isCurrentTrackLiked ? "Hapus dari Favorit" : "Suka Lagu Ini"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>

          {/* Burgundy Lyrics Preview Box */}
          <div
            onClick={() => setIsZoomed(true)}
            className="bg-gradient-to-br from-[#781926] to-[#450c14] rounded-2xl p-4 flex flex-col gap-2.5 cursor-pointer hover:brightness-105 transition mb-4 shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">Lirik</span>
              <span className="text-xs bg-black/40 px-2.5 py-0.5 rounded-full text-white/90 font-bold flex items-center gap-1">
                <span>Layar Penuh</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                </svg>
              </span>
            </div>
            {currentTrack.lyrics.slice(0, 4).map((l, idx) => (
              <div
                key={idx}
                className={`text-sm leading-snug ${
                  idx === activeLyricIdx ? "text-white font-extrabold text-base" : "text-white/60"
                }`}
              >
                {l.text}
              </div>
            ))}
          </div>

          {/* Smart Next Up Recommendation Preview */}
          {relatedQueue.length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Berikutnya dari Rekomendasi</span>
                <span className="text-[10px] text-[#1ed760] font-bold">Autoplay</span>
              </div>
              <div
                onClick={() => handlePlaySingleSongWithRadio(relatedQueue[0])}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition"
              >
                <img
                  src={relatedQueue[0].cover}
                  alt="next"
                  onError={handleImgError}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{relatedQueue[0].title}</div>
                  <div className="text-[10px] text-[#b3b3b3] truncate">{relatedQueue[0].artist}</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ====================================================================
          3. MASTER BOTTOM DOCK (BRNSIC STANDARD WEB LAYOUT)
          ==================================================================== */}
      <footer className="hidden md:flex h-20 items-center justify-between px-4 bg-black z-40 flex-shrink-0">
        {/* Left Column: Track Info */}
        <div className="flex items-center gap-3.5 w-[30%] min-w-[180px]">
          <img
            src={currentTrack.cover}
            alt="thumb"
            onError={handleImgError}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <div
              onClick={() => setIsZoomed(true)}
              className="text-sm font-semibold text-white truncate hover:underline cursor-pointer"
            >
              {currentTrack.title}
            </div>
            <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist}</div>
            {currentTrack.album && (
              <div
                onClick={() => openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId)}
                className="text-[10px] text-white/50 hover:text-[#1ed760] hover:underline cursor-pointer truncate"
              >
                {currentTrack.album}
              </div>
            )}
          </div>
          <button
            onClick={() => toggleLike(currentTrack.id)}
            className={`p-1.5 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`}
            title={isCurrentTrackLiked ? "Hapus dari Favorit" : "Suka Lagu Ini"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        {/* Center Column: Official Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[720px]">
          <div className="flex items-center gap-5">
            {/* 3-State Repeat Button: Off / All / One */}
            <button
              onClick={() => {
                const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
                setRepeatMode(nextMode);
                setIsAlbumLoopMode(nextMode === "all");
              }}
              className={`p-1 transition relative ${
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
              }`}
              title={
                repeatMode === "off"
                  ? "Ulangi: Mati (Lanjut memutar lagu lain)"
                  : repeatMode === "all"
                  ? "Ulangi: Semua Lagu / Album"
                  : "Ulangi: 1 Lagu Ini"
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
              {repeatMode === "one" && (
                <span className="absolute -top-1 -right-1 bg-[#1ed760] text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  1
                </span>
              )}
              {repeatMode === "all" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></span>
              )}
            </button>
            <button onClick={playPrevSong} className="text-[#b3b3b3] hover:text-white" title="Lagu sebelumnya">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 transition flex items-center justify-center shadow-md"
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={playNextSong} className="text-[#b3b3b3] hover:text-white" title="Lagu berikutnya">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (currentTrack.collectionId || currentTrack.album) {
                  openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId);
                }
              }}
              className="text-[#b3b3b3] hover:text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white/20"
              title="Buka Halaman Album Lagu Ini"
            >
              Album
            </button>
          </div>

          <div className="flex items-center gap-2 w-full text-[11px] text-[#b3b3b3]">
            <span className="w-8 text-right font-medium">{formatTime(Math.floor(currentTime))}</span>
            <div onClick={handleSeek} className="flex-1 h-3 flex items-center cursor-pointer group">
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-8 font-medium">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Right Column: Brnsic Action Icons */}
        <div className="flex items-center justify-end gap-3.5 w-[30%] min-w-[180px]">
          <button
            onClick={() => setSongToAddToPlaylist(currentTrack)}
            title="Tambah ke Playlist"
            className="text-[#b3b3b3] hover:text-white p-1 text-xs font-bold"
          >
            + Playlist
          </button>

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            title="Lirik Lagu"
            className="text-[#1ed760] hover:scale-110 transition p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          <button
            onClick={() => setCurrentView(currentView === "home" ? "top50-indo" : "home")}
            className="text-[#b3b3b3] hover:text-white p-1"
            title="Antrean"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="flex items-center gap-2 w-28">
            <button onClick={toggleMute} className="text-[#b3b3b3] hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            <div onClick={handleVolume} className="flex-1 h-3 flex items-center cursor-pointer group">
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            title="Layar Penuh"
            className="text-[#b3b3b3] hover:text-white hover:scale-110 transition p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        </div>
      </footer>

      {/* ====================================================================
          4. MOBILE FLOATING MINI-PLAYER + BOTTOM NAV BAR
          ==================================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-auto">
        {!isMobilePlayerOpen && (
          <div
            onClick={() => setIsMobilePlayerOpen(true)}
            className="mx-2 mb-2 liquid-glass-borderless rounded-2xl p-2.5 flex items-center justify-between shadow-2xl cursor-pointer active:scale-[0.99] transition border-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={currentTrack.cover}
                alt="thumb"
                onError={handleImgError}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                <div className="text-[11px] text-[#b3b3b3] truncate flex items-center gap-1.5">
                  <span>{currentTrack.artist}</span>
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-2">
                      <span className="w-0.5 bg-white bar-1 rounded-full"></span>
                      <span className="w-0.5 bg-white bar-2 rounded-full"></span>
                      <span className="w-0.5 bg-white bar-3 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(currentTrack.id);
                }}
                className={`p-1 ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-[#b3b3b3]"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNextSong();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition"
                title="Lagu Berikutnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        {!isMobilePlayerOpen && (
          <nav className="h-14 bg-black/95 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-6">
            <button
              onClick={() => {
                setMobileNavTab("home");
                setCurrentView("home");
              }}
              className={`flex flex-col items-center gap-1 ${
                mobileNavTab === "home" ? "text-white font-bold" : "text-[#b3b3b3]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" />
              </svg>
              <span className="text-[10px]">Home</span>
            </button>
            <button
              onClick={() => {
                setMobileNavTab("search");
                setCurrentView("search");
              }}
              className={`flex flex-col items-center gap-1 ${
                mobileNavTab === "search" ? "text-white font-bold" : "text-[#b3b3b3]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="text-[10px]">Cari</span>
            </button>
            <button
              onClick={() => {
                setMobileNavTab("library");
                if (userPlaylists.length > 0) {
                  setActiveCustomPlaylist(userPlaylists[0]);
                  setCurrentView("custom-playlist");
                } else {
                  setCurrentView("top50-indo");
                }
              }}
              className={`flex flex-col items-center gap-1 ${
                mobileNavTab === "library" ? "text-white font-bold" : "text-[#b3b3b3]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1.5-.866zM20 20h-4V4h4v16zm-10.5.134A1 1 0 0 0 8 19V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1.5.866zM7 18H3V6h4v12z" />
              </svg>
              <span className="text-[10px]">Koleksi</span>
            </button>
          </nav>
        )}
      </div>

      {/* ====================================================================
          5. THE EXACT "LIQUID AUDIO" FULLSCREEN EXPERIENCE
          ==================================================================== */}
      {isMobilePlayerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col p-4 md:p-6 overflow-hidden animate-fadeIn border-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] md:w-[600px] h-[340px] md:h-[600px] bg-white/[0.04] rounded-full blur-[120px] pointer-events-none" />

          {/* Top Bar matching Brnsic Mobile */}
          <header className="relative z-10 flex items-center justify-between pb-2 flex-shrink-0">
            <button
              onClick={() => setIsMobilePlayerOpen(false)}
              className="w-10 h-10 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 hover:text-white"
              title="Tutup Player"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div className="text-center min-w-0 px-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block truncate">
                {repeatMode === "all" ? "MODE ULANGI (LOOP)" : "BRNSIC AUDIO PLAYER"}
              </span>
              <span className="text-xs font-black text-white truncate max-w-[200px] block">
                {currentTrack.album || currentTrack.artist}
              </span>
            </div>

            <button
              onClick={() => {
                setIsMobilePlayerOpen(false);
                setCurrentView("search");
              }}
              className="w-10 h-10 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </header>

          {/* Body Content by Tab */}
          <div className="relative z-10 flex-1 overflow-hidden flex flex-col pb-20">
            
            {/* TAB 1: QUEUE */}
            {mobileTab === "queue" && (
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      ANTREAN AKTIF
                    </span>
                    <h2 className="text-xl font-black text-white">
                      {isAlbumLoopMode ? `Album: ${currentTrack.album}` : "Antrean & Rekomendasi"}
                    </h2>
                  </div>
                  {isAlbumLoopMode && (
                    <button
                      onClick={() => {
                        setIsAlbumLoopMode(false);
                        setRepeatMode("off");
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300"
                    >
                      Matikan Loop Album
                    </button>
                  )}
                </div>

                {/* Now Playing Card */}
                <div className="liquid-glass-borderless rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={currentTrack.cover}
                        alt="thumb"
                        onError={handleImgError}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                        <span className="w-1 bg-white bar-1 rounded-full"></span>
                        <span className="w-1 bg-white bar-2 rounded-full"></span>
                        <span className="w-1 bg-white bar-3 rounded-full"></span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">{currentTrack.title}</div>
                      <div className="text-xs text-white/60 truncate">{currentTrack.artist}</div>
                    </div>
                  </div>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md flex-shrink-0"
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Related Smart Queue */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1ed760] px-1">
                    Berikutnya dalam Antrean
                  </span>
                  {(activeQueue.length > 1
                    ? activeQueue
                    : relatedQueue.length > 0
                    ? relatedQueue
                    : mostPlayedIndonesia
                  ).map((song, i) => (
                    <div
                      key={song.id || i}
                      onClick={() => handlePlayFromList(song, activeQueue, i, isAlbumLoopMode)}
                      className="liquid-glass-card rounded-xl p-2.5 flex items-center justify-between hover:bg-white/10 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="text-white/30 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="4" y1="9" x2="20" y2="9"></line>
                          <line x1="4" y1="15" x2="20" y2="15"></line>
                        </svg>
                        <img
                          src={song.cover}
                          alt="thumb"
                          onError={handleImgError}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{song.title}</div>
                          <div className="text-[11px] text-white/50 truncate">
                            {song.artist} {song.reason ? `• ${song.reason}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-white/40">{formatTime(song.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: NOW PLAYING */}
            {mobileTab === "now-playing" && (
              <div className="flex-1 flex flex-col items-center justify-between max-w-sm mx-auto w-full pt-1">
                {/* Artwork Canvas */}
                <div className="w-full aspect-square max-h-[44vh] rounded-3xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] my-auto group">
                  <img
                    src={currentTrack.canvasImg || currentTrack.cover}
                    alt={currentTrack.title}
                    onError={handleImgError}
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Title, Artist, & Like Button Row */}
                <div className="w-full flex items-center justify-between mt-3 px-1">
                  <div className="min-w-0 flex-1 pr-3">
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
                      {currentTrack.title}
                    </h1>
                    <p className="text-xs md:text-sm text-white/60 font-medium truncate mt-0.5">{currentTrack.artist}</p>
                    {currentTrack.album && (
                      <button
                        onClick={() => {
                          setIsMobilePlayerOpen(false);
                          openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.collectionId);
                        }}
                        className="text-[11px] text-[#1ed760] font-bold hover:underline truncate block mt-0.5"
                      >
                        Album: {currentTrack.album} ↗
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => toggleLike(currentTrack.id)}
                    className={`p-2 transition ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-white/60 hover:text-white"}`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>

                {/* Timeline & Scrubber */}
                <div className="w-full flex flex-col gap-1 mt-3">
                  <div onClick={handleSeek} className="w-full h-3 flex items-center cursor-pointer group">
                    <div className="w-full h-1 bg-white/20 rounded-full relative">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] absolute top-1/2 -translate-y-1/2 -ml-1.5"
                        style={{ left: `${(currentTime / currentTrack.duration) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/50 font-medium px-0.5">
                    <span>{formatTime(Math.floor(currentTime))}</span>
                    <span>{formatTime(currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Playback Controls Bar */}
                <div className="w-full flex items-center justify-between mt-2 px-2">
                  <button
                    onClick={() => {
                      const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
                      setRepeatMode(nextMode);
                      setIsAlbumLoopMode(nextMode === "all");
                    }}
                    className={`p-1 relative ${repeatMode !== "off" ? "text-[#1ed760]" : "text-white/50 hover:text-white"}`}
                    title={
                      repeatMode === "off"
                        ? "Ulangi: Mati (Lanjut lagu lain)"
                        : repeatMode === "all"
                        ? "Ulangi: Semua Lagu"
                        : "Ulangi: 1 Lagu Ini"
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"></polyline>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                      <polyline points="7 23 3 19 7 15"></polyline>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                    {repeatMode === "one" && (
                      <span className="absolute -top-1 -right-1 bg-[#1ed760] text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        1
                      </span>
                    )}
                  </button>

                  <button onClick={playPrevSong} className="text-white hover:scale-110 transition p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button onClick={playNextSong} className="text-white hover:scale-110 transition p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setSongToAddToPlaylist(currentTrack)}
                    className="text-white/50 hover:text-white p-1 text-xs font-bold"
                    title="Tambah ke Playlist"
                  >
                    + Playlist
                  </button>
                </div>

                {/* Bottom Utility Row */}
                <div className="w-full flex items-center justify-between mt-3 px-1 text-white/60">
                  <button className="flex items-center gap-2 text-xs font-semibold hover:text-white transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>Brnsic Audio Engine</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: currentTrack.title,
                          text: `Dengarkan lagu ${currentTrack.title} oleh ${currentTrack.artist} di Brnsic!`,
                          url: window.location.href
                        });
                      }
                    }}
                    className="p-1 hover:text-white transition"
                    title="Bagikan"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LYRICS */}
            {mobileTab === "lyrics" && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="liquid-glass-borderless rounded-xl p-2.5 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentTrack.cover}
                      alt="thumb"
                      onError={handleImgError}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                      <div className="text-[10px] text-white/60 truncate">{currentTrack.artist}</div>
                    </div>
                  </div>
                  <button onClick={() => toggleLike(currentTrack.id)} className={`p-1.5 ${isCurrentTrackLiked ? "text-[#1ed760]" : "text-white/40"}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isCurrentTrackLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>

                <div
                  ref={mobileLyricsScrollRef}
                  onWheel={handleUserScroll}
                  onTouchMove={handleUserScroll}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 py-12 px-4 text-center"
                >
                  {currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIdx;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? mobileActiveLyricRef : null}
                        onClick={() => {
                          setCurrentTime(line.time);
                          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
                            ytPlayerRef.current.seekTo(line.time, true);
                          }
                          setUserIsScrollingLyrics(false);
                        }}
                        className={`transition-all duration-300 cursor-pointer select-none leading-relaxed ${
                          isActive
                            ? "text-white font-black text-2xl sm:text-3xl drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] scale-105"
                            : "text-white/30 font-bold text-lg sm:text-xl hover:text-white/60"
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>

                <div className="liquid-glass-pill rounded-full py-2 px-6 flex items-center justify-around mt-2 max-w-xs mx-auto w-full">
                  <button onClick={playPrevSong} className="text-white hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md"
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button onClick={playNextSong} className="text-white hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Master 3-Tab Floating Pill */}
          <footer className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto h-12 liquid-glass-borderless rounded-full p-1.5 flex items-center justify-between z-30 shadow-2xl border-0">
            <button
              onClick={() => setMobileTab("queue")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "queue"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
              </svg>
              <span>Antrean</span>
            </button>

            <button
              onClick={() => setMobileTab("now-playing")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "now-playing"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              <span>Lagu</span>
            </button>

            <button
              onClick={() => setMobileTab("lyrics")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition ${
                mobileTab === "lyrics"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
              <span>Lirik</span>
            </button>
          </footer>

        </div>
      )}

      {/* ====================================================================
          6. DESKTOP CINEMA ZOOM (FULLSCREEN)
          ==================================================================== */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col p-6 animate-fadeIn">
          <header className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
            {/* Left: Track Info */}
            <div className="flex items-center gap-3.5 min-w-0 max-w-[30%]">
              <img
                src={currentTrack.cover}
                alt="thumb"
                onError={handleImgError}
                className="w-12 h-12 rounded-xl object-cover shadow-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-extrabold text-white text-base tracking-tight truncate">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-[#b3b3b3] font-medium truncate">
                  {currentTrack.artist} • {currentTrack.album}
                </div>
              </div>
            </div>

            {/* Center: Mode Switcher Pills */}
            <div className="flex items-center bg-[#1f1f1f]/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
              <button
                onClick={() => setZoomMode("both")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  zoomMode === "both" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Lirik &amp; Video
              </button>
              <button
                onClick={() => setZoomMode("lyrics-only")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  zoomMode === "lyrics-only" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Fokus Lirik
              </button>
              <button
                onClick={() => setZoomMode("video-only")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  zoomMode === "video-only" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                Fokus Video
              </button>
            </div>

            {/* Right: Crisp Centered Close Button */}
            <div className="flex items-center justify-end max-w-[30%]">
              <button
                onClick={() => setIsZoomed(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition shadow border border-white/10"
                title="Tutup Layar Penuh (Esc)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </header>

          <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 pb-20 overflow-hidden">
            {(zoomMode === "both" || zoomMode === "video-only") && (
              <div
                className={`${
                  zoomMode === "video-only" ? "md:col-span-12 max-w-3xl mx-auto" : "md:col-span-5"
                } flex flex-col items-center justify-center h-full`}
              >
                <div className="w-full max-w-[460px] aspect-[9/13] rounded-3xl overflow-hidden shadow-2xl bg-black/60 border border-white/10 relative group">
                  <img
                    src={currentTrack.canvasImg || currentTrack.cover}
                    alt={currentTrack.title}
                    onError={handleImgError}
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>
              </div>
            )}

            {(zoomMode === "both" || zoomMode === "lyrics-only") && (
              <div
                className={`${
                  zoomMode === "lyrics-only" ? "md:col-span-12 max-w-3xl mx-auto" : "md:col-span-7"
                } flex flex-col h-full relative overflow-hidden`}
              >
                <div
                  ref={zoomedLyricsScrollRef}
                  onWheel={handleUserScroll}
                  onTouchMove={handleUserScroll}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 px-8 py-16 text-left"
                >
                  {currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIdx;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? zoomedActiveLyricRef : null}
                        onClick={() => {
                          setCurrentTime(line.time);
                          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
                            ytPlayerRef.current.seekTo(line.time, true);
                          }
                          setUserIsScrollingLyrics(false);
                        }}
                        className={`transition-all duration-300 cursor-pointer select-none leading-relaxed ${
                          isActive
                            ? "text-white font-black text-3xl sm:text-5xl drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
                            : "text-white/30 font-bold text-2xl sm:text-3xl hover:text-white/70"
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          7. MODAL: BUAT PLAYLIST BARU
          ==================================================================== */}
      {isCreatePlaylistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-white/10 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-black text-white">Buat Playlist Baru</h2>
            <input
              type="text"
              placeholder="Beri nama playlist kamu (misal: Hindia & Indie)"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/10 px-4 text-white text-sm outline-none border border-white/10 focus:border-[#1ed760] transition"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setIsCreatePlaylistModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white transition"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-5 py-2.5 rounded-full bg-[#1ed760] text-black font-extrabold text-xs hover:scale-105 transition shadow-lg"
              >
                Simpan Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          8. MODAL: TAMBAH KE PLAYLIST
          ==================================================================== */}
      {songToAddToPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-white/10 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Tambahkan ke Playlist</h2>
              <button
                onClick={() => setSongToAddToPlaylist(null)}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
              <img
                src={songToAddToPlaylist.cover}
                alt="cover"
                onError={handleImgError}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{songToAddToPlaylist.title}</div>
                <div className="text-xs text-[#b3b3b3] truncate">{songToAddToPlaylist.artist}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {userPlaylists.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#b3b3b3]">
                  Belum ada playlist yang dibuat. Buat playlist baru terlebih dahulu.
                </div>
              ) : (
                userPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleAddSongToPlaylist(pl.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
                  >
                    <span className="font-bold text-sm text-white truncate">{pl.name}</span>
                    <span className="text-xs text-[#1ed760] font-semibold">+ Tambahkan</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setSongToAddToPlaylist(null);
                setIsCreatePlaylistModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-xs font-bold text-white/80 hover:text-white transition"
            >
              + Buat Playlist Baru Sekarang
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
