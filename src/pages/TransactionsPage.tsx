import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MonthYearSelector } from '@/components/MonthYearSelector';
import { TransactionModal } from '@/components/TransactionModal';
import { useAuth } from '@/lib/authContext';
import { exportTransactionsToCSV } from '@/lib/csv';
import {
  createTransaction,
  deleteTransaction,
  subscribeCategories,
  subscribeMonthTransactions,
  updateTransaction,
} from '@/lib/firestoreService';
import { formatDateID, formatMonthLabel, formatRupiah } from '@/lib/format';
import { usePeriod } from '@/lib/periodContext';
import { useToast } from '@/lib/toastContext';
import type { Category, Transaction, TransactionInput } from '@/types';

type TypeFilter = 'all' | 'income' | 'expense';

export function TransactionsPage() {
  const { user } = useAuth();
  const { year, month, monthKey, setPeriod } = usePeriod();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [deletingLoading, setDeletingLoading] = useState<boolean>(false);

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
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
        showToast('Gagal memuat daftar transaksi.', 'error');
      }
    );

    return () => {
      unsubCat();
      unsubTx();
    };
  }, [user, monthKey, showToast]);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.color);
    }
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      if (!keyword) return true;
      return (
        tx.note.toLowerCase().includes(keyword) ||
        tx.categoryName.toLowerCase().includes(keyword)
      );
    });
  }, [transactions, searchTerm, typeFilter]);

  const openAddModal = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSubmit = async (input: TransactionInput) => {
    if (!user) return;
    if (editingTx) {
      await updateTransaction(user.uid, editingTx.id, input);
      showToast('Transaksi berhasil diperbarui.', 'success');
    } else {
      await createTransaction(user.uid, input);
      showToast('Transaksi berhasil ditambahkan.', 'success');
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deletingTx) return;
    setDeletingLoading(true);
    try {
      await deleteTransaction(user.uid, deletingTx.id);
      showToast('Transaksi berhasil dihapus.', 'success');
      setDeletingTx(null);
    } catch {
      showToast('Gagal menghapus transaksi. Coba lagi.', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      showToast('Belum ada transaksi pada bulan ini untuk diunduh.', 'error');
      return;
    }
    exportTransactionsToCSV(transactions, monthKey);
    showToast(`Laporan ${formatMonthLabel(monthKey)} berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Transaksi
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola catatan pemasukan dan pengeluaran untuk {formatMonthLabel(monthKey)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <MonthYearSelector year={year} month={month} onChange={setPeriod} />

          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari catatan atau kategori..."
            aria-label="Cari catatan transaksi"
            className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'income', label: 'Pemasukan' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Content */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ReceiptText className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Belum ada transaksi pada {formatMonthLabel(monthKey)}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Klik tombol di bawah untuk mencatat pemasukan atau pengeluaran pertama Anda.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tidak ada transaksi yang cocok dengan pencarian Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Tanggal</th>
                    <th className="py-3.5 px-5">Kategori</th>
                    <th className="py-3.5 px-5">Catatan</th>
                    <th className="py-3.5 px-5 text-right">Nominal</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredTransactions.map((tx) => {
                    const color = categoryColorMap.get(tx.categoryId) || '#64748b';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {formatDateID(tx.date)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {tx.categoryName}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {tx.note ? (
                            tx.note
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">
                              Tanpa catatan
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(tx)}
                              aria-label={`Edit transaksi ${tx.note || tx.categoryName}`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTx(tx)}
                              aria-label={`Hapus transaksi ${tx.note || tx.categoryName}`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const color = categoryColorMap.get(tx.categoryId) || '#64748b';
                return (
                  <li key={tx.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className="mt-1.5 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {tx.note || tx.categoryName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {tx.categoryName} · {formatDateID(tx.date)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(tx)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 pr-2"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTx(tx)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 py-1 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-mono font-semibold tabular-nums shrink-0 ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        categories={categories}
        initialTransaction={editingTx}
        defaultMonthKey={monthKey}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={Boolean(deletingTx)}
        title="Hapus Transaksi?"
        description={
          deletingTx
            ? `Transaksi "${deletingTx.note || deletingTx.categoryName}" sebesar ${formatRupiah(
                deletingTx.amount
              )} akan dihapus permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        loading={deletingLoading}
        onCancel={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
