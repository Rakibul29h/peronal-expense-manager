import { format, parseISO, isValid } from 'date-fns';

export function formatCurrency(
  amount: number,
  symbol: string = '৳',
  _currencyCode: string = 'BDT'
): string {
  const isNeg = amount < 0;
  const absAmt = Math.abs(amount);
  
  // Format with standard international comma grouping
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmt);

  return `${isNeg ? '-' : ''}${symbol}${formatted}`;
}

export function formatDate(dateStr: string, formatPattern: string = 'MMM d, yyyy'): string {
  if (!dateStr) return '';
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return dateStr;
    return format(parsed, formatPattern);
  } catch {
    return dateStr;
  }
}

export function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}
