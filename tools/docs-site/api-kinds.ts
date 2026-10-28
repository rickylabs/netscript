/** Visible labels identify kinds; generated syntax roles will supply their final paint. */
export const API_KINDS = {
  class: 'info',
  interface: 'info',
  type: 'warning',
  enum: 'warning',
  function: 'success',
  method: 'success',
  const: 'warning',
  variable: 'warning',
  component: 'success',
} as const;

export type ApiKind = keyof typeof API_KINDS;

/** Normalize deno doc vocabulary without treating arbitrary table text as an API kind. */
export function apiKind(value: unknown): ApiKind | undefined {
  if (typeof value !== 'string') return undefined;
  const name = value.trim().toLowerCase().replace(/[`]/g, '');
  if (/^type(?:alias| aliases?|s|\b)/.test(name)) return 'type';
  if (/^interfaces?\b/.test(name)) return 'interface';
  if (/^(?:const(?:ant)?|value)\b/.test(name)) return 'const';
  return Object.keys(API_KINDS).find((kind) => name === kind || name.startsWith(`${kind} /`)) as
    | ApiKind
    | undefined;
}
