import { ChevronLeft, ChevronRight } from 'lucide-react';
import { INDONESIAN_MONTHS } from '@/lib/format';

interface MonthYearSelectorProps {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
}

export function MonthYearSelector({ year, month, onChange }: MonthYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, idx) => currentYear - 5 + idx);

  const handlePrev = () => {
    if (month === 0) {
      onChange(year - 1, 11);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      onChange(year + 1, 0);
    } else {
      onChange(year, month + 1);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Bulan sebelumnya"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <select
        aria-label="Pilih bulan"
        value={month}
        onChange={(e) => onChange(year, Number(e.target.value))}
        className="h-9 rounded-lg bg-transparent px-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
      >
        {INDONESIAN_MONTHS.map((label, idx) => (
          <option key={label} value={idx} className="bg-white dark:bg-slate-900">
            {label}
          </option>
        ))}
      </select>

      <select
        aria-label="Pilih tahun"
        value={year}
        onChange={(e) => onChange(Number(e.target.value), month)}
        className="h-9 rounded-lg bg-transparent px-2 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y} className="bg-white dark:bg-slate-900">
            {y}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Bulan berikutnya"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
