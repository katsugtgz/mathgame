import type {
  Level,
  Profile,
  Question,
  Result,
  Skill,
  SkillState,
} from "./types";
import type { SeedQuestion } from "./seed";
/** Judul level, index = level - 1. Berbahasa Indonesia, pujian usaha bukan bakat. */
export const LEVEL_TITLES = [
  "Kucing Kecil",
  "Kucing Rajin",
  "Kucing Pintar",
  "Kucing Hebat",
  "Kucing Jenius",
  "Master Kucing",
] as const;

/** Benar berapa kali berturut-turut untuk naik stage CPA. */
export const STAGE_UP_STREAK = 3;
/** Salah berapa kali berturut-turut untuk turun stage CPA. */
export const STAGE_DOWN_STREAK = 3;
/** Benar berapa kali berturut-turut di abstract untuk mastery. */
export const MASTERY_STREAK = 5;
/** Streak benar untuk menaikkan difficulty. */
export const DIFF_UP_STREAK = 4;
/** Streak salah untuk menurunkan difficulty. */
export const DIFF_DOWN_STREAK = 1;

/** XP dasar untuk naik dari level L ke L+1: 100, 150, 200, ... (naik 50 tiap level). */
export function xpForLevel(level: number): number {
  return 50 + level * 50;
}

/** Peta xp kumulatif → level. Murni, tanpa efek samping. */
export function mapXp(xp: number): Level {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  let needed = xpForLevel(1);
  while (rest >= needed) {
    rest -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    into: rest,
    needed,
  };
}

/** Nilai jawaban dinormalisasi: spasi pinggir, pecahan disederhanakan. */
export function normalizeAnswer(a: string): string {
  const t = a.trim().replace(/\s+/g, "");
  const frac = t.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const n = Number(frac[1]);
    const d = Number(frac[2]);
    if (d !== 0) {
      const g = gcd(Math.abs(n), d);
      if (g > 0) return `${n / g}/${d / g}`;
    }
  }
  return t;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Koreksi jawaban. Pilihan ganda wajib salah satu pilihan; isian dinormalisasi. */
export function gradeAnswer(question: Question, answer: string): Result {
  const expected = question.answer;
  if (question.choices && question.choices.length > 0) {
    return { correct: question.choices.includes(answer) && answer === expected, expected };
  }
  const ok = normalizeAnswer(answer) === normalizeAnswer(expected);
  return { correct: ok, expected };
}

/** State baru untuk skill yang belum pernah ditemui. */
export function newSkillState(now: number): SkillState {
  return {
    correctStreak: 0,
    failStreak: 0,
    mastery: 0,
    stage: "concrete",
    lastSeen: now,
  };
}

const STAGES = ["concrete", "pictorial", "abstract"] as const;

/** Perbarui state skill dari satu hasil jawaban: streak, stage CPA, mastery. */
export function updateMastery(
  prev: SkillState | undefined,
  result: Result,
  now: number = Date.now(),
): SkillState {
  const s: SkillState = prev ? { ...prev } : newSkillState(now);
  s.lastSeen = now;

  if (result.correct) {
    s.correctStreak += 1;
    s.failStreak = 0;

    // mastery gate: hanya di abstract
    if (s.stage === "abstract" && s.correctStreak >= MASTERY_STREAK) {
      s.mastery = 1;
      s.correctStreak = 0; // mulai lagi siklus warm-up
      return s;
    }

    // naik stage CPA
    if (s.stage !== "abstract" && s.correctStreak >= STAGE_UP_STREAK) {
      s.stage = STAGES[STAGES.indexOf(s.stage) + 1];
      s.correctStreak = 0; // streak segar di stage baru
    }
  } else {
    s.failStreak += 1;
    s.correctStreak = 0;
    // mastery yang sudah tercapai tidak dicabut
    if (s.stage !== "concrete" && s.failStreak >= STAGE_DOWN_STREAK) {
      s.stage = STAGES[STAGES.indexOf(s.stage) - 1];
      s.failStreak = 0;
    }
  }
  return s;
}

/** Difficulty berikutnya (index level soal), dari streak saat ini. */
export function nextDifficulty(
  state: SkillState | undefined,
  maxLevel: number,
): number {
  const streak =
    state && state.correctStreak >= DIFF_UP_STREAK
      ? Math.floor(state.correctStreak / DIFF_UP_STREAK)
      : state && state.failStreak >= DIFF_DOWN_STREAK
        ? -1
        : 0;
  const base = 0;
  return Math.min(maxLevel, Math.max(0, base + streak));
}

/** Fallback deterministik bila pemanggil tidak menyuntik rng. */
export const defaultRng = () => 0.5;

/**
 * Pilih skill + buat soal berikutnya.
 * - skill belum master didahulukan, urut stabil (anak baru selalu mulai dari skill pertama).
 * - semua master → warm-up acak dari yang dikuasai.
 * - sessionStart: soal pertama sesi selalu level 0 (prinsip Kumon: mulai mudah).
 */
export function nextQuestion(
  profile: Profile,
  skills: Skill[],
  rng: () => number = defaultRng,
  sessionStart: boolean = false,
  seedBank: SeedQuestion[] = [],
): { question: Question; skill: Skill; warmup: boolean } {
  const gradeSkills = skills.filter((s) => s.grade === profile.settings.grade);
  const pool = gradeSkills.length > 0 ? gradeSkills : skills;

  const unlocked = pool.filter(
    (s) => (profile.skills[s.id]?.mastery ?? 0) === 0,
  );
  const allMastered = unlocked.length === 0;
  const list = allMastered ? pool : unlocked;
  const skill = allMastered
    ? list[Math.floor(rng() * list.length) % list.length]
    : list[0];

  const state = profile.skills[skill.id];
  const maxLevel = (skill.levels?.length ?? 1) - 1;
  const difficulty = sessionStart ? 0 : nextDifficulty(state, maxLevel);

  const cpa = state?.stage ?? "concrete";

  // warm-up sesi: soal pertama dari seed bank skill ini bila ada (dijamin mudah)
  if (sessionStart) {
    const seed = seedBank.find((s) => s.skill === skill.id && s.grade === profile.settings.grade);
    if (seed) {
      return {
        question: {
          id: seed.id,
          skill: seed.skill,
          cpaStage: seed.cpaStage,
          prompt: seed.prompt,
          answer: seed.answer,
          choices: seed.choices,
          visual: seed.visual,
          hint: seed.hint,
        },
        skill,
        warmup: true,
      };
    }
  }

  const draft = skill.gen(rng, cpa, difficulty);

  return {
    question: {
      id: `${skill.id}.${draft.prompt}`, // deterministik, unik per soal
      skill: skill.id,
      cpaStage: cpa,
      prompt: draft.prompt,
      answer: draft.answer,
      choices: draft.choices,
      visual: draft.visual,
      hint: draft.hint,
    },
    skill,
    warmup: sessionStart,
  };
}
