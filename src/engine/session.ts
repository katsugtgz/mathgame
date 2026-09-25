import type { Profile, Question, Result, SkillState } from "./types";
import { updateMastery } from "./engine";

/** XP dasar per jawaban benar. */
export const XP_BASE = 10;
/** Batas waktu (ms) untuk dapat bonus kecepatan. */
export const FAST_MS = 5000;

/** XP untuk satu jawaban: dasar + bonus kecepatan; salah selalu 0. */
export function xpForCorrect(now: number, answeredAt?: number, correct = true): number {
  if (!correct) return 0;
  if (answeredAt === undefined) return XP_BASE;
  const elapsed = answeredAt - now;
  const bonus = elapsed <= FAST_MS ? Math.min(5, Math.max(0, Math.floor((FAST_MS - elapsed) / 1000))) : 0;
  return XP_BASE + bonus;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" (UTC) dari epoch ms. */
export function todayString(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

/** Tambahkan xp, perbarui state skill dari satu hasil jawaban. */
export function applyResult(
  profile: Profile,
  question: Question,
  result: Result,
  _elapsedMs: number,
  nowIso: string,
): Profile {
  const xp = xpForCorrect(Date.parse(nowIso), undefined, result.correct);
  const prev: SkillState | undefined = profile.skills[question.skill];
  const skillState = updateMastery(prev, result);
  return {
    ...profile,
    xp: profile.xp + xp,
    skills: {
      ...profile.skills,
      [question.skill]: skillState,
    },
  };
}

/**
 * Streak harian: dipanggil sekali di awal sesi.
 * - sesi pertama → 1; hari sama → tetap; kemarin → +1; lebih lama → reset 1.
 */
export function updateStreak(profile: Profile, today: string): Profile {
  if (profile.lastSessionDate === today) return profile;
  if (profile.lastSessionDate === "") {
    return { ...profile, streakDays: 1, lastSessionDate: today };
  }
  const prev = Date.parse(profile.lastSessionDate + "T00:00:00Z");
  const cur = Date.parse(today + "T00:00:00Z");
  const consecutive = cur - prev === DAY_MS;
  return {
    ...profile,
    streakDays: consecutive ? profile.streakDays + 1 : 1,
    lastSessionDate: today,
  };
}

/** Profil kosong untuk pengguna baru. */
export function emptyProfile(_today: string): Profile {
  return {
    xp: 0,
    streakDays: 0,
    lastSessionDate: "",
    settings: { grade: 4, avatar: "kucing-oranye", theme: "senja" },
    skills: {},
  };
}
