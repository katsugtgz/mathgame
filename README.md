# MathGame

Latihan matematika harian untuk anak SD kelas 4 sampai 6. Aplikasi web yang bisa dipasang di HP, dipakai offline, dan tanpa akun.

## Apa ini

Anak latihan 15 menit sehari. Setiap sesi berisi 10 soal. Soal pertama selalu mudah supaya anak mulai dengan rasa berhasil. Kalau jawabannya salah, aplikasi menunjukkan jawaban benar beserta petunjuk visual, bukan sekadar menyuruh mengulang.

Semua kemajuan tersimpan di HP sendiri. Tidak ada server, tidak ada akun, tidak ada iklan, tidak ada pembelian di dalam aplikasi.

## Metode yang dipakai

Aplikasi ini menggabungkan dua pendekatan.

**Kumon**: langkah kecil dan teratur. Anak naik tingkat hanya setelah benar beberapa kali berturut-turut. Kecepatan dan ketepatan sama pentingnya. Satu skill dianggap tuntas setelah anak benar 5 kali berturut-turut di tingkat abstrak.

**CPA (Concrete-Pictorial-Abstract)** dari Singapura: topik baru mulai dari gambar, misalnya titik-titik pada kotak sepuluh, sebelum berlanjut ke angka saja. Kalau anak salah tiga kali berturut-turut, soal kembali ke bentuk gambar supaya anak paham alasannya, bukan menghafal.

Materinya mengikuti Kurikulum Merdeka: pecahan, desimal, KPK/FPB, keliling dan luas untuk kelas 4; operasi pecahan, volume, rata-rata untuk kelas 5; persen, kecepatan dan debit, bilangan bulat negatif untuk kelas 6.

## Fitur

- Sesi harian 10 soal dengan struktur tetap: pembuka dari bank soal, latihan bertingkat, penutup dengan konfeti.
- Naik-turun tingkat kesulitan otomatis. Anak yang salah terus turun satu tingkat. Anak yang benar terus naik.
- XP, level, streak harian, dan lencana untuk setiap skill yang tuntas.
- Semua soal bisa dijawab tanpa internet setelah aplikasi terpasang.
- Pilihan kelas 4, 5, atau 6 di halaman pengaturan.

## Cara pakai

1. Buka aplikasi di browser HP.
2. Pilih menu pasang (Install app / Tambahkan ke layar utama) di browser.
3. Selesai. Mulai besok, buka dari ikon di layar utama. Tanpa kuota pun tetap jalan.

## Cara pengembangan

Butuh Node.js 22.

```bash
npm ci
npm run dev        # server pengembangan
npm run verify     # build + test + cek kualitas + e2e, satu perintah
```

Perintah tunggalnya:

| Perintah | Fungsi |
|---|---|
| `npm run test:coverage` | unit test dengan batas coverage 100% untuk folder `src/engine` |
| `npm run quality` | penilaian react-doctor, wajib skor 100 |
| `npm run e2e` | test Playwright lewat build produksi (bukan server dev) |
| `npm run verify` | semua di atas berurutan |

Logika inti (naik-turun tingkat, mastery, XP, streak) ada di `src/engine` sebagai fungsi murni tanpa mock. Itu satu-satunya bagian yang diwajibkan coverage 100%. Antarmuka tidak punya test unit; yang menaunginya adalah e2e Playwright.

## Struktur

```
src/engine     logika inti murni + konten soal (yang di-test)
src/components komponen tampilan
e2e            test Playwright lewat server preview
```

## Kontribusi

PR dipersilakan. CI berjalan di setiap PR dan wajib hijau: typecheck, unit test, skor react-doctor 100, dan e2e. Jalankan `npm run verify` sebelum push.

## Lisensi

[MIT](LICENSE)
