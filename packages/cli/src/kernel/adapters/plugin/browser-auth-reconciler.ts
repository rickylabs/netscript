import { dirname, join, relative, resolve } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';

interface BrowserAuthEntry {
  readonly Type?: string;
  readonly Workdir?: string;
  readonly Entrypoint?: string;
  PluginReferences?: string[];
}
interface BrowserAuthSettings {
  NetScript?: {
    Plugins?: Record<string, { PackageSpecifier?: string }>;
    Apps?: Record<string, BrowserAuthEntry>;
    Services?: Record<string, BrowserAuthEntry>;
  };
}
interface BrowserAuthFile {
  readonly path: string;
  readonly content: string;
}

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
    name === 'auth' || entry.PackageSpecifier === '@netscript/plugin-auth'
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
    // Authored policy is authoritative. Upgrade only the scaffold's unconfigured preset.
    if (
      !current.includes('await defineService(router, {') ||
      /\bauth\s*:/.test(current)
    ) continue;
    const authImport = relative(
      dirname(path),
      join(projectRoot, 'auth/service.ts'),
    ).replaceAll('\\', '/');
    const router = name.replace(
      /[-_]([a-z])/g,
      (_, letter: string) => letter.toUpperCase(),
    );
    files.push({
      path,
      content: `import { browserAuthenticator } from '${authImport}';\n` +
        current.replace(
          'await defineService(router, {',
          `await defineService(router, {\n  auth: { authn: { authenticator: browserAuthenticator,\n    // Demonstration routes remain public; other API paths require a bearer.\n    allowAnonymous: ['/health', '/api/v1/${router}', '/api/rpc/v1/${router}'],\n  } },`,
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
      if (!file.path.endsWith('/src/main.ts')) continue;
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
