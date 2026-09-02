import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';

/** Scaffolder input for the fixed auth SDK client contribution starter. */
export type AuthSdkClientInput = Readonly<Record<string, never>>;

/** Default input for the auth SDK client contribution starter. */
export const DEFAULT_AUTH_SDK_CLIENT_INPUT: AuthSdkClientInput = {};

/** Starter module that applications explicitly attach to an auth service client. */
export const authSdkClientScaffolder: ItemScaffolder<AuthSdkClientInput> = {
  name: 'sdk-client',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'auth/sdk-client.ts',
        `/** Generated typed bearer contribution for an explicitly selected service client. */

import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';

/** Application-owned context used to resolve an auth bearer credential. */
export interface AuthSdkClientContext {
  /** Explicit credential provider; no environment or browser storage is read here. */
  readonly auth: {
    /** Resolve the current opaque access credential for this logical call. */
    readonly getAccessToken: () => string | undefined | PromiseLike<string | undefined>;
  };
  /** Stable non-secret tenant/account cache partition; never use a token, session id, or email. */
  readonly authCachePartition: string;
}

/**
 * Bearer contribution available for explicit placement in a named service tuple:
 * \`contributions: [authSdkClientContribution] as const\`.
 */
export const authSdkClientContribution = createBearerSdkClientContribution<AuthSdkClientContext>({
  context: { auth: 'required', authCachePartition: 'required' },
  resolveCredential: ({ context }) => context.auth.getAccessToken(),
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.authCachePartition,
  },
});
`,
      ),
    ];
  },
};
