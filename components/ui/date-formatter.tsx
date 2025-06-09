"use client";

import { format } from "date-fns";

interface DateFormatterProps {
  date: Date | string;
  formatStr?: string;
}

export function DateFormatter({ date, formatStr = "PPp" }: DateFormatterProps) {
  if (!date) return null;
  
  const dateObject = typeof date === "string" ? new Date(date) : date;
  return <span>{format(dateObject, formatStr)}</span>;
}

export function formatDate(date: Date | string, formatStr = "PPp") {
  if (!date) return "";
  
  const dateObject = typeof date === "string" ? new Date(date) : date;
  return format(dateObject, formatStr);
}