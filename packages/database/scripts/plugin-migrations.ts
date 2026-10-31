/** Migration-time delivery of immutable SQL sidecars from installed schema contributions. */
import { walk } from 'jsr:@std/fs@^1/walk';
import { join, relative } from '@std/path';

/** One pending SQL asset and its durable content identity. */
export type PluginMigration = Readonly<{ marker: string; sql: string }>;
const MARKER = /^-- netscript-plugin-migration (\S+) ([0-9a-f]{64})$/gm;

/** Discover SQL contributions not already recorded in the application's migration history. */
export async function pendingPluginMigrations(
  schemaPath: string,
  migrationsPath: string,
): Promise<readonly PluginMigration[]> {
  const recorded = new Map<string, string>();
  for (const path of await files(migrationsPath, 'migration.sql')) {
    const sql = await Deno.readTextFile(path);
    for (const match of sql.matchAll(MARKER)) recorded.set(match[1], match[2]);
  }
  const pending: PluginMigration[] = [];
  for (const path of await files(schemaPath, '.migration.sql')) {
    const id = encodeURIComponent(relative(schemaPath, path).replaceAll('\\', '/'));
    const sql = (await Deno.readTextFile(path)).replaceAll('\r\n', '\n');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql));
    const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(
      '',
    );
    const previous = recorded.get(id);
    if (previous && previous !== hash) {
      throw new Error(
        `Plugin migration ${id} changed after recording; publish a new migration name.`,
      );
    }
    if (!previous) pending.push({ marker: `-- netscript-plugin-migration ${id} ${hash}`, sql });
  }
  return pending;
}

/** Append pending contributions before deployment, creating an SQL-only migration when needed. */
export async function appendPluginMigrations(
  migrationsPath: string,
  created: readonly string[],
  pending: readonly PluginMigration[],
): Promise<readonly string[]> {
  if (pending.length === 0) return created;
  let target = created.at(-1);
  if (!target) {
    target = new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '_plugin_' +
      crypto.randomUUID().slice(0, 8);
    await Deno.mkdir(join(migrationsPath, target), { recursive: true });
  }
  const sql = pending.map(({ marker, sql }) => `${marker}\n${sql}`).join('\n');
  await Deno.writeTextFile(join(migrationsPath, target, 'migration.sql'), `\n${sql}\n`, {
    append: true,
  });
  return created.length ? created : [target];
}

async function files(root: string, suffix: string): Promise<string[]> {
  try {
    await Deno.stat(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
  const result: string[] = [];
  for await (const entry of walk(root, { includeDirs: false, followSymlinks: false })) {
    if (entry.isFile && entry.path.endsWith(suffix)) result.push(entry.path);
  }
  return result.sort();
}
