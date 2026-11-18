import { Navigate } from 'react-router-dom';
import { AlertCircle, BarChart3, FileSpreadsheet, Loader2, Moon, ShieldCheck, Sun } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';

export function LoginPage() {
  const { user, loading, signingIn, authError, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Memuat aplikasi DuitKu...
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <BrandLogo size="md" />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Mode Gelap</span>
            </>
          )}
        </button>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-14 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15] [text-wrap:balance]">
              Catat keuangan harian lebih rapi dan terkendali.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Pantau arus kas pemasukan, pengeluaran, kategori, dan batas anggaran bulanan Anda dalam satu ruang kerja pribadi yang aman.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2.5" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Grafik Arus Kas
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ringkasan 6 bulan terakhir dan rincian kategori pengeluaran.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2.5" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Data Terpisah Aman
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Setiap akun memiliki ruang data pribadi yang hanya dapat diakses pemiliknya.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2.5" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Ekspor CSV Excel
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Unduh laporan bulanan siap buka di Microsoft Excel Indonesia.
                </p>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Mulai Catat Keuangan
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Masuk atau daftar instan menggunakan akun Google Anda. Kategori bawaan akan langsung disiapkan otomatis.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 p-3.5 text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-medium leading-snug">{authError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={signingIn}
                className="mt-6 w-full min-h-[48px] inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menghubungkan ke Google...</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </span>
                    <span>Masuk dengan Google</span>
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Dengan masuk, catatan Anda tersimpan langsung di Google Cloud Firestore milik proyek ini.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
