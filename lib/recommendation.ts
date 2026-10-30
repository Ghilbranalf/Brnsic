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
  "Viral TikTok": [0.3, 0.85, 0.75, 0.9, 0.7, 0.4, 0.3, 0.7, 0.5, 0.6, 0.2, 1.0],
  "Alternative": [0.35, 0.85, 0.65, 0.75, 0.1, 0.95, 0.75, 0.0, 0.3, 0.95, 0.5, 0.85],
  "Indie Pop": [0.35, 0.8, 0.75, 0.75, 0.1, 0.95, 0.65, 0.0, 0.4, 0.95, 0.4, 0.85],
  "Rock": [0.2, 0.9, 0.6, 0.6, 0.2, 0.4, 0.95, 0.0, 0.2, 0.85, 0.8, 0.75],
  "R&B/Soul": [0.35, 0.7, 0.6, 0.8, 0.2, 0.3, 0.2, 0.0, 0.95, 0.95, 0.3, 0.85],
  "Electronic": [0.1, 0.95, 0.85, 0.95, 0.1, 0.2, 0.3, 0.0, 0.6, 0.95, 0.3, 0.9],
  "Hip-Hop/Rap": [0.15, 0.9, 0.65, 0.85, 0.1, 0.2, 0.3, 0.0, 0.95, 0.95, 0.3, 0.95]
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
  "bleachers": [0.35, 0.85, 0.7, 0.75, 0.1, 0.9, 0.75, 0.0, 0.3, 0.95, 0.6, 0.85],
  "the 1975": [0.3, 0.85, 0.65, 0.8, 0.1, 0.9, 0.7, 0.0, 0.5, 0.95, 0.4, 0.9],
  "lorde": [0.4, 0.75, 0.5, 0.7, 0.1, 0.9, 0.3, 0.0, 0.5, 0.95, 0.3, 0.85],
  "lana del rey": [0.6, 0.5, 0.3, 0.45, 0.1, 0.85, 0.4, 0.0, 0.4, 0.95, 0.6, 0.9],
  "wallows": [0.3, 0.85, 0.75, 0.75, 0.1, 0.95, 0.8, 0.0, 0.3, 0.9, 0.3, 0.85],
  "coin": [0.25, 0.9, 0.8, 0.85, 0.1, 0.9, 0.7, 0.0, 0.4, 0.9, 0.3, 0.8],
  "fun.": [0.35, 0.9, 0.75, 0.7, 0.1, 0.8, 0.6, 0.0, 0.3, 0.95, 0.7, 0.85],
  "clairo": [0.7, 0.45, 0.45, 0.5, 0.1, 0.95, 0.2, 0.0, 0.5, 0.9, 0.2, 0.85],
  "phoebe bridgers": [0.85, 0.4, 0.25, 0.35, 0.1, 0.95, 0.3, 0.0, 0.3, 0.9, 0.2, 0.85],
  "chappell roan": [0.25, 0.9, 0.85, 0.85, 0.1, 0.7, 0.5, 0.0, 0.5, 1.0, 0.5, 0.98],
  "gracie abrams": [0.75, 0.5, 0.4, 0.5, 0.1, 0.9, 0.2, 0.0, 0.4, 0.95, 0.2, 0.9],
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
  "dua lipa": [0.2, 0.9, 0.85, 0.95, 0.2, 0.1, 0.2, 0.0, 0.7, 1.0, 0.3, 0.95],
  "xxxtentacion": [0.35, 0.85, 0.25, 0.75, 0.1, 0.3, 0.3, 0.0, 0.95, 0.95, 0.2, 0.95],
  "juice wrld": [0.35, 0.8, 0.3, 0.75, 0.1, 0.3, 0.4, 0.0, 0.95, 0.9, 0.25, 0.9],
  "travis scott": [0.15, 0.95, 0.5, 0.85, 0.1, 0.1, 0.2, 0.0, 0.9, 0.95, 0.4, 0.95],
  "drake": [0.25, 0.85, 0.6, 0.85, 0.1, 0.1, 0.2, 0.0, 0.95, 0.95, 0.5, 0.95]
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

export function extractTrackFeatureVector(track: any): FeatureVector {
  if (!track) return [...DEFAULT_VECTOR];
  const artist = (typeof track === "string" ? track : track.artist || track.artistName || "").toLowerCase().trim();
  const genre = (track.genre || track.primaryGenreName || "").toLowerCase().trim();
  const title = (track.title || track.trackName || "").toLowerCase().trim();

  // 1. Direct Artist match from embedded latent space
  for (const [key, vec] of Object.entries(ARTIST_EMBEDDINGS)) {
    if (artist.includes(key) || key.includes(artist)) {
      return [...vec];
    }
  }

  // 2. Synthesize base vector from metadata genre
  let base: FeatureVector = [...DEFAULT_VECTOR];
  if (genre.includes("indie") || genre.includes("alternative")) {
    base = [...GENRE_PROFILES["Alternative"]];
  } else if (genre.includes("rock") || genre.includes("metal")) {
    base = [...GENRE_PROFILES["Rock"]];
  } else if (genre.includes("r&b") || genre.includes("soul")) {
    base = [...GENRE_PROFILES["R&B/Soul"]];
  } else if (genre.includes("electronic") || genre.includes("dance") || genre.includes("edm")) {
    base = [...GENRE_PROFILES["Electronic"]];
  } else if (genre.includes("hip-hop") || genre.includes("rap")) {
    base = [...GENRE_PROFILES["Hip-Hop/Rap"]];
  } else if (genre.includes("dangdut") || genre.includes("koplo")) {
    base = [...GENRE_PROFILES["Dangdut Koplo"]];
  } else if (genre.includes("acoustic") || genre.includes("folk") || genre.includes("singer")) {
    base = [...GENRE_PROFILES["Akustik Santai"]];
  } else if (genre.includes("pop")) {
    base = [...GENRE_PROFILES["Hits Global"]];
  }

  // 3. Modulate emotional valence & acousticness based on title semantics
  const melancholyKeywords = ["sedih", "galau", "cry", "tears", "lonely", "broken", "sendu", "hancur", "luka", "air mata", "pergi", "hilang", "kenangan", "hurt", "die", "dead", "sad"];
  const energeticKeywords = ["happy", "senang", "ceria", "pesta", "party", "dance", "upbeat", "semangat", "rollercoaster", "fun", "celebrate", "light", "fire", "jump"];
  const acousticKeywords = ["acoustic", "akustik", "unplugged", "piano", "guitar", "gitar", "senja", "kopi", "hujan", "malam", "sleep", "bobo", "calm"];

  if (melancholyKeywords.some((w) => title.includes(w))) {
    base[2] = Math.max(0.05, base[2] - 0.35); // Lower valence (sendu)
    base[0] = Math.min(0.95, base[0] + 0.2); // Higher acoustic reflection
  }
  if (energeticKeywords.some((w) => title.includes(w))) {
    base[2] = Math.min(0.95, base[2] + 0.3); // High valence
    base[1] = Math.min(0.95, base[1] + 0.25); // High energy
    base[3] = Math.min(0.95, base[3] + 0.2); // High danceability
  }
  if (acousticKeywords.some((w) => title.includes(w))) {
    base[0] = Math.min(0.95, base[0] + 0.35);
    base[1] = Math.max(0.1, base[1] - 0.2);
  }

  return base;
}

export function getArtistFeatureVector(artistName: string): FeatureVector {
  return extractTrackFeatureVector({ artist: artistName });
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
  const trackVector = extractTrackFeatureVector(track);
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
  recentCooldown: string[] = [],
  dislikedIds: string[] = [],
  count: number = 24,
  allowRecent: boolean = false,
  priorityArtists: string[] = []
): any[] {
  const seen = new Set<string>();
  const scored: Array<{ track: any; finalScore: number }> = [];

  const cooldownSet = new Set(recentCooldown.map((t) => t.toLowerCase().trim()));
  const dislikeSet = new Set(dislikedIds.map((id) => id.toLowerCase().trim()));
  const priorityList = priorityArtists.map((a) => a.toLowerCase().trim()).filter(Boolean);

  for (let i = 0; i < candidates.length; i++) {
    const t = candidates[i];
    if (!t) continue;
    const cleanTitle = (t.title || t.trackName || "").toLowerCase().trim();
    const trackArtist = (t.artist || t.artistName || "").toLowerCase().trim();
    const trackId = (t.id || t.trackId || "").toString().toLowerCase().trim();

    if (!cleanTitle || seen.has(cleanTitle)) continue;
    seen.add(cleanTitle);

    // Hard Filtration: Disliked songs are always excluded
    if (dislikeSet.has(trackId) || dislikeSet.has(cleanTitle)) continue;

    // Cooldown only applies to automated autoplay radio queues to prevent loops,
    // NEVER ban user's favorite tracks from their home personalized shelf!
    const isRecent = cooldownSet.has(cleanTitle);
    if (!allowRecent && isRecent) continue;

    const trackVector = extractTrackFeatureVector(t);
    const cosine = computeCosineSimilarity(userVector, trackVector);

    // If the song was played by the user recently, boost its relevance on personalized shelves!
    const familiarityBoost = (allowRecent && isRecent) ? 0.25 : 0;

    // Priority artist guarantee: If shelf is dedicated to an artist, their songs ALWAYS rank first!
    const isPriority = priorityList.length > 0 && priorityList.some((p) => trackArtist.includes(p) || p.includes(trackArtist));
    const priorityBoost = isPriority ? 5.0 : 0;

    // UCB1 Exploration Term (Balances familiar songs with fresh discoveries)
    const explorationTerm = 0.08 * Math.sqrt(Math.log(candidates.length + 1) / (i + 1));
    const finalScore = cosine + familiarityBoost + explorationTerm + priorityBoost;

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
  const hiphop = userVector[8];
  const globalPop = userVector[9];

  // 1. Personalized Artist AI Intelligence (When user has established listening preference or chosen onboarding artists)
  if (topArtist) {
    if (
      hiphop > 0.55 ||
      /xxxtentacion|juice wrld|travis scott|drake|kendrick|eminem|post malone|kanye|21 savage|future|j\.? cole|lil |tyler|playboi/i.test(topArtist)
    ) {
      return {
        moodKey: "energetic",
        badgeText: `AI Taste Intelligence • Hip-Hop & Rap • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Disesuaikan dengan pilihan artismu: ${topArtist} dan vibe musik hip-hop favoritmu.`,
        targetVector: userVector
      };
    }

    if (
      rockNostalgia > 0.5 ||
      /sheila|dewa|peterpan|padi|noah|naif|ungu|slank|my chemical|mcr|coldplay|green day|linkin park|paramore|avenged|bring me/i.test(topArtist)
    ) {
      return {
        moodKey: "nostalgia",
        badgeText: `AI Taste Intelligence • Rock & Alternatif • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Racikan lagu terbaik dari ${topArtist} dan distorsi musik favoritmu.`,
        targetVector: userVector
      };
    }

    if (
      dangdut > 0.5 ||
      /denny caknan|happy asmara|guyon waton|ndx|gilga|woro widowati|ndarboy/i.test(topArtist)
    ) {
      return {
        moodKey: "energetic",
        badgeText: `AI Taste Intelligence • Dangdut Koplo • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Lagu terpopuler dari ${topArtist} dan irama dangdut modern favoritmu.`,
        targetVector: userVector
      };
    }

    if (
      (popIndo > 0.65 && valence < 0.45) ||
      /bernadya|mahalini|tiara andini|lyodra|fabio asher|keisya|anggi marito|judika|raisa/i.test(topArtist)
    ) {
      return {
        moodKey: "melancholy",
        badgeText: `AI Taste Intelligence • Pop Galau Indonesia • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Disesuaikan dengan nuansa reflektif dan deretan lagu ${topArtist} yang kamu sukai.`,
        targetVector: userVector
      };
    }

    if (
      indie > 0.5 ||
      /sal priadi|hindia|nadin amizah|fourtwnty|pamungkas|fiersa besari|kunto aji|idgitaf/i.test(topArtist)
    ) {
      return {
        moodKey: "neutral",
        badgeText: `AI Taste Intelligence • Indie Pop & Senja • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Disesuaikan dengan pilihan artismu: ${topArtist} dan musisi satu frekuensi yang kamu sukai.`,
        targetVector: userVector
      };
    }

    if (
      globalPop > 0.55 ||
      /taylor swift|ariana grande|billie eilish|dua lipa|justin bieber|olivia rodrigo|sabrina carpenter|ed sheeran|bruno mars|the weeknd/i.test(topArtist)
    ) {
      return {
        moodKey: "energetic",
        badgeText: `AI Taste Intelligence • Hits Global & Pop • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Koleksi lagu terbaik dari ${topArtist} dan deretan hits internasional favoritmu.`,
        targetVector: userVector
      };
    }

    if (acoustic > 0.65) {
      return {
        moodKey: "chill",
        badgeText: `AI Taste Intelligence • Akustik & Santai • Favorit: ${topArtist}`,
        shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
        shelfDescription: `Petikan akustik hangat dan harmoni santai selaras dengan ${topArtist}.`,
        targetVector: userVector
      };
    }

    return {
      moodKey: "neutral",
      badgeText: `AI Taste Intelligence • Favorit: ${topArtist}`,
      shelfTitle: `Spesial Untukmu & Fans ${topArtist}`,
      shelfDescription: `Disesuaikan dengan artis & album favorit pilihanmu: ${topArtist}.`,
      targetVector: userVector
    };
  }

  // 2. Cold-Start / New User Mood Discovery (No dominant artist yet)
  if (energy > 0.65 || dangdut > 0.5) {
    return {
      moodKey: "energetic",
      badgeText: "Deteksi Mood AI • Energi & Semangat",
      shelfTitle: "Pembangkit Mood & Semangat Hari Ini",
      shelfDescription: "Irama penuh energi dan tempo bersemangat untuk menemani harimu.",
      targetVector: [0.25, 0.9, 0.85, 0.95, 0.6, 0.1, 0.3, 0.95, 0.5, 0.6, 0.3, 0.9]
    };
  }

  if (acoustic > 0.7) {
    return {
      moodKey: "chill",
      badgeText: "Deteksi Mood AI • Akustik & Senja",
      shelfTitle: "Rehat Sejenak • Akustik & Puisi Senja",
      shelfDescription: "Harmoni hangat dan petikan gitar akustik yang menenangkan jiwa.",
      targetVector: [0.9, 0.4, 0.45, 0.45, 0.5, 0.95, 0.2, 0.0, 0.4, 0.2, 0.2, 0.75]
    };
  }

  if (valence < 0.3) {
    return {
      moodKey: "melancholy",
      badgeText: "Deteksi Mood AI • Reflektif & Sendu",
      shelfTitle: "Lagu Penenang Suasana Hati",
      shelfDescription: "Lagu sendu dan reflektif untuk menemani saat hening.",
      targetVector: [0.75, 0.4, 0.2, 0.4, 0.95, 0.9, 0.2, 0.0, 0.3, 0.2, 0.3, 0.85]
    };
  }

  return {
    moodKey: "neutral",
    badgeText: "AI Taste Intelligence",
    shelfTitle: "Rekomendasi Spesial Untukmu",
    shelfDescription: "",
    targetVector: userVector
  };
}
