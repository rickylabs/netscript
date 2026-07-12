import type { DiscoveredStreamCollection, DiscoveredStreamTopic } from '../streams-types.ts';

const PRODUCER_SUFFIXES = ['producer.ts', '-stream.ts'] as const;

/** Discover producer-backed durable stream topics in a NetScript project. */
export async function discoverStreamTopics(
  workspaceRoot: string,
): Promise<readonly DiscoveredStreamTopic[]> {
  const root = normalizeRoot(workspaceRoot);
  const producerFiles = await findProducerFiles(root);
  const topics = await Promise.all(producerFiles.map((file) => readTopic(root, file)));
  return topics.sort((left, right) => left.name.localeCompare(right.name));
}

async function findProducerFiles(root: string): Promise<readonly string[]> {
  const files: string[] = [];
  await collectFiles(`${root}/streams`, files);

  const pluginsRoot = `${root}/plugins`;
  for (const plugin of await readDirectories(pluginsRoot)) {
    await collectFiles(`${pluginsRoot}/${plugin}/streams`, files);
  }
  return [...new Set(files)].sort();
}

async function collectFiles(directory: string, files: string[]): Promise<void> {
  try {
    for await (const entry of Deno.readDir(directory)) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory) {
        await collectFiles(path, files);
      } else if (entry.isFile && PRODUCER_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
        files.push(path);
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

async function readDirectories(directory: string): Promise<readonly string[]> {
  const names: string[] = [];
  try {
    for await (const entry of Deno.readDir(directory)) {
      if (entry.isDirectory) names.push(entry.name);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return names.sort();
}

async function readTopic(root: string, producerFile: string): Promise<DiscoveredStreamTopic> {
  const source = await Deno.readTextFile(producerFile);
  const streamPath = firstStringValue(source, ['STREAM_PATH', 'streamPath']);
  const producerId = firstStringValue(source, ['PRODUCER_ID', 'producerId']);
  const schemaFile = await resolveSchemaFile(producerFile, source);
  const collections = schemaFile ? parseCollections(await Deno.readTextFile(schemaFile)) : [];
  const producerRelative = relativePath(root, producerFile);

  return {
    name: streamPath ?? inferTopicName(producerRelative),
    streamPath,
    producerId,
    producerFile: producerRelative,
    collections,
  };
}

function firstStringValue(source: string, names: readonly string[]): string | undefined {
  for (const name of names) {
    const pattern = new RegExp(`\\b${name}\\s*(?:=|:)\\s*['\"]([^'\"]+)['\"]`);
    const value = source.match(pattern)?.[1];
    if (value) return value;
  }
  return undefined;
}

async function resolveSchemaFile(
  producerFile: string,
  source: string,
): Promise<string | undefined> {
  const directory = producerFile.slice(0, producerFile.lastIndexOf('/'));
  const imported = source.match(/from\s+['\"](\.\.?\/[^'\"]*schema\.ts)['\"]/)?.[1];
  const candidates = imported
    ? [normalizeSegments(`${directory}/${imported}`), `${directory}/schema.ts`]
    : [`${directory}/schema.ts`];

  for (const candidate of candidates) {
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isFile) return candidate;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return undefined;
}

function parseCollections(source: string): readonly DiscoveredStreamCollection[] {
  const start = source.indexOf('defineStreamSchema({');
  if (start < 0) return [];
  const body = source.slice(start + 'defineStreamSchema({'.length);
  const collections: DiscoveredStreamCollection[] = [];
  let depth = 1;

  for (const line of body.split(/\r?\n/)) {
    if (depth === 1) {
      const name = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*\{/)?.[1];
      if (name) {
        const remainder = body.slice(body.indexOf(line));
        collections.push({
          name,
          type: firstStringValue(remainder, ['type']) ?? name,
          primaryKey: firstStringValue(remainder, ['primaryKey']) ?? 'id',
        });
      }
    }
    depth += count(line, '{') - count(line, '}');
    if (depth <= 0) break;
  }
  return uniqueCollections(collections);
}

function uniqueCollections(
  collections: readonly DiscoveredStreamCollection[],
): readonly DiscoveredStreamCollection[] {
  return [...new Map(collections.map((collection) => [collection.name, collection])).values()];
}

function count(value: string, token: string): number {
  return value.split(token).length - 1;
}

function inferTopicName(producerFile: string): string {
  const pluginMatch = producerFile.match(/^plugins\/([^/]+)\/streams\//);
  if (pluginMatch) return pluginMatch[1];
  return producerFile.split('/').at(-1)?.replace(/(?:-stream|-producer|producer)\.ts$/, '') ??
    producerFile;
}

function normalizeRoot(root: string): string {
  return root.replaceAll('\\', '/').replace(/\/+$/, '');
}

function relativePath(root: string, path: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

function normalizeSegments(path: string): string {
  const output: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '.' || segment === '') continue;
    if (segment === '..') output.pop();
    else output.push(segment);
  }
  return path.startsWith('/') ? `/${output.join('/')}` : output.join('/');
}
