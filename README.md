# DuitKu — Pencatat Keuangan Pribadi

DuitKu adalah aplikasi web pencatat keuangan pribadi berbasis **Single Page Application (SPA)** statis menggunakan **Vite + React + TypeScript + Tailwind CSS**, dengan penyimpanan dan autentikasi langsung ke **Firebase (Spark Plan gratis)**.

## Fitur Utama

- **Autentikasi Google**: Siapa saja dapat masuk dengan akun Google (`signInWithPopup`). Data setiap pengguna terisolasi di path `users/{uid}/...`.
- **Dashboard Analitik**: Ringkasan Total Pemasukan, Total Pengeluaran, Saldo, grafik pie pengeluaran per kategori, dan grafik batang arus kas 6 bulan terakhir.
- **Pencatatan Transaksi**: Tambah, edit, dan hapus (dengan konfirmasi) transaksi dalam nominal Rupiah bulat (`> 0`), lengkap dengan pencarian catatan dan filter bulan/tahun.
- **Kategori Kustom & Bawaan**: Kategori bawaan otomatis dibuat saat login pertama kali, dan pengguna dapat menambah/menghapus kategori dengan warna pilihan.
- **Budget Bulanan**: Pengaturan batas pengeluaran total bulanan dan per kategori pengeluaran dengan indikator progress hijau (`< 80%`), kuning (`80%–99%`), dan merah (`>= 100%`).
- **Ekspor CSV**: Unduh transaksi bulan terpilih dalam format CSV pemisah titik koma (`;`), BOM UTF-8 (siap dibuka langsung di Excel Indonesia), dan proteksi CSV injection.
- **Mode Gelap & Terang**: Antarmuka responsif mobile-first dengan tema hijau zamrud.

## Menjalankan di Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
3. Isi keenam environment variable Firebase di file `.env` (dan opsional `VITE_RECAPTCHA_SITE_KEY` jika mengaktifkan App Check).
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Bangun untuk produksi:
   ```bash
   npm run build
   ```

## Cara Memasang Security Rules (`firestore.rules`) di Firebase Console

Agar data setiap pengguna terlindungi dan tidak bisa dibaca/diubah oleh pengguna lain:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih proyek Firebase Anda.
2. Pada menu sebelah kiri, klik **Build** -> **Firestore Database**.
3. Pilih tab **Rules** di bagian atas halaman Firestore Database.
4. Hapus aturan default yang ada, lalu salin seluruh isi file `firestore.rules` dari root repositori ini ke editor Rules di Firebase Console (file `firestore.rules` sudah membatasi akses per `uid`, memvalidasi skema field per koleksi, serta menolak seluruh path di luar `users/{uid}/...`).
5. Klik tombol **Publish** untuk mengaktifkan aturan keamanan tersebut.

## Mengaktifkan Firebase App Check (reCAPTCHA v3)

App Check melindungi Firestore dan Authentication dari permintaan tidak sah. Aplikasi tetap berjalan normal jika `VITE_RECAPTCHA_SITE_KEY` dikosongkan (App Check otomatis dilewati).

1. Buka [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create) dan buat site key bertipe **reCAPTCHA v3** untuk domain Anda (misalnya `localhost` dan domain `.vercel.app`).
2. Salin **Site Key** ke variabel `VITE_RECAPTCHA_SITE_KEY` di `.env` / Vercel Environment Variables.
3. Di **Firebase Console -> Build -> App Check -> Apps**, pilih aplikasi web Anda, klik **reCAPTCHA v3**, lalu masukkan **Secret Key** dari langkah 1 dan simpan.
4. Saat menjalankan `npm run dev` di lokal, mode debug App Check otomatis aktif (`FIREBASE_APPCHECK_DEBUG_TOKEN = true`); buka DevTools Console browser untuk menyalin debug token lalu daftarkan di **App Check -> Apps -> Manage debug tokens** bila perlu.

## Deploy ke Vercel

1. Push repositori ke GitHub/GitLab/Bitbucket.
2. Impor proyek ke Vercel dengan preset **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
3. Masukkan keenam environment variable `VITE_FIREBASE_*` (serta `VITE_RECAPTCHA_SITE_KEY` jika memakai App Check) pada menu **Settings -> Environment Variables** di Vercel.
4. Setelah mendapatkan domain Vercel (misalnya `duitku.vercel.app`), buka **Firebase Console -> Authentication -> Settings -> Authorized domains**, lalu tambahkan domain Vercel Anda agar login Google tidak ditolak (`auth/unauthorized-domain`).
