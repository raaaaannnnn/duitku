export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const SHORT_INDONESIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const absFormatted = rupiahFormatter.format(Math.abs(safe));
  return safe < 0 ? `-Rp ${absFormatted}` : `Rp ${absFormatted}`;
}

export function formatCompactRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000)}rb`;
  }
  return `${sign}Rp ${Math.round(abs)}`;
}

export function getMonthKey(year: number, monthIndexZeroBased: number): string {
  const m = String(monthIndexZeroBased + 1).padStart(2, '0');
  return `${year}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const monthName = INDONESIAN_MONTHS[monthIdx] ?? monthStr;
  return `${monthName} ${yearStr}`;
}

export function formatShortMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const monthName = SHORT_INDONESIAN_MONTHS[monthIdx] ?? monthStr;
  return `${monthName} ${yearStr.slice(2)}`;
}

export function getLast6MonthKeys(year: number, monthIndexZeroBased: number): string[] {
  const keys: string[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(year, monthIndexZeroBased - offset, 1);
    keys.push(getMonthKey(d.getFullYear(), d.getMonth()));
  }
  return keys;
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthIdx = Number(month) - 1;
  const monthName = SHORT_INDONESIAN_MONTHS[monthIdx] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIntegerRupiah(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10);
}
