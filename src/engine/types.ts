/** Tipe data inti engine — dipakai engine, konten, storage, dan UI. */

export type SkillId = string; // "k4.pecahan-setara" dst

export type CpaStage = "concrete" | "pictorial" | "abstract";

export type SkillState = {
  correctStreak: number;
  failStreak: number;
  mastery: 0 | 1;
  stage: CpaStage;
  lastSeen: number; // epoch ms
};

export type Settings = {
  grade: 4 | 5 | 6;
  avatar: string; // id kucing, mis. "kucing-oranye"
  theme: string; // id tema warna, mis. "senja"
};

export type Profile = {
  xp: number;
  streakDays: number;
  lastSessionDate: string; // "YYYY-MM-DD"
  settings: Settings;
  skills: Record<SkillId, SkillState>;
};

export type Question = {
  id: string;
  skill: SkillId;
  cpaStage: CpaStage;
  prompt: string;
  /** Visual CPA terenkode string, mis. "tenframe:2x5:rrrrrrrrrb" — dirender TenFrame. */
  visual?: string;
  answer: string;
  choices?: string[];
  hint?: string;
};

export type Result = {
  correct: boolean;
  expected: string;
};

export type Level = {
  level: number;
  title: string;
  into: number; // xp dalam level sekarang
  needed: number; // xp total untuk naik level
};

/** Draft soal dari generator konten — engine bungkus jadi Question. */
export type QuestionDraft = {
  prompt: string;
  answer: string;
  choices?: string[];
  visual?: string;
  hint?: string;
};

/** Definisi skill dari konten statis (dipisah dari mesin). */
export type Skill = {
  id: SkillId;
  grade: 4 | 5 | 6;
  topic: string;
  title: string;
  /** Level kesulitan tersedia (small steps); default 1 level. */
  levels?: number[];
  gen: (rng: () => number, cpaStage: string, difficulty: number) => QuestionDraft;
};
