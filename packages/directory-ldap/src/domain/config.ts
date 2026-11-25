/**
 * Strict startup configuration validation for `@netscript/directory-ldap`.
 *
 * Enforces strict TLS defaults (`ldaps://` or StartTLS with `rejectUnauthorized: true`, refusing
 * plaintext `ldap://` unless an explicit dev opt-in is set) and `*_FILE`-only bind passwords.
 *
 * @module
 */

import { DIRECTORY_MAX_SEARCH_LIMIT } from '@netscript/plugin-directory-core';
import {
  DEFAULT_LDAP_CANDIDATE_BATCH_SIZE,
  DEFAULT_LDAP_PAGE_SIZE,
  DEFAULT_LDAP_TIMEOUT_MS,
  type LdapStaticConfigOptions,
  type LdapTlsMode,
  type LdapTlsOptions,
  type ResolvedLdapAttributeMap,
  type ResolvedLdapConfig,
  type ResolvedLdapHost,
} from './config-types.ts';

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new RangeError(`LDAP configuration "${fieldName}" must be a non-empty string.`);
  }
  return value.trim();
}

function requirePositiveInt(
  value: number | undefined,
  fallback: number,
  fieldName: string,
): number {
  const effective = value ?? fallback;
  if (!Number.isInteger(effective) || effective < 1) {
    throw new RangeError(`LDAP configuration "${fieldName}" must be a positive integer.`);
  }
  return effective;
}

function rejectForbiddenInlinePassword(options: LdapStaticConfigOptions): void {
  const raw = options as Record<string, unknown>;
  for (const forbidden of ['bindPassword', 'password', 'secret', 'bindSecret']) {
    if (Object.prototype.hasOwnProperty.call(raw, forbidden) && raw[forbidden] !== undefined) {
      throw new RangeError(
        `LDAP configuration does not accept inline "${forbidden}"; provide "bindPasswordFile" pointing to a secret file.`,
      );
    }
  }
}

function resolveHost(
  rawUrl: string,
  index: number,
  tls: LdapTlsOptions | undefined,
): { host: ResolvedLdapHost; tlsMode: LdapTlsMode } {
  const trimmed = requireNonEmptyString(rawUrl, `urls[${index}]`);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new RangeError(`LDAP configuration "urls[${index}]" is not a valid URL.`);
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new RangeError(
      `LDAP configuration "urls[${index}]" must not embed credentials in the URL.`,
    );
  }
  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== 'ldaps:' && scheme !== 'ldap:') {
    throw new RangeError(
      `LDAP configuration "urls[${index}]" must use ldaps:// or ldap:// scheme.`,
    );
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (hostname.length === 0) {
    throw new RangeError(`LDAP configuration "urls[${index}]" must include a hostname.`);
  }

  const requestedMode = tls?.mode;
  const allowInsecurePlaintextDev = tls?.allowInsecurePlaintextDev === true;

  if (scheme === 'ldaps:') {
    if (requestedMode === 'starttls' || requestedMode === 'insecure-plaintext-dev') {
      throw new RangeError(
        `LDAP configuration "urls[${index}]" uses ldaps:// which conflicts with tls.mode="${requestedMode}".`,
      );
    }
    return {
      tlsMode: 'ldaps',
      host: {
        url: `${scheme}//${parsed.host}`,
        hostname,
        directTls: true,
        useStartTls: false,
        probeName: `host-${index + 1}`,
      },
    };
  }

  if (requestedMode === 'starttls') {
    return {
      tlsMode: 'starttls',
      host: {
        url: `${scheme}//${parsed.host}`,
        hostname,
        directTls: false,
        useStartTls: true,
        probeName: `host-${index + 1}`,
      },
    };
  }
  if (
    allowInsecurePlaintextDev &&
    (requestedMode === undefined || requestedMode === 'insecure-plaintext-dev')
  ) {
    return {
      tlsMode: 'insecure-plaintext-dev',
      host: {
        url: `${scheme}//${parsed.host}`,
        hostname,
        directTls: false,
        useStartTls: false,
        probeName: `host-${index + 1}`,
      },
    };
  }
  throw new RangeError(
    `Plaintext ldap:// URL at urls[${index}] is refused by default. Use ldaps://, set tls.mode="starttls", or explicitly opt into development plaintext with tls.allowInsecurePlaintextDev=true.`,
  );
}

/**
 * Validates and normalizes static LDAP adapter options without performing I/O.
 *
 * Enforces strict TLS defaults, forbids inline bind passwords or URL-embedded credentials,
 * and validates all bounds.
 *
 * @param options - Raw LDAP adapter options.
 * @returns Validated immutable configuration object.
 * @throws {RangeError} When any security or boundary invariant is violated.
 */
export function resolveLdapConfig(options: LdapStaticConfigOptions): ResolvedLdapConfig {
  rejectForbiddenInlinePassword(options);

  const name = options.name === undefined ? 'ldap' : requireNonEmptyString(options.name, 'name');
  const directoryInstance = requireNonEmptyString(options.directoryInstance, 'directoryInstance');
  const baseDn = requireNonEmptyString(options.baseDn, 'baseDn');
  const usersBaseDn = options.usersBaseDn === undefined
    ? baseDn
    : requireNonEmptyString(options.usersBaseDn, 'usersBaseDn');
  const groupsBaseDn = options.groupsBaseDn === undefined
    ? baseDn
    : requireNonEmptyString(options.groupsBaseDn, 'groupsBaseDn');
  const bindDn = requireNonEmptyString(options.bindDn, 'bindDn');
  const bindPasswordFile = requireNonEmptyString(options.bindPasswordFile, 'bindPasswordFile');

  if (!Array.isArray(options.urls) || options.urls.length === 0) {
    throw new RangeError('LDAP configuration "urls" must contain at least one directory URL.');
  }

  const tls = options.tls;
  if (tls !== undefined) {
    const rawReject = (tls as Record<string, unknown>).rejectUnauthorized;
    if (rawReject !== undefined && rawReject !== true) {
      throw new RangeError(
        'LDAP TLS certificate verification (rejectUnauthorized: true) cannot be disabled; pass tls.caFile for private CAs.',
      );
    }
    if (tls.mode === 'insecure-plaintext-dev' && tls.allowInsecurePlaintextDev !== true) {
      throw new RangeError(
        'tls.mode="insecure-plaintext-dev" requires tls.allowInsecurePlaintextDev=true.',
      );
    }
  }

  const hosts: ResolvedLdapHost[] = [];
  let effectiveTlsMode: LdapTlsMode | undefined;
  for (let i = 0; i < options.urls.length; i++) {
    const resolved = resolveHost(options.urls[i]!, i, tls);
    if (effectiveTlsMode === undefined) {
      effectiveTlsMode = resolved.tlsMode;
    } else if (effectiveTlsMode !== resolved.tlsMode) {
      throw new RangeError(
        'All configured LDAP URLs must use a consistent transport security mode (all ldaps:// or all ldap:// with StartTLS).',
      );
    }
    hosts.push(resolved.host);
  }

  const caFile = tls?.caFile === undefined
    ? undefined
    : requireNonEmptyString(tls.caFile, 'tls.caFile');
  const servername = tls?.servername === undefined
    ? undefined
    : requireNonEmptyString(tls.servername, 'tls.servername');

  const maxSearchLimit = requirePositiveInt(
    options.maxSearchLimit,
    DIRECTORY_MAX_SEARCH_LIMIT,
    'maxSearchLimit',
  );
  const pageSize = requirePositiveInt(options.pageSize, DEFAULT_LDAP_PAGE_SIZE, 'pageSize');
  const defaultTimeoutMs = requirePositiveInt(
    options.defaultTimeoutMs,
    DEFAULT_LDAP_TIMEOUT_MS,
    'defaultTimeoutMs',
  );
  const connectTimeoutMs = requirePositiveInt(
    options.connectTimeoutMs,
    Math.min(defaultTimeoutMs, 3_000),
    'connectTimeoutMs',
  );
  const candidateBatchSize = requirePositiveInt(
    options.candidateBatchSize,
    DEFAULT_LDAP_CANDIDATE_BATCH_SIZE,
    'candidateBatchSize',
  );

  const attrs = options.attributes;
  const userObjectClass = attrs?.userObjectClass?.trim() || 'user';
  const excludeUserObjectClasses = attrs?.excludeUserObjectClasses ??
    (userObjectClass.toLowerCase() === 'user' ? ['computer'] : []);

  const attributes: ResolvedLdapAttributeMap = {
    userObjectClass,
    excludeUserObjectClasses,
    groupObjectClass: attrs?.groupObjectClass?.trim() || 'group',
    immutableId: attrs?.immutableId?.trim() || 'objectGUID',
    objectSid: attrs?.objectSid?.trim() || 'objectSid',
    primaryGroupId: attrs?.primaryGroupId?.trim() || 'primaryGroupID',
    userAccountControl: attrs?.userAccountControl?.trim() || 'userAccountControl',
    accountExpires: attrs?.accountExpires?.trim() || 'accountExpires',
    displayName: attrs?.displayName?.trim() || 'displayName',
    userPrincipalName: attrs?.userPrincipalName?.trim() || 'userPrincipalName',
    mail: attrs?.mail?.trim() || 'mail',
    username: attrs?.username?.trim() || 'sAMAccountName',
    groupDisplayName: attrs?.groupDisplayName?.trim() || 'cn',
    groupDescription: attrs?.groupDescription?.trim() || 'description',
    member: attrs?.member?.trim() || 'member',
  };

  return {
    name,
    directoryInstance,
    hosts,
    baseDn,
    usersBaseDn,
    groupsBaseDn,
    bindDn,
    bindPasswordFile,
    tlsMode: effectiveTlsMode!,
    caFile,
    servername,
    supportsInChainMatching: options.supportsInChainMatching ?? true,
    maxSearchLimit,
    pageSize,
    defaultTimeoutMs,
    connectTimeoutMs,
    candidateBatchSize,
    attributes,
  };
}
