import { dirname, join, relative, resolve } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import { readAuthServiceName, SERVICE_PUBLIC_REASON } from '../service/auth-policy.ts';

interface BrowserAuthEntry {
  readonly Type?: string;
  readonly Workdir?: string;
  readonly Entrypoint?: string;
  PluginReferences?: string[];
}
interface BrowserAuthSettings {
  NetScript?: {
    Apps?: Record<string, BrowserAuthEntry>;
    Services?: Record<string, BrowserAuthEntry>;
  };
}
interface BrowserAuthFile {
  readonly path: string;
  readonly content: string;
  readonly overwrite?: boolean;
}

// Only scaffold-owned reasons may be replaced; whitespace outside strings is immaterial.
const PUBLIC_REASONS = [
  'Scaffold demo is public; #1382 L2 will wire the guarded auth policy',
  SERVICE_PUBLIC_REASON,
];
const PUBLIC_POLICY = new RegExp(
  String.raw`\bauth\s*:\s*\{\s*public\s*:\s*true\s*,\s*reason\s*:\s*(?:` +
    PUBLIC_REASONS.map((reason) => {
      const escaped = reason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `'${escaped}'|"${escaped}"`;
    }).join('|') + String.raw`)\s*,?\s*\}\s*,`,
);

/** Exact authored paths a lifecycle rollback must preserve before browser reconciliation. */
export async function browserAuthReconciliationPaths(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const auth = await readAuthServiceName(projectRoot, fs);
  if (!auth) return [];
  const settingsPath = join(projectRoot, 'appsettings.json');
  if (!await fs.exists(settingsPath)) return [];
  const settings = JSON.parse(await fs.readFile(settingsPath)) as BrowserAuthSettings;
  return [
    join(projectRoot, 'auth/bff.ts'),
    join(projectRoot, 'auth/service.ts'),
    ...Object.entries(settings.NetScript?.Apps ?? {}).filter(([, entry]) =>
      !entry.Type || entry.Type === 'app'
    ).flatMap(([name, entry]) => [
      dirname(appAuthRoute(projectRoot, name, entry)),
      ...Object.keys(settings.NetScript?.Services ?? {}).map((service) =>
        appServiceSessionRoute(projectRoot, name, entry, service)
      ),
    ]),
    ...Object.entries(settings.NetScript?.Services ?? {}).map(([name, entry]) =>
      serviceEntrypoint(projectRoot, name, entry)
    ),
  ];
}

/** Reconcile install-time browser auth using the CLI's injected filesystem boundary. */
export async function reconcileBrowserAuth(
  projectRoot: string,
  fs: FileSystemPort,
  formatter?: GeneratedSourceFormatterPort,
): Promise<readonly string[]> {
  const auth = await readAuthServiceName(projectRoot, fs);
  if (!auth) return [];
  const settingsPath = join(projectRoot, 'appsettings.json');
  const settings = JSON.parse(
    await fs.readFile(settingsPath),
  ) as BrowserAuthSettings;
  const config = settings.NetScript;
  if (!config) return [];
  const authServiceName = `'${auth}'`;
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
    const path = appAuthRoute(projectRoot, name, entry);
    // Custom layouts are left to their author; this route is for generated Fresh apps.
    if (!await fs.exists(join(appRoot, 'utils.ts'))) continue;
    const bffImport = relative(dirname(path), join(projectRoot, 'auth/bff.ts'))
      .replaceAll('\\', '/');
    files.push({
      path,
      content: renderTemplateAssetSync(TEMPLATE_KEYS.authRoute, { bffImport }),
    });
    for (const service of Object.keys(config.Services ?? {})) {
      const contract = join(projectRoot, 'contracts/versions/v1', `${service}.contract.ts`);
      if (!await fs.exists(contract)) continue;
      // Older or authored contracts need not implement the generated identity proof.
      if (!/\bsession:\s*baseContract\b/.test(await fs.readFile(contract))) continue;
      const route = appServiceSessionRoute(projectRoot, name, entry, service);
      const importFrom = (target: string) => {
        const specifier = relative(dirname(route), target).replaceAll('\\', '/');
        return specifier.startsWith('.') ? specifier : `./${specifier}`;
      };
      files.push({
        path: route,
        content: renderTemplateAssetSync(TEMPLATE_KEYS.authServiceSessionRoute, {
          serviceName: service,
          utilsImport: importFrom(join(appRoot, 'utils.ts')),
          contractImport: importFrom(contract),
          bffImport: importFrom(join(projectRoot, 'auth/bff.ts')),
        }),
      });
    }
    entry.PluginReferences = [
      ...new Set([...(entry.PluginReferences ?? []), auth]),
    ];
  }
  for (const [name, entry] of Object.entries(config.Services ?? {})) {
    const path = serviceEntrypoint(projectRoot, name, entry);
    if (!await fs.exists(path)) continue;
    const current = await fs.readFile(path);
    if (!current.includes('await defineService(router, {')) continue;
    if (current.includes('authenticator: browserAuthenticator')) continue;
    // An authored guarded policy is authoritative; a scaffold opt-out must compose exactly.
    const publicPolicy = current.match(PUBLIC_POLICY)?.[0];
    if (!publicPolicy) {
      if (
        /\bauth\s*:/.test(current) && !current.includes('Scaffold demo is public') &&
        !current.includes(SERVICE_PUBLIC_REASON)
      ) continue;
      throw new TypeError(
        `Cannot wire browser auth for ${name}: expected the scaffold public policy with an unchanged reason`,
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
          `auth: {
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
      ...new Set([...(entry.PluginReferences ?? []), auth]),
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

function appAuthRoute(root: string, name: string, entry: BrowserAuthEntry): string {
  return join(workspacePath(root, entry.Workdir ?? `apps/${name}`), 'routes/auth/[action].ts');
}

function appServiceSessionRoute(
  root: string,
  name: string,
  entry: BrowserAuthEntry,
  service: string,
): string {
  return join(
    workspacePath(root, entry.Workdir ?? `apps/${name}`),
    'routes/examples',
    service,
    'session.ts',
  );
}

function serviceEntrypoint(root: string, name: string, entry: BrowserAuthEntry): string {
  return join(
    workspacePath(root, entry.Workdir ?? `services/${name}`),
    entry.Entrypoint ?? 'src/main.ts',
  );
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
