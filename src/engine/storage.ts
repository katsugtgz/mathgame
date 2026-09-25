import type { Profile, SkillState } from "./types";

export const STORAGE_KEY = "mathgame.profile.v1";
export const SCHEMA_VERSION = 1;

/** Adapter tunggal untuk semua akses profil. UI tidak menyentuh localStorage langsung. */
export type Storage = {
  load: () => Profile | null;
  save: (p: Profile) => void;
  clear: () => void;
};

function isProfile(p: unknown): p is Profile {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  if (typeof o.xp !== "number") return false;
  if (typeof o.streakDays !== "number") return false;
  if (typeof o.lastSessionDate !== "string") return false;
  if (typeof o.skills !== "object" || o.skills === null) return false;
  const s = o.settings as Record<string, unknown> | undefined;
  if (!s || typeof s.grade !== "number") return false;
  // validasi bentuk tiap skill state
  for (const v of Object.values(o.skills)) {
    const k = v as Partial<SkillState> | null;
    if (!k || typeof k.correctStreak !== "number" || typeof k.failStreak !== "number") return false;
    if (k.mastery !== 0 && k.mastery !== 1) return false;
    if (!k.stage) return false;
  }
  return true;
}

export function createStorage(ls: Pick<StorageImpl, "getItem" | "setItem" | "removeItem">): Storage {
  return {
    load(): Profile | null {
      try {
        const raw = ls.getItem(STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as { v?: number; profile?: unknown };
        if (env.v !== SCHEMA_VERSION) return null;
        if (!isProfile(env.profile)) return null;
        return env.profile;
      } catch {
        return null; // json rusak / storage diblokir: mulai segar
      }
    },
    save(p: Profile): void {
      try {
        ls.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, profile: p }));
      } catch {
        // kuota penuh / private mode: progres sesi ini tetap jalan di memori
      }
    },
    clear(): void {
      try {
        ls.removeItem(STORAGE_KEY);
      } catch {
        // diabaikan
      }
    },
  };
}

type StorageImpl = globalThis.Storage;
