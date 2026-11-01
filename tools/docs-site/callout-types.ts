/** One public contract for rendered callouts and their Markdown alert markers. */
export const CALLOUT_TYPES = {
  note: { label: 'Note', tone: 'info', icon: 'info', markdown: 'NOTE' },
  tip: { label: 'Tip', tone: 'success', icon: 'lightbulb', markdown: 'TIP' },
  important: {
    label: 'Important',
    tone: 'important',
    icon: 'message-square-warning',
    markdown: 'IMPORTANT',
  },
  warning: { label: 'Warning', tone: 'warning', icon: 'triangle-alert', markdown: 'WARNING' },
  caution: { label: 'Caution', tone: 'destructive', icon: 'octagon-alert', markdown: 'CAUTION' },
  danger: { label: 'Danger', tone: 'destructive', icon: 'octagon-alert', markdown: 'CAUTION' },
  error: { label: 'Error', tone: 'destructive', icon: 'circle-x', markdown: 'ERROR' },
} as const;

export type CalloutType = keyof typeof CALLOUT_TYPES;

/** Static outline geometry; caution and danger intentionally share the octagon alert. */
export const CALLOUT_ICONS = {
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1"/>',
  lightbulb: '<path d="M9 16c0-1-1-2-2-3a6 6 0 1 1 10 0c-1 1-2 2-2 3H9ZM9 18h6m-5 3h4"/>',
  'message-square-warning':
    '<path d="M21 15a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3ZM12 7v5m0 3h.01"/>',
  'triangle-alert': '<path d="M12 3 2 21h20ZM12 9v5m0 3h.01"/>',
  'octagon-alert': '<path d="m8 2-6 6v8l6 6h8l6-6V8l-6-6ZM12 8v5m0 4h.01"/>',
  'circle-x': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
} as const;

/** Omitted types default to Note; explicit unknown types must never downgrade a warning. */
export function calloutType(value: unknown): CalloutType {
  if (value === undefined || value === null || value === '') return 'note';
  if (typeof value === 'string') {
    const name = value.trim().toLowerCase();
    if (Object.hasOwn(CALLOUT_TYPES, name)) return name as CalloutType;
  }
  throw new Error(`Unsupported callout type: ${String(value)}`);
}
