import { KeyRound, ShieldAlert } from 'lucide-react';
import { missingFirebaseEnvVars } from '@/firebase';

export function SetupMissingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Konfigurasi Firebase Diperlukan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DuitKu membutuhkan environment variable Firebase untuk berjalan
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Salin file <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">.env.example</code> menjadi{' '}
          <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">.env</code> di lokal (atau isi di Environment Variables Vercel), lalu muat ulang halaman ini.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Variabel yang belum terisi:
          </div>
          <ul className="space-y-1.5">
            {missingFirebaseEnvVars.map((envName) => (
              <li
                key={envName}
                className="font-mono text-xs text-rose-600 dark:text-rose-400"
              >
                {envName}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
