import { getKv, type WatchableKv } from '@netscript/kv';
import type { AuthSession } from '@netscript/plugin-auth-core';
import { createKvOAuthCrypto, type KvOAuthCrypto, type KvOAuthKeyMaterial } from './crypto.ts';
import { KvOAuthError } from './errors.ts';

export { AUTH_SESSION_STATES } from '@netscript/plugin-auth-core';
export type { AuthSession, AuthSessionState } from '@netscript/plugin-auth-core';
export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
} from '@netscript/kv';

/** OAuth token set stored encrypted at rest. */
export type KvOAuthTokenSet = Readonly<{
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: string;
  claims?: Readonly<Record<string, unknown>>;
}>;

/** Encrypted token container stored in KV. */
export type KvOAuthEncryptedTokens = Readonly<{
  keyId: string;
  sealed: string;
}>;

/** Single-use OAuth transaction state. */
export type KvOAuthTxn = Readonly<{
  id: string;
  providerId: string;
  state: string;
  nonce?: string;
  codeVerifier: string;
  returnTo: string;
  issuer?: string;
  createdAt: string;
  expiresAt: string;
}>;

/** Backend session record persisted in KV. */
export type KvOAuthSessionRecord = Readonly<{
  session: AuthSession;
  tokens: KvOAuthEncryptedTokens;
  refreshTokenHash?: string;
  compromisedAt?: string;
}>;

/** Options used to construct a KV OAuth store. */
export type KvOAuthStoreOptions = Readonly<{
  kv?: WatchableKv;
  namespace?: readonly string[];
  sessionTtlMs?: number;
  txnTtlMs?: number;
  encryptionKey?: KvOAuthKeyMaterial;
  keyId?: string;
}>;

/** KV store operations used by flow and backend ports. */
export interface KvOAuthStore {
  /** Crypto helper used to seal token sets before persistence. */
  readonly crypto: KvOAuthCrypto;
  /** Persists a short-lived OAuth transaction and returns its generated id. */
  putTxn(txn: Omit<KvOAuthTxn, 'id' | 'createdAt' | 'expiresAt'>): Promise<KvOAuthTxn>;
  /** Atomically reads and deletes an OAuth transaction. */
  takeTxn(id: string): Promise<KvOAuthTxn | null>;
  /** Persists a normalized auth session and seals the token set. */
  putSession(
    record: Omit<KvOAuthSessionRecord, 'tokens'> & { tokens: KvOAuthTokenSet },
  ): Promise<KvOAuthSessionRecord>;
  /** Reads a session record by id. */
  getSession(id: string): Promise<KvOAuthSessionRecord | null>;
  /** Replaces a session record using optimistic concurrency. */
  rotateSession(
    id: string,
    next: KvOAuthSessionRecord,
    expectedVersionstamp?: string | null,
  ): Promise<boolean>;
  /** Deletes a session record. */
  deleteSession(id: string): Promise<void>;
  /** Seals an OAuth token set for KV persistence. */
  sealTokens(tokens: KvOAuthTokenSet): Promise<KvOAuthEncryptedTokens>;
  /** Opens an encrypted token set from KV persistence. */
  openTokens(tokens: KvOAuthEncryptedTokens): Promise<KvOAuthTokenSet>;
}

/** Creates a `WatchableKv` backed OAuth store. */
export async function createKvOAuthStore(options: KvOAuthStoreOptions = {}): Promise<KvOAuthStore> {
  const kv = options.kv ?? await getKv();
  const namespace = options.namespace ?? ['auth-kv-oauth'];
  const sessionTtlMs = options.sessionTtlMs ?? 90 * 24 * 60 * 60 * 1000;
  const txnTtlMs = options.txnTtlMs ?? 10 * 60 * 1000;
  const oauthCrypto = await createKvOAuthCrypto(options.encryptionKey, options.keyId);

  const txnKey = (id: string): readonly Deno.KvKeyPart[] => [...namespace, 'txn', id];
  const sessionKey = (id: string): readonly Deno.KvKeyPart[] => [...namespace, 'session', id];

  return {
    crypto: oauthCrypto,
    async putTxn(input): Promise<KvOAuthTxn> {
      const now = new Date();
      const txn: KvOAuthTxn = {
        ...input,
        id: randomId('txn'),
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + txnTtlMs).toISOString(),
      };
      await kv.set(txnKey(txn.id), txn, { expireIn: txnTtlMs });
      return txn;
    },
    async takeTxn(id): Promise<KvOAuthTxn | null> {
      const key = txnKey(id);
      const entry = await kv.get<KvOAuthTxn>(key);
      if (!entry) {
        return null;
      }
      const result = await requireAtomic(kv).call(kv, [{ key, versionstamp: entry.versionstamp }], [
        { type: 'delete', key },
      ]);
      return result.ok ? entry.value : null;
    },
    async putSession(input): Promise<KvOAuthSessionRecord> {
      const record: KvOAuthSessionRecord = {
        ...input,
        tokens: { keyId: oauthCrypto.keyId, sealed: await oauthCrypto.seal(input.tokens) },
        refreshTokenHash: input.tokens.refreshToken
          ? await hashToken(input.tokens.refreshToken)
          : undefined,
      };
      await kv.set(sessionKey(record.session.id), record, { expireIn: sessionTtlMs });
      return record;
    },
    async getSession(id): Promise<KvOAuthSessionRecord | null> {
      const entry = await kv.get<KvOAuthSessionRecord>(sessionKey(id));
      return entry?.value ?? null;
    },
    async rotateSession(id, next, expectedVersionstamp): Promise<boolean> {
      const key = sessionKey(id);
      const entry = expectedVersionstamp === undefined
        ? await kv.get<KvOAuthSessionRecord>(key)
        : undefined;
      const versionstamp = expectedVersionstamp === undefined
        ? entry?.versionstamp ?? null
        : expectedVersionstamp;
      const result = await requireAtomic(kv).call(kv, [{ key, versionstamp }], [
        { type: 'set', key, value: next, expireIn: sessionTtlMs },
      ]);
      return result.ok;
    },
    async deleteSession(id): Promise<void> {
      await kv.delete(sessionKey(id));
    },
    async sealTokens(tokens): Promise<KvOAuthEncryptedTokens> {
      return { keyId: oauthCrypto.keyId, sealed: await oauthCrypto.seal(tokens) };
    },
    async openTokens(tokens): Promise<KvOAuthTokenSet> {
      return await oauthCrypto.open<KvOAuthTokenSet>(tokens.sealed);
    },
  };
}

/** Hashes a refresh token for reuse detection without storing the raw token outside the sealed blob. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function requireAtomic(kv: WatchableKv): NonNullable<WatchableKv['atomic']> {
  if (!kv.atomic) {
    throw new KvOAuthError(
      'configuration_error',
      'WatchableKv adapter must support atomic CAS operations.',
    );
  }
  return kv.atomic;
}

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}
