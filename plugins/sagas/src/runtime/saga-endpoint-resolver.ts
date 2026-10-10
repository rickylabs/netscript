import type { SagaPublisherEndpointDiagnostic } from '@netscript/plugin-sagas-core/integration/publisher';

/** Environment lookup boundary used for Aspire service discovery. */
export type SagaPublisherEnvReader = (name: string) => string | undefined;

/** Environment key enumeration boundary used only to diagnose a failed discovery. */
export type SagaPublisherEnvKeyLister = () => Iterable<string>;

/** Ordered endpoint discovery for the sagas API, with a key-names-only failure diagnostic. */
export type SagaEndpointResolver = Readonly<{
  /** Resolve the sagas API base URL, or `undefined` when no source is set. */
  resolve(): string | undefined;
  /** Describe what discovery consulted; call only after `resolve()` returned `undefined`. */
  diagnose(): SagaPublisherEndpointDiagnostic;
}>;

/** Inputs for the sagas API endpoint resolver. */
export type SagaEndpointResolverOptions = Readonly<{
  serviceName: string;
  baseUrl?: string;
  readEnv: SagaPublisherEnvReader;
  listEnvKeys: SagaPublisherEnvKeyLister;
}>;

const BASE_URL_SOURCE = 'options.baseUrl' as const;
const ASPIRE_SERVICE_KEY_PREFIX = 'services__' as const;
const ASPIRE_MARKER_KEY = 'NETSCRIPT_ASPIRE' as const;

/** Create the resolver; the ordered source list is built once, not per publish. */
export function createSagaEndpointResolver(
  options: SagaEndpointResolverOptions,
): SagaEndpointResolver {
  const envKeys = Object.freeze([
    `services__${options.serviceName}__https__0`,
    `services__${options.serviceName}__http__0`,
    'SAGAS_API_URL',
    'NETSCRIPT_SAGAS_URL',
  ]);
  const attempted = Object.freeze([BASE_URL_SOURCE, ...envKeys]);

  return Object.freeze({
    resolve(): string | undefined {
      if (options.baseUrl !== undefined) return options.baseUrl;
      for (const key of envKeys) {
        const value = options.readEnv(key);
        if (value !== undefined) return value;
      }
      return undefined;
    },
    diagnose(): SagaPublisherEndpointDiagnostic {
      const detection = detectAspireEnvironment(options.listEnvKeys);
      return Object.freeze({ attempted, ...detection });
    },
  });
}

/** Default enumeration over the process environment; reads key names only. */
export function listDenoEnvKeys(): Iterable<string> {
  return Object.keys(Deno.env.toObject());
}

function detectAspireEnvironment(
  listEnvKeys: SagaPublisherEnvKeyLister,
): Pick<SagaPublisherEndpointDiagnostic, 'aspireDetected' | 'envEnumerationDenied'> {
  try {
    for (const key of listEnvKeys()) {
      if (key.startsWith(ASPIRE_SERVICE_KEY_PREFIX) || key === ASPIRE_MARKER_KEY) {
        return { aspireDetected: true, envEnumerationDenied: false };
      }
    }
    return { aspireDetected: false, envEnumerationDenied: false };
  } catch (error) {
    if (isPermissionDenied(error)) {
      return { aspireDetected: false, envEnumerationDenied: true };
    }
    throw error;
  }
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof Deno.errors.NotCapable || error instanceof Deno.errors.PermissionDenied;
}
