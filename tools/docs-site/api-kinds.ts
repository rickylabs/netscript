/** Visible labels identify kinds; generated syntax roles supply their paint per the merged Utility spec. */
export const API_KINDS = {
  class: 'type',
  interface: 'keyword',
  type: 'keyword',
  enum: 'number',
  function: 'function',
  method: 'function',
  const: 'number',
  variable: 'number',
  component: 'function',
  module: 'fg',
  namespace: 'fg',
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

/** The visible kind label is independent of its shared generated syntax colour. */
export function apiKindRole(value: unknown): string | undefined {
  const kind = apiKind(value);
  return kind ? API_KINDS[kind] : undefined;
}
