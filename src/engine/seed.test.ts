import { describe, it, expect } from "vitest";
import { SEED_BANK, seedsFor } from "./seed";
import { gradeAnswer } from "./engine";
import type { Question } from "./types";

describe("seed bank soal", () => {
  it("tiap kelas punya soal seed", () => {
    expect(seedsFor(4).length).toBeGreaterThanOrEqual(6);
    expect(seedsFor(5).length).toBeGreaterThanOrEqual(4);
    expect(seedsFor(6).length).toBeGreaterThanOrEqual(4);
  });

  it("id seed unik", () => {
    const ids = SEED_BANK.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("grade cocok dengan prefix id", () => {
    for (const s of SEED_BANK) {
      expect(s.id.startsWith(`k${s.grade}.`)).toBe(true);
    }
  });

  it("pilihan (bila ada) memuat jawaban, jawaban dinilai benar", () => {
    for (const seed of SEED_BANK) {
      const q: Question = {
        id: seed.id,
        skill: seed.skill,
        cpaStage: seed.cpaStage,
        prompt: seed.prompt,
        answer: seed.answer,
        choices: seed.choices,
        visual: seed.visual,
      };
      const r = gradeAnswer(q, seed.answer);
      expect(r.correct, `seed ${seed.id} dinilai salah`).toBe(true);
      if (seed.choices) {
        expect(seed.choices).toContain(seed.answer);
        expect(new Set(seed.choices).size).toBe(seed.choices.length);
      }
    }
  });

  it("soal seed bercorak CPA: tiap kelas punya minimal 1 concrete/pictorial", () => {
    for (const g of [4, 5, 6] as const) {
      const vis = seedsFor(g).filter((s) => s.cpaStage !== "abstract");
      expect(vis.length, `kelas ${g} tak punya seed visual`).toBeGreaterThanOrEqual(1);
    }
  });

  it("cpaStage valid", () => {
    for (const s of SEED_BANK) {
      expect(["concrete", "pictorial", "abstract"]).toContain(s.cpaStage);
    }
  });
});
