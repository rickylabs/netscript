import { dirname, join, relative, resolve } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import { SERVICE_PUBLIC_REASON } from '../service/auth-policy.ts';

interface BrowserAuthEntry {
  readonly Type?: string;
  readonly Workdir?: string;
  readonly Entrypoint?: string;
  PluginReferences?: string[];
}
interface BrowserAuthSettings {
  NetScript?: {
    Plugins?: Record<string, { PackageSpecifier?: string; Enabled?: boolean }>;
    Apps?: Record<string, BrowserAuthEntry>;
    Services?: Record<string, BrowserAuthEntry>;
  };
}
interface BrowserAuthFile {
  readonly path: string;
  readonly content: string;
  readonly overwrite?: boolean;
}

// Composition contract with #1382 L1: replace only its exact scaffold opt-out line.
const PUBLIC_POLICY =
  "  auth: { public: true, reason: 'Scaffold demo is public; #1382 L2 will wire the guarded auth policy' },";

const FORMATTED_PUBLIC_POLICY = `  auth: {
    public: true,
    reason: 'Scaffold demo is public; #1382 L2 will wire the guarded auth policy',
  },`;

// Retain the legacy opt-out and recognize the current scaffold's exact public reason.
const PUBLIC_POLICIES = [
  PUBLIC_POLICY,
  FORMATTED_PUBLIC_POLICY,
  `  auth: { public: true, reason: '${SERVICE_PUBLIC_REASON}' },`,
  `  auth: {
    public: true,
    reason: '${SERVICE_PUBLIC_REASON}',
  },`,
  `  auth: {
    public: true,
    reason:
      '${SERVICE_PUBLIC_REASON}',
  },`,
];

/** Reconcile install-time browser auth using the CLI's injected filesystem boundary. */
export async function reconcileBrowserAuth(
  projectRoot: string,
  fs: FileSystemPort,
  formatter?: GeneratedSourceFormatterPort,
): Promise<readonly string[]> {
  const settingsPath = join(projectRoot, 'appsettings.json');
  const settings = JSON.parse(
    await fs.readFile(settingsPath),
  ) as BrowserAuthSettings;
  const config = settings.NetScript;
  const auth = Object.entries(config?.Plugins ?? {}).find(([name, entry]) =>
    entry.Enabled !== false &&
    (name === 'auth' || entry.PackageSpecifier === '@netscript/plugin-auth')
  );
  if (!auth || !config) return [];
  const authServiceName = JSON.stringify(auth[0]);
  const files: BrowserAuthFile[] = [
    {
      path: join(projectRoot, 'auth/bff.ts'),
      content: renderTemplateAssetSync(TEMPLATE_KEYS.authBff, {
        authServiceName,
      }),
    },
    {
      path: join(projectRoot, 'auth/service.ts'),
      content: renderTemplateAssetSync(TEMPLATE_KEYS.authService, {
        authServiceName,
      }),
    },
  ];
  for (const [name, entry] of Object.entries(config.Apps ?? {})) {
    if (entry.Type && entry.Type !== 'app') continue;
    const appRoot = workspacePath(projectRoot, entry.Workdir ?? `apps/${name}`);
    const path = join(appRoot, 'routes/auth/[action].ts');
    // Custom layouts are left to their author; this route is for generated Fresh apps.
    if (!await fs.exists(join(appRoot, 'utils.ts'))) continue;
    const bffImport = relative(dirname(path), join(projectRoot, 'auth/bff.ts'))
      .replaceAll('\\', '/');
    files.push({
      path,
      content: renderTemplateAssetSync(TEMPLATE_KEYS.authRoute, { bffImport }),
    });
    entry.PluginReferences = [
      ...new Set([...(entry.PluginReferences ?? []), auth[0]]),
    ];
  }
  for (const [name, entry] of Object.entries(config.Services ?? {})) {
    const serviceRoot = workspacePath(
      projectRoot,
      entry.Workdir ?? `services/${name}`,
    );
    const path = join(serviceRoot, entry.Entrypoint ?? 'src/main.ts');
    if (!await fs.exists(path)) continue;
    const current = await fs.readFile(path);
    if (!current.includes('await defineService(router, {')) continue;
    if (current.includes('authenticator: browserAuthenticator')) continue;
    // An authored guarded policy is authoritative; a scaffold opt-out must compose exactly.
    const publicPolicy = PUBLIC_POLICIES.find((policy) => current.includes(policy));
    if (!publicPolicy) {
      if (
        /\bauth\s*:/.test(current) && !current.includes('Scaffold demo is public') &&
        !current.includes(SERVICE_PUBLIC_REASON)
      ) continue;
      throw new TypeError(
        `Cannot wire browser auth for ${name}: expected the exact #1382 scaffold public policy line`,
      );
    }
    const authImport = relative(
      dirname(path),
      join(projectRoot, 'auth/service.ts'),
    ).replaceAll('\\', '/');
    files.push({
      path,
      overwrite: true,
      content: `import { browserAuthenticator } from '${authImport}';\n` +
        "import { createContractAuthorizer } from '@netscript/service/auth';\n" +
        current.replace(
          publicPolicy,
          `  auth: {
    authn: {
      authenticator: browserAuthenticator,
      // Public discovery endpoints; demo procedures declare access in their contracts.
      allowAnonymous: ['/health', '/api/openapi.json', '/api/docs'],
    },
    authz: { authorizer: createContractAuthorizer(router) },
  },`,
        ),
    });
    entry.PluginReferences = [
      ...new Set([...(entry.PluginReferences ?? []), auth[0]]),
    ];
  }
  const written: string[] = [];
  for (const file of files) {
    if (await fs.exists(file.path)) {
      // Never replace a previously authored module or route.
      if (!file.overwrite) continue;
      if (await fs.readFile(file.path) === file.content) continue;
    }
    await fs.createDir(dirname(file.path));
    const content = formatter
      ? await formatter.formatContent(file.path, file.content)
      : file.content;
    await fs.writeFile(file.path, content);
    written.push(file.path);
  }
  const content = `${JSON.stringify(settings, null, 2)}\n`;
  if (await fs.readFile(settingsPath) !== content) {
    await fs.writeFile(settingsPath, content);
  }
  return written;
}

function workspacePath(root: string, path: string): string {
  const resolved = resolve(root, path);
  const rel = relative(root, resolved);
  if (rel.startsWith('..') || rel === '') {
    throw new TypeError(
      'Browser auth requires a resource directory inside its workspace',
    );
  }
  return resolved;
}
