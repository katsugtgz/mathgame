import { describe, it, expect } from "vitest";
import { SKILLS, skillsForGrade } from "./content";
import { gradeAnswer } from "./engine";
import type { Skill } from "./types";

describe("skill tree", () => {
  it("tiga kelas terdaftar, tiap kelas punya skill", () => {
    expect(skillsForGrade(4).length).toBeGreaterThanOrEqual(4);
    expect(skillsForGrade(5).length).toBeGreaterThanOrEqual(3);
    expect(skillsForGrade(6).length).toBeGreaterThanOrEqual(3);
  });

  it("id skill unik di seluruh tree", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prefix id sesuai kelas", () => {
    for (const s of SKILLS) {
      expect(s.id.startsWith(`k${s.grade}.`)).toBe(true);
    }
  });

  it("tiap skill punya minimal 2 level kesulitan (small steps)", () => {
    for (const s of SKILLS) {
      expect((s.levels?.length ?? 0)).toBeGreaterThanOrEqual(2);
    }
  });
});

// Setiap generator harus menghasilkan soal valid untuk semua stage + level.
// Sifat kunci: jawaban gradeAnswer terhadap dirinya selalu benar, dan pilihan
// (kalau ada) memuat jawaban.
function checkSkill(s: Skill) {
  const stages = ["concrete", "pictorial", "abstract"] as const;
  const maxLvl = (s.levels?.length ?? 1) - 1;
  let rngState = 42;
  const rng = () => {
    // LCG deterministik supaya sampel bervariasi tapi repeatable
    rngState = (rngState * 1664525 + 1013904223) % 4294967296;
    return rngState / 4294967296;
  };
  for (const stage of stages) {
    for (let d = 0; d <= maxLvl; d++) {
      for (let i = 0; i < 6; i++) {
        const draft = s.gen(rng, stage, d);
        if (!draft.prompt || draft.prompt.length === 0) {
          throw new Error(`${s.id} prompt kosong (stage=${stage} d=${d})`);
        }
        if (draft.answer === undefined || draft.answer === "") {
          throw new Error(`${s.id} answer kosong (stage=${stage} d=${d})`);
        }
        const q = {
          id: "chk",
          skill: s.id,
          cpaStage: stage,
          prompt: draft.prompt,
          answer: draft.answer,
          choices: draft.choices,
          visual: draft.visual,
        };
        const r = gradeAnswer(q, draft.answer);
        if (!r.correct) {
          throw new Error(`${s.id} jawaban sendiri dinilai salah: "${draft.answer}" (stage=${stage} d=${d})`);
        }
        if (draft.choices) {
          if (!draft.choices.includes(draft.answer)) {
            throw new Error(`${s.id} pilihan tak memuat jawaban (stage=${stage} d=${d})`);
          }
          if (new Set(draft.choices).size !== draft.choices.length) {
            throw new Error(`${s.id} pilihan duplikat (stage=${stage} d=${d})`);
          }
        }
        // visual tenframe harus well-formed bila ada
        if (draft.visual && !draft.visual.startsWith("tenframe:")) {
          throw new Error(`${s.id} visual tak dikenal: ${draft.visual}`);
        }
      }
    }
  }
}

describe("generators menghasilkan soal valid", () => {
  it("semua skill lolos pemeriksaan soal", () => {
    for (const s of SKILLS) checkSkill(s);
  });

  it("difficulty 0 vs max menghasilkan prompt beda (kesulitan terasa)", () => {
    for (const s of SKILLS) {
      const lo = s.gen(() => 0.5, "abstract", 0);
      const hi = s.gen(() => 0.5, "abstract", (s.levels?.length ?? 1) - 1);
      // tidak wajib selalu beda, tapi minimal satu sampel beda di 5 percobaan
      let differ = lo.prompt !== hi.prompt;
      if (!differ) {
        let rs = 7;
        const rng = () => {
          rs = (rs * 1664525 + 1013904223) % 4294967296;
          return rs / 4294967296;
        };
        for (let i = 0; i < 5 && !differ; i++) {
          differ = s.gen(rng, "abstract", 0).prompt !== s.gen(rng, "abstract", (s.levels?.length ?? 1) - 1).prompt;
        }
      }
      expect(differ).toBe(true);
    }
  });
});

describe("CPA concrete/pictorial punya visual", () => {
  it("stage rendah menyertakan visual tenframe untuk skill bilangan", () => {
    const s = SKILLS.find((x) => x.id === "k4.bilangan-1")!;
    const c = s.gen(() => 0.5, "concrete", 0);
    const a = s.gen(() => 0.5, "abstract", 0);
    expect(c.visual).toMatch(/^tenframe:/);
    expect(a.visual).toBeUndefined();
  });

  it("k6 bilangan: suhu negatif tanpa visual (a < b)", () => {
    const s = SKILLS.find((x) => x.id === "k6.bilangan-bulat")!;
    // ri: a = 1 (rng 0.01), b = 9 (rng 0.99)
    const seq = [0.01, 0.99];
    let i = 0;
    const q = s.gen(() => seq[i++ % 2], "pictorial", 0);
    expect(q.answer).toBe("-8");
    expect(q.visual).toBeUndefined();
  });
});
