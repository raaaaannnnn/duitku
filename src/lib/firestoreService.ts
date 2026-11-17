import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Budget, Category, Transaction, TransactionInput, TransactionType } from '@/types';

interface DefaultCategorySeed {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  // Pengeluaran
  { id: 'default-expense-makan', name: 'Makan', type: 'expense', color: '#10b981' },
  { id: 'default-expense-transportasi', name: 'Transportasi', type: 'expense', color: '#3b82f6' },
  { id: 'default-expense-belanja', name: 'Belanja', type: 'expense', color: '#f59e0b' },
  { id: 'default-expense-tagihan', name: 'Tagihan', type: 'expense', color: '#ef4444' },
  { id: 'default-expense-hiburan', name: 'Hiburan', type: 'expense', color: '#8b5cf6' },
  { id: 'default-expense-kesehatan', name: 'Kesehatan', type: 'expense', color: '#ec4899' },
  { id: 'default-expense-lainnya', name: 'Lainnya', type: 'expense', color: '#64748b' },
  // Pemasukan
  { id: 'default-income-gaji', name: 'Gaji', type: 'income', color: '#059669' },
  { id: 'default-income-bonus', name: 'Bonus', type: 'income', color: '#0ea5e9' },
  { id: 'default-income-lainnya', name: 'Lainnya', type: 'income', color: '#64748b' },
];

function requireDb() {
  if (!db) {
    throw new Error('Konfigurasi Firebase belum tersedia.');
  }
  return db;
}

function toTimestampMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export async function seedDefaultCategoriesIfNeeded(uid: string): Promise<void> {
  const firestore = requireDb();
  const initRef = doc(firestore, 'users', uid, 'meta', 'init');
  const initSnap = await getDoc(initRef);

  if (initSnap.exists()) {
    return;
  }

  const categoriesRef = collection(firestore, 'users', uid, 'categories');
  const existingCategories = await getDocs(categoriesRef);

  const batch = writeBatch(firestore);

  if (existingCategories.empty) {
    for (const item of DEFAULT_CATEGORIES) {
      const catRef = doc(firestore, 'users', uid, 'categories', item.id);
      batch.set(catRef, {
        name: item.name,
        type: item.type,
        color: item.color,
      });
    }
  }

  batch.set(initRef, {
    categoriesSeeded: true,
    seededAt: serverTimestamp(),
  });

  await batch.commit();
}

export function subscribeCategories(
  uid: string,
  onData: (categories: Category[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = requireDb();
  const categoriesRef = collection(firestore, 'users', uid, 'categories');

  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const list: Category[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name || ''),
          type: data.type === 'income' ? 'income' : 'expense',
          color: String(data.color || '#10b981'),
        };
      });
      list.sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
      onData(list);
    },
    (err) => onError(err)
  );
}

export async function createCategory(
  uid: string,
  payload: Omit<Category, 'id'>
): Promise<string> {
  const firestore = requireDb();
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    throw new Error('Nama kategori wajib diisi.');
  }
  const ref = await addDoc(collection(firestore, 'users', uid, 'categories'), {
    name: trimmedName,
    type: payload.type,
    color: payload.color,
  });
  return ref.id;
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, 'users', uid, 'categories', categoryId));
}

export function subscribeMonthTransactions(
  uid: string,
  monthKey: string,
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = requireDb();
  const txQuery = query(
    collection(firestore, 'users', uid, 'transactions'),
    where('monthKey', '==', monthKey)
  );

  return onSnapshot(
    txQuery,
    (snapshot) => {
      const list: Transaction[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type === 'income' ? 'income' : 'expense',
          amount: Math.round(Number(data.amount) || 0),
          categoryId: String(data.categoryId || ''),
          categoryName: String(data.categoryName || 'Lainnya'),
          date: String(data.date || ''),
          monthKey: String(data.monthKey || monthKey),
          note: String(data.note || ''),
          createdAt: toTimestampMillis(data.createdAt),
        };
      });

      // Urutkan di sisi klien agar tidak perlu composite index Firestore
      list.sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });

      onData(list);
    },
    (err) => onError(err)
  );
}

export function subscribeMultiMonthTransactions(
  uid: string,
  monthKeys: string[],
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = requireDb();
  const txQuery = query(
    collection(firestore, 'users', uid, 'transactions'),
    where('monthKey', 'in', monthKeys)
  );

  return onSnapshot(
    txQuery,
    (snapshot) => {
      const list: Transaction[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type === 'income' ? 'income' : 'expense',
          amount: Math.round(Number(data.amount) || 0),
          categoryId: String(data.categoryId || ''),
          categoryName: String(data.categoryName || 'Lainnya'),
          date: String(data.date || ''),
          monthKey: String(data.monthKey || ''),
          note: String(data.note || ''),
          createdAt: toTimestampMillis(data.createdAt),
        };
      });
      onData(list);
    },
    (err) => onError(err)
  );
}

export async function createTransaction(
  uid: string,
  input: TransactionInput
): Promise<string> {
  const firestore = requireDb();
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Nominal harus lebih besar dari Rp 0.');
  }
  const monthKey = input.date.slice(0, 7);
  const ref = await addDoc(collection(firestore, 'users', uid, 'transactions'), {
    type: input.type,
    amount,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    date: input.date,
    monthKey,
    note: input.note.trim(),
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  input: TransactionInput
): Promise<void> {
  const firestore = requireDb();
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Nominal harus lebih besar dari Rp 0.');
  }
  const monthKey = input.date.slice(0, 7);
  await updateDoc(doc(firestore, 'users', uid, 'transactions', transactionId), {
    type: input.type,
    amount,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    date: input.date,
    monthKey,
    note: input.note.trim(),
  });
}

export async function deleteTransaction(
  uid: string,
  transactionId: string
): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, 'users', uid, 'transactions', transactionId));
}

export function subscribeMonthBudgets(
  uid: string,
  monthKey: string,
  onData: (budgets: Budget[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = requireDb();
  const budgetQuery = query(
    collection(firestore, 'users', uid, 'budgets'),
    where('monthKey', '==', monthKey)
  );

  return onSnapshot(
    budgetQuery,
    (snapshot) => {
      const list: Budget[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          monthKey: String(data.monthKey || monthKey),
          categoryId: data.categoryId ? String(data.categoryId) : null,
          limit: Math.round(Number(data.limit) || 0),
        };
      });
      onData(list);
    },
    (err) => onError(err)
  );
}

export async function upsertBudget(
  uid: string,
  monthKey: string,
  categoryId: string | null,
  limit: number
): Promise<void> {
  const firestore = requireDb();
  const safeLimit = Math.round(Number(limit));
  if (!Number.isFinite(safeLimit) || safeLimit <= 0) {
    throw new Error('Batas budget harus lebih besar dari Rp 0.');
  }
  const docId = categoryId ? `${monthKey}_${categoryId}` : `${monthKey}_total`;
  await setDoc(doc(firestore, 'users', uid, 'budgets', docId), {
    monthKey,
    categoryId: categoryId ?? null,
    limit: safeLimit,
  });
}

export async function deleteBudget(uid: string, budgetDocId: string): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, 'users', uid, 'budgets', budgetDocId));
}
