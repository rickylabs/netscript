/**
 * Request-less `AuthnRequest` synthesis and structured in-process auth audit
 * logging helpers for NetScript's oRPC procedure pipeline.
 *
 * @module
 */

import { createLogger, type Logger } from '@netscript/logger';
import type { AuthnRequest, Principal } from '../auth/types.ts';

const PROCEDURE_AUTH_LOGGER = createLogger(['netscript', 'service', 'auth']);

/** Builds a non-HTTP `AuthnRequest` with `IN_PROCESS` method and `orpc://` URI. */
export function toRequestlessAuthnRequest(
  rawHeaders: Readonly<Record<string, string>> | Headers | undefined,
  serviceName: string,
  procedureKey: string,
): AuthnRequest {
  const headerMap = new Headers();
  if (rawHeaders instanceof Headers) {
    for (const [key, value] of rawHeaders.entries()) {
      headerMap.append(key, value);
    }
  } else if (typeof rawHeaders === 'object' && rawHeaders !== null) {
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (typeof value === 'string') {
        headerMap.append(key, value);
      }
    }
  }

  return {
    method: 'IN_PROCESS',
    path: `orpc://${serviceName}/${procedureKey}`,
    header: (name: string) => headerMap.get(name) ?? undefined,
    headers: () => new Headers(headerMap),
    cookie: (name: string) => readCookie(headerMap.get('cookie') ?? undefined, name),
  };
}

/** Maps an authenticator rejection string to `commonErrorMap.UNAUTHORIZED.reason`. */
export function mapUnauthorizedReason(
  reason: string,
): 'missing_token' | 'invalid_token' | 'expired_token' {
  const lower = reason.toLowerCase();
  if (lower.includes('expired')) return 'expired_token';
  if (lower.includes('missing')) return 'missing_token';
  return 'invalid_token';
}

/** Emits structured in-process authn/authz audit log records with hashed subjects. */
export async function logInProcessAuthDecision(
  params: {
    readonly logger?: Logger;
    readonly requestId: string;
    readonly serviceName: string;
    readonly procedureKey: string;
  },
  event: {
    readonly stage: 'authn' | 'authz';
    readonly decision: 'allow' | 'deny';
    readonly principal?: Principal;
    readonly reason?: string;
  },
): Promise<void> {
  const logger = params.logger ?? PROCEDURE_AUTH_LOGGER;
  const subjectHash = event.principal ? await hashSubject(event.principal.subject) : undefined;
  const fields = {
    stage: event.stage,
    decision: event.decision,
    transport: 'in-process',
    procedure: params.procedureKey,
    method: 'IN_PROCESS',
    path: `orpc://${params.serviceName}/${params.procedureKey}`,
    requestId: params.requestId,
    scheme: event.principal?.scheme,
    subjectHash,
    reason: event.reason,
  };
  const message = event.decision === 'allow' ? 'auth decision allow' : 'auth decision deny';
  if (event.decision === 'allow') {
    logger.info(message, fields);
  } else {
    logger.warn(message, fields);
  }
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === name) {
      return rawValue.join('=');
    }
  }
  return undefined;
}

async function hashSubject(subject: string): Promise<string> {
  const bytes = new TextEncoder().encode(subject);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
