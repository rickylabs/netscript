import { join } from '@std/path';
import { z } from 'zod';
import { ConfigInvalidError } from '../../domain/errors.ts';
import {
  readConfiguredPluginDirectories,
  readInstalledDeclarations,
} from '../plugin/installed-plugin-declarations.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';

/** Consumer-facing reason for a service created without configured authentication. */
export const SERVICE_PUBLIC_REASON: string =
  'Service authentication is not configured. Install or enable the auth plugin to protect this API.';

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
      singleQuoted(authServiceName)
    }, timeoutMs: 10_000 }),
    },
    authz: {
      authorizer: createScopeAuthorizer({
        rules: [{ match: () => true, requireScopes: [${singleQuoted(`${serviceName}:access`)}] }],
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
  let value: unknown;
  try {
    value = JSON.parse(await fs.readFile(path));
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new ConfigInvalidError('Invalid appsettings.json: expected valid JSON.', path);
  }
  const parsed = authSettingsSchema.safeParse(value);
  if (!parsed.success) {
    throw new ConfigInvalidError(
      `Invalid appsettings.json auth configuration: ${parsed.error.message}`,
      path,
    );
  }
  const plugins = parsed.data.NetScript?.Plugins ?? {};
  const directories = await readConfiguredPluginDirectories(projectRoot, fs);
  const declarations = await readInstalledDeclarations(
    projectRoot,
    plugins,
    parsed.data.NetScript?.BackgroundProcessors ?? {},
    directories,
    fs,
  );
  const auth = declarations.find((declaration) => declaration.canonicalName === 'auth');
  if (!auth) return undefined;
  if (auth.resourceConfigKey !== 'auth' || plugins[auth.resourceConfigKey] === undefined) {
    throw new ConfigInvalidError(
      'Unsupported or incomplete auth plugin installation. ' +
        'Service add requires the canonical auth key; install auth with --name auth ' +
        'and ensure its manifest matches NetScript.Plugins.auth.',
      path,
    );
  }
  return plugins.auth.Enabled === false ? undefined : 'auth';
}

const pluginEntrySchema = z.object({ Enabled: z.boolean().optional() }).passthrough();
const authSettingsSchema = z.object({
  NetScript: z.object({
    Plugins: z.record(z.string(), pluginEntrySchema).optional(),
    BackgroundProcessors: z.record(z.string(), pluginEntrySchema).optional(),
  }).passthrough().optional(),
}).passthrough();

function singleQuoted(value: string): string {
  return "'" + JSON.stringify(value).slice(1, -1).replaceAll("'", "\\'").replaceAll('\\"', '"') +
    "'";
}
