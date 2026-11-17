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
3. Isi keenam environment variable Firebase di file `.env`.
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
4. Hapus aturan default yang ada, lalu salin seluruh isi file `firestore.rules` dari repositori ini:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. Klik tombol **Publish** untuk mengaktifkan aturan keamanan tersebut.

## Deploy ke Vercel

1. Push repositori ke GitHub/GitLab/Bitbucket.
2. Impor proyek ke Vercel dengan preset **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
3. Masukkan keenam environment variable `VITE_FIREBASE_*` pada menu **Settings -> Environment Variables** di Vercel.
4. Setelah mendapatkan domain Vercel (misalnya `duitku.vercel.app`), buka **Firebase Console -> Authentication -> Settings -> Authorized domains**, lalu tambahkan domain Vercel Anda agar login Google tidak ditolak (`auth/unauthorized-domain`).
