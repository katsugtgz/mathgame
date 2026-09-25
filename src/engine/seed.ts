import type { CpaStage, SkillId } from "./types";

/** Satu soal statis hasil kurasi — dijamin layak, dipakai untuk warm-up/awal sesi. */
export type SeedQuestion = {
  id: string;
  grade: 4 | 5 | 6;
  skill: SkillId;
  cpaStage: CpaStage;
  prompt: string;
  answer: string;
  choices?: string[];
  visual?: string;
  hint?: string;
};

/** Bank soal awal hasil kurasi manual (gambar kartu belajar: ten-frame + kucing). */
export const SEED_BANK: SeedQuestion[] = [
  // ---------- kelas 4 ----------
  {
    id: "k4.bilangan-1.s1",
    grade: 4,
    skill: "k4.bilangan-1",
    cpaStage: "concrete",
    prompt: "Ada berapa titik pada gambar?",
    answer: "7",
    visual: "tenframe:2x5:rrrrrrr...",
    choices: ["6", "7", "8", "9"],
    hint: "Hitung satu per satu.",
  },
  {
    id: "k4.bilangan-1.s2",
    grade: 4,
    skill: "k4.bilangan-1",
    cpaStage: "pictorial",
    prompt: "Ada berapa titik pada gambar?",
    answer: "13",
    visual: "tenframe:4x5:rrrrrrrrrrrrr......",
    choices: ["12", "13", "14", "15"],
    hint: "Satu baris penuh = 5.",
  },
  {
    id: "k4.pecahan-setara.s1",
    grade: 4,
    skill: "k4.pecahan-setara",
    cpaStage: "concrete",
    prompt: "Berapa pecahan bagian yang diarsir?",
    answer: "1/2",
    visual: "tenframe:1x2:r.",
    hint: "Diarsir dibagi total.",
  },
  {
    id: "k4.pecahan-setara.s2",
    grade: 4,
    skill: "k4.pecahan-setara",
    cpaStage: "abstract",
    prompt: "Pecahan senilai dari 1/3 dengan pengali 2 adalah?",
    answer: "2/6",
  },
  {
    id: "k4.desimal.s1",
    grade: 4,
    skill: "k4.desimal",
    cpaStage: "pictorial",
    prompt: "3/10 ditulis sebagai desimal adalah?",
    answer: "0.3",
    visual: "tenframe:2x5:rrr.......",
    hint: "Persepuluh jadi satu angka di belakang koma.",
  },
  {
    id: "k4.kpk-fpb.s1",
    grade: 4,
    skill: "k4.kpk-fpb",
    cpaStage: "abstract",
    prompt: "KPK dari 2 dan 3 adalah?",
    answer: "6",
    choices: ["5", "6", "8", "12"],
  },
  {
    id: "k4.keliling-luas.s1",
    grade: 4,
    skill: "k4.keliling-luas",
    cpaStage: "concrete",
    prompt: "Luas persegi panjang 3 x 2 (satuan kotak) adalah?",
    answer: "6",
    visual: "tenframe:2x3:rrrrrr",
    hint: "Hitung kotak: panjang kali lebar.",
  },
  // ---------- kelas 5 ----------
  {
    id: "k5.operasi-pecahan.s1",
    grade: 5,
    skill: "k5.operasi-pecahan",
    cpaStage: "pictorial",
    prompt: "1/2 + 1/4 = ? (paling sederhana)",
    answer: "3/4",
    visual: "tenframe:2x5:rrr.......",
    hint: "Samakan penyebut dulu, lalu jumlahkan.",
  },
  {
    id: "k5.volume.s1",
    grade: 5,
    skill: "k5.volume",
    cpaStage: "pictorial",
    prompt: "Volume balok 2 x 3 x 2 (satuan kubus) adalah?",
    answer: "12",
    visual: "tenframe:2x5:rrrrrr....",
    hint: "Luas alas kali tinggi.",
  },
  {
    id: "k5.rata-rata.s1",
    grade: 5,
    skill: "k5.rata-rata",
    cpaStage: "abstract",
    prompt: "Rata-rata dari 4, 6, 8 adalah?",
    answer: "6",
    choices: ["4", "5", "6", "8"],
  },
  {
    id: "k5.operasi-pecahan.s2",
    grade: 5,
    skill: "k5.operasi-pecahan",
    cpaStage: "abstract",
    prompt: "2/3 - 1/6 = ? (paling sederhana)",
    answer: "1/2",
  },
  // ---------- kelas 6 ----------
  {
    id: "k6.persen.s1",
    grade: 6,
    skill: "k6.persen",
    cpaStage: "concrete",
    prompt: "50% dari 8 adalah?",
    answer: "4",
    visual: "tenframe:2x5:rrrr.......",
    hint: "50% = setengah.",
  },
  {
    id: "k6.persen.s2",
    grade: 6,
    skill: "k6.persen",
    cpaStage: "abstract",
    prompt: "25% dari 20 adalah?",
    answer: "5",
    choices: ["4", "5", "10", "15"],
  },
  {
    id: "k6.kecepatan.s1",
    grade: 6,
    skill: "k6.kecepatan",
    cpaStage: "pictorial",
    prompt: "Budi jarak 10 km dalam 2 jam. Kecepatannya (km/jam)?",
    answer: "5",
    choices: ["4", "5", "8", "20"],
    hint: "Jarak dibagi waktu.",
  },
  {
    id: "k6.bilangan-bulat.s1",
    grade: 6,
    skill: "k6.bilangan-bulat",
    cpaStage: "pictorial",
    prompt: "Suhu pagi 3°C, turun 5°C. Suhu sekarang?",
    answer: "-2",
    hint: "Turun berarti dikurangi.",
  },
];

export function seedsFor(grade: 4 | 5 | 6): SeedQuestion[] {
  return SEED_BANK.filter((s) => s.grade === grade);
}
