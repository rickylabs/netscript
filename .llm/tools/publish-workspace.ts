type JsonObject = Record<string, unknown>;

export type PublishMode = 'dry-run' | 'publish';

export interface PublishableMember {
  readonly path: string;
  readonly name: string;
}

export interface PublishWorkspaceOptions {
  readonly mode: PublishMode;
  readonly root?: string;
}

export interface PublishWorkspaceResult {
  readonly members: readonly PublishableMember[];
}

const PUBLISH_PARENT_DIRS = ['packages', 'plugins'];
const JSR_SCOPE = '@netscript/';
const JSR_LINK_BLOCK_START = '<!-- jsr-links:start -->';
const JSR_LINK_BLOCK_END = '<!-- jsr-links:end -->';

export async function publishWorkspace(
  options: PublishWorkspaceOptions,
): Promise<PublishWorkspaceResult> {
  const root = options.root ?? Deno.cwd();
  const catalog = await readRootCatalog(root);
  const members = await discoverWorkspaceMembers(root);
  const snapshots = new Map<string, string>();

  try {
    for (const member of members) {
      const configPath = `${root}/${member.path}/deno.json`;
      const source = await Deno.readTextFile(configPath);
      snapshots.set(configPath, source);
      const config = parseJsonObject(source, configPath);
      config.imports = materializeCatalogImports(config.imports, catalog, member.path);
      await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    }

    // Atomic whole-workspace publish from the repo root. Deno publishes every
    // workspace member in a single transaction and rewrites inter-member
    // @netscript/* imports to jsr: specifiers. Publishing members individually
    // (cd per member) breaks that resolution: a sibling's source files fall
    // outside the member's own publish tarball, so the module graph fails with
    // "Module not found". deno publish skips versions already on the registry,
    // so re-running after a partial publish is safe and idempotent. Slow types
    // are accepted workspace-wide.
    //
    // Bundled assets are inlined as plain string constants in the *.generated.ts
    // barrels (see .llm/tools/generate-cli-assets-barrel.ts), NOT imported via
    // `with { type: 'text' }`. `deno publish`'s module-graph build never enables
    // `unstable_text_imports`, so text-attribute imports fail at real publish
    // ("The import attribute type of 'text' is unsupported") even though they
    // type-check, run, and pass `publish --dry-run`. No `--unstable-*` flag fixes
    // this: text imports are stable (no flag exists) and `--unstable-raw-imports`
    // only toggles `bytes` imports, which this workspace does not use. Plain
    // string constants publish cleanly with no flag.
    const args = ['publish', '--allow-dirty', '--allow-slow-types'];
    if (options.mode === 'dry-run') {
      args.push('--dry-run');
    }

    const command = new Deno.Command('deno', {
      args,
      cwd: root,
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const result = await command.output();
    if (result.code !== 0) {
      const action = options.mode === 'dry-run' ? 'Publish dry-run' : 'Publish';
      throw new Error(`${action} failed (deno publish exit ${result.code}).`);
    }

    return { members };
  } finally {
    for (const [path, source] of snapshots) {
      await Deno.writeTextFile(path, source);
    }
  }
}

export async function discoverWorkspaceMembers(
  repoRoot: string = Deno.cwd(),
): Promise<PublishableMember[]> {
  const members: PublishableMember[] = [];
  for (const parent of PUBLISH_PARENT_DIRS) {
    for await (const entry of Deno.readDir(`${repoRoot}/${parent}`)) {
      if (!entry.isDirectory) {
        continue;
      }
      const memberPath = `${parent}/${entry.name}`;
      const member = await readPublishableMember(repoRoot, memberPath);
      if (member) {
        members.push(member);
      }
    }
  }
  members.sort((left, right) => left.path.localeCompare(right.path));
  return members;
}

export function formatJsrLinks(
  members: readonly PublishableMember[],
  version: string,
): string {
  const lines = members.map((member) => {
    const packageName = member.name.startsWith(JSR_SCOPE)
      ? member.name.slice(JSR_SCOPE.length)
      : member.name;
    return `- https://jsr.io/@netscript/${packageName}@${version}`;
  });
  return `${lines.join('\n')}\n`;
}

export function formatJsrLinksBlock(
  members: readonly PublishableMember[],
  version: string,
): string {
  return [
    JSR_LINK_BLOCK_START,
    '## JSR Packages',
    '',
    ...formatJsrLinks(members, version).trimEnd().split('\n'),
    JSR_LINK_BLOCK_END,
  ].join('\n');
}

export function updateReleaseBodyWithJsrLinks(
  body: string,
  members: readonly PublishableMember[],
  version: string,
): string {
  const block = formatJsrLinksBlock(members, version);
  const start = body.indexOf(JSR_LINK_BLOCK_START);
  const end = body.indexOf(JSR_LINK_BLOCK_END);
  if (start >= 0 && end >= start) {
    const afterEnd = end + JSR_LINK_BLOCK_END.length;
    return `${body.slice(0, start).trimEnd()}\n\n${block}\n${body.slice(afterEnd).trimStart()}`;
  }
  const trimmed = body.trimEnd();
  return trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
}

async function readRootCatalog(root: string): Promise<Record<string, string>> {
  const configPath = `${root}/deno.json`;
  const config = parseJsonObject(await Deno.readTextFile(configPath), configPath);
  const catalog = config.catalog;
  if (!isStringRecord(catalog)) {
    throw new Error('Root deno.json is missing a string-valued catalog block.');
  }
  return catalog;
}

function materializeCatalogImports(
  imports: unknown,
  catalogEntries: Record<string, string>,
  memberPath: string,
): unknown {
  if (!isJsonObject(imports)) {
    return imports;
  }

  const materialized: JsonObject = {};
  for (const [specifier, value] of Object.entries(imports)) {
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

async function readPublishableMember(
  repoRoot: string,
  memberPath: string,
): Promise<PublishableMember | null> {
  const configPath = `${repoRoot}/${memberPath}/deno.json`;
  let config: JsonObject;
  try {
    config = parseJsonObject(await Deno.readTextFile(configPath), configPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
  if (typeof config.name !== 'string' || config.publish === false) {
    return null;
  }
  return { path: memberPath, name: config.name };
}

function parseJsonObject(source: string, path: string): JsonObject {
  const parsed: unknown = JSON.parse(source);
  if (!isJsonObject(parsed)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  return parsed;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isJsonObject(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === 'string');
}
