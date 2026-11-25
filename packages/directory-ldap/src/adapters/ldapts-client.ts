/**
 * Default {@link LdapClientFactory} backed by `npm:ldapts`.
 *
 * Strictly separates direct `ldaps://` (`tlsOptions` on `Client`) from `ldap://` StartTLS
 * (plain TCP `Client` followed by `client.startTLS(...)`) because `ldapts` switches to direct TLS
 * whenever `tlsOptions` has any defined property.
 *
 * @module
 */

import { Client, type Entry, Filter } from 'ldapts';
import type {
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
      if (!(params.filter instanceof Filter)) {
        throw new TypeError('LDAP search filter must be an ldapts Filter AST instance.');
      }
      const result = await client.search(baseDn, {
        scope: params.scope,
        filter: params.filter,
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
    async unbind(): Promise<void> {
      await client.unbind();
    },
  };
}

/** Default {@link LdapClientFactory} backed by `npm:ldapts`. */
export const defaultLdapClientFactory: LdapClientFactory = createLdaptsClient;
