import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'FinanceFlow - Personal Finance & Expense Tracker',
  description:
    'Modern personal finance dashboard to track income, expenses, remaining balance, survival runway, category breakdowns, and month-over-month comparisons.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
