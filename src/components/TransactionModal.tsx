import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { formatRupiah, getTodayDateString, parseIntegerRupiah } from '@/lib/format';
import type { Category, Transaction, TransactionInput, TransactionType } from '@/types';

interface TransactionModalProps {
  open: boolean;
  categories: Category[];
  initialTransaction?: Transaction | null;
  defaultMonthKey?: string;
  onClose: () => void;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function TransactionModal({
  open,
  categories,
  initialTransaction,
  defaultMonthKey,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountRaw(String(Math.round(initialTransaction.amount)));
      setCategoryId(initialTransaction.categoryId);
      setDate(initialTransaction.date);
      setNote(initialTransaction.note);
    } else {
      const today = getTodayDateString();
      const initialDate =
        defaultMonthKey && !today.startsWith(defaultMonthKey)
          ? `${defaultMonthKey}-01`
          : today;
      setType('expense');
      setAmountRaw('');
      setDate(initialDate);
      setNote('');
      const firstExpense = categories.find((c) => c.type === 'expense');
      setCategoryId(firstExpense?.id || '');
    }
  }, [open, initialTransaction, defaultMonthKey, categories]);

  useEffect(() => {
    if (!open) return;
    const stillValid = filteredCategories.some((c) => c.id === categoryId);
    if (!stillValid) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, categoryId, open]);

  if (!open) return null;

  const parsedAmount = parseIntegerRupiah(amountRaw);
  const formattedDisplay =
    amountRaw.length > 0
      ? new Intl.NumberFormat('id-ID').format(parsedAmount)
      : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedAmount <= 0) {
      setError('Nominal wajib lebih besar dari Rp 0.');
      return;
    }

    if (!date) {
      setError('Tanggal transaksi wajib dipilih.');
      return;
    }

    const selectedCat = filteredCategories.find((c) => c.id === categoryId);
    if (!selectedCat) {
      setError('Silakan pilih kategori terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        date,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan transaksi. Coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2
            id="tx-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {initialTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup formulir"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Tipe Transaksi */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Tipe Transaksi
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Nominal Rupiah */}
          <div>
            <label
              htmlFor="tx-amount"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Nominal (Rupiah)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                Rp
              </span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={formattedDisplay}
                onChange={(e) => setAmountRaw(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-4 text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Terbaca: {formatRupiah(parsedAmount)}
              </p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label
              htmlFor="tx-category"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Kategori
            </label>
            <select
              id="tx-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {filteredCategories.length === 0 ? (
                <option value="">Belum ada kategori</option>
              ) : (
                filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Tanggal */}
          <div>
            <label
              htmlFor="tx-date"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Tanggal
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Catatan */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Catatan (Opsional)
            </label>
            <input
              id="tx-note"
              type="text"
              maxLength={140}
              placeholder="Contoh: Makan siang bersama tim"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || filteredCategories.length === 0}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
