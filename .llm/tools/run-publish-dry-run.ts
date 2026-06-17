type JsonObject = Record<string, unknown>;

const APPROVED_SLOW_TYPE_PACKAGES = new Set([
  'packages/contracts',
  'packages/plugin-triggers-core',
  'packages/service',
  'packages/plugin',
]);

const root = Deno.cwd();
const rootConfigPath = `${root}/deno.json`;
const rootConfig = JSON.parse(await Deno.readTextFile(rootConfigPath)) as JsonObject;
const catalog = rootConfig.catalog as Record<string, string> | undefined;

if (!catalog) {
  throw new Error('Root deno.json is missing a catalog block.');
}

const memberPaths = await discoverWorkspaceMembers(root);
const snapshots = new Map<string, string>();

try {
  for (const memberPath of memberPaths) {
    const configPath = `${root}/${memberPath}/deno.json`;
    const source = await Deno.readTextFile(configPath);
    snapshots.set(configPath, source);
    const config = JSON.parse(source) as JsonObject;
    config.imports = materializeCatalogImports(config.imports, catalog, memberPath);
    await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }

  const failures: string[] = [];
  for (const memberPath of memberPaths) {
    const args = ['publish', '--dry-run', '--allow-dirty'];
    if (APPROVED_SLOW_TYPE_PACKAGES.has(memberPath)) {
      args.push('--allow-slow-types');
    }

    const command = new Deno.Command('deno', {
      args,
      cwd: `${root}/${memberPath}`,
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const result = await command.output();
    if (result.code !== 0) {
      failures.push(`${memberPath} (exit ${result.code})`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Publish dry-run failed for: ${failures.join(', ')}`);
  }
} finally {
  for (const [path, source] of snapshots) {
    await Deno.writeTextFile(path, source);
  }
}

function materializeCatalogImports(
  imports: unknown,
  catalogEntries: Record<string, string>,
  memberPath: string,
): unknown {
  if (!imports || typeof imports !== 'object' || Array.isArray(imports)) {
    return imports;
  }

  const materialized: Record<string, unknown> = {};
  for (const [specifier, value] of Object.entries(imports as Record<string, unknown>)) {
    if (value === 'catalog:') {
      const version = catalogEntries[specifier];
      if (!version) {
        throw new Error(
          `${memberPath}/deno.json imports "${specifier}" via catalog: with no root catalog entry.`,
        );
      }
      materialized[specifier] = `npm:${specifier}@${version}`;
    } else {
      materialized[specifier] = value;
    }
  }
  return materialized;
}

async function discoverWorkspaceMembers(repoRoot: string): Promise<string[]> {
  const members: string[] = [];
  for (const parent of ['packages', 'plugins']) {
    for await (const entry of Deno.readDir(`${repoRoot}/${parent}`)) {
      if (!entry.isDirectory) {
        continue;
      }
      const memberPath = `${parent}/${entry.name}`;
      if (await isPublishableMember(repoRoot, memberPath)) {
        members.push(memberPath);
      }
    }
  }
  members.sort();
  return members;
}

async function isPublishableMember(repoRoot: string, memberPath: string): Promise<boolean> {
  try {
    const config = JSON.parse(
      await Deno.readTextFile(`${repoRoot}/${memberPath}/deno.json`),
    ) as JsonObject;
    return typeof config.name === 'string' && config.publish !== false;
  } catch {
    return false;
  }
}
