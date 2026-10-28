import fs from "fs";
import path from "path";
import {
  isPrismaConfigured,
  prismaGetUserByEmail,
  prismaGetUserById,
  prismaCreateUser,
  prismaUpdateUser,
  prismaLogActivity,
  prismaGetPlaylistById
} from "./prisma-db";
import {
  isSupabaseConfigured,
  supabaseGetUserByEmail,
  supabaseGetUserById,
  supabaseCreateUser,
  supabaseUpdateUser,
  supabaseLogActivity,
  supabaseGetPlaylistById
} from "./supabase";

export interface TasteProfile {
  userSeed: string;
  persona: string;
  artistWeights: Record<string, number>;
  genreWeights?: Record<string, number>;
  playCounts: Record<string, number>;
  likedArtists: string[];
  totalPlays: number;
  moodState?: string;
  moodAffinity?: Record<string, number>;
  topArtist?: string;
}

export interface UserActivity {
  id: string;
  songId: string;
  title: string;
  artist: string;
  genre?: string;
  action: "play" | "complete" | "replay" | "like" | "skip" | "playlist";
  timestamp: number;
  duration?: number;
  listenSeconds?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  createdAt: number;
  onboardingCompleted: boolean;
  selectedGenres?: string[];
  selectedArtists?: string[];
  taste: TasteProfile;
  likedSongs: string[];
  playlists: any[];
  history: UserActivity[];
}

interface DatabaseSchema {
  users: Record<string, User>; // key: email lowercase
}

// In-memory fallback cache across lambda lifecycles
let memoryDb: DatabaseSchema = {
  users: {}
};

// Compute writable DB file path
const getDbFilePath = (): string => {
  // Prefer /tmp on serverless or pre-created AppData directory
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join("/tmp", "brnsic-db.json");
  }
  return path.join(process.cwd(), "brnsic-local-db.json");
};

// Safe load from disk
const loadDb = (): DatabaseSchema => {
  try {
    const filePath = getDbFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.users === "object") {
        memoryDb = parsed;
        return memoryDb;
      }
    }
  } catch (err) {
    // If filesystem not accessible, rely on memory cache
  }
  return memoryDb;
};

// Safe save to disk
const saveDb = (db: DatabaseSchema) => {
  memoryDb = db;
  try {
    const filePath = getDbFilePath();
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    // Graceful fallback to memory storage
  }
};

// Helper to derive persona from weights
export const derivePersona = (weights: Record<string, number>, genres?: Record<string, number>): string => {
  const sorted = Object.entries(weights || {}).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "Penjelajah Musik Indonesia & Global";

  const top = sorted[0][0].toLowerCase();
  if (top.includes("sal priadi") || top.includes("hindia") || top.includes("nadin")) {
    return "Penikmat Indie Pop & Puisi Senja";
  }
  if (top.includes("bernadya") || top.includes("mahalini") || top.includes("juicy")) {
    return "Spesialis Pop Galau & Kisah Cinta";
  }
  if (top.includes("denny") || top.includes("caknan") || top.includes("koplo")) {
    return "Pecinta Dangdut Koplo Modern";
  }
  if (top.includes("sheila") || top.includes("dewa") || top.includes("andra")) {
    return "Pecinta Rock Pop Nostalgia & Legend";
  }
  if (top.includes("bruno") || top.includes("billie") || top.includes("gaga")) {
    return "Pencinta Hits Global & Pop Soul";
  }
  return `Penggemar ${sorted[0][0]}`;
};

export const defaultTasteForUser = (name: string): TasteProfile => ({
  userSeed: `brnsic-${Date.now().toString(36)}`,
  persona: "Penjelajah Musik Indonesia & Global",
  artistWeights: { "Sal Priadi": 3, "Bernadya": 3, "Sheila On 7": 2 },
  genreWeights: { "Pop Indonesia": 3, "Indie Lokal": 3 },
  playCounts: {},
  likedArtists: ["Sal Priadi", "Bernadya", "Sheila On 7"],
  totalPlays: 0
});

// Database Public Operations (Prisma ORM First, Supabase REST Second, Local Fallback)
export const dbFindUserByEmail = async (email: string): Promise<User | null> => {
  if (isPrismaConfigured()) {
    const pUser = await prismaGetUserByEmail(email);
    if (pUser) return pUser;
  }
  if (isSupabaseConfigured()) {
    const sbUser = await supabaseGetUserByEmail(email);
    if (sbUser) return sbUser;
  }
  const db = loadDb();
  const cleanEmail = email.trim().toLowerCase();
  return db.users[cleanEmail] || null;
};

export const dbFindUserById = async (id: string): Promise<User | null> => {
  if (isPrismaConfigured()) {
    const pUser = await prismaGetUserById(id);
    if (pUser) return pUser;
  }
  if (isSupabaseConfigured()) {
    const sbUser = await supabaseGetUserById(id);
    if (sbUser) return sbUser;
  }
  const db = loadDb();
  for (const user of Object.values(db.users)) {
    if (user.id === id) return user;
  }
  return null;
};

export const dbCreateUser = async (
  name: string,
  email: string,
  passwordHash: string,
  salt: string,
  explicitId?: string
): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  const id = explicitId || `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const newUser: User = {
    id,
    email: cleanEmail,
    name: name.trim() || cleanEmail.split("@")[0],
    passwordHash,
    salt,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
    createdAt: Date.now(),
    onboardingCompleted: false,
    selectedGenres: [],
    selectedArtists: [],
    taste: defaultTasteForUser(name),
    likedSongs: [],
    playlists: [],
    history: []
  };

  if (isPrismaConfigured()) {
    await prismaCreateUser(newUser);
  } else if (isSupabaseConfigured()) {
    await supabaseCreateUser(newUser);
  }

  const db = loadDb();
  db.users[cleanEmail] = newUser;
  saveDb(db);
  return newUser;
};

export const dbUpdateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  if (isPrismaConfigured()) {
    await prismaUpdateUser(id, updates);
  } else if (isSupabaseConfigured()) {
    await supabaseUpdateUser(id, updates);
  }

  const db = loadDb();
  let targetUser: User | null = null;
  let targetKey: string | null = null;

  for (const [email, user] of Object.entries(db.users)) {
    if (user.id === id) {
      targetUser = user;
      targetKey = email;
      break;
    }
  }

  if (!targetUser || !targetKey) {
    if (isPrismaConfigured()) {
      return await prismaGetUserById(id);
    }
    if (isSupabaseConfigured()) {
      return await supabaseGetUserById(id);
    }
    return null;
  }

  const updated: User = {
    ...targetUser,
    ...updates,
    id: targetUser.id, // Immutable
    email: targetUser.email // Immutable
  };

  db.users[targetKey] = updated;
  saveDb(db);
  return updated;
};

// Record and learn from user activity
export const dbLogUserActivity = async (
  userId: string,
  activity: {
    songId: string;
    title: string;
    artist: string;
    genre?: string;
    action: "play" | "complete" | "replay" | "like" | "skip" | "playlist";
    duration?: number;
    listenSeconds?: number;
  }
): Promise<User | null> => {
  let user = await dbFindUserById(userId);
  if (!user) {
    const isGuest = userId.startsWith("dev_") || userId.startsWith("guest");
    const cleanEmail = isGuest ? `${userId.toLowerCase()}@guest.brnsic.app` : `${userId}@user.brnsic.app`;
    user = await dbFindUserByEmail(cleanEmail);
    if (!user) {
      user = await dbCreateUser(
        isGuest ? "Pengguna Brnsic (Tamu)" : "Pengguna Brnsic",
        cleanEmail,
        "guest-hash",
        "guest-salt",
        userId
      );
    }
  }
  if (!user) return null;

  const artist = (activity.artist || "Unknown").trim();
  const title = (activity.title || "Unknown").trim();
  const genre = activity.genre ? activity.genre.trim() : undefined;

  // 1. Calculate weight adjustments
  // Like (+5), Playlist (+4), Replay (+4), Completed (>80% duration) (+3), Play (+1)
  // Skip: if user skipped in first 15 seconds, check frequency. Multiple skips on same artist = penalty.
  let artistBoost = 0;
  let genreBoost = 0;

  if (activity.action === "like") {
    artistBoost = 5;
    genreBoost = 4;
  } else if (activity.action === "playlist") {
    artistBoost = 4;
    genreBoost = 3;
  } else if (activity.action === "replay") {
    artistBoost = 4;
    genreBoost = 3;
  } else if (activity.action === "complete") {
    artistBoost = 3;
    genreBoost = 2;
  } else if (activity.action === "play") {
    artistBoost = 1;
    genreBoost = 1;
  } else if (activity.action === "skip") {
    const recentSkips = user.history
      .slice(-10)
      .filter((h) => h.action === "skip" && h.artist.toLowerCase() === artist.toLowerCase()).length;
    artistBoost = recentSkips >= 2 ? -2 : -1;
    genreBoost = recentSkips >= 3 ? -1 : 0;
  }

  const nextArtistWeights = { ...(user.taste.artistWeights || {}) };
  const nextGenreWeights = { ...(user.taste.genreWeights || {}) };
  const nextPlayCounts = { ...(user.taste.playCounts || {}) };

  nextArtistWeights[artist] = Math.max(0, (nextArtistWeights[artist] || 0) + artistBoost);
  if (genre) {
    nextGenreWeights[genre] = Math.max(0, (nextGenreWeights[genre] || 0) + genreBoost);
  }

  if (activity.action === "play") {
    nextPlayCounts[activity.songId || title] = (nextPlayCounts[activity.songId || title] || 0) + 1;
  }

  const nextLikedArtists =
    activity.action === "like" && !user.taste.likedArtists.includes(artist)
      ? [...user.taste.likedArtists, artist]
      : user.taste.likedArtists;

  const nextTaste: TasteProfile = {
    ...user.taste,
    artistWeights: nextArtistWeights,
    genreWeights: nextGenreWeights,
    playCounts: nextPlayCounts,
    likedArtists: nextLikedArtists,
    persona: derivePersona(nextArtistWeights, nextGenreWeights),
    totalPlays: user.taste.totalPlays + (activity.action === "play" ? 1 : 0)
  };

  const newActivityEntry: UserActivity = {
    id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    songId: activity.songId,
    title,
    artist,
    genre,
    action: activity.action,
    timestamp: Date.now(),
    duration: activity.duration,
    listenSeconds: activity.listenSeconds
  };

  if (isPrismaConfigured()) {
    await prismaLogActivity(userId, newActivityEntry);
  } else if (isSupabaseConfigured()) {
    await supabaseLogActivity(userId, newActivityEntry);
  }

  const updatedHistory = [...(user.history || []), newActivityEntry].slice(-150);

  return dbUpdateUser(userId, {
    taste: nextTaste,
    history: updatedHistory
  });
};

export const dbGetPlaylistById = async (playlistId: string) => {
  if (isPrismaConfigured()) {
    const pl = await prismaGetPlaylistById(playlistId);
    if (pl) return pl;
  }
  if (isSupabaseConfigured()) {
    const pl = await supabaseGetPlaylistById(playlistId);
    if (pl) return pl;
  }
  const db = loadDb();
  for (const user of Object.values(db.users)) {
    if (Array.isArray(user.playlists)) {
      const found = user.playlists.find((p: any) => p.id === playlistId);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          cover: found.cover || null,
          songs: Array.isArray(found.songs) ? found.songs : [],
          createdAt: found.createdAt || Date.now(),
          creator: {
            name: user.name || "Pengguna Brnsic",
            avatar: user.avatar || ""
          }
        };
      }
    }
  }
  return null;
};
