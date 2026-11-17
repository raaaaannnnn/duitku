import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useAuth } from '@/lib/authContext';
import {
  createCategory,
  deleteCategory,
  subscribeCategories,
} from '@/lib/firestoreService';
import { useToast } from '@/lib/toastContext';
import type { Category, TransactionType } from '@/types';

const COLOR_SWATCHES = [
  '#10b981',
  '#059669',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#64748b',
];

export function CategoriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState<string>(COLOR_SWATCHES[0]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeCategories(
      user.uid,
      (list) => {
        setCategories(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
        showToast('Gagal memuat daftar kategori.', 'error');
      }
    );
    return () => unsub();
  }, [user, showToast]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Nama kategori wajib diisi.', 'error');
      return;
    }

    const exists = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      showToast('Kategori dengan nama tersebut sudah ada.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createCategory(user.uid, {
        name: trimmed,
        type,
        color,
      });
      setName('');
      showToast(`Kategori "${trimmed}" berhasil ditambahkan.`, 'success');
    } catch {
      showToast('Gagal menambahkan kategori.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deletingCat) return;
    setDeleting(true);
    try {
      await deleteCategory(user.uid, deletingCat.id);
      showToast(`Kategori "${deletingCat.name}" berhasil dihapus.`, 'success');
      setDeletingCat(null);
    } catch {
      showToast('Gagal menghapus kategori.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kategori Transaksi
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tambahkan atau atur kategori pengeluaran dan pemasukan sesuai kebutuhan Anda
        </p>
      </div>

      {/* Add Category Form */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Tambah Kategori Baru
        </h2>

        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label
              htmlFor="cat-name"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Nama Kategori
            </label>
            <input
              id="cat-name"
              type="text"
              maxLength={40}
              placeholder="Contoh: Kopi & Camilan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="cat-type"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Tipe
            </label>
            <select
              id="cat-type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Warna Label
            </span>
            <div className="flex items-center gap-1.5 flex-wrap min-h-[42px]">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={`Pilih warna ${swatch}`}
                  className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                    color.toLowerCase() === swatch.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Pilih warna kustom"
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Tambah</span>
            </button>
          </div>
        </form>
      </section>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Kategori Pengeluaran
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {expenseCategories.length} kategori
            </span>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : expenseCategories.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              Belum ada kategori pengeluaran.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenseCategories.map((cat) => (
                <li
                  key={cat.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingCat(cat)}
                    aria-label={`Hapus kategori ${cat.name}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Income Categories */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Kategori Pemasukan
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {incomeCategories.length} kategori
            </span>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : incomeCategories.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              Belum ada kategori pemasukan.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {incomeCategories.map((cat) => (
                <li
                  key={cat.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingCat(cat)}
                    aria-label={`Hapus kategori ${cat.name}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deletingCat)}
        title="Hapus Kategori?"
        description={
          deletingCat
            ? `Kategori "${deletingCat.name}" akan dihapus dari daftar pilihan. Transaksi lama yang sudah tercatat tetap aman tersimpan.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onCancel={() => setDeletingCat(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
