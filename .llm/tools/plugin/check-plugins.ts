import {
  generatePluginManifestSchemaText,
  PLUGIN_MANIFEST_SCHEMA_PATH,
} from './manifest-schema.ts';
import {
  parsePluginManifest,
  stripPluginManifestSchemaKey,
} from '../../../packages/plugin/src/protocol/mod.ts';

interface Failure {
  readonly path: string;
  readonly message: string;
}

const PLUGIN_MANIFEST_PATHS = [
  'plugins/auth/scaffold.plugin.json',
  'plugins/sagas/scaffold.plugin.json',
  'plugins/streams/scaffold.plugin.json',
  'plugins/triggers/scaffold.plugin.json',
  'plugins/workers/scaffold.plugin.json',
];

const NETSCRIPT_PACKAGE_VERSION_PATTERN =
  /jsr:@netscript\/[A-Za-z0-9_-]+@([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)/g;
const NETSCRIPT_RECORD_VERSION_PATTERN =
  /["']@netscript\/[^"']+["']\s*:\s*["']([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)["']/g;
const NETSCRIPT_VERSION_CONST_PATTERN =
  /NETSCRIPT_VERSION\s*=\s*["']([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)["']/g;

if (import.meta.main) {
  const failures = [
    ...await checkManifests(),
    ...await checkSchemaFreshness(),
    ...await checkScaffoldVersionPins(),
  ];

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${failure.path}: ${failure.message}`);
    }
    Deno.exitCode = 1;
  } else {
    console.log('plugins:check passed');
  }
}

async function checkManifests(): Promise<Failure[]> {
  const failures: Failure[] = [];

  for (const path of PLUGIN_MANIFEST_PATHS) {
    const json = JSON.parse(await Deno.readTextFile(path));
    const result = parsePluginManifest(stripPluginManifestSchemaKey(json));
    if (!result.ok) {
      failures.push({
        path,
        message: result.error.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join('; '),
      });
    }
  }

  return failures;
}

async function checkSchemaFreshness(): Promise<Failure[]> {
  const committed = await Deno.readTextFile(PLUGIN_MANIFEST_SCHEMA_PATH);
  const generated = generatePluginManifestSchemaText();
  if (committed === generated) {
    return [];
  }
  return [{
    path: PLUGIN_MANIFEST_SCHEMA_PATH,
    message: 'schema drift detected; run plugins:schema:gen',
  }];
}

async function checkScaffoldVersionPins(): Promise<Failure[]> {
  const workspaceVersion = await readWorkspaceVersion();
  const files = await collectScaffoldSourceFiles('plugins');
  const failures: Failure[] = [];

  for (const path of files) {
    const text = await Deno.readTextFile(path);
    for (const version of findLiteralNetscriptVersionConsts(text)) {
      failures.push({
        path,
        message: `hardcoded NETSCRIPT_VERSION ${version}; derive from the plugin deno.json import`,
      });
    }
    for (const version of findNetscriptPackagePins(text)) {
      if (version !== workspaceVersion) {
        failures.push({
          path,
          message: `stale NetScript version pin ${version}; expected ${workspaceVersion}`,
        });
      }
    }
  }

  return failures;
}

async function readWorkspaceVersion(): Promise<string> {
  const json = JSON.parse(await Deno.readTextFile('deno.json'));
  if (!isRecord(json) || typeof json.version !== 'string') {
    throw new Error('Root deno.json is missing a string version.');
  }
  return json.version;
}

function findLiteralNetscriptVersionConsts(text: string): string[] {
  return matchVersions(text, NETSCRIPT_VERSION_CONST_PATTERN);
}

function findNetscriptPackagePins(text: string): string[] {
  return [
    ...matchVersions(text, NETSCRIPT_PACKAGE_VERSION_PATTERN),
    ...matchVersions(text, NETSCRIPT_RECORD_VERSION_PATTERN),
  ];
}

function matchVersions(text: string, pattern: RegExp): string[] {
  const versions: string[] = [];
  for (const match of text.matchAll(pattern)) {
    const version = match[1];
    if (version !== undefined) {
      versions.push(version);
    }
  }
  return versions;
}

async function collectScaffoldSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  await collectScaffoldSourceFilesInto(root, files);
  return files.sort();
}

async function collectScaffoldSourceFilesInto(path: string, files: string[]): Promise<void> {
  for await (const entry of Deno.readDir(path)) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory) {
      await collectScaffoldSourceFilesInto(child, files);
      continue;
    }
    if (
      entry.isFile &&
      child.includes('/src/scaffold/') &&
      child.endsWith('.ts') &&
      !child.endsWith('_test.ts')
    ) {
      files.push(child);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
