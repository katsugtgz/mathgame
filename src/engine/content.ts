import type { Skill, QuestionDraft } from "./types";

// ---------- util generator ----------

/** Bilangan acak bulat [min, max] dari rng. */
const ri = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

const pick = <T,>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

/** Visual ten-frame terenkode: "tenframe:barisXkolom:r|b|." per sel. */
function tenframe(rows: number, cols: number, cells: string): string {
  return `tenframe:${rows}x${cols}:${cells}`;
}

/** String sel ten-frame dari jumlah counter merah (r). n dibatasi [0, total]. */
function reds(n: number, total: number): string {
  const c = Math.max(0, Math.min(n, total));
  return "r".repeat(c) + ".".repeat(total - c);
}

/** Pilihan ganda dari jawaban benar + pengecoh bulat (boleh negatif). */
function numChoices(rng: () => number, answer: number, spread = 5): string[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard < 100) {
    guard += 1;
    const d = ri(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    set.add(answer + d);
  }
  // fallback deterministik bila ruang pengecoh sempit
  let extra = 1;
  while (set.size < 4) {
    set.add(answer + extra);
    extra += 1;
  }
  const arr = [...set].map(String);
  // acak urutan
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Sederhanakan pecahan. */
function simplify(n: number, d: number): [number, number] {
  const g = gcd(Math.abs(n), d);
  return [n / g, d / g];
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// ---------- kelas 4 ----------

const k4Bilangan: Skill = {
  id: "k4.bilangan-1",
  grade: 4,
  topic: "Bilangan",
  title: "Bilangan dan Ten-Frame",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const n = diff === 0 ? ri(rng, 3, 9) : diff === 1 ? ri(rng, 10, 18) : ri(rng, 11, 20);
    if (cpa !== "abstract") {
      const cols = 5;
      const rows = n > 10 ? 4 : 2;
      const cellsStr = "r".repeat(Math.min(10, n)) + "r".repeat(Math.max(0, n - 10)) + ".".repeat(Math.max(0, 20 - n));
      return {
        prompt: `Ada berapa titik pada gambar?`,
        answer: String(n),
        visual: tenframe(rows, cols, cellsStr),
        choices: numChoices(rng, n),
        hint: "Hitung titik per baris.",
      };
    }
    return {
      prompt: `${n} + 1 = ?`,
      answer: String(n + 1),
      choices: numChoices(rng, n + 1),
    };
  },
};

const k4PecahanSetara: Skill = {
  id: "k4.pecahan-setara",
  grade: 4,
  topic: "Pecahan",
  title: "Pecahan Senilai",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const [n, d] = simplify(ri(rng, 1, 4 + diff * 3), 0);
    void n; void d;
    const base = ri(rng, 1, 3 + diff);
    const den = ri(rng, base + 1, base + 4 + diff * 2);
    const mult = ri(rng, 2, 3 + diff);
    const frac = `${base}/${den}`;
    if (cpa === "concrete") {
      // pecahan dari gambar: n bagian diarsir dari total
      return {
        prompt: `Berapa pecahan bagian yang diarsir?`,
        answer: frac,
        visual: tenframe(2, Math.max(den, 2), "r".repeat(base) + ".".repeat(Math.max(0, den - base))),
        hint: "Diarsir dibagi total.",
      };
    }
    if (cpa === "pictorial") {
      return {
        prompt: `${base}/${den} senilai dengan? (kalikan atas-bawah)`,
        answer: `${base * mult}/${den * mult}`,
        hint: `Kalikan pembilang dan penyebut dengan ${mult}.`,
      };
    }
    return {
      prompt: `Pecahan senilai dari ${frac} dengan pengali ${mult} adalah?`,
      answer: `${base * mult}/${den * mult}`,
    };
  },
};

const k4Desimal: Skill = {
  id: "k4.desimal",
  grade: 4,
  topic: "Desimal",
  title: "Pecahan Desimal",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const tenths = ri(rng, 1, 9 + diff * 9);
    const asFrac = `${tenths}/10`;
    const asDec = (tenths / 10).toFixed(1);
    if (cpa === "concrete" || cpa === "pictorial") {
      return {
        prompt: `${asFrac} ditulis sebagai desimal adalah?`,
        answer: asDec,
        visual: tenframe(2, 5, reds(Math.min(tenths, 10), 10)),
        hint: "Persepuluh jadi satu angka di belakang koma.",
      };
    }
    if (diff === 0) {
      return {
        prompt: `${asFrac} = ? (desimal)`,
        answer: asDec,
      };
    }
    const hundredths = ri(rng, 1, 9);
    return {
      prompt: `${tenths}/10 + ${hundredths}/100 = ? (desimal, pakai titik)`,
      answer: (tenths / 10 + hundredths / 100).toFixed(2),
    };
  },
};

const k4KpkFpb: Skill = {
  id: "k4.kpk-fpb",
  grade: 4,
  topic: "Bilangan",
  title: "KPK dan FPB",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const a = ri(rng, 2, 6 + diff * 4);
    const b = ri(rng, 2, 6 + diff * 4);
    const wantKpk = rng() < 0.5;
    if (wantKpk) {
      let m = a;
      while (m % b !== 0) m += a;
      return {
        prompt: `KPK dari ${a} dan ${b} adalah?`,
        answer: String(m),
        choices: numChoices(rng, m, 6),
        hint: cpa === "abstract" ? undefined : "Daftar kelipatan kedua bilangan, cari yang sama.",
      };
    }
    let g = a;
    while (b % g !== 0) g -= 1;
    return {
      prompt: `FPB dari ${a} dan ${b} adalah?`,
      answer: String(g),
      choices: numChoices(rng, g, 4),
      hint: cpa === "abstract" ? undefined : "Cari pembagi terbesar yang sama.",
    };
  },
};

const k4KelilingLuas: Skill = {
  id: "k4.keliling-luas",
  grade: 4,
  topic: "Pengukuran",
  title: "Keliling dan Luas",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const p = ri(rng, 3, 8 + diff * 4);
    const l = ri(rng, 2, 6 + diff * 3);
    const askLuas = rng() < 0.5;
    if (cpa !== "abstract") {
      return {
        prompt: `Luas persegi panjang ${p} x ${l} (satuan kotak) adalah?`,
        answer: String(p * l),
        visual: tenframe(Math.min(p, 4), Math.min(l, 5), "r".repeat(Math.min(p * l, 20))),
        hint: "Hitung kotak: panjang kali lebar.",
      };
    }
    return askLuas
      ? { prompt: `Luas persegi panjang panjang ${p} lebar ${l} adalah?`, answer: String(p * l), choices: numChoices(rng, p * l, 8) }
      : { prompt: `Keliling persegi panjang panjang ${p} lebar ${l} adalah?`, answer: String(2 * (p + l)), choices: numChoices(rng, 2 * (p + l), 8) };
  },
};

// ---------- kelas 5 ----------

const k5OperasiPecahan: Skill = {
  id: "k5.operasi-pecahan",
  grade: 5,
  topic: "Pecahan",
  title: "Operasi Pecahan",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const d1 = ri(rng, 2, 5 + diff * 3);
    let d2 = ri(rng, 2, 5 + diff * 3);
    if (d2 === d1) d2 += 1;
    const n1 = ri(rng, 1, d1 - 1);
    const n2 = ri(rng, 1, d2 - 1);
    const sum = simplify(n1 * d2 + n2 * d1, d1 * d2);
    if (cpa !== "abstract") {
      return {
        prompt: `${n1}/${d1} + ${n2}/${d2} = ? (paling sederhana)`,
        answer: `${sum[0]}/${sum[1]}`,
        visual: tenframe(2, 5, reds(n1 + n2, 10)),
        hint: "Samakan penyebut dulu, lalu jumlahkan.",
      };
    }
    return {
      prompt: `${n1}/${d1} + ${n2}/${d2} = ? (paling sederhana)`,
      answer: `${sum[0]}/${sum[1]}`,
    };
  },
};

const k5Volume: Skill = {
  id: "k5.volume",
  grade: 5,
  topic: "Pengukuran",
  title: "Volume Balok dan Kubus",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const p = ri(rng, 2, 6 + diff * 3);
    const l = ri(rng, 2, 5 + diff * 3);
    const t = ri(rng, 2, 5 + diff * 2);
    if (cpa !== "abstract") {
      return {
        prompt: `Volume balok ${p} x ${l} x ${t} (satuan kubus) adalah?`,
        answer: String(p * l * t),
        visual: tenframe(2, 5, reds(Math.min(p * l, 10), 10)),
        hint: "Luas alas kali tinggi.",
      };
    }
    return {
      prompt: `Volume balok panjang ${p}, lebar ${l}, tinggi ${t} adalah?`,
      answer: String(p * l * t),
      choices: numChoices(rng, p * l * t, 12),
    };
  },
};

const k5RataRata: Skill = {
  id: "k5.rata-rata",
  grade: 5,
  topic: "Statistika",
  title: "Rata-rata",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const n = 3 + diff;
    const nums: number[] = [];
    const mean = ri(rng, 5, 12);
    for (let i = 0; i < n - 1; i++) nums.push(ri(rng, 1, mean * 2));
    const last = mean * n - nums.reduce((a, b) => a + b, 0);
    nums.push(last);
    if (cpa !== "abstract") {
      return {
        prompt: `Rata-rata dari ${nums.join(", ")} adalah?`,
        answer: String(mean),
        visual: tenframe(2, 5, reds(mean, 10)),
        hint: "Jumlahkan semua, bagi banyak data.",
      };
    }
    return {
      prompt: `Rata-rata dari ${nums.join(", ")} adalah?`,
      answer: String(mean),
      choices: numChoices(rng, mean, 4),
    };
  },
};

// ---------- kelas 6 ----------

const k6Persen: Skill = {
  id: "k6.persen",
  grade: 6,
  topic: "Persen",
  title: "Persen",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const pct = pick(rng, diff === 0 ? [10, 25, 50, 100] : diff === 1 ? [20, 30, 40, 75] : [5, 15, 35, 65]);
    const base = ri(rng, 2, 10 + diff * 10) * (pct === 100 ? 1 : 2);
    const val = (pct / 100) * base;
    if (cpa !== "abstract") {
      return {
        prompt: `${pct}% dari ${base} adalah?`,
        answer: String(val),
        visual: tenframe(2, 5, reds(Math.round(val) % 10 || 1, 10)),
        hint: "Per seratus. 50% = setengah.",
      };
    }
    return {
      prompt: `${pct}% dari ${base} adalah?`,
      answer: String(val),
      choices: numChoices(rng, val, Math.max(2, Math.round(val / 3))),
    };
  },
};

const k6Kecepatan: Skill = {
  id: "k6.kecepatan",
  grade: 6,
  topic: "Pengukuran",
  title: "Kecepatan dan Debit",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const v = ri(rng, 2, 8 + diff * 4);
    const t = ri(rng, 2, 6 + diff * 2);
    const s = v * t;
    if (rng() < 0.5) {
      return {
        prompt: `Budi jarak ${s} km dalam ${t} jam. Kecepatannya (km/jam)?`,
        answer: String(v),
        choices: numChoices(rng, v, 5),
        hint: cpa !== "abstract" ? "Jarak dibagi waktu." : undefined,
      };
    }
    const debit = ri(rng, 2, 9 + diff * 3);
    const menit = ri(rng, 2, 6);
    return {
      prompt: `Air ${debit} liter/menit selama ${menit} menit. Total liter?`,
      answer: String(debit * menit),
      choices: numChoices(rng, debit * menit, 6),
    };
  },
};

const k6BilanganBulat: Skill = {
  id: "k6.bilangan-bulat",
  grade: 6,
  topic: "Bilangan",
  title: "Bilangan Bulat Negatif",
  levels: [0, 1, 2],
  gen: (rng, cpa, diff): QuestionDraft => {
    const a = ri(rng, 1, 9 + diff * 5);
    const b = ri(rng, 1, 9 + diff * 5);
    if (cpa !== "abstract") {
      // suhu: concrete konteks naik-turun
      return {
        prompt: `Suhu pagi ${a}°C, turun ${b}°C. Suhu sekarang?`,
        answer: String(a - b),
        visual: a >= b ? tenframe(2, 5, reds(a - b, 10)) : undefined,
        hint: "Turun berarti dikurangi.",
      };
    }
    return {
      prompt: `${a} - ${b} = ?`,
      answer: String(a - b),
      choices: numChoices(rng, a - b, 5),
    };
  },
};

// ---------- tree ----------

export const SKILLS: Skill[] = [
  k4Bilangan,
  k4PecahanSetara,
  k4Desimal,
  k4KpkFpb,
  k4KelilingLuas,
  k5OperasiPecahan,
  k5Volume,
  k5RataRata,
  k6Persen,
  k6Kecepatan,
  k6BilanganBulat,
];

export function skillsForGrade(grade: 4 | 5 | 6): Skill[] {
  return SKILLS.filter((s) => s.grade === grade);
}
