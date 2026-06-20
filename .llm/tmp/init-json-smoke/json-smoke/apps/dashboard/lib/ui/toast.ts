/**
 * Toast semantic variants supported by the redirect-flash helpers.
 */
export type RegistryToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Redirect-flash payload persisted in URL query parameters.
 */
export interface RegistryToast {
  /** Visible toast body copy. */
  message: string;
  /** Optional headline shown above the toast message. */
  title?: string;
  /** Visual and semantic toast tone. */
  type: RegistryToastType;
}

/**
 * Query-string keys reserved by the redirect-flash helpers.
 */
export const REGISTRY_TOAST_QUERY_KEYS = {
  message: 'toastMessage',
  title: 'toastTitle',
  type: 'toastType',
} as const;

function isRegistryToastType(value: string | null): value is RegistryToastType {
  return value === 'success' || value === 'error' || value === 'warning' || value === 'info';
}

/**
 * Appends a toast payload to a relative application path.
 */
export function withToast(path: string, toast: RegistryToast): string {
  const url = new URL(path, 'https://fresh-ui.netscript.local');
  url.searchParams.set(REGISTRY_TOAST_QUERY_KEYS.message, toast.message);
  url.searchParams.set(REGISTRY_TOAST_QUERY_KEYS.type, toast.type);

  if (toast.title) {
    url.searchParams.set(REGISTRY_TOAST_QUERY_KEYS.title, toast.title);
  }

  return `${url.pathname}${url.search}`;
}

/**
 * Reads a toast payload from a URL when redirect-flash query parameters are present.
 */
export function getToast(url: URL): RegistryToast | undefined {
  const message = url.searchParams.get(REGISTRY_TOAST_QUERY_KEYS.message);

  if (!message) {
    return undefined;
  }

  const type = url.searchParams.get(REGISTRY_TOAST_QUERY_KEYS.type);

  return {
    message,
    title: url.searchParams.get(REGISTRY_TOAST_QUERY_KEYS.title) ?? undefined,
    type: isRegistryToastType(type) ? type : 'info',
  };
}

/**
 * Removes all toast query parameters from a URL while preserving path and hash.
 */
export function stripToastFromUrl(url: URL): string {
  const next = new URL(url.toString());

  for (const key of Object.values(REGISTRY_TOAST_QUERY_KEYS)) {
    next.searchParams.delete(key);
  }

  return `${next.pathname}${next.search}${next.hash}`;
}
