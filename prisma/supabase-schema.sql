-- ====================================================================
-- BRNSIC MUSIC STREAMING - POSTGRESQL SCHEMA (SUPABASE / PRISMA ORM)
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  salt TEXT,
  avatar TEXT,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  selected_genres TEXT[] DEFAULT '{}'::text[],
  selected_artists TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. User Taste & Vector Persona
CREATE TABLE IF NOT EXISTS public.user_taste (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_seed TEXT DEFAULT '' NOT NULL,
  persona TEXT DEFAULT 'Penjelajah Musik Indonesia & Global' NOT NULL,
  artist_weights JSONB DEFAULT '{}'::jsonb NOT NULL,
  genre_weights JSONB DEFAULT '{}'::jsonb NOT NULL,
  play_counts JSONB DEFAULT '{}'::jsonb NOT NULL,
  liked_artists TEXT[] DEFAULT '{}'::text[],
  total_plays INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Liked Songs Table
CREATE TABLE IF NOT EXISTS public.user_likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_likes UNIQUE (user_id, song_id)
);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON public.user_likes(user_id);

-- 4. User Playlists Table
CREATE TABLE IF NOT EXISTS public.user_playlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover TEXT,
  songs JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON public.user_playlists(user_id);

-- 5. User Activity & Listening History
CREATE TABLE IF NOT EXISTS public.user_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  action TEXT NOT NULL,
  duration INTEGER,
  listen_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);
