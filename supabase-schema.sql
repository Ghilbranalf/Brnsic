-- ====================================================================
-- BRNSIC MUSIC PLAYER • SUPABASE POSTGRESQL SCHEMA
-- Jalankan skrip SQL ini di: Supabase Studio -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Tabel Pengguna (Users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  avatar TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  selected_genres TEXT[] DEFAULT '{}',
  selected_artists TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Profil Selera Musik Pengguna (Taste Profile)
CREATE TABLE IF NOT EXISTS user_taste (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  persona TEXT DEFAULT 'Penjelajah Musik Indonesia & Global',
  artist_weights JSONB DEFAULT '{}'::jsonb,
  genre_weights JSONB DEFAULT '{}'::jsonb,
  play_counts JSONB DEFAULT '{}'::jsonb,
  liked_artists TEXT[] DEFAULT '{}',
  total_plays INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Riwayat Interaksi & Pembelajaran (Activity Log)
-- Menyimpan waktu kejadian, lagu, aksi (play, complete, replay, like, skip, playlist), durasi didengar
CREATE TABLE IF NOT EXISTS user_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  action TEXT NOT NULL, -- 'play', 'complete', 'replay', 'like', 'skip', 'playlist'
  duration INTEGER DEFAULT 0,
  listen_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Lagu Favorit (Likes)
CREATE TABLE IF NOT EXISTS user_likes (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- 5. Tabel Playlist Pribadi Pengguna
CREATE TABLE IF NOT EXISTS user_playlists (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT 'Playlist Pribadi',
  songs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa pencarian kilat
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON user_playlists(user_id);

-- Disable Row Level Security (RLS) untuk kemudahan integrasi API backend Brnsic
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_taste DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlists DISABLE ROW LEVEL SECURITY;
