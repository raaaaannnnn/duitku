import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/firebase';
import { seedDefaultCategoriesIfNeeded } from '@/lib/firestoreService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
  }
  const code = 'code' in error ? String((error as { code?: string }).code) : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Popup login diblokir oleh browser Anda. Mohon izinkan popup untuk situs ini lalu coba lagi.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum proses selesai. Silakan coba masuk kembali.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login sebelumnya dibatalkan. Silakan klik tombol masuk sekali saja.';
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan di Firebase Authentication. Tambahkan domain ini ke Authorized Domains di Firebase Console.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda lalu coba lagi.';
    case 'auth/operation-not-allowed':
      return 'Login Google belum diaktifkan di Firebase Authentication. Aktifkan penyedia Google di Firebase Console.';
    default:
      return 'Gagal masuk dengan Google. Pastikan koneksi stabil dan konfigurasi Firebase sudah benar.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await seedDefaultCategoriesIfNeeded(firebaseUser.uid);
        } catch (err) {
          console.error('Gagal menyiapkan kategori bawaan:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setAuthError('Konfigurasi Firebase belum lengkap.');
      return;
    }
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signingIn,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
