## Problem Statement

Anak kelas 4-6 SD di Indonesia perlu latihan matematika harian yang teratur, tapi worksheet kertas (model Kumon) membosankan, tidak ada umpan balik instan, dan orang tua sulit melacak kemajuan. App matematika yang ada umumnya: (a) game-nya menutupi belajar, (b) tidak offline (kuota HP terbatas), (c) tidak mengajarkan *mengapa*, hanya hafalan prosedur.

## Solution

PWA mobile-first berbahasa Indonesia: sesi latihan harian 15 menit yang menggabungkan disiplin Kumon (langkah kecil, mastery gate, latihan harian, kecepatan + akurasi) dengan pemahaman konseptual CPA Singapura (concrete → pictorial → abstract per topik baru). Gamifikasi melekat pada materi — XP, streak harian, progress bar per skill, badge mastery — bukan hiasan. Offline-first penuh: semua progres di perangkat (localStorage), zero-backend.

## User Stories

1. As an anak kelas 4-6, I want memulai sesi latihan harian dengan satu tap, so that rutinitas 15 menit terasa ringan, bukan beban.
2. As an anak, I want soal pertama sesi selalu mudah (yang sudah saya kuasai), so that saya mulai dengan rasa berhasil seperti prinsip Kumon.
3. As an anak, I want melihat timer per set soal, so that saya termotivasi menghitung cepat dan tepat.
4. As an anak, I want umpan balik instan (benar/salah + animasi) setiap jawaban, so that saya tahu langsung posisi saya tanpa menunggu.
5. As an anak, I want jawaban salah ditunjukkan koreksinya dengan langkah visual, so that saya belajar dari kesalahan, bukan sekadar disuruh ulang.
6. As an anak, I want XP naik dengan animasi angka saat jawaban benar, so that kemajuan saya terasa langsung.
7. As an anak, I want melihat streak harian saya, so that saya termotivasi latihan setiap hari tanpa putus.
8. As an anak, I want badge saat menyelesaikan satu skill (mastery), so that ada momen pencapaian yang bisa saya pamerkan.
9. As an anak, I want topik baru diperkenalkan lewat gambar/benda visual dulu sebelum angka, so that saya paham *mengapa*, bukan hanya *bagaimana* (CPA).
10. As an anak, I want masuk kembali ke representasi gambar saat saya salah terus di soal abstrak, so that saya tidak stuck dan frustrasi.
11. As an anak, I want tingkat kesulitan naik pelan-pelan (small steps), so that saya tidak pernah merasa soal "mustahil".
12. As an anak, I want app bisa dibuka tanpa internet, so that latihan tidak terputus saat kuota habis.
13. As an anak, I want memilih avatar/tema warna, so that app terasa milik saya.
14. As an orang tua, I want melihat ringkasan kemajuan anak (skill dikuasai, streak, waktu latihan), so that saya tahu apakah rutinitas berjalan.
15. As an orang tua, I want semua data tersimpan lokal di perangkat, so that data anak tidak dikirim ke server mana pun.
16. As an orang tua, I want tidak ada iklan dan tidak ada pembelian dalam app, so that anak tidak terdistraksi atau berbelanja.
17. As an anak kelas 4, I want materi sesuai kurikulum kelas saya (pecahan, desimal, keliling-luas, KPK/FPB), so that yang saya latih nyambung dengan sekolah.
18. As an anak kelas 5, I want materi operasi pecahan/desimal lanjutan, volume, rata-rata, so that yang saya latih nyambung dengan sekolah.
19. As an anak kelas 6, I want materi persen, kecepatan-debit, bilangan bulat, so that yang saya latih nyambung dengan sekolah.
20. As an anak, I want sesi berakhir dengan ringkasan + confetti, so that menyelesaikan sesi terasa seperti menang.
21. As an anak, I want tombol besar dan mudah disentuh (target sentuh ≥44px), so that saya tidak salah tekan di HP kecil.
22. As an anak yang kesulitan, I want app menurunkan kesulitan otomatis saat saya salah berkali-kali, so that saya tidak menyerah (adaptive difficulty).
23. As an anak yang mahir, I want app menaikkan kesulitan otomatis saat saya benar terus dengan cepat, so that saya tidak bosan.
24. As an orang tua, I want menginstal app ke home screen HP (PWA install), so that terasa seperti app native tanpa app store.

## Implementation Decisions

- **Stack**: Vite + React 19 + TypeScript strict. PWA via vite-plugin-pwa (workbox precache, autoUpdate). Zero-backend.
- **Penyimpanan**: `localStorage` dengan adapter tunggal (`storage` module) — satu titik akses, typed, dengan versioning schema. Naik ke IndexedDB (Dexie) hanya jika data riwayat tumbuh besar. Keputusan sadar: YAGNI, localStorage cukup untuk progres per-skill.
- **Seam utama (satu-satunya yang di-test)**: modul `engine` — pure functions: `nextQuestion(profile, skillState) → Question`, `gradeAnswer(question, answer) → Result`, `updateMastery(skillState, result) → skillState'`, `mapXp(xp) → Level`. Semua logika mastery/adaptive/XP ada di sini sebagai fungsi murni. UI adalah lapisan render di atasnya; storage adapter di-inject saat test.
- **Model data** (dari prototipe skema):
  ```ts
  type SkillId = string; // "k4.pecahan-setara" dll
  type SkillState = { correctStreak: number; failStreak: number; mastery: 0|1; lastSeen: number };
  type Profile = { xp: number; streakDays: number; lastSessionDate: string; skills: Record<SkillId, SkillState> };
  type Question = { id: string; skill: SkillId; cpaStage: "concrete"|"pictorial"|"abstract"; prompt: string; visual?: string; answer: string; choices?: string[] };
  ```
- **Kurikulum**: konten per kelas dideklarasikan sebagai data statis (skill tree per kelas 4/5/6, Kurikulum Merdeka), dipisah dari mesin. Topik: kelas 4 (pecahan, desimal, KPK/FPB, keliling-luas), kelas 5 (operasi pecahan/desimal, volume, rata-rata), kelas 6 (persen, kecepatan-debit, bilangan bulat).
- **CPA progression**: tiap skill punya soal bertanda `cpaStage`. Skill baru mulai di concrete/pictorial; mesin naik ke abstract hanya setelah benar N berturut-turut di stage bawah. Salah berkali-kali di abstract → turun kembali ke pictorial (jalan keluar Kumon "kembali satu langkah").
- **Mastery gate**: skill dianggap dikuasai saat akurasi ≥ threshold dan waktu per soal di bawah target (Kumon: cepat + tepat). Mastery membuka skill berikutnya di tree + badge.
- **Sesi harian**: struktur tetap — warm-up (soal mudah yang sudah dikuasai), drill bertimer, mastery check. Durasi target ±15 menit, lalu ringkasan + confetti (canvas-confetti).
- **Gamifikasi**: XP per jawaban benar (bonus kecepatan), level dari XP via `mapXp`, streak dihitung dari `lastSessionDate`, badge per mastery. Semua angka dinamis lewat slot-text (text roll). Leaderboard tidak ada.
- **Animasi/transisi**: transisi.dev skill dipasang di repo untuk konsistensi motion tokens.
- **Bahasa UI**: Indonesia penuh. Ikon Lucide. Aset visual Kenney (CC0) bila perlu ilustrasi.
- **Aksesibilitas**: target sentuh ≥44px, kontras AA, `touch-action: manipulation`, tanpa timer visual yang memicu panik (timer tersembunyi opsional).

## Testing Decisions

- Yang di-test: **modul `engine` saja** — perilaku eksternalnya (mastery gate, CPA stage transitions, adaptive difficulty, XP/level, streak calc) adalah inti produk. Test = fungsi murni input→output, cepat, tanpa mock.
- Tidak di-test: komponen render React (visual, dicek manual/PWA dev tools), adapter localStorage (thin), konten soal (data statis).
- Good test: menyatakan perilaku yang dijanjikan user-facing ("anak yang salah 3× di abstract turun ke pictorial"), bukan internal state.
- Prior art: tidak ada (greenfield). Test pertama jadi contoh gaya: assert-based via Vitest.
- Satu self-check runnable disertakan sejak awal: `npm test` menjalankan suite engine.

## Out of Scope

- Multiplayer, leaderboard publik, akun/cloud sync.
- Backend atau telemetri apa pun (privacy by design).
- Soal cerita panjang (word problems) — v1 murni drill + visual CPA.
- Editor konten; soal ditulis sebagai data statis oleh developer.
- iOS App Store / Play Store wrapper.
- Suara/narasi.

## Further Notes

- Research methodology tersimpan di `RESEARCH.md` (Kumon, CPA, gamifikasi, pola PWA).
- Ikon PWA (192/512 maskable) harus ditambahkan sebelum deploy pertama.
- Fallback Torph (place-value digit morph) disimpan untuk soal nilai tempat kelas 4 — jangan install sampai dibutuhkan.
