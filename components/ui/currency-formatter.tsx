"use client";

interface CurrencyFormatterProps {
  amount: number;
  currency?: string;
  locale?: string;
}

export function CurrencyFormatter({ 
  amount, 
  currency = "INR", 
  locale = "en-IN" 
}: CurrencyFormatterProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  
  return <span>{formatted}</span>;
}

export function formatCurrency(
  amount: number, 
  currency = "INR", 
  locale = "en-IN"
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}