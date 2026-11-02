/** Build a generated application using native Deno package artifacts, with no workspace source. */
import { basename, dirname, join, resolve, toFileUrl } from '@std/path';
import { discoverWorkspaceMembers } from '../../../../../../.llm/tools/deps/workspace.ts';

interface Config {
  name?: string;
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  catalog?: Record<string, string>;
  workspace?: string[];
  tasks?: Record<string, string>;
}
const SLOW_TYPE_PACKAGES = new Set(['contracts', 'plugin-triggers-core', 'service', 'plugin']);
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.data',
  '.fresh',
  '_fresh',
  'packages',
  'plugins',
  'aspire',
  '.netscript-source-root',
]);

async function run(args: string[], cwd: string, log: string): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  await Deno.writeTextFile(log, decoder.decode(result.stdout) + decoder.decode(result.stderr));
  if (!result.success) {
    throw new Error(
      `Command failed (${result.code}): deno ${args.join(' ')}; see ${basename(log)}`,
    );
  }
}

async function copyApplication(source: string, target: string): Promise<void> {
  await Deno.mkdir(target, { recursive: true });
  for await (const entry of Deno.readDir(source)) {
    if (EXCLUDED_DIRECTORIES.has(entry.name) || entry.isSymlink) continue;
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory) await copyApplication(from, to);
    else if (entry.isFile) await Deno.copyFile(from, to);
  }
}

/** Pack maintained runtime packages and build a clean copy of the selected generated app. */
export async function buildPackedShowcase(
  repository: string,
  project: string,
  output: string,
): Promise<void> {
  const root = JSON.parse(await Deno.readTextFile(join(repository, 'deno.json'))) as Config;
  const artifacts = join(output, 'artifacts');
  const consumer = join(output, 'consumer');
  await Deno.mkdir(artifacts, { recursive: true });
  await copyApplication(project, consumer);
  const imports: Record<string, string> = Object.fromEntries(
    Object.entries(root.catalog ?? {}).map(([name, version]) => [name, `npm:${name}@${version}`]),
  );
  const packageNames: string[] = [];
  const members = await discoverWorkspaceMembers(repository);
  for (const member of members) {
    if (
      !member.root.startsWith('packages/') || member.root.endsWith('/e2e') ||
      member.root === 'packages/cli'
    ) continue;
    const directory = join(repository, member.root);
    const config = JSON.parse(await Deno.readTextFile(join(directory, 'deno.json'))) as Config;
    if (!config.name?.startsWith('@netscript/') || !config.exports) continue;
    const name = basename(directory);
    const archive = join(artifacts, `${name}.tgz`);
    await run(
      [
        'pack',
        '--allow-dirty',
        ...(SLOW_TYPE_PACKAGES.has(name) ? ['--allow-slow-types'] : []),
        '--output',
        archive,
      ],
      directory,
      join(artifacts, `${name}.pack.log`),
    );
    const extracted = join(artifacts, name);
    await Deno.mkdir(extracted, { recursive: true });
    const unpack = await new Deno.Command('tar', {
      args: ['-xzf', archive, '--strip-components=1', '-C', extracted],
      stdout: 'null',
      stderr: 'piped',
    }).output();
    if (!unpack.success) throw new Error(`Could not unpack ${name}`);
    const manifest = JSON.parse(await Deno.readTextFile(join(extracted, 'package.json'))) as {
      name: string;
      version: string;
      exports: Record<string, { import: string }>;
    };
    if (manifest.name !== config.name || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.version)) {
      throw new Error(`Invalid packed identity: ${name}`);
    }
    const exports: Record<string, string> = {};
    for (const [subpath, entry] of Object.entries(manifest.exports)) {
      if (!/\.(?:js|json|css|wasm)$/.test(entry.import) || entry.import.includes('..')) {
        throw new Error(`Not a compiled module or data export: ${name}${subpath}`);
      }
      await Deno.stat(join(extracted, entry.import));
      exports[subpath] = entry.import;
      const key = config.name + (subpath === '.' ? '' : subpath.slice(1));
      imports[key] = toFileUrl(join(extracted, entry.import)).href;
    }
    // Native pack emits npm metadata. Project its actual identity/JS exports into Deno's
    // manifest format so the unchanged consumer closure guard can inspect the artifact.
    await Deno.writeTextFile(
      join(extracted, 'deno.json'),
      JSON.stringify({ name: manifest.name, version: manifest.version, exports }, null, 2) + '\n',
    );
    for (const [key, value] of Object.entries(config.imports ?? {})) {
      if (key.startsWith('@netscript/')) continue;
      if (value === 'catalog:') {
        const version = root.catalog?.[key];
        if (version) imports[key] ??= `npm:${key}@${version}`;
      } else if (/^(npm:|jsr:|https:)/.test(value)) imports[key] ??= value;
    }
    packageNames.push(config.name);
  }
  // Native plugin entrypoints stay outside Vite's provider graph, but their aliases
  // must still use registry identities rather than reaching into the monorepo.
  for (const member of members.filter((entry) => entry.root.startsWith('plugins/'))) {
    const config = JSON.parse(
      await Deno.readTextFile(join(repository, member.root, 'deno.json')),
    ) as Config & { version?: string };
    if (!config.name?.startsWith('@netscript/') || !config.version || !config.exports) continue;
    for (const subpath of Object.keys(config.exports)) {
      const suffix = subpath === '.' ? '' : subpath.slice(1);
      imports[config.name + suffix] = `jsr:${config.name}@${config.version}${suffix}`;
    }
  }
  for (const packageName of packageNames) {
    const file = join(artifacts, packageName.slice('@netscript/'.length), 'deno.json');
    const config = JSON.parse(await Deno.readTextFile(file)) as Config;
    config.imports = imports;
    await Deno.writeTextFile(file, JSON.stringify(config, null, 2) + '\n');
  }
  const configure = async (file: string): Promise<void> => {
    const config = JSON.parse(await Deno.readTextFile(file)) as Config;
    config.imports = { ...config.imports, ...imports };
    for (const [name, target] of Object.entries(config.imports)) {
      if (!name.startsWith('@netscript/')) continue;
      if (!target.startsWith('jsr:') && !target.startsWith(toFileUrl(artifacts + '/').href)) {
        throw new Error(`First-party import escaped packed/published artifacts: ${name}`);
      }
    }
    if (config.workspace) {
      config.workspace = config.workspace.filter((member) =>
        !/^\.?\/?(?:packages|plugins)(?:\/|$)/.test(member)
      );
    }
    await Deno.writeTextFile(file, JSON.stringify(config, null, 2) + '\n');
  };
  await configure(join(consumer, 'deno.json'));
  for await (const app of Deno.readDir(join(consumer, 'apps'))) {
    if (!app.isDirectory) continue;
    const config = join(consumer, 'apps', app.name, 'deno.json');
    await configure(config);
    await run(['task', 'build'], dirname(config), join(output, `${app.name}.build.log`));
  }
  // Every app framework alias now resolves to unpacked JS, and source vendors were not copied.
  const report = {
    ok: true,
    command: 'deno pack + generated app build',
    packedPackages: packageNames,
    packageCount: packageNames.length,
    copiedWorkspaceSource: false,
  };
  await Deno.writeTextFile(
    join(output, 'packed-build.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report));
}

if (import.meta.main) {
  const [repository, project, output] = Deno.args;
  if (!repository || !project || !output) {
    throw new Error('Expected repository, generated project and fresh output directory');
  }
  await buildPackedShowcase(resolve(repository), resolve(project), resolve(output));
}
