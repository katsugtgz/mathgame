import { describe, it, expect } from "vitest";
import {
  xpForCorrect,
  applyResult,
  updateStreak,
  todayString,
  emptyProfile,
} from "./session";
import type { Profile, Question } from "./types";

const q = (skill = "k4.test"): Question => ({
  id: "t1",
  skill,
  cpaStage: "abstract",
  prompt: "1+1",
  answer: "2",
});

const profile = (over: Partial<Profile> = {}): Profile => ({
  xp: 0,
  streakDays: 0,
  lastSessionDate: "2026-09-25",
  settings: { grade: 4, avatar: "kucing-oranye", theme: "senja" },
  skills: {},
  ...over,
});

describe("xpForCorrect", () => {
  it("dasar 10 xp per jawaban benar", () => {
    expect(xpForCorrect(1000)).toBe(10);
  });

  it("bonus kecepatan: cepat dapat lebih", () => {
    expect(xpForCorrect(1000, 2000)).toBeGreaterThan(10);
  });

  it("salah tidak dapat xp", () => {
    expect(xpForCorrect(1000, 2000, false)).toBe(0);
  });

  it("sangat lambat tetap dapat dasar", () => {
    expect(xpForCorrect(1000, 60_000)).toBe(10);
  });
});

describe("applyResult", () => {
  it("benar: xp naik, skill state diperbarui", () => {
    const p = applyResult(profile(), q("k4.a"), { correct: true, expected: "2" }, 2000, "2026-09-25");
    expect(p.xp).toBeGreaterThan(0);
    expect(p.skills["k4.a"].correctStreak).toBe(1);
  });

  it("salah: xp tetap, failStreak naik", () => {
    const p = applyResult(profile(), q("k4.a"), { correct: false, expected: "2" }, 2000, "2026-09-25");
    expect(p.xp).toBe(0);
    expect(p.skills["k4.a"].failStreak).toBe(1);
  });
});

describe("todayString", () => {
  it("format YYYY-MM-DD dari epoch", () => {
    // 2026-09-25 00:00 UTC
    expect(todayString(1790294400000)).toBe("2026-09-25");
  });

  it("lintas bulan benar", () => {
    // 2026-10-01 00:00 UTC
    expect(todayString(1790812800000)).toBe("2026-10-01");
  });
});

describe("updateStreak", () => {
  it("sesi pertama: streak jadi 1", () => {
    const p = updateStreak(profile({ lastSessionDate: "" }), "2026-09-25");
    expect(p.streakDays).toBe(1);
    expect(p.lastSessionDate).toBe("2026-09-25");
  });

  it("hari sama: streak tetap", () => {
    const p = updateStreak(profile({ streakDays: 5, lastSessionDate: "2026-09-25" }), "2026-09-25");
    expect(p.streakDays).toBe(5);
  });

  it("hari berikutnya: streak +1", () => {
    const p = updateStreak(profile({ streakDays: 5, lastSessionDate: "2026-09-25" }), "2026-09-26");
    expect(p.streakDays).toBe(6);
  });

  it("bolong sehari: streak reset ke 1", () => {
    const p = updateStreak(profile({ streakDays: 5, lastSessionDate: "2026-09-20" }), "2026-09-25");
    expect(p.streakDays).toBe(1);
  });

  it("lintas bulan: kemarin 09-30, hari ini 10-01 tetap lanjut", () => {
    const p = updateStreak(profile({ streakDays: 3, lastSessionDate: "2026-09-30" }), "2026-10-01");
    expect(p.streakDays).toBe(4);
  });

  it("lintas tahun: 12-31 ke 01-01 tetap lanjut", () => {
    const p = updateStreak(profile({ streakDays: 7, lastSessionDate: "2025-12-31" }), "2026-01-01");
    expect(p.streakDays).toBe(8);
  });
});

describe("emptyProfile", () => {
  it("profil baru: grade 4, streak 0, tanpa skill", () => {
    const p = emptyProfile("2026-09-25");
    expect(p.settings.grade).toBe(4);
    expect(p.streakDays).toBe(0);
    expect(Object.keys(p.skills)).toHaveLength(0);
    expect(p.lastSessionDate).toBe("");
  });
});
