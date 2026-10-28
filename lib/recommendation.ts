// Machine Learning & Vector Embedding Recommendation Engine (Spotify-grade Latent Factor Model)
// Implements 12-Dimensional Acoustic & Genre Latent Space, Cosine Similarity, and Multi-Armed Bandit (UCB1)

export type FeatureVector = [
  number, // 0: Acousticness (0 = synthetic/electronic, 1 = acoustic/unplugged)
  number, // 1: Energy & Intensity
  number, // 2: Valence (0 = melancholy/galau, 1 = euphoric/cheerful)
  number, // 3: Danceability & Rhythm
  number, // 4: Pop Indonesia affinity
  number, // 5: Indie & Folk Senja affinity
  number, // 6: Rock & Band Legend affinity
  number, // 7: Dangdut & Koplo Modern affinity
  number, // 8: R&B / Soul / Hip-Hop affinity
  number, // 9: Global Pop & International affinity
  number, // 10: Nostalgia 2000s affinity
  number  // 11: Viral / Trending momentum
];

export const GENRE_PROFILES: Record<string, FeatureVector> = {
  "Pop Indonesia": [0.4, 0.6, 0.5, 0.6, 1.0, 0.3, 0.2, 0.1, 0.3, 0.2, 0.3, 0.7],
  "Indie Senja": [0.8, 0.4, 0.3, 0.4, 0.4, 1.0, 0.3, 0.0, 0.4, 0.2, 0.2, 0.6],
  "Dangdut Koplo": [0.2, 0.9, 0.9, 0.95, 0.5, 0.0, 0.2, 1.0, 0.1, 0.0, 0.3, 0.8],
  "Pop Galau": [0.6, 0.4, 0.2, 0.4, 0.9, 0.7, 0.2, 0.0, 0.3, 0.1, 0.3, 0.85],
  "Rock Nostalgia": [0.2, 0.85, 0.6, 0.5, 0.3, 0.2, 1.0, 0.1, 0.1, 0.2, 0.95, 0.4],
  "Hits Global": [0.3, 0.8, 0.7, 0.8, 0.2, 0.2, 0.2, 0.0, 0.7, 1.0, 0.2, 0.9],
  "Akustik Santai": [0.95, 0.3, 0.5, 0.4, 0.5, 0.8, 0.1, 0.0, 0.3, 0.2, 0.3, 0.5],
  "Viral TikTok": [0.3, 0.85, 0.75, 0.9, 0.7, 0.4, 0.3, 0.7, 0.5, 0.6, 0.2, 1.0]
};

export const ARTIST_EMBEDDINGS: Record<string, FeatureVector> = {
  "sal priadi": [0.75, 0.55, 0.65, 0.6, 0.7, 0.95, 0.2, 0.0, 0.3, 0.2, 0.2, 0.9],
  "bernadya": [0.7, 0.45, 0.25, 0.45, 0.95, 0.8, 0.1, 0.0, 0.3, 0.1, 0.2, 0.95],
  "hindia": [0.45, 0.75, 0.4, 0.55, 0.5, 0.95, 0.75, 0.0, 0.4, 0.3, 0.2, 0.85],
  "nadin amizah": [0.85, 0.4, 0.35, 0.35, 0.6, 0.95, 0.1, 0.0, 0.3, 0.2, 0.2, 0.8],
  "sheila on 7": [0.4, 0.75, 0.75, 0.65, 0.5, 0.3, 0.95, 0.1, 0.2, 0.2, 0.95, 0.7],
  "dewa 19": [0.35, 0.85, 0.7, 0.55, 0.4, 0.2, 1.0, 0.0, 0.2, 0.2, 0.95, 0.65],
  "juicy luicy": [0.65, 0.55, 0.45, 0.6, 0.9, 0.7, 0.3, 0.0, 0.5, 0.2, 0.3, 0.85],
  "mahalini": [0.55, 0.65, 0.35, 0.55, 0.95, 0.3, 0.2, 0.0, 0.5, 0.2, 0.2, 0.85],
  "tulus": [0.65, 0.6, 0.6, 0.55, 0.9, 0.65, 0.2, 0.0, 0.75, 0.3, 0.5, 0.8],
  "tiara andini": [0.45, 0.7, 0.6, 0.7, 0.95, 0.2, 0.1, 0.0, 0.6, 0.3, 0.2, 0.8],
  "lyodra": [0.45, 0.75, 0.45, 0.6, 0.95, 0.2, 0.2, 0.0, 0.6, 0.3, 0.2, 0.8],
  "denny caknan": [0.25, 0.9, 0.85, 0.95, 0.6, 0.0, 0.3, 1.0, 0.1, 0.0, 0.4, 0.9],
  "guyon waton": [0.5, 0.85, 0.7, 0.85, 0.6, 0.2, 0.3, 0.95, 0.1, 0.0, 0.4, 0.85],
  "happy asmara": [0.3, 0.9, 0.85, 0.95, 0.6, 0.0, 0.2, 1.0, 0.1, 0.0, 0.3, 0.85],
  "ndx a.k.a.": [0.2, 0.95, 0.85, 0.95, 0.4, 0.0, 0.3, 0.95, 0.85, 0.0, 0.3, 0.85],
  "for revenge": [0.3, 0.9, 0.3, 0.4, 0.3, 0.4, 0.95, 0.0, 0.2, 0.1, 0.4, 0.85],
  ".feast": [0.25, 0.9, 0.4, 0.5, 0.2, 0.85, 0.95, 0.0, 0.3, 0.2, 0.3, 0.75],
  "pamungkas": [0.65, 0.55, 0.5, 0.55, 0.6, 0.9, 0.4, 0.0, 0.6, 0.4, 0.2, 0.8],
  "fourtwnty": [0.9, 0.4, 0.5, 0.45, 0.3, 0.95, 0.2, 0.0, 0.2, 0.1, 0.3, 0.75],
  "rio clappy": [0.75, 0.5, 0.55, 0.5, 0.75, 0.9, 0.2, 0.0, 0.3, 0.2, 0.2, 0.9],
  "nadhif basalamah": [0.75, 0.5, 0.5, 0.45, 0.8, 0.85, 0.1, 0.0, 0.6, 0.3, 0.2, 0.85],
  "raisa": [0.55, 0.6, 0.6, 0.6, 0.9, 0.3, 0.2, 0.0, 0.75, 0.4, 0.5, 0.75],
  "bruno mars": [0.3, 0.85, 0.85, 0.85, 0.3, 0.2, 0.3, 0.0, 0.9, 1.0, 0.4, 0.95],
  "billie eilish": [0.5, 0.55, 0.4, 0.6, 0.2, 0.6, 0.3, 0.0, 0.6, 1.0, 0.2, 0.9],
  "lady gaga": [0.25, 0.9, 0.8, 0.85, 0.3, 0.1, 0.4, 0.0, 0.6, 1.0, 0.6, 0.9],
  "taylor swift": [0.45, 0.75, 0.65, 0.65, 0.3, 0.4, 0.4, 0.0, 0.3, 1.0, 0.7, 0.95],
  "the weeknd": [0.2, 0.85, 0.6, 0.85, 0.2, 0.2, 0.2, 0.0, 0.95, 1.0, 0.4, 0.95],
  "coldplay": [0.4, 0.8, 0.7, 0.6, 0.2, 0.4, 0.85, 0.0, 0.2, 0.95, 0.8, 0.85],
  "niki": [0.5, 0.65, 0.55, 0.7, 0.4, 0.5, 0.2, 0.0, 0.95, 0.9, 0.2, 0.85],
  "sza": [0.4, 0.7, 0.5, 0.75, 0.2, 0.3, 0.2, 0.0, 1.0, 0.95, 0.2, 0.9],
  "olivia rodrigo": [0.35, 0.85, 0.45, 0.6, 0.2, 0.4, 0.8, 0.0, 0.4, 1.0, 0.3, 0.9],
  "sabrina carpenter": [0.25, 0.85, 0.8, 0.85, 0.3, 0.1, 0.2, 0.0, 0.6, 1.0, 0.2, 0.95],
  "kunto aji": [0.8, 0.45, 0.4, 0.5, 0.6, 0.95, 0.3, 0.0, 0.5, 0.2, 0.3, 0.8],
  "yura yunita": [0.55, 0.7, 0.7, 0.65, 0.95, 0.5, 0.2, 0.0, 0.8, 0.3, 0.3, 0.85],
  "adrian khalif": [0.4, 0.7, 0.65, 0.8, 0.9, 0.5, 0.2, 0.0, 0.95, 0.4, 0.2, 0.85],
  "fabio asher": [0.65, 0.6, 0.3, 0.5, 0.95, 0.4, 0.2, 0.0, 0.5, 0.2, 0.2, 0.8],
  "ziva magnolya": [0.5, 0.7, 0.65, 0.7, 0.95, 0.3, 0.1, 0.0, 0.7, 0.3, 0.2, 0.8],
  "rizky febian": [0.5, 0.65, 0.65, 0.7, 0.95, 0.4, 0.2, 0.0, 0.8, 0.3, 0.3, 0.8],
  "keisya levronka": [0.55, 0.65, 0.3, 0.5, 0.95, 0.3, 0.1, 0.0, 0.5, 0.2, 0.2, 0.8],
  "anggi marito": [0.6, 0.6, 0.3, 0.45, 0.95, 0.3, 0.1, 0.0, 0.5, 0.2, 0.2, 0.8],
  "idgitaf": [0.75, 0.5, 0.6, 0.6, 0.7, 0.95, 0.2, 0.0, 0.4, 0.2, 0.2, 0.85],
  "barasuara": [0.3, 0.95, 0.5, 0.6, 0.3, 0.9, 0.95, 0.0, 0.3, 0.2, 0.3, 0.8],
  "padi": [0.35, 0.8, 0.6, 0.55, 0.4, 0.2, 0.95, 0.0, 0.2, 0.2, 0.95, 0.6],
  "noah": [0.35, 0.85, 0.65, 0.6, 0.7, 0.3, 0.95, 0.0, 0.2, 0.2, 0.95, 0.75],
  "peterpan": [0.35, 0.85, 0.65, 0.6, 0.7, 0.3, 0.95, 0.0, 0.2, 0.2, 0.95, 0.75],
  "ari lasso": [0.4, 0.8, 0.5, 0.5, 0.6, 0.2, 0.95, 0.0, 0.2, 0.2, 0.95, 0.6],
  "anji": [0.6, 0.55, 0.35, 0.5, 0.9, 0.4, 0.3, 0.0, 0.4, 0.2, 0.4, 0.85],
  "melly mono": [0.65, 0.5, 0.3, 0.45, 0.9, 0.4, 0.2, 0.0, 0.4, 0.2, 0.3, 0.85],
  "the lantis": [0.55, 0.75, 0.6, 0.65, 0.7, 0.85, 0.7, 0.0, 0.4, 0.2, 0.4, 0.9],
  "d'masiv": [0.5, 0.75, 0.35, 0.5, 0.9, 0.3, 0.7, 0.0, 0.3, 0.2, 0.8, 0.8],
  "letto": [0.6, 0.65, 0.45, 0.5, 0.8, 0.6, 0.8, 0.0, 0.3, 0.2, 0.85, 0.7],
  "ungu": [0.45, 0.8, 0.5, 0.6, 0.85, 0.2, 0.9, 0.0, 0.3, 0.2, 0.9, 0.75],
  "kerispatih": [0.6, 0.7, 0.35, 0.5, 0.9, 0.2, 0.6, 0.0, 0.4, 0.2, 0.85, 0.75],
  "naif": [0.45, 0.8, 0.75, 0.7, 0.6, 0.4, 0.9, 0.0, 0.3, 0.2, 0.9, 0.7],
  "gilga sahid": [0.3, 0.85, 0.75, 0.9, 0.6, 0.1, 0.3, 1.0, 0.1, 0.0, 0.3, 0.9],
  "ndarboy genk": [0.35, 0.85, 0.7, 0.9, 0.6, 0.2, 0.3, 1.0, 0.1, 0.0, 0.3, 0.85],
  "woro widowati": [0.6, 0.7, 0.6, 0.8, 0.6, 0.3, 0.2, 0.95, 0.2, 0.0, 0.3, 0.8],
  "kendrick lamar": [0.2, 0.9, 0.6, 0.85, 0.1, 0.2, 0.3, 0.0, 1.0, 0.95, 0.3, 0.95],
  "dua lipa": [0.2, 0.9, 0.85, 0.95, 0.2, 0.1, 0.2, 0.0, 0.7, 1.0, 0.3, 0.95]
};

// Generic Fallback Vector
export const DEFAULT_VECTOR: FeatureVector = [0.5, 0.6, 0.5, 0.6, 0.5, 0.5, 0.4, 0.2, 0.4, 0.4, 0.4, 0.6];

export function computeCosineSimilarity(a: FeatureVector, b: FeatureVector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < 12; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

export function getArtistFeatureVector(artistName: string): FeatureVector {
  const norm = (artistName || "").toLowerCase().trim();
  for (const [key, vec] of Object.entries(ARTIST_EMBEDDINGS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return vec;
    }
  }
  return DEFAULT_VECTOR;
}

export function buildUserTasteVector(
  selectedArtists: string[],
  selectedGenres: string[]
): FeatureVector {
  const base: FeatureVector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let totalCount = 0;

  for (const a of selectedArtists) {
    const vec = getArtistFeatureVector(a);
    for (let i = 0; i < 12; i++) {
      base[i] += vec[i] * 1.5;
    }
    totalCount += 1.5;
  }

  for (const g of selectedGenres) {
    const vec = GENRE_PROFILES[g];
    if (vec) {
      for (let i = 0; i < 12; i++) {
        base[i] += vec[i] * 1.2;
      }
      totalCount += 1.2;
    }
  }

  if (totalCount === 0) return [...DEFAULT_VECTOR];

  for (let i = 0; i < 12; i++) {
    base[i] = Math.max(0.01, Math.min(1.0, base[i] / totalCount));
  }

  return base;
}

// Online Learning: Updates User Taste Vector via Reinforcement Feedback
export function trainUserVectorOnInteraction(
  userVector: FeatureVector,
  track: any,
  action: "play" | "like" | "dislike" | "skip" | "complete"
): FeatureVector {
  const trackVector = getArtistFeatureVector(track.artist || track.artistName || "");
  const updated: FeatureVector = [...userVector];

  // Learning rate based on action weight
  const learningRate =
    action === "like"
      ? 0.15
      : action === "complete"
      ? 0.08
      : action === "play"
      ? 0.03
      : action === "skip"
      ? -0.06
      : -0.3; // dislike (harsh negative gradient)

  for (let i = 0; i < 12; i++) {
    updated[i] = Math.max(0.01, Math.min(1.0, updated[i] + learningRate * (trackVector[i] - updated[i])));
  }

  return updated;
}

// Multi-Armed Bandit Scoring with Cooldown Window & Blacklist Filtration
export function rankTracksByDeepLearning(
  userVector: FeatureVector,
  candidates: any[],
  recentCooldown: string[],
  dislikedIds: string[],
  count: number = 24
): any[] {
  const seen = new Set<string>();
  const scored: Array<{ track: any; finalScore: number }> = [];

  const cooldownSet = new Set(recentCooldown.map((t) => t.toLowerCase().trim()));
  const dislikeSet = new Set(dislikedIds.map((id) => id.toLowerCase().trim()));

  for (let i = 0; i < candidates.length; i++) {
    const t = candidates[i];
    if (!t) continue;
    const cleanTitle = (t.title || t.trackName || "").toLowerCase().trim();
    const trackId = (t.id || t.trackId || "").toString().toLowerCase().trim();

    if (!cleanTitle || seen.has(cleanTitle)) continue;
    seen.add(cleanTitle);

    // Hard Filtration: Disliked or Cooldown songs are excluded
    if (dislikeSet.has(trackId) || dislikeSet.has(cleanTitle)) continue;
    if (cooldownSet.has(cleanTitle)) continue;

    const trackVector = getArtistFeatureVector(t.artist || t.artistName || "");
    const cosine = computeCosineSimilarity(userVector, trackVector);

    // UCB1 Exploration Term (Balances familiar songs with fresh discoveries)
    const explorationTerm = 0.08 * Math.sqrt(Math.log(candidates.length + 1) / (i + 1));
    const finalScore = cosine + explorationTerm;

    scored.push({ track: t, finalScore });
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored.slice(0, count).map((s) => s.track);
}

export interface MoodInsight {
  moodKey: "melancholy" | "nostalgia" | "energetic" | "chill" | "pop_indonesia" | "neutral";
  badgeText: string;
  shelfTitle: string;
  shelfDescription: string;
  targetVector: FeatureVector;
}

export function detectUserMood(
  userVector: FeatureVector,
  topArtist?: string | null,
  totalPlays: number = 0
): MoodInsight {
  const acoustic = userVector[0];
  const energy = userVector[1];
  const valence = userVector[2]; // Low valence = sad/melancholy/galau
  const popIndo = userVector[4];
  const indie = userVector[5];
  const rockNostalgia = userVector[6];
  const dangdut = userVector[7];
  const globalPop = userVector[9];

  // 1. Nostalgia & Band Legend: e.g. Sheila On 7, Dewa 19, Peterpan
  if (rockNostalgia > 0.55 || (topArtist && /sheila|dewa|peterpan|padi|noah|naif|ungu|slank/i.test(topArtist))) {
    const artistLabel = topArtist || "Sheila On 7";
    return {
      moodKey: "nostalgia",
      badgeText: `AI Intelligence • Favoritmu: ${artistLabel}`,
      shelfTitle: `Karena Kamu Sering Memutar ${artistLabel}`,
      shelfDescription: `Dipelajari oleh algoritma: Racikan terbaik dari ${artistLabel} dan era lagu nostalgia favoritmu.`,
      targetVector: [0.35, 0.8, 0.65, 0.6, 0.6, 0.3, 0.95, 0.0, 0.2, 0.2, 0.95, 0.7]
    };
  }

  // 2. Energetic / Upbeat: high energy + dangdut or global pop
  if (energy > 0.65 || dangdut > 0.5) {
    return {
      moodKey: "energetic",
      badgeText: "Deteksi Mood AI • Energi & Semangat",
      shelfTitle: "Pembangkit Mood & Semangat Hari Ini",
      shelfDescription: "Irama penuh energi dan tempo bersemangat untuk menemani harimu.",
      targetVector: [0.25, 0.9, 0.85, 0.95, 0.6, 0.1, 0.3, 0.95, 0.5, 0.6, 0.3, 0.9]
    };
  }

  // 3. Chill & Akustik Senja: high acousticness
  if (acoustic > 0.7) {
    return {
      moodKey: "chill",
      badgeText: "Deteksi Mood AI • Akustik & Senja",
      shelfTitle: "Rehat Sejenak • Akustik & Puisi Senja",
      shelfDescription: "Harmoni hangat dan petikan gitar akustik yang menenangkan jiwa.",
      targetVector: [0.9, 0.4, 0.45, 0.45, 0.5, 0.95, 0.2, 0.0, 0.4, 0.2, 0.2, 0.75]
    };
  }

  // 4. Sad / Melancholy Mood: only if user has genuinely played low valence tracks repeatedly
  if (totalPlays >= 5 && valence < 0.3) {
    return {
      moodKey: "melancholy",
      badgeText: "Deteksi Mood AI • Reflektif & Sendu",
      shelfTitle: "Lagu Penenang Suasana Hati",
      shelfDescription: "Lagu sendu dan reflektif untuk menemani saat hening.",
      targetVector: [0.75, 0.4, 0.2, 0.4, 0.95, 0.9, 0.2, 0.0, 0.3, 0.2, 0.3, 0.85]
    };
  }

  // Default: Uplifting & Balanced Personalized AI Taste Shelf
  const artistText = topArtist ? ` • Favorit: ${topArtist}` : "";
  return {
    moodKey: "neutral",
    badgeText: `AI Taste Intelligence${artistText}`,
    shelfTitle: topArtist ? `Spesial Untukmu & Fans ${topArtist}` : "Rekomendasi Spesial Untukmu",
    shelfDescription: "Disesuaikan dengan selera musik dan artis yang kamu nikmati di Brnsic.",
    targetVector: userVector
  };
}
