import { User, TasteProfile, UserActivity } from "./db";

export const isPrismaConfigured = (): boolean => {
  const dbUrl = process.env.DATABASE_URL || "";
  return Boolean(
    dbUrl &&
    (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) &&
    !dbUrl.includes("[YOUR-PASSWORD]") &&
    !dbUrl.includes("YOUR-PASSWORD")
  );
};

// Lazy load prisma instance safely so imports don't throw if client isn't generated yet
const getPrisma = async () => {
  try {
    const { prisma } = await import("./prisma");
    return prisma;
  } catch (err) {
    return null;
  }
};

export const prismaGetUserByEmail = async (email: string): Promise<User | null> => {
  if (!isPrismaConfigured()) return null;
  try {
    const prisma = await getPrisma();
    if (!prisma) return null;

    const cleanEmail = email.trim().toLowerCase();
    const row = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        taste: true,
        likedSongs: true,
        playlists: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 60
        }
      }
    });

    if (!row) return null;

    const taste: TasteProfile = row.taste
      ? {
          userSeed: row.taste.userSeed || `brnsic-${row.id}`,
          persona: row.taste.persona || "Penjelajah Musik Indonesia & Global",
          artistWeights: (row.taste.artistWeights as Record<string, number>) || {},
          genreWeights: (row.taste.genreWeights as Record<string, number>) || {},
          playCounts: (row.taste.playCounts as Record<string, number>) || {},
          likedArtists: row.taste.likedArtists || [],
          totalPlays: row.taste.totalPlays || 0
        }
      : {
          userSeed: `brnsic-${row.id}`,
          persona: "Penjelajah Musik Indonesia & Global",
          artistWeights: {},
          genreWeights: {},
          playCounts: {},
          likedArtists: [],
          totalPlays: 0
        };

    const likedSongs = row.likedSongs ? row.likedSongs.map((l) => l.songId) : [];
    const playlists = row.playlists
      ? row.playlists.map((p) => ({
          id: p.id,
          name: p.name,
          cover: p.cover,
          songs: Array.isArray(p.songs) ? p.songs : []
        }))
      : [];

    const history: UserActivity[] = row.activities
      ? row.activities.map((a) => ({
          id: a.id,
          songId: a.songId,
          title: a.title,
          artist: a.artist,
          genre: a.genre || undefined,
          action: (a.action as any) || "play",
          timestamp: a.createdAt.getTime(),
          duration: a.duration || undefined,
          listenSeconds: a.listenSeconds || undefined
        }))
      : [];

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash || "",
      salt: row.salt || "",
      avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.email)}`,
      createdAt: row.createdAt.getTime(),
      onboardingCompleted: row.onboardingCompleted,
      selectedGenres: row.selectedGenres || [],
      selectedArtists: row.selectedArtists || [],
      taste,
      likedSongs,
      playlists,
      history
    };
  } catch (err) {
    console.error("Prisma getUserByEmail error:", err);
    return null;
  }
};

export const prismaGetUserById = async (id: string): Promise<User | null> => {
  if (!isPrismaConfigured()) return null;
  try {
    const prisma = await getPrisma();
    if (!prisma) return null;

    const row = await prisma.user.findUnique({
      where: { id },
      include: {
        taste: true,
        likedSongs: true,
        playlists: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 60
        }
      }
    });

    if (!row) return null;

    const taste: TasteProfile = row.taste
      ? {
          userSeed: row.taste.userSeed || `brnsic-${row.id}`,
          persona: row.taste.persona || "Penjelajah Musik Indonesia & Global",
          artistWeights: (row.taste.artistWeights as Record<string, number>) || {},
          genreWeights: (row.taste.genreWeights as Record<string, number>) || {},
          playCounts: (row.taste.playCounts as Record<string, number>) || {},
          likedArtists: row.taste.likedArtists || [],
          totalPlays: row.taste.totalPlays || 0
        }
      : {
          userSeed: `brnsic-${row.id}`,
          persona: "Penjelajah Musik Indonesia & Global",
          artistWeights: {},
          genreWeights: {},
          playCounts: {},
          likedArtists: [],
          totalPlays: 0
        };

    const likedSongs = row.likedSongs ? row.likedSongs.map((l) => l.songId) : [];
    const playlists = row.playlists
      ? row.playlists.map((p) => ({
          id: p.id,
          name: p.name,
          cover: p.cover,
          songs: Array.isArray(p.songs) ? p.songs : []
        }))
      : [];

    const history: UserActivity[] = row.activities
      ? row.activities.map((a) => ({
          id: a.id,
          songId: a.songId,
          title: a.title,
          artist: a.artist,
          genre: a.genre || undefined,
          action: (a.action as any) || "play",
          timestamp: a.createdAt.getTime(),
          duration: a.duration || undefined,
          listenSeconds: a.listenSeconds || undefined
        }))
      : [];

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash || "",
      salt: row.salt || "",
      avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.email)}`,
      createdAt: row.createdAt.getTime(),
      onboardingCompleted: row.onboardingCompleted,
      selectedGenres: row.selectedGenres || [],
      selectedArtists: row.selectedArtists || [],
      taste,
      likedSongs,
      playlists,
      history
    };
  } catch (err) {
    console.error("Prisma getUserById error:", err);
    return null;
  }
};

export const prismaCreateUser = async (user: User): Promise<boolean> => {
  if (!isPrismaConfigured()) return false;
  try {
    const prisma = await getPrisma();
    if (!prisma) return false;

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email.toLowerCase().trim(),
        name: user.name,
        passwordHash: user.passwordHash,
        salt: user.salt,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
        selectedGenres: user.selectedGenres || [],
        selectedArtists: user.selectedArtists || [],
        taste: {
          create: {
            userSeed: user.taste.userSeed,
            persona: user.taste.persona,
            artistWeights: user.taste.artistWeights as any,
            genreWeights: (user.taste.genreWeights || {}) as any,
            playCounts: (user.taste.playCounts || {}) as any,
            likedArtists: user.taste.likedArtists || [],
            totalPlays: user.taste.totalPlays || 0
          }
        }
      }
    });

    return true;
  } catch (err) {
    console.error("Prisma createUser error:", err);
    return false;
  }
};

export const prismaUpdateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
  if (!isPrismaConfigured()) return false;
  try {
    const prisma = await getPrisma();
    if (!prisma) return false;

    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.avatar !== undefined) dataToUpdate.avatar = updates.avatar;
    if (updates.onboardingCompleted !== undefined) dataToUpdate.onboardingCompleted = updates.onboardingCompleted;
    if (updates.selectedGenres !== undefined) dataToUpdate.selectedGenres = updates.selectedGenres;
    if (updates.selectedArtists !== undefined) dataToUpdate.selectedArtists = updates.selectedArtists;

    await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    if (updates.taste) {
      await prisma.tasteProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          userSeed: updates.taste.userSeed,
          persona: updates.taste.persona,
          artistWeights: updates.taste.artistWeights as any,
          genreWeights: (updates.taste.genreWeights || {}) as any,
          playCounts: (updates.taste.playCounts || {}) as any,
          likedArtists: updates.taste.likedArtists || [],
          totalPlays: updates.taste.totalPlays || 0
        },
        update: {
          persona: updates.taste.persona,
          artistWeights: updates.taste.artistWeights as any,
          genreWeights: (updates.taste.genreWeights || {}) as any,
          playCounts: (updates.taste.playCounts || {}) as any,
          likedArtists: updates.taste.likedArtists || [],
          totalPlays: updates.taste.totalPlays || 0
        }
      });
    }

    if (Array.isArray(updates.likedSongs)) {
      await prisma.likedSong.deleteMany({ where: { userId: id } });
      if (updates.likedSongs.length > 0) {
        await prisma.likedSong.createMany({
          data: updates.likedSongs.map((songId) => ({
            userId: id,
            songId
          })),
          skipDuplicates: true
        });
      }
    }

    if (Array.isArray(updates.playlists)) {
      await prisma.playlist.deleteMany({ where: { userId: id } });
      if (updates.playlists.length > 0) {
        await prisma.playlist.createMany({
          data: updates.playlists.map((p) => ({
            id: p.id || `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId: id,
            name: p.name,
            cover: p.cover || null,
            songs: (Array.isArray(p.songs) ? p.songs : []) as any
          }))
        });
      }
    }

    return true;
  } catch (err) {
    console.error("Prisma updateUser error:", err);
    return false;
  }
};

export const prismaLogActivity = async (userId: string, activity: UserActivity): Promise<boolean> => {
  if (!isPrismaConfigured()) return false;
  try {
    const prisma = await getPrisma();
    if (!prisma) return false;

    await prisma.userActivity.create({
      data: {
        id: activity.id,
        userId,
        songId: activity.songId,
        title: activity.title,
        artist: activity.artist,
        genre: activity.genre || null,
        action: activity.action,
        duration: activity.duration || null,
        listenSeconds: activity.listenSeconds || null,
        createdAt: new Date(activity.timestamp)
      }
    });

    return true;
  } catch (err) {
    console.error("Prisma logActivity error:", err);
    return false;
  }
};
