import { createContext, useContext, useState, type ReactNode } from 'react';
import { getMonthKey } from '@/lib/format';

interface PeriodContextValue {
  year: number;
  month: number; // 0-11
  monthKey: string;
  setPeriod: (year: number, month: number) => void;
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());

  const setPeriod = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const monthKey = getMonthKey(year, month);

  return (
    <PeriodContext.Provider value={{ year, month, monthKey, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) {
    throw new Error('usePeriod harus digunakan di dalam PeriodProvider');
  }
  return ctx;
}
