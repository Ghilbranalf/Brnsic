import crypto from "crypto";
import { User, dbFindUserById } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "brnsic-secret-salt-liquid-dark-2026-v2";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: number;
  onboardingCompleted: boolean;
  selectedGenres?: string[];
  selectedArtists?: string[];
  taste: User["taste"];
  likedSongs: string[];
  playlists: any[];
}

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  createdAt: user.createdAt,
  onboardingCompleted: Boolean(user.onboardingCompleted),
  selectedGenres: user.selectedGenres || [],
  selectedArtists: user.selectedArtists || [],
  taste: user.taste,
  likedSongs: user.likedSongs || [],
  playlists: user.playlists || []
});

export const hashPassword = (password: string): { hash: string; salt: string } => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { hash, salt };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(hash, "hex"));
};

// Stateless Signed Token (HMAC SHA-256)
export const createSessionToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90 // 90 days validity
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
};

export const verifySessionToken = (token: string): { userId: string; email: string } | null => {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  if (signature !== expectedSignature) return null;

  try {
    const raw = Buffer.from(body, "base64url").toString("utf-8");
    const payload = JSON.parse(raw);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return { userId: payload.userId, email: payload.email };
  } catch (err) {
    return null;
  }
};

export const getAuthUser = async (req: Request): Promise<User | null> => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/brnsic_session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1].trim());
      }
    }

    if (!token) return null;

    const verified = verifySessionToken(token);
    if (!verified) return null;

    return await dbFindUserById(verified.userId);
  } catch (e) {
    return null;
  }
};
