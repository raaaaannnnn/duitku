import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SetupMissingScreen } from '@/components/SetupMissingScreen';
import { isFirebaseConfigured } from '@/firebase';
import { AuthProvider } from '@/lib/authContext';
import { PeriodProvider } from '@/lib/periodContext';
import { ThemeProvider } from '@/lib/themeContext';
import { ToastProvider } from '@/lib/toastContext';
import { BudgetPage } from '@/pages/BudgetPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          {!isFirebaseConfigured ? (
            <SetupMissingScreen />
          ) : (
            <AuthProvider>
              <PeriodProvider>
                <HashRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route element={<Layout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/transaksi" element={<TransactionsPage />} />
                        <Route path="/budget" element={<BudgetPage />} />
                        <Route path="/kategori" element={<CategoriesPage />} />
                      </Route>
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </HashRouter>
              </PeriodProvider>
            </AuthProvider>
          )}
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
