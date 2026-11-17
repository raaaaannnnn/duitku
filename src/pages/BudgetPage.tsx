import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, Loader2, PiggyBank, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MonthYearSelector } from '@/components/MonthYearSelector';
import { useAuth } from '@/lib/authContext';
import {
  deleteBudget,
  subscribeCategories,
  subscribeMonthBudgets,
  subscribeMonthTransactions,
  upsertBudget,
} from '@/lib/firestoreService';
import { formatMonthLabel, formatRupiah, parseIntegerRupiah } from '@/lib/format';
import { usePeriod } from '@/lib/periodContext';
import { useToast } from '@/lib/toastContext';
import type { Budget, Category, Transaction } from '@/types';

interface BudgetTarget {
  categoryId: string | null;
  label: string;
  currentLimit: number | null;
  docId: string | null;
}

function getProgressMeta(spent: number, limit: number) {
  const ratio = limit > 0 ? (spent / limit) * 100 : 0;
  const pctRounded = Math.round(ratio);
  const remaining = limit - spent;

  if (ratio >= 100) {
    return {
      pctRounded,
      barWidth: 100,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      statusLabel: 'Melebihi Batas',
      remaining,
    };
  }
  if (ratio >= 80) {
    return {
      pctRounded,
      barWidth: pctRounded,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      statusLabel: 'Mendekati Batas',
      remaining,
    };
  }
  return {
    pctRounded,
    barWidth: pctRounded,
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    statusLabel: 'Aman',
    remaining,
  };
}

export function BudgetPage() {
  const { user } = useAuth();
  const { year, month, monthKey, setPeriod } = usePeriod();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [editingTarget, setEditingTarget] = useState<BudgetTarget | null>(null);
  const [limitRaw, setLimitRaw] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingBudget, setDeletingBudget] = useState<{
    docId: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubCat = subscribeCategories(
      user.uid,
      (list) => setCategories(list),
      () => showToast('Gagal memuat kategori.', 'error')
    );

    const unsubTx = subscribeMonthTransactions(
      user.uid,
      monthKey,
      (list) => setTransactions(list),
      () => showToast('Gagal memuat pengeluaran bulan ini.', 'error')
    );

    const unsubBudgets = subscribeMonthBudgets(
      user.uid,
      monthKey,
      (list) => {
        setBudgets(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
        showToast('Gagal memuat data budget.', 'error');
      }
    );

    return () => {
      unsubCat();
      unsubTx();
      unsubBudgets();
    };
  }, [user, monthKey, showToast]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const totalSpent = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'expense')
        .reduce((acc, tx) => acc + tx.amount, 0),
    [transactions]
  );

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
    }
    return map;
  }, [transactions]);

  const totalBudget = useMemo(
    () => budgets.find((b) => b.categoryId === null) || null,
    [budgets]
  );

  const budgetMap = useMemo(() => {
    const map = new Map<string, Budget>();
    for (const b of budgets) {
      if (b.categoryId) {
        map.set(b.categoryId, b);
      }
    }
    return map;
  }, [budgets]);

  const openEditor = (target: BudgetTarget) => {
    setEditingTarget(target);
    setLimitRaw(target.currentLimit ? String(target.currentLimit) : '');
    setFormError(null);
  };

  const handleSaveBudget = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !editingTarget) return;
    setFormError(null);

    const parsed = parseIntegerRupiah(limitRaw);
    if (parsed <= 0) {
      setFormError('Batas budget harus lebih besar dari Rp 0.');
      return;
    }

    setSaving(true);
    try {
      await upsertBudget(user.uid, monthKey, editingTarget.categoryId, parsed);
      showToast(`Budget ${editingTarget.label} berhasil disimpan.`, 'success');
      setEditingTarget(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!user || !deletingBudget) return;
    setDeleting(true);
    try {
      await deleteBudget(user.uid, deletingBudget.docId);
      showToast(`Budget ${deletingBudget.label} dihapus.`, 'success');
      setDeletingBudget(null);
    } catch {
      showToast('Gagal menghapus budget.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const parsedLimit = parseIntegerRupiah(limitRaw);
  const formattedLimitInput =
    limitRaw.length > 0 ? new Intl.NumberFormat('id-ID').format(parsedLimit) : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Budget Bulanan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tetapkan batas pengeluaran total dan per kategori untuk {formatMonthLabel(monthKey)}
          </p>
        </div>

        <MonthYearSelector year={year} month={month} onChange={setPeriod} />
      </div>

      {/* Monthly Total Budget Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Budget Total Bulan Ini
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akumulasi seluruh pengeluaran pada {formatMonthLabel(monthKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openEditor({
                  categoryId: null,
                  label: 'Total Bulanan',
                  currentLimit: totalBudget?.limit ?? null,
                  docId: totalBudget?.id ?? null,
                })
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{totalBudget ? 'Ubah Budget Total' : 'Atur Budget Total'}</span>
            </button>
            {totalBudget && (
              <button
                type="button"
                onClick={() =>
                  setDeletingBudget({
                    docId: totalBudget.id,
                    label: 'Total Bulanan',
                  })
                }
                aria-label="Hapus budget total"
                className="min-h-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : totalBudget ? (
          (() => {
            const meta = getProgressMeta(totalSpent, totalBudget.limit);
            return (
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <div className="font-mono tabular-nums">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatRupiah(totalSpent)}
                    </span>
                    <span className="text-slate-400">
                      {' '}
                      / {formatRupiah(totalBudget.limit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={meta.textColor}>{meta.statusLabel}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {meta.pctRounded}%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${meta.barColor}`}
                    style={{ width: `${meta.barWidth}%` }}
                  />
                </div>

                <p className={`text-xs font-semibold tabular-nums ${meta.textColor}`}>
                  {meta.remaining >= 0
                    ? `Sisa budget: ${formatRupiah(meta.remaining)}`
                    : `Melebihi budget sebesar ${formatRupiah(Math.abs(meta.remaining))}`}
                </p>
              </div>
            );
          })()
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Total pengeluaran saat ini{' '}
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatRupiah(totalSpent)}
            </span>
            . Belum ada batas budget total yang ditetapkan untuk bulan ini.
          </p>
        )}
      </section>

      {/* Per-Category Expense Budgets */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Budget per Kategori Pengeluaran
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hijau di bawah 80%, kuning mulai 80%, dan merah mulai 100%.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : expenseCategories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada kategori pengeluaran tersedia. Tambahkan kategori terlebih dahulu di menu Kategori.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories.map((cat) => {
              const catBudget = budgetMap.get(cat.id) || null;
              const spent = spentByCategory.get(cat.id) || 0;
              const meta = catBudget
                ? getProgressMeta(spent, catBudget.limit)
                : null;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                          Terpakai: {formatRupiah(spent)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openEditor({
                            categoryId: cat.id,
                            label: cat.name,
                            currentLimit: catBudget?.limit ?? null,
                            docId: catBudget?.id ?? null,
                          })
                        }
                        className="min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {catBudget ? 'Ubah' : 'Atur'}
                      </button>
                      {catBudget && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeletingBudget({
                              docId: catBudget.id,
                              label: `kategori ${cat.name}`,
                            })
                          }
                          aria-label={`Hapus budget ${cat.name}`}
                          className="min-h-[34px] rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {catBudget && meta ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${meta.textColor}`}>
                          {meta.statusLabel} · {meta.pctRounded}%
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          Batas: {formatRupiah(catBudget.limit)}
                        </span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${meta.barColor}`}
                          style={{ width: `${meta.barWidth}%` }}
                        />
                      </div>

                      <p className={`text-xs font-medium tabular-nums ${meta.textColor}`}>
                        {meta.remaining >= 0
                          ? `Sisa budget: ${formatRupiah(meta.remaining)}`
                          : `Melebihi budget: ${formatRupiah(Math.abs(meta.remaining))}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Belum ada batas budget untuk kategori ini.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Budget Modal */}
      {editingTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-modal-title"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2
                id="budget-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Budget {editingTarget.label}
              </h2>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                disabled={saving}
                aria-label="Tutup dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label
                  htmlFor="budget-limit-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Batas Maksimal ({formatMonthLabel(monthKey)})
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Rp
                  </span>
                  <input
                    id="budget-limit-input"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="0"
                    value={formattedLimitInput}
                    onChange={(e) => setLimitRaw(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-4 text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {formError && (
                <p className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  disabled={saving}
                  className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deletingBudget)}
        title="Hapus Budget?"
        description={
          deletingBudget
            ? `Batas budget untuk ${deletingBudget.label} pada ${formatMonthLabel(
                monthKey
              )} akan dihapus.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onCancel={() => setDeletingBudget(null)}
        onConfirm={handleDeleteBudget}
      />
    </div>
  );
}
