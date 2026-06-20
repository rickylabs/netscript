# API Design — `@netscript/auth-kv-oauth`

Public surface for the KV-backed OAuth2/OIDC adapter. Consumes `@netscript/service/auth` (#77) and
`@netscript/kv`; protocol engine is `jsr:@panva/oauth4webapi@^3.8.6`. All exports carry explicit
return types (`isolatedDeclarations:true`). Provider SDK types are NOT re-exported — we expose
minimal structural interfaces to keep the public surface stable.

## Module map

```
packages/auth-kv-oauth/
  mod.ts                      # public exports (+ re-export seam types for convenience)
  deno.json                  # @netscript/auth-kv-oauth, jsr: engine pin, --unstable-kv check task
  package.json               # only if an npm catalog: dep is later needed (baseline: none)
  README.md
  src/
    config.ts                # OAuthProviderConfig + generic builder + discovery resolution
    providers.ts             # preset registry (first-class + tier-2) over the generic builder
    store.ts                 # KvOAuthStore over WatchableKv (txn + session namespaces, CAS)
    crypto.ts                # AES-256-GCM token sealing; PKCE/state/nonce via engine
    cookies.ts               # __Host- cookie build/parse, isHttps-from-forwarded-proto
    flow.ts                  # signIn / handleCallback / signOut / getSessionId closures
    authenticator.ts         # createKvOAuthAuthenticator -> AuthenticatorPort (+ refresh rotation)
    mount.ts                 # mountKvOAuthHandler (Hono) owning /signin /callback /signout
    errors.ts                # KvOAuthError taxonomy (mirrors engine + seam reason strings)
  tests/...
```

## Core configuration

```ts
/** Minimal structural provider config — generic primitive all presets build on. */
export interface OAuthProviderConfig {
  readonly clientId: string;
  readonly clientSecret?: string;            // omit for public clients (PKCE-only)
  /** OIDC issuer for discovery; when set, endpoints are resolved from metadata. */
  readonly issuer?: string;
  /** Explicit endpoints for non-OIDC providers (or to override discovery). */
  readonly authorizationEndpoint?: string;
  readonly tokenEndpoint?: string;
  readonly userInfoEndpoint?: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];        // normalized to array (accepts string|string[] via builder)
  readonly clientAuthMethod?: "client_secret_basic" | "client_secret_post" | "none";
  readonly pkce?: boolean;                    // default true (S256); never plain
  readonly par?: boolean;                     // default false (opt-in)
  readonly extraAuthParams?: Readonly<Record<string, string>>;
}

/** Builder: normalizes scope, fills env-derived client creds, validates shape. */
export function defineOAuthProvider(
  input: OAuthProviderInput,
): OAuthProviderConfig;

/** Preset registry — every named provider is data over defineOAuthProvider. */
export const providers: {
  github(opts: PresetOpts): OAuthProviderConfig;
  google(opts: PresetOpts): OAuthProviderConfig;
  gitlab(opts: PresetOpts): OAuthProviderConfig;
  discord(opts: PresetOpts): OAuthProviderConfig;
  slack(opts: PresetOpts): OAuthProviderConfig;
  spotify(opts: PresetOpts): OAuthProviderConfig;
  facebook(opts: PresetOpts): OAuthProviderConfig;   // version overridable, not literal-pinned
  twitter(opts: PresetOpts): OAuthProviderConfig;    // verify X.com endpoints at impl
  // tier-2 (issuer/domain templated):
  auth0(opts: TenantPresetOpts): OAuthProviderConfig;
  okta(opts: TenantPresetOpts): OAuthProviderConfig;
  awsCognito(opts: TenantPresetOpts): OAuthProviderConfig;
  azureAd(opts: TenantPresetOpts): OAuthProviderConfig;
  logto(opts: TenantPresetOpts): OAuthProviderConfig;
  clerk(opts: TenantPresetOpts): OAuthProviderConfig;
};
// Generic-only (Azure ADB2C, Notion, Dropbox, Patreon): documented recipes via defineOAuthProvider.
```

## Store (over `@netscript/kv` `WatchableKv`)

```ts
export interface KvOAuthStoreOptions {
  readonly kv?: WatchableKv;                 // default: await getKv(); injectable for tests
  readonly namespace?: readonly string[];    // default ['auth-kv-oauth']
  readonly sessionTtlMs?: number;            // default 90d
  readonly txnTtlMs?: number;                // default 10m
  /**
   * 32-byte AES-256-GCM key for token-at-rest sealing. Inject a CryptoKey/ArrayBuffer, or omit to
   * resolve from the required env secret NETSCRIPT_AUTH_KV_OAUTH_KEY (base64url, 32 bytes). A
   * missing key is a hard startup error — never a silent plaintext fallback. Sealed values carry a
   * `keyId` prefix for forward-compatible rotation (active rotation deferred to debt).
   */
  readonly encryptionKey?: ArrayBuffer | CryptoKey;
  readonly keyId?: string;                    // default 'k0'; prefixes sealed token blobs
}

export interface KvOAuthStore {
  putTxn(txn: OAuthTxn): Promise<string>;                 // returns txn id
  takeTxn(id: string): Promise<OAuthTxn | null>;          // atomic check+delete (single-use)
  putSession(s: OAuthSessionRecord): Promise<string>;
  getSession(id: string): Promise<OAuthSessionRecord | null>;
  rotateSession(id: string, next: OAuthSessionRecord): Promise<boolean>; // versionstamp CAS
  deleteSession(id: string): Promise<void>;
}

export function createKvOAuthStore(opts: KvOAuthStoreOptions): KvOAuthStore;
```

## Flow + authenticator (consumes the #77 seam)

```ts
import type {
  AuthenticatorPort, AuthnRequest, AuthnResult, Principal,
} from "@netscript/service/auth";

export interface KvOAuthCookieOptions {            // mirrors WorkosCookieOptions
  readonly name?: string;                          // default '__Host-ns_session'
  readonly path?: string;                          // default '/'
  readonly domain?: string;                        // omit for __Host-
  readonly maxAge?: number;
  readonly sameSite?: "Strict" | "Lax" | "None";   // default 'Lax'
  readonly secure?: boolean;                        // default: derived from forwarded-proto
  readonly httpOnly?: boolean;                      // default true
}

export type KvOAuthRefreshMode = "never" | "always";   // mirrors WorkosRefreshMode

export interface KvOAuthOptions {
  readonly provider: OAuthProviderConfig;
  readonly store: KvOAuthStore;
  readonly cookie?: KvOAuthCookieOptions;
  readonly refreshMode?: KvOAuthRefreshMode;       // default 'always' (rotate near expiry)
  /** Allowlist or predicate closing the post-login open-redirect. */
  readonly allowedReturnTo?: readonly string[] | ((url: URL) => boolean);
  /** Default = verified id_token claims; override for userinfo/custom mapping. */
  readonly normalizePrincipal?: (ctx: NormalizeContext) => Principal | Promise<Principal>;
}

export interface KvOAuthFlow {
  signIn(request: Request, opts?: { returnTo?: string }): Promise<Response>;
  handleCallback(request: Request): Promise<{ response: Response; sessionId: string; principal: Principal }>;
  getSessionId(request: Request): Promise<string | undefined>;
  signOut(request: Request, opts?: { revoke?: boolean }): Promise<Response>;
}

export function createKvOAuthFlow(options: KvOAuthOptions): KvOAuthFlow;

/** AuthenticatorPort: cookie -> KV session -> (refresh rotation) -> Principal{scheme:'custom'}. */
export function createKvOAuthAuthenticator(options: KvOAuthOptions): AuthenticatorPort;
// On near-expiry it refreshes (engine refreshTokenGrantRequest), CAS-rotates the session,
// and returns { ok:true, principal, setCookies:[rotatedCookie] }; on miss { ok:false, reason }.
```

## Mount helper (Hono, owns the routes)

```ts
export interface MountKvOAuthOptions {
  readonly basePath?: string;                      // default '/api/auth'
  readonly flow: KvOAuthFlow;
}
/** Registers GET <base>/signin, GET <base>/callback, POST <base>/signout. */
export function mountKvOAuthHandler<T extends Hono>(app: T, options: MountKvOAuthOptions): T;
```

## Errors

```ts
export type KvOAuthErrorCode =
  | "oauth_cookie_missing" | "oauth_txn_not_found" | "state_mismatch"
  | "nonce_mismatch" | "id_token_invalid" | "token_exchange_failed"
  | "refresh_failed" | "refresh_reuse_detected" | "return_to_not_allowed"
  | "session_not_found";
export class KvOAuthError extends Error { readonly code: KvOAuthErrorCode; readonly cause?: unknown; }
// AuthnResult.reason strings map 1:1 (e.g. 'kv_oauth_session_missing').
```

## Usage sketch

```ts
const store = createKvOAuthStore({ encryptionKey: await loadKey() });
const provider = providers.google({ clientId: env("GOOGLE_CLIENT_ID"), clientSecret: env("GOOGLE_CLIENT_SECRET"),
  redirectUri: "https://app/api/auth/callback", scopes: ["openid", "email", "profile"] });
const flow = createKvOAuthFlow({ provider, store, allowedReturnTo: ["https://app/"] });

mountKvOAuthHandler(app, { flow });                          // owns /signin /callback /signout
const authenticator = createKvOAuthAuthenticator({ provider, store });  // per-request -> Principal
```
