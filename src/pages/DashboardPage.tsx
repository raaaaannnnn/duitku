import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MonthYearSelector } from '@/components/MonthYearSelector';
import { TransactionModal } from '@/components/TransactionModal';
import { useAuth } from '@/lib/authContext';
import {
  createTransaction,
  subscribeCategories,
  subscribeMonthBudgets,
  subscribeMonthTransactions,
  subscribeMultiMonthTransactions,
} from '@/lib/firestoreService';
import {
  formatCompactRupiah,
  formatDateID,
  formatMonthLabel,
  formatRupiah,
  formatShortMonthLabel,
  getLast6MonthKeys,
} from '@/lib/format';
import { usePeriod } from '@/lib/periodContext';
import { useTheme } from '@/lib/themeContext';
import { useToast } from '@/lib/toastContext';
import type { Budget, Category, Transaction, TransactionInput } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { year, month, monthKey, setPeriod } = usePeriod();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sixMonthTransactions, setSixMonthTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const last6Keys = useMemo(() => getLast6MonthKeys(year, month), [year, month]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubCat = subscribeCategories(
      user.uid,
      (list) => setCategories(list),
      () => showToast('Gagal memuat daftar kategori.', 'error')
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
        showToast('Gagal memuat transaksi bulan ini.', 'error');
      }
    );

    const unsubSix = subscribeMultiMonthTransactions(
      user.uid,
      last6Keys,
      (list) => setSixMonthTransactions(list),
      () => showToast('Gagal memuat grafik 6 bulan terakhir.', 'error')
    );

    const unsubBudgets = subscribeMonthBudgets(
      user.uid,
      monthKey,
      (list) => setBudgets(list),
      () => {}
    );

    return () => {
      unsubCat();
      unsubTx();
      unsubSix();
      unsubBudgets();
    };
  }, [user, monthKey, last6Keys, showToast]);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.color);
    }
    return map;
  }, [categories]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const grouped = new Map<
      string,
      { categoryId: string; name: string; value: number; color: string }
    >();

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const existing = grouped.get(tx.categoryId);
      const color = categoryColorMap.get(tx.categoryId) || '#10b981';
      if (existing) {
        existing.value += tx.amount;
      } else {
        grouped.set(tx.categoryId, {
          categoryId: tx.categoryId,
          name: tx.categoryName,
          value: tx.amount,
          color,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.value - a.value);
  }, [transactions, categoryColorMap]);

  const sixMonthChartData = useMemo(() => {
    const buckets = new Map<string, { income: number; expense: number }>();
    for (const k of last6Keys) {
      buckets.set(k, { income: 0, expense: 0 });
    }
    for (const tx of sixMonthTransactions) {
      const bucket = buckets.get(tx.monthKey);
      if (!bucket) continue;
      if (tx.type === 'income') bucket.income += tx.amount;
      else bucket.expense += tx.amount;
    }

    return last6Keys.map((k) => {
      const val = buckets.get(k) || { income: 0, expense: 0 };
      return {
        monthKey: k,
        label: formatShortMonthLabel(k),
        Pemasukan: val.income,
        Pengeluaran: val.expense,
      };
    });
  }, [last6Keys, sixMonthTransactions]);

  const totalBudget = useMemo(
    () => budgets.find((b) => b.categoryId === null) || null,
    [budgets]
  );

  const handleSaveTransaction = async (input: TransactionInput) => {
    if (!user) return;
    await createTransaction(user.uid, input);
    showToast('Transaksi berhasil ditambahkan.', 'success');
  };

  const chartAxisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  const hasSixMonthData = sixMonthChartData.some(
    (item) => item.Pemasukan > 0 || item.Pengeluaran > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard Keuangan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ringkasan arus kas untuk periode {formatMonthLabel(monthKey)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MonthYearSelector year={year} month={month} onChange={setPeriod} />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Pemasukan
            </span>
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2.5 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatRupiah(summary.income)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Pengeluaran
            </span>
            <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2.5 text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {formatRupiah(summary.expense)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo Bulan Ini
            </span>
            <Wallet className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p
              className={`mt-2.5 text-2xl font-bold font-mono tabular-nums ${
                summary.balance >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(summary.balance)}
            </p>
          )}
        </div>
      </div>

      {/* Empty State Banner if no transactions at all for selected month */}
      {!loading && transactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Belum ada transaksi di {formatMonthLabel(monthKey)}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Mulai catat pemasukan atau pengeluaran pertama Anda pada bulan ini untuk melihat grafik rincian dan perkembangan saldo.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-5 min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Transaksi Pertama</span>
          </button>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Expense by Category */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Pengeluaran per Kategori
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi pengeluaran pada {formatMonthLabel(monthKey)}
            </p>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          ) : expenseByCategory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Belum ada pengeluaran tercatat di bulan ini.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Grafik proporsi kategori akan tampil otomatis setelah pengeluaran ditambahkan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div className="sm:col-span-3 h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {expenseByCategory.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatRupiah(Number(value))}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="sm:col-span-2 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {expenseByCategory.map((item) => {
                  const pct =
                    summary.expense > 0
                      ? Math.round((item.value / summary.expense) * 100)
                      : 0;
                  return (
                    <li
                      key={item.categoryId}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {pct}%
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Bar Chart: 6-Month Cashflow */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Pemasukan vs Pengeluaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan 6 bulan terakhir hingga {formatMonthLabel(monthKey)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Masuk
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                Keluar
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          ) : !hasSixMonthData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Belum ada riwayat 6 bulan terakhir.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Grafik perbandingan bulanan akan muncul seiring pencatatan transaksi Anda.
              </p>
            </div>
          ) : (
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={sixMonthChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartAxisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => formatCompactRupiah(Number(val))}
                    tick={{ fill: chartAxisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    formatter={(value) => formatRupiah(Number(value))}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                    }}
                  />
                  <Bar
                    dataKey="Pemasukan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="Pengeluaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Row: Budget Overview + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Monthly Budget Card */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Budget Bulanan
              </h2>
              <Link
                to="/budget"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Atur</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {totalBudget ? (
              (() => {
                const pct =
                  totalBudget.limit > 0
                    ? Math.round((summary.expense / totalBudget.limit) * 100)
                    : 0;
                const remaining = totalBudget.limit - summary.expense;
                const barColor =
                  pct >= 100
                    ? 'bg-rose-500'
                    : pct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';
                const statusLabel =
                  pct >= 100
                    ? 'Melebihi Batas'
                    : pct >= 80
                    ? 'Mendekati Batas'
                    : 'Aman';

                return (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Terpakai ({pct}%)
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {statusLabel}
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatRupiah(summary.expense)}
                      </span>
                      <span className="text-slate-400">
                        / {formatRupiah(totalBudget.limit)}
                      </span>
                    </div>

                    <p
                      className={`text-xs font-medium tabular-nums ${
                        remaining >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {remaining >= 0
                        ? `Sisa budget: ${formatRupiah(remaining)}`
                        : `Melebihi budget: ${formatRupiah(Math.abs(remaining))}`}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Anda belum mengatur batas budget total untuk {formatMonthLabel(monthKey)}.
                </p>
                <Link
                  to="/budget"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Tetapkan Budget Sekarang
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Transaksi Terbaru
            </h2>
            <Link
              to="/transaksi"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              Belum ada aktivitas transaksi pada periode ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice(0, 5).map((tx) => {
                const dotColor = categoryColorMap.get(tx.categoryId) || '#64748b';
                return (
                  <li
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {tx.note || tx.categoryName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tx.categoryName} · {formatDateID(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold font-mono tabular-nums shrink-0 ${
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
          )}
        </section>
      </div>

      <TransactionModal
        open={modalOpen}
        categories={categories}
        defaultMonthKey={monthKey}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveTransaction}
      />
    </div>
  );
}
