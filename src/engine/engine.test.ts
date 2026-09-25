import { describe, it, expect } from "vitest";
import {
  nextQuestion,
  gradeAnswer,
  updateMastery,
  mapXp,
  LEVEL_TITLES,
} from "./engine";
import { defaultRng } from "./engine";
import type { Profile, SkillState, Question } from "./types";

// ---------- helpers ----------

const baseSkill: SkillState = {
  correctStreak: 0,
  failStreak: 0,
  mastery: 0,
  stage: "pictorial",
  lastSeen: 0,
};

const emptyProfile = (): Profile => ({
  xp: 0,
  streakDays: 0,
  lastSessionDate: "2026-09-25",
  settings: { grade: 4, avatar: "kucing-oranye", theme: "senja" },
  skills: {},
});

// soal tiruan untuk gradeAnswer
const q = (answer: string, choices?: string[]): Question => ({
  id: "t1",
  skill: "k4.test",
  cpaStage: "abstract",
  prompt: "t?",
  answer,
  choices,
});

// ---------- gradeAnswer ----------

describe("gradeAnswer", () => {
  it("benar persis sama", () => {
    expect(gradeAnswer(q("12"), "12").correct).toBe(true);
  });

  it("benar meski spasi dipinggir beda", () => {
    expect(gradeAnswer(q("12"), " 12 ").correct).toBe(true);
  });

  it("salah kalau beda angka", () => {
    expect(gradeAnswer(q("12"), "13").correct).toBe(false);
  });

  it("salah kalau kosong", () => {
    expect(gradeAnswer(q("12"), "").correct).toBe(false);
  });

  it("pilihan ganda: jawaban harus salah satu pilihan", () => {
    // "99" benar secara string tapi bukan pilihan → salah
    expect(gradeAnswer(q("1", ["1", "2", "3"]), "99").correct).toBe(false);
    expect(gradeAnswer(q("2", ["1", "2", "3"]), "2").correct).toBe(true);
  });

  it("hasil membawa jawaban yang diharapkan", () => {
    expect(gradeAnswer(q("7"), "9").expected).toBe("7");
  });

  it("pecahan dinormalisasi: 1/2 sama dengan 2/4", () => {
    expect(gradeAnswer(q("1/2"), "2/4").correct).toBe(true);
    expect(gradeAnswer(q("3/4"), "3/4").correct).toBe(true);
    expect(gradeAnswer(q("1/2"), "1/3").correct).toBe(false);
  });
});

// ---------- mapXp ----------

describe("mapXp", () => {
  it("0 xp = level 1, judul pertama", () => {
    const lvl = mapXp(0);
    expect(lvl.level).toBe(1);
    expect(lvl.title).toBe(LEVEL_TITLES[0]);
    expect(lvl.into).toBe(0);
  });

  it("tepat di batas naik level", () => {
    const lvl1 = mapXp(0);
    const lvl2 = mapXp(lvl1.needed);
    expect(lvl2.level).toBe(2);
    expect(lvl2.into).toBe(0);
  });

  it("di tengah level, into = sisa sejak level itu", () => {
    const lvl1 = mapXp(0);
    const lvl = mapXp(10);
    expect(lvl.level).toBe(1);
    expect(lvl.into).toBe(10);
    expect(lvl.needed).toBe(lvl1.needed);
  });

  it("level tinggi tetap monoton naik", () => {
    let prev = 0;
    for (const xp of [0, 50, 100, 250, 500, 1000, 5000, 20000]) {
      const lvl = mapXp(xp);
      expect(lvl.level).toBeGreaterThanOrEqual(prev);
      prev = lvl.level;
    }
  });

  it("judul level selalu ada", () => {
    expect(LEVEL_TITLES.length).toBeGreaterThanOrEqual(5);
    for (const t of LEVEL_TITLES) expect(t.length).toBeGreaterThan(0);
  });
});

// ---------- updateMastery ----------

describe("updateMastery: streak benar/salah", () => {
  it("benar menaikkan correctStreak, reset failStreak", () => {
    const s = updateMastery({ ...baseSkill, correctStreak: 1, failStreak: 2 }, { correct: true, expected: "1" });
    expect(s.correctStreak).toBe(2);
    expect(s.failStreak).toBe(0);
  });

  it("salah menaikkan failStreak, reset correctStreak", () => {
    const s = updateMastery({ ...baseSkill, correctStreak: 3 }, { correct: false, expected: "1" });
    expect(s.failStreak).toBe(1);
    expect(s.correctStreak).toBe(0);
  });

  it("lastSeen maju", () => {
    const before = Date.now();
    const s = updateMastery(baseSkill, { correct: true, expected: "1" });
    expect(s.lastSeen).toBeGreaterThanOrEqual(before);
  });
});

describe("updateMastery: CPA stage naik-turun", () => {
  it("anak baru mulai di concrete untuk skill tak dikenal", () => {
    const s = updateMastery(undefined, { correct: true, expected: "1" });
    expect(s.stage).toBe("concrete");
    expect(s.mastery).toBe(0);
  });

  it("benar 3x berturut-turut di concrete naik ke pictorial", () => {
    let s: SkillState = { ...baseSkill, stage: "concrete", correctStreak: 0 };
    s = updateMastery(s, { correct: true, expected: "1" });
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.stage).toBe("concrete");
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.stage).toBe("pictorial");
  });

  it("benar 3x berturut-turut di pictorial naik ke abstract", () => {
    let s: SkillState = { ...baseSkill, stage: "pictorial", correctStreak: 2 };
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.stage).toBe("abstract");
  });

  it("salah 3x di abstract turun ke pictorial (jalan keluar)", () => {
    let s: SkillState = { ...baseSkill, stage: "abstract", failStreak: 2 };
    s = updateMastery(s, { correct: false, expected: "1" });
    expect(s.stage).toBe("pictorial");
    expect(s.failStreak).toBe(0);
  });

  it("salah 3x di pictorial turun ke concrete", () => {
    let s: SkillState = { ...baseSkill, stage: "pictorial", failStreak: 2 };
    s = updateMastery(s, { correct: false, expected: "1" });
    expect(s.stage).toBe("concrete");
  });

  it("salah di concrete tetap concrete (tidak turun lagi)", () => {
    const s = updateMastery({ ...baseSkill, stage: "concrete", failStreak: 9 }, { correct: false, expected: "1" });
    expect(s.stage).toBe("concrete");
  });

  it("naik stage me-reset streak yang memicunya", () => {
    let s: SkillState = { ...baseSkill, stage: "concrete", correctStreak: 2 };
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.correctStreak).toBe(0); // streak mulai segar di stage baru
    expect(s.stage).toBe("pictorial");
  });
});

describe("updateMastery: mastery gate", () => {
  it("abstract + benar 5x berturut-turut = mastery", () => {
    let s: SkillState = { ...baseSkill, stage: "abstract", correctStreak: 4, mastery: 0 };
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.mastery).toBe(1);
  });

  it("belum mastery di stage bawah walau streak panjang", () => {
    let s: SkillState = { ...baseSkill, stage: "concrete", correctStreak: 9 };
    s = updateMastery(s, { correct: true, expected: "1" });
    expect(s.mastery).toBe(0);
  });

  it("mastery sekali tercapai tidak hilang karena satu salah", () => {
    const s = updateMastery({ ...baseSkill, stage: "abstract", mastery: 1 }, { correct: false, expected: "1" });
    expect(s.mastery).toBe(1);
  });
});

// ---------- nextQuestion: pemilihan skill ----------

// konten tiruan: dua skill untuk tes routing
const twoSkills = [
  {
    id: "k4.satu",
    grade: 4 as const,
    topic: "uji",
    title: "Satu",
    gen: () => ({ prompt: "1+1", answer: "2" }),
  },
  {
    id: "k4.dua",
    grade: 4 as const,
    topic: "uji",
    title: "Dua",
    gen: () => ({ prompt: "2+2", answer: "4" }),
  },
];

describe("nextQuestion: pemilihan skill", () => {
  it("anak baru (tanpa state) dapat skill pertama grade-nya", () => {
    const profile = emptyProfile();
    const { question, skill } = nextQuestion(profile, twoSkills);
    expect(question.skill).toBe("k4.satu");
    expect(skill.id).toBe("k4.satu");
  });

  it("skill yang belum dikuasai didahulukan", () => {
    const profile = emptyProfile();
    profile.skills["k4.satu"] = { ...baseSkill, mastery: 0, stage: "abstract" };
    const { question } = nextQuestion(profile, twoSkills);
    expect(question.skill).toBe("k4.satu");
  });

  it("semua master → warm-up dari yang sudah dikuasai", () => {
    const profile = emptyProfile();
    profile.skills["k4.satu"] = { ...baseSkill, mastery: 1 };
    profile.skills["k4.dua"] = { ...baseSkill, mastery: 1 };
    const { question } = nextQuestion(profile, twoSkills);
    expect(["k4.satu", "k4.dua"]).toContain(question.skill);
  });

  it("skill tidak ada di profile tetap bisa dipilih (state dibuat saat update)", () => {
    const profile = emptyProfile();
    const { question } = nextQuestion(profile, twoSkills);
    expect(question).toHaveProperty("prompt");
  });
});

// ---------- nextQuestion: CPA stage & sumber soal ----------

const stagedSkill = {
  id: "k4.staged",
  grade: 4 as const,
  topic: "uji",
  title: "Staged",
  gen: (_rng: () => number, cpa: string) => ({
    prompt: `lv:${cpa}`,
    answer: "1",
    visual: cpa === "pictorial" ? "tenframe:2x5:rrrrrrrrrr" : undefined,
  }),
};

describe("nextQuestion: CPA stage diteruskan ke generator", () => {
  it("stage dari skillState dipakai generator", () => {
    const profile = emptyProfile();
    profile.skills["k4.staged"] = { ...baseSkill, stage: "pictorial" };
    const { question } = nextQuestion(profile, [stagedSkill]);
    expect(question.prompt).toBe("lv:pictorial");
    expect(question.visual).toBe("tenframe:2x5:rrrrrrrrrr");
  });

  it("tanpa state, stage default concrete", () => {
    const profile = emptyProfile();
    const { question } = nextQuestion(profile, [stagedSkill]);
    expect(question.prompt).toBe("lv:concrete");
  });
});

// ---------- nextQuestion: difficulty (small steps) ----------

const leveled = {
  id: "k4.leveled",
  grade: 4 as const,
  topic: "uji",
  title: "Leveled",
  levels: [0, 1, 2],
  gen: (_rng: () => number, _cpa: string, diff: number) => ({
    prompt: `d:${diff}`,
    answer: "1",
  }),
};

describe("nextQuestion: adaptive difficulty", () => {
  it("anak baru mulai level 0 (soal pertama selalu mudah)", () => {
    const profile = emptyProfile();
    const { question } = nextQuestion(profile, [leveled]);
    expect(question.prompt).toBe("d:0");
  });

  it("streak benar tinggi naik level kesulitan", () => {
    const profile = emptyProfile();
    profile.skills["k4.leveled"] = { ...baseSkill, stage: "abstract", correctStreak: 4 };
    const { question } = nextQuestion(profile, [leveled]);
    expect(question.prompt).toBe("d:1");
  });

  it("streak benar lebih tinggi naik lagi, dibatasi max level", () => {
    const profile = emptyProfile();
    profile.skills["k4.leveled"] = { ...baseSkill, stage: "abstract", correctStreak: 8 };
    const { question } = nextQuestion(profile, [leveled]);
    expect(question.prompt).toBe("d:2");
  });

  it("salah baru-menurunkan difficulty", () => {
    const profile = emptyProfile();
    profile.skills["k4.leveled"] = { ...baseSkill, stage: "abstract", failStreak: 1 };
    const { question } = nextQuestion(profile, [leveled]);
    expect(question.prompt).toBe("d:0");
  });
});

// ---------- nextQuestion: warm-up ----------

describe("nextQuestion: warm-up kumon", () => {
  it("soal pertama sesi untuk skill sedang-latih tetap level rendah", () => {
    // anak streak 4 di abstract; sesi baru harus mulai dari level 0 dulu
    const profile = emptyProfile();
    profile.skills["k4.leveled"] = {
      ...baseSkill,
      stage: "abstract",
      correctStreak: 4,
    };
    const first = nextQuestion(profile, [leveled], defaultRng, true);
    expect(first.warmup).toBe(true);
    expect(first.question.prompt).toBe("d:0");
  });
});

describe("nextQuestion: fallback grade kosong", () => {
  it("skill grade lain dipakai bila grade profil tak punya skill", () => {
    const profile = emptyProfile();
    profile.settings.grade = 6; // duaSkills semua grade 4
    const { question } = nextQuestion(profile, [...twoSkills]);
    expect(["k4.satu", "k4.dua"]).toContain(question.skill);
  });
});

// ---------- nextQuestion: seed bank warm-up ----------

const seedWarmup = [
  {
    id: "k4.leveled.s1",
    grade: 4 as const,
    skill: "k4.leveled",
    cpaStage: "concrete" as const,
    prompt: "seed-soal",
    answer: "1",
  },
];

describe("nextQuestion: seed bank warm-up", () => {
  it("soal pertama sesi dari seed bank bila tersedia", () => {
    const profile = emptyProfile();
    const r = nextQuestion(profile, [leveled], defaultRng, true, seedWarmup);
    expect(r.warmup).toBe(true);
    expect(r.question.prompt).toBe("seed-soal");
    expect(r.question.id).toBe("k4.leveled.s1");
  });

  it("bukan sesi-pertama: generator biasa dipakai", () => {
    const profile = emptyProfile();
    const r = nextQuestion(profile, [leveled], defaultRng, false, seedWarmup);
    expect(r.question.prompt).not.toBe("seed-soal");
  });

  it("seed tanpa skill cocok: generator biasa", () => {
    const profile = emptyProfile();
    const r = nextQuestion(profile, [leveled], defaultRng, true, [
      { ...seedWarmup[0], skill: "k4.lain" },
    ]);
    expect(r.question.prompt).toBe("d:0");
  });
});

// ---------- determinisme rng ----------

describe("nextQuestion: rng bisa disuntik", () => {
  it("rng sama menghasilkan soal sama", () => {
    const profile = emptyProfile();
    profile.skills["k4.leveled"] = { ...baseSkill, stage: "abstract" };
    const rng = () => 0.5;
    const a = nextQuestion(profile, [leveled], rng);
    const b = nextQuestion(profile, [leveled], rng);
    expect(a.question.prompt).toBe(b.question.prompt);
  });
});
