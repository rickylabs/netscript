/**
 * Contract-level fixtures for auth plugin tests.
 *
 * @module
 */

import type { AuthSession, AuthUser } from '../domain/mod.ts';

/** Options accepted by {@link buildAuthUser}. */
export type BuildAuthUserOptions = Partial<AuthUser>;

/** Options accepted by {@link buildAuthSession}. */
export type BuildAuthSessionOptions = Partial<AuthSession>;

/** Builds a normalized auth user fixture. */
export function buildAuthUser(options: BuildAuthUserOptions = {}): AuthUser {
  return {
    id: options.id ?? 'user_test',
    displayName: options.displayName ?? 'Test User',
    email: options.email ?? 'test@example.com',
    emailVerified: options.emailVerified ?? true,
    imageUrl: options.imageUrl,
    locale: options.locale,
    claims: options.claims ?? {},
  };
}

/** Builds a normalized auth session fixture. */
export function buildAuthSession(options: BuildAuthSessionOptions = {}): AuthSession {
  return {
    id: options.id ?? 'sess_test',
    userId: options.userId ?? 'user_test',
    accountId: options.accountId,
    providerId: options.providerId ?? 'provider_test',
    state: options.state ?? 'active',
    subject: options.subject ?? 'user:user_test',
    scopes: options.scopes ?? ['profile:read'],
    roles: options.roles ?? ['user'],
    claims: options.claims ?? {},
    issuedAt: options.issuedAt ?? '2026-01-01T00:00:00.000Z',
    expiresAt: options.expiresAt ?? '2026-01-02T00:00:00.000Z',
    refreshedAt: options.refreshedAt,
    revokedAt: options.revokedAt,
    traceparent: options.traceparent,
    tracestate: options.tracestate,
  };
}
