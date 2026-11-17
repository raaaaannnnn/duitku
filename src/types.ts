export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  note: string;
  createdAt: number;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string;
  note: string;
}

export interface Budget {
  id: string; // `${monthKey}_total` or `${monthKey}_${categoryId}`
  monthKey: string;
  categoryId: string | null;
  limit: number;
}
