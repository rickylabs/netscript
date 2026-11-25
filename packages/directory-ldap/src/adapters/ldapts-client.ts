/**
 * Default {@link LdapClientFactory} backed by `npm:ldapts`.
 *
 * Strictly separates direct `ldaps://` (`tlsOptions` on `Client`) from `ldap://` StartTLS
 * (plain TCP `Client` followed by `client.startTLS(...)`) because `ldapts` switches to direct TLS
 * whenever `tlsOptions` has any defined property. Uses `client.searchPaginated` in
 * `searchBounded` so broad directory queries stop reading pages once `maxEntries` are collected.
 *
 * @module
 */

import { Client, type Entry, Filter } from 'ldapts';
import type {
  LdapBoundedSearchParams,
  LdapClientConnectOptions,
  LdapClientFactory,
  LdapClientPort,
  LdapRawEntry,
  LdapSearchParams,
  LdapSearchResult,
  LdapTransportTlsOptions,
} from '../ports/mod.ts';

function normalizeEntry(entry: Entry): LdapRawEntry {
  const out: Record<
    string,
    string | readonly string[] | Uint8Array | readonly Uint8Array[] | undefined
  > = { dn: entry.dn };
  for (const [key, value] of Object.entries(entry)) {
    if (key === 'dn') {
      continue;
    }
    if (typeof value === 'string' || value instanceof Uint8Array) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      const binaryItems: Uint8Array[] = [];
      const stringItems: string[] = [];
      let allBinary = true;
      for (const item of value) {
        if (item instanceof Uint8Array) {
          binaryItems.push(item);
        } else {
          allBinary = false;
          stringItems.push(String(item));
        }
      }
      out[key] = allBinary ? binaryItems : stringItems;
    }
  }
  return out as LdapRawEntry;
}

function assertFilterAst(filter: unknown): Filter {
  if (!(filter instanceof Filter)) {
    throw new TypeError('LDAP search filter must be an ldapts Filter AST instance.');
  }
  return filter;
}

/**
 * Creates an {@link LdapClientPort} wrapping `ldapts.Client`.
 *
 * @param connectOptions - Host URL, timeouts, and optional direct-LDAPS TLS configuration.
 * @returns An {@link LdapClientPort} instance for one directory operation lifecycle.
 */
export function createLdaptsClient(connectOptions: LdapClientConnectOptions): LdapClientPort {
  const client = new Client({
    url: connectOptions.url,
    timeout: connectOptions.timeoutMs,
    connectTimeout: connectOptions.connectTimeoutMs,
    ...(connectOptions.tlsOptions !== undefined
      ? {
        tlsOptions: {
          rejectUnauthorized: connectOptions.tlsOptions.rejectUnauthorized,
          ...(connectOptions.tlsOptions.ca !== undefined
            ? { ca: connectOptions.tlsOptions.ca }
            : {}),
          servername: connectOptions.tlsOptions.servername,
        },
      }
      : {}),
  });

  return {
    async startTLS(tlsOptions: LdapTransportTlsOptions): Promise<void> {
      await client.startTLS({
        rejectUnauthorized: tlsOptions.rejectUnauthorized,
        ...(tlsOptions.ca !== undefined ? { ca: tlsOptions.ca } : {}),
        servername: tlsOptions.servername,
      });
    },
    async bind(dn: string, password: string): Promise<void> {
      await client.bind(dn, password);
    },
    async search(baseDn: string, params: LdapSearchParams): Promise<LdapSearchResult> {
      const filter = assertFilterAst(params.filter);
      const result = await client.search(baseDn, {
        scope: params.scope,
        filter,
        attributes: [...params.attributes],
        ...(params.explicitBufferAttributes !== undefined
          ? { explicitBufferAttributes: [...params.explicitBufferAttributes] }
          : {}),
        sizeLimit: params.sizeLimit,
        timeLimit: params.timeLimit,
        ...(params.paged !== undefined ? { paged: { pageSize: params.paged.pageSize } } : {}),
      });
      return {
        searchEntries: result.searchEntries.map(normalizeEntry),
      };
    },
    async searchBounded(
      baseDn: string,
      params: LdapBoundedSearchParams,
    ): Promise<LdapSearchResult> {
      const filter = assertFilterAst(params.filter);
      if (!Number.isInteger(params.maxEntries) || params.maxEntries < 1) {
        throw new RangeError('LDAP bounded search maxEntries must be a positive integer.');
      }
      const pageSize = Math.max(
        1,
        Math.min(params.paged?.pageSize ?? params.maxEntries, params.maxEntries),
      );
      const collected: LdapRawEntry[] = [];
      const pages = client.searchPaginated(baseDn, {
        scope: params.scope,
        filter,
        attributes: [...params.attributes],
        ...(params.explicitBufferAttributes !== undefined
          ? { explicitBufferAttributes: [...params.explicitBufferAttributes] }
          : {}),
        sizeLimit: 0,
        timeLimit: params.timeLimit,
        paged: { pageSize },
      });

      for await (const page of pages) {
        for (const entry of page.searchEntries) {
          collected.push(normalizeEntry(entry));
          if (collected.length >= params.maxEntries) {
            return { searchEntries: collected };
          }
        }
      }
      return { searchEntries: collected };
    },
    async unbind(): Promise<void> {
      await client.unbind();
    },
  };
}

/** Default {@link LdapClientFactory} backed by `npm:ldapts`. */
export const defaultLdapClientFactory: LdapClientFactory = createLdaptsClient;
