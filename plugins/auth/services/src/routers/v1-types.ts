import type {
  AuthBackendPort,
  ResolvedAuthBackendRegistry,
} from '@netscript/plugin-auth-core/ports';
import type { AuthnRequest, AuthSession } from '@netscript/plugin-auth-core/domain';
import type {
  CallbackInput,
  CallbackResponse,
  MeResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
} from '@netscript/plugin-auth-core/contracts/v1';

/** Minimal HTTP request data available to auth handlers. */
export type AuthServiceRequest = Readonly<{
  url: string;
  method?: string;
  headers?: Headers;
}>;

/** Service context available to V1 auth route handlers. */
export type AuthServiceContext = Readonly<{
  registry: ResolvedAuthBackendRegistry;
  request?: AuthServiceRequest;
}>;

/** Backend with optional interactive flow methods supplied by concrete adapters. */
export type InteractiveAuthBackend =
  & AuthBackendPort
  & Partial<{
    signIn(request: Request, options?: { returnTo?: string }): Promise<Response>;
    handleCallback(request: Request): Promise<{
      readonly response: Response;
      readonly sessionId: string;
      readonly principal: { readonly subject: string };
    }>;
    getSessionId(request: Request): Promise<string | undefined>;
    signOut(request: Request, options?: { revoke?: boolean }): Promise<Response>;
  }>;

/** Error used before handler-level mapping into contract-defined oRPC errors. */
export class AuthServiceHandlerError extends Error {
  /** Contract error code. */
  readonly code: 'UNAUTHORIZED' | 'AUTH_PROVIDER_ERROR' | 'VALIDATION_ERROR';
  /** Provider id or backend name related to the failure. */
  readonly providerId?: string;
  /** Validation form errors. */
  readonly formErrors?: readonly string[];
  /** Validation field errors. */
  readonly fieldErrors?: Readonly<Record<string, readonly string[] | undefined>>;

  /** Creates an auth handler error. */
  constructor(
    code: AuthServiceHandlerError['code'],
    message: string,
    options: {
      readonly providerId?: string;
      readonly formErrors?: readonly string[];
      readonly fieldErrors?: Readonly<Record<string, readonly string[] | undefined>>;
    } = {},
  ) {
    super(message);
    this.name = 'AuthServiceHandlerError';
    this.code = code;
    this.providerId = options.providerId;
    this.formErrors = options.formErrors;
    this.fieldErrors = options.fieldErrors;
  }
}

/** Input and output pair for signin handler tests. */
export type SigninHandler = (
  input: SigninInput,
  context: AuthServiceContext,
) => Promise<SigninResponse>;

/** Input and output pair for callback handler tests. */
export type CallbackHandler = (
  input: CallbackInput,
  context: AuthServiceContext,
) => Promise<CallbackResponse>;

/** Input and output pair for signout handler tests. */
export type SignoutHandler = (
  input: SignoutInput,
  context: AuthServiceContext,
) => Promise<SignoutResponse>;

/** Input and output pair for session handler tests. */
export type SessionHandler = (
  input: SessionInput | undefined,
  context: AuthServiceContext,
) => Promise<SessionResponse>;

/** Input and output pair for me handler tests. */
export type MeHandler = (context: AuthServiceContext) => Promise<MeResponse>;

/** Session mapper used by helpers. */
export type AuthSessionMapper = (session: AuthSession) => SessionResponse['session'];

/** Authn request factory used by helpers and tests. */
export type AuthnRequestFactory = (
  serviceRequest: AuthServiceRequest | undefined,
  sessionId?: string,
) => AuthnRequest;
