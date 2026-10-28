import { User, TasteProfile, UserActivity } from "./db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith("http"));
};

const getHeaders = (extra?: Record<string, string>) => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  ...extra
});

// 1. Get user by email from Supabase
export const supabaseGetUserByEmail = async (email: string): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const url = `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}&select=*,user_taste(*),user_likes(song_id),user_playlists(*)`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    // Reconstruct into clean User object
    const tasteRow = Array.isArray(row.user_taste) && row.user_taste.length > 0 ? row.user_taste[0] : null;
    const taste: TasteProfile = tasteRow
      ? {
          userSeed: `brnsic-${row.id}`,
          persona: tasteRow.persona || "Penjelajah Musik Indonesia & Global",
          artistWeights: tasteRow.artist_weights || {},
          genreWeights: tasteRow.genre_weights || {},
          playCounts: tasteRow.play_counts || {},
          likedArtists: tasteRow.liked_artists || [],
          totalPlays: tasteRow.total_plays || 0
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

    const likedSongs = Array.isArray(row.user_likes) ? row.user_likes.map((l: any) => l.song_id) : [];
    const playlists = Array.isArray(row.user_playlists) ? row.user_playlists : [];

    let history: UserActivity[] = [];
    try {
      const actRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_activity?user_id=eq.${encodeURIComponent(row.id)}&order=created_at.desc&limit=60`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (actRes.ok) {
        const actRows = await actRes.json();
        if (Array.isArray(actRows)) {
          history = actRows.map((a: any) => ({
            id: a.id || `act_${a.created_at}`,
            songId: a.song_id || a.title,
            title: a.title,
            artist: a.artist,
            genre: a.genre || undefined,
            action: a.action,
            timestamp: new Date(a.created_at).getTime(),
            duration: a.duration,
            listenSeconds: a.listen_seconds
          }));
        }
      }
    } catch (e) {}

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      salt: row.salt,
      avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.email)}`,
      createdAt: new Date(row.created_at).getTime(),
      onboardingCompleted: Boolean(row.onboarding_completed),
      selectedGenres: row.selected_genres || [],
      selectedArtists: row.selected_artists || [],
      taste,
      likedSongs,
      playlists,
      history
    };
  } catch (err) {
    console.error("Supabase getUserByEmail error:", err);
    return null;
  }
};

// 2. Get user by ID from Supabase
export const supabaseGetUserById = async (id: string): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}&select=*,user_taste(*),user_likes(song_id),user_playlists(*)`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    const tasteRow = Array.isArray(row.user_taste) && row.user_taste.length > 0 ? row.user_taste[0] : null;
    const taste: TasteProfile = tasteRow
      ? {
          userSeed: `brnsic-${row.id}`,
          persona: tasteRow.persona || "Penjelajah Musik Indonesia & Global",
          artistWeights: tasteRow.artist_weights || {},
          genreWeights: tasteRow.genre_weights || {},
          playCounts: tasteRow.play_counts || {},
          likedArtists: tasteRow.liked_artists || [],
          totalPlays: tasteRow.total_plays || 0
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

    const likedSongs = Array.isArray(row.user_likes) ? row.user_likes.map((l: any) => l.song_id) : [];
    const playlists = Array.isArray(row.user_playlists) ? row.user_playlists : [];

    let history: UserActivity[] = [];
    try {
      const actRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_activity?user_id=eq.${encodeURIComponent(row.id)}&order=created_at.desc&limit=60`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (actRes.ok) {
        const actRows = await actRes.json();
        if (Array.isArray(actRows)) {
          history = actRows.map((a: any) => ({
            id: a.id || `act_${a.created_at}`,
            songId: a.song_id || a.title,
            title: a.title,
            artist: a.artist,
            genre: a.genre || undefined,
            action: a.action,
            timestamp: new Date(a.created_at).getTime(),
            duration: a.duration,
            listenSeconds: a.listen_seconds
          }));
        }
      }
    } catch (e) {}

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      salt: row.salt,
      avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.email)}`,
      createdAt: new Date(row.created_at).getTime(),
      onboardingCompleted: Boolean(row.onboarding_completed),
      selectedGenres: row.selected_genres || [],
      selectedArtists: row.selected_artists || [],
      taste,
      likedSongs,
      playlists,
      history
    };
  } catch (err) {
    console.error("Supabase getUserById error:", err);
    return null;
  }
};

// 3. Create user in Supabase
export const supabaseCreateUser = async (user: User): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      password_hash: user.passwordHash,
      salt: user.salt,
      avatar: user.avatar,
      onboarding_completed: user.onboardingCompleted,
      selected_genres: user.selectedGenres || [],
      selected_artists: user.selectedArtists || []
    };

    const resUser = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: getHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(userPayload)
    });

    if (!resUser.ok) {
      console.error("Supabase create user failed:", await resUser.text());
      return false;
    }

    // Insert initial taste
    if (user.taste) {
      await fetch(`${SUPABASE_URL}/rest/v1/user_taste`, {
        method: "POST",
        headers: getHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          user_id: user.id,
          persona: user.taste.persona,
          artist_weights: user.taste.artistWeights || {},
          genre_weights: user.taste.genreWeights || {},
          play_counts: user.taste.playCounts || {},
          liked_artists: user.taste.likedArtists || [],
          total_plays: user.taste.totalPlays || 0
        })
      });
    }

    return true;
  } catch (err) {
    console.error("Supabase createUser error:", err);
    return false;
  }
};

// 4. Update user in Supabase
export const supabaseUpdateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatar) dbUpdates.avatar = updates.avatar;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.selectedGenres) dbUpdates.selected_genres = updates.selectedGenres;
    if (updates.selectedArtists) dbUpdates.selected_artists = updates.selectedArtists;

    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: getHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(dbUpdates)
    });

    // Update taste if included
    if (updates.taste) {
      await fetch(`${SUPABASE_URL}/rest/v1/user_taste`, {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({
          user_id: id,
          persona: updates.taste.persona,
          artist_weights: updates.taste.artistWeights || {},
          genre_weights: updates.taste.genreWeights || {},
          play_counts: updates.taste.playCounts || {},
          liked_artists: updates.taste.likedArtists || [],
          total_plays: updates.taste.totalPlays || 0,
          updated_at: new Date().toISOString()
        })
      });
    }

    // Update likes if included
    if (updates.likedSongs) {
      // Re-sync likes
      await fetch(`${SUPABASE_URL}/rest/v1/user_likes?user_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (updates.likedSongs.length > 0) {
        const rows = updates.likedSongs.map((songId) => ({
          user_id: id,
          song_id: songId
        }));
        await fetch(`${SUPABASE_URL}/rest/v1/user_likes`, {
          method: "POST",
          headers: getHeaders({ Prefer: "return=minimal" }),
          body: JSON.stringify(rows)
        });
      }
    }

    // Update playlists if included
    if (Array.isArray(updates.playlists)) {
      await fetch(`${SUPABASE_URL}/rest/v1/user_playlists?user_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (updates.playlists.length > 0) {
        const rows = updates.playlists.map((p) => ({
          id: p.id || `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          user_id: id,
          name: p.name,
          cover: p.cover || null,
          songs: Array.isArray(p.songs) ? p.songs : []
        }));
        await fetch(`${SUPABASE_URL}/rest/v1/user_playlists`, {
          method: "POST",
          headers: getHeaders({ Prefer: "return=minimal" }),
          body: JSON.stringify(rows)
        });
      }
    }

    return true;
  } catch (err) {
    console.error("Supabase updateUser error:", err);
    return false;
  }
};

// 5. Log interaction activity in Supabase
export const supabaseLogActivity = async (userId: string, activity: UserActivity): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: activity.id,
      user_id: userId,
      song_id: activity.songId,
      title: activity.title,
      artist: activity.artist,
      genre: activity.genre || null,
      action: activity.action,
      duration: activity.duration || 0,
      listen_seconds: activity.listenSeconds || 0,
      created_at: new Date(activity.timestamp).toISOString()
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_activity`, {
      method: "POST",
      headers: getHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.error("Supabase log activity error:", err);
    return false;
  }
};
