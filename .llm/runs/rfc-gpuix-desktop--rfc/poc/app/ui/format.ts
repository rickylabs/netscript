import type { Metric, RecordStatus } from '../contract.ts';

const integer = new Intl.NumberFormat('en-CH');
const percent = new Intl.NumberFormat('en-CH', { maximumFractionDigits: 1 });
const money = new Map<string, Intl.NumberFormat>();

export function formatAmount(value: number, currency: string): string {
  let format = money.get(currency);
  if (!format) {
    format = new Intl.NumberFormat('en-CH', { style: 'currency', currency, maximumFractionDigits: 0 });
    money.set(currency, format);
  }
  return format.format(value);
}

export function formatInt(value: number): string {
  return integer.format(value);
}

export function formatDelta(metric: Metric, points = false): string {
  const change = points ? metric.delta : metric.percentChange;
  if (change === null) return 'New';
  const arrow = metric.delta > 0 ? '↗' : metric.delta < 0 ? '↘' : '—';
  return `${arrow} ${percent.format(Math.abs(change))}${points ? ' pts' : '%'}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(seconds, 0)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  return new Intl.DateTimeFormat('en-CH', { day: 'numeric', month: 'short' }).format(date);
}

export function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export function statusTone(status: RecordStatus): 'muted' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'awaiting_payment':
      return 'warning';
    case 'shipped':
      return 'info';
    default:
      return 'muted';
  }
}
