import { join } from '@std/path';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';

/** Consumer-facing reason for a service created before authentication is installed. */
export const SERVICE_PUBLIC_REASON: string =
  'Authentication is not installed. Install the auth plugin to protect this service API.';

/** Service entrypoint template composition, shared by both service variants. */
export interface ServiceAuthTemplate {
  readonly authImports: string;
  readonly authPolicy: string;
}

/** Compose native service guards, or record why the generated API is public. */
export function serviceAuthTemplate(
  serviceName: string,
  authServiceName?: string,
): ServiceAuthTemplate {
  if (authServiceName === undefined) {
    return {
      authImports: '',
      authPolicy: `auth: { public: true, reason: '${SERVICE_PUBLIC_REASON}' },`,
    };
  }
  return {
    authImports:
      "import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';\n" +
      "import { createScopeAuthorizer } from '@netscript/service/auth';",
    authPolicy: `auth: {
    authn: {
      authenticator: createAuthServiceAuthenticator({ serviceName: ${
      JSON.stringify(authServiceName)
    }, timeoutMs: 10_000 }),
    },
    authz: {
      authorizer: createScopeAuthorizer({
        rules: [{ match: () => true, requireScopes: [${JSON.stringify(`${serviceName}:access`)}] }],
      }),
    },
  },`,
  };
}

/** Find the enabled installed auth plugin's discovery name through the filesystem port. */
export async function readAuthServiceName(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  const path = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(path)) return undefined;
  const settings = JSON.parse(await fs.readFile(path)) as {
    NetScript?: {
      Plugins?: Record<string, { Enabled?: boolean; PackageSpecifier?: string }>;
    };
  };
  return Object.entries(settings.NetScript?.Plugins ?? {}).find(([name, plugin]) =>
    plugin.Enabled !== false &&
    (name === 'auth' || plugin.PackageSpecifier === '@netscript/plugin-auth')
  )?.[0];
}
