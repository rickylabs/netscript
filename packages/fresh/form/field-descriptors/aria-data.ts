import type { ControlProps } from '../types.ts';

export function createFieldId(formId: string, path: string): string {
  const sanitizedPath = path
    .replaceAll('.', '-')
    .replaceAll('[', '-')
    .replaceAll(']', '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitizedPath ? `${formId}-${sanitizedPath}` : formId;
}

export function mergeControlProps<TOverrides extends Record<string, unknown>>(
  base: ControlProps,
  overrides: TOverrides,
): ControlProps & TOverrides {
  return {
    ...base,
    ...overrides,
    'aria-describedby': mergeDescribedBy(
      base['aria-describedby'],
      overrides['aria-describedby'],
    ),
  } as ControlProps & TOverrides;
}

export function mergeDescribedBy(
  base: unknown,
  override: unknown,
): string | undefined {
  const values = [
    typeof base === 'string' ? base : undefined,
    typeof override === 'string' ? override : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  return values.length > 0
    ? [...new Set(values.flatMap((value) => value.split(/\s+/)))].join(' ')
    : undefined;
}

export function formatControlValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return undefined;
}
