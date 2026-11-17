import type { Transaction } from '@/types';

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

function sanitizeCsvCell(value: string | number): string {
  let str = String(value ?? '');
  if (CSV_FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }
  const needsQuotes = /[;"\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  monthKey: string
): void {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
  const rows = transactions.map((tx) => [
    sanitizeCsvCell(tx.date),
    sanitizeCsvCell(tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
    sanitizeCsvCell(tx.categoryName),
    sanitizeCsvCell(Math.round(tx.amount)),
    sanitizeCsvCell(tx.note || ''),
  ]);

  const csvLines = [headers.join(';'), ...rows.map((r) => r.join(';'))];
  const bom = '\uFEFF';
  const content = bom + csvLines.join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `duitku-transaksi-${monthKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
