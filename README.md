# DuitKu — Pencatat Keuangan Pribadi

DuitKu adalah aplikasi web pencatat keuangan pribadi berbasis **Single Page Application (SPA)** statis menggunakan **Vite + React + TypeScript + Tailwind CSS**, dengan penyimpanan dan autentikasi langsung ke **Firebase (Spark Plan gratis)**.

## Fitur Utama

- **Autentikasi Google**: Siapa saja dapat masuk dengan akun Google (`signInWithPopup`). Data setiap pengguna terisolasi di path `users/{uid}/...`.
- **Dashboard Analitik**: Ringkasan Total Pemasukan, Total Pengeluaran, Saldo, grafik pie pengeluaran per kategori, dan grafik batang arus kas 6 bulan terakhir.
- **Pencatatan Transaksi**: Tambah, edit, dan hapus (dengan konfirmasi) transaksi dalam nominal Rupiah bulat (`> 0` dan `< Rp 1.000.000.000.000`), lengkap dengan pencarian catatan, filter tipe (`Semua`, `Pengeluaran`, `Pemasukan`), dan filter bulan/tahun.
- **Kategori Kustom & Bawaan**: Kategori bawaan otomatis dibuat saat login pertama kali, dan pengguna dapat menambah/menghapus kategori dengan warna pilihan.
- **Budget Bulanan**: Pengaturan batas pengeluaran total bulanan dan per kategori pengeluaran dengan indikator progress hijau (`< 80%`), kuning (`80%–99%`), dan merah (`>= 100%`).
- **Ekspor CSV**: Unduh transaksi bulan terpilih dalam format CSV pemisah titik koma (`;`), BOM UTF-8 (siap dibuka langsung di Excel Indonesia), dan proteksi CSV injection.
- **Responsif Mobile-First & Mode Gelap/Terang**: Navigasi sidebar desktop, bottom tab bar untuk mobile, serta dukungan tema gelap dan terang dengan warna utama hijau zamrud.

## Struktur Proyek

```text
.
├── .env.example
├── .gitignore
├── README.md
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── firebase.ts
    ├── index.css
    ├── main.tsx
    ├── types.ts
    ├── components/
    │   ├── ConfirmModal.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── Layout.tsx
    │   ├── MonthYearSelector.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── SetupMissingScreen.tsx
    │   └── TransactionModal.tsx
    ├── lib/
    │   ├── authContext.tsx
    │   ├── csv.ts
    │   ├── firestoreService.ts
    │   ├── format.ts
    │   ├── periodContext.tsx
    │   ├── themeContext.tsx
    │   └── toastContext.tsx
    └── pages/
        ├── BudgetPage.tsx
        ├── CategoriesPage.tsx
        ├── DashboardPage.tsx
        ├── LoginPage.tsx
        └── TransactionsPage.tsx
```

## Menjalankan di Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
3. Isi keenam environment variable Firebase di file `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Bangun untuk produksi:
   ```bash
   npm run build
   ```

## Cara Memasang Security Rules (`firestore.rules`) di Firebase Console

Agar data setiap pengguna terlindungi dan tervalidasi di level database:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih proyek Firebase Anda.
2. Pada menu sebelah kiri, klik **Build** -> **Firestore Database**.
3. Pilih tab **Rules** di bagian atas halaman Firestore Database.
4. Hapus aturan default yang ada, lalu salin seluruh isi file `firestore.rules` dari root repositori ini ke editor Rules di Firebase Console (sudah membatasi akses per `uid`, memvalidasi skema field `transactions`, `categories`, `budgets`, serta `meta/init`, dan menolak akses ke path lain).
5. Klik tombol **Publish** untuk mengaktifkan aturan keamanan tersebut.

## Deploy ke Vercel

1. Push repositori ke GitHub/GitLab/Bitbucket.
2. Impor proyek ke Vercel dengan preset **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
3. Masukkan keenam environment variable `VITE_FIREBASE_*` pada menu **Settings -> Environment Variables** di Vercel.
4. Setelah mendapatkan domain Vercel (misalnya `duitku.vercel.app`), buka **Firebase Console -> Authentication -> Settings -> Authorized domains**, lalu tambahkan domain Vercel Anda agar login Google tidak ditolak (`auth/unauthorized-domain`).
