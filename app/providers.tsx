'use client';

import React, { useState } from 'react';
import { ToastProvider } from '@/src/context/ToastContext';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { Navbar } from '@/src/components/layout/Navbar';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { MobileNav } from '@/src/components/layout/MobileNav';
import { ExpenseModal } from '@/src/components/modals/ExpenseModal';
import { IncomeModal } from '@/src/components/modals/IncomeModal';
import { CategoryDetailsModal } from '@/src/components/modals/CategoryDetailsModal';
import { DatabaseStatusBanner } from '@/src/components/common/DatabaseStatusBanner';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AuthScreen } from '@/src/components/auth/AuthScreen';

export const AppLayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Database Status Alert Banner */}
      <DatabaseStatusBanner />

      {/* Top Navbar */}
      <Navbar onToggleMobileNav={() => setMobileNavOpen(true)} />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Slideout Nav */}
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <ExpenseModal />
      <IncomeModal />
      <CategoryDetailsModal />
    </div>
  );
};

const AuthenticatedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading || !user) return <AppLayoutShell>{children}</AppLayoutShell>;
  return (
    <AppProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
    </AppProvider>
  );
};

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthenticatedApp>{children}</AuthenticatedApp>
      </AuthProvider>
    </ToastProvider>
  );
};
