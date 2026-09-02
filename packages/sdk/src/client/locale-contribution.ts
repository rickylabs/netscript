/**
 * Canonical locale contribution for NetScript service clients.
 *
 * @module
 */

import { defineSdkClientContribution } from './sdk-client-contribution.ts';
import type {
  SdkClientCachePartitionOptions,
  SdkClientContextDeclaration,
  SdkClientContribution,
  SdkClientResponseCache,
} from '../ports/sdk-client-contribution.ts';

const LOCALE_CONTRIBUTION_ID = '@netscript/sdk:locale' as const;
const LOCALE_HEADER_KEYS = ['accept-language'] as const;
const DEFAULT_LOCALE_PARTITION = 'default';

/** Per-call context consumed by the canonical locale contribution. */
export interface LocaleSdkClientContext {
  /** Single Unicode BCP 47 locale to send and use as the response-cache partition. */
  readonly locale?: string;
}

/** Canonical partitioned locale contribution returned by the locale factory. */
export type LocaleSdkClientContribution =
  & Omit<
    SdkClientContribution<
      '@netscript/sdk:locale',
      LocaleSdkClientContext,
      SdkClientContextDeclaration<LocaleSdkClientContext>,
      readonly ['accept-language']
    >,
    'responseCache'
  >
  & {
    readonly responseCache: Extract<
      SdkClientResponseCache<LocaleSdkClientContext>,
      { readonly mode: 'partitioned' }
    >;
  };

function canonicalLocale(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new TypeError('Locale context must be one canonicalizable Unicode locale identifier.');
  }

  let locale: string;
  try {
    [locale] = Intl.getCanonicalLocales(value);
  } catch {
    throw new TypeError('Locale context must be one canonicalizable Unicode locale identifier.');
  }
  if (locale.length > 64) {
    throw new TypeError('Locale context must fit the SDK cache-partition limit.');
  }
  return locale;
}

function localePartition(
  options: SdkClientCachePartitionOptions<LocaleSdkClientContext>,
): string {
  return canonicalLocale(options.context.locale) ?? DEFAULT_LOCALE_PARTITION;
}

/**
 * Create the canonical typed locale contribution.
 *
 * A present locale is canonicalized with `Intl.getCanonicalLocales`, sent as
 * `accept-language`, and used as the non-secret response-cache partition. An
 * absent locale emits no header and uses the stable `default` partition.
 *
 * @returns A version-1 partitioned SDK contribution owning `accept-language`.
 *
 * @example
 * ```ts
 * const locale = createLocaleSdkClientContribution();
 * const client = createServiceClient({
 *   contract,
 *   serviceName: 'catalog',
 *   contributions: [locale] as const,
 * });
 * await client.list({}, { context: { locale: 'de-CH' } });
 * ```
 */
export function createLocaleSdkClientContribution(): LocaleSdkClientContribution {
  return defineSdkClientContribution<LocaleSdkClientContext>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: LOCALE_CONTRIBUTION_ID,
    context: { locale: 'optional' },
    headerKeys: LOCALE_HEADER_KEYS,
    responseCache: {
      mode: 'partitioned',
      partition: localePartition,
    },
    prepare: ({ context }) => {
      const locale = canonicalLocale(context.locale);
      return locale === undefined ? {} : { headers: { 'accept-language': locale } };
    },
  });
}
