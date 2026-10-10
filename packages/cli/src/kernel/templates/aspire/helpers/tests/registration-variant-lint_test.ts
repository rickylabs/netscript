/**
 * @module templates/aspire/helpers/registration-variant-lint_test
 *
 * Lints every populated variant of the background and plugin registration
 * helpers. The shared preamble (imports, bindings, the `infrastructure`
 * parameter) must follow what the emitted body consumes, so each variant is
 * `deno lint`-clean on its own — not only the empty one.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import type { BackgroundProcessorEntry, DatabaseEntry, PluginEntry } from '@netscript/aspire/types';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import {
  BACKGROUND_NO_TELEMETRY,
  BACKGROUND_WITH_CONCURRENCY,
  MINIMAL_BACKGROUND,
  MINIMAL_DENO_DEFAULTS,
  POPULATED_CONFIG,
} from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

/** First-party background entries as `buildBackgroundProcessorEntry` produces them. */
function firstPartyBackground(
  entrypoint: string,
  extra: Partial<BackgroundProcessorEntry> = {},
): BackgroundProcessorEntry {
  return {
    Enabled: true,
    Runtime: 'deno',
    Entrypoint: entrypoint,
    Workdir: 'background',
    Telemetry: true,
    WatchMode: true,
    RequiresDb: true,
    RequiresKv: true,
    Permissions: ['--allow-net', '--allow-env', '--allow-read'],
    ...extra,
  };
}

const WORKERS = firstPartyBackground('workers/runtime.ts', {
  Concurrency: 4,
  ConcurrencyEnvVar: 'WORKER_CONCURRENCY',
  PluginReferences: ['workers-api'],
});
const SAGAS = firstPartyBackground('sagas/runtime.ts', { PluginReferences: ['sagas-api'] });
const TRIGGERS = firstPartyBackground('triggers/runtime.ts', {
  PluginReferences: ['triggers-api'],
});
const KV_ONLY_BACKGROUND: BackgroundProcessorEntry = { ...MINIMAL_BACKGROUND, RequiresKv: true };

/** Streams ships `requiresDb: false`, `requiresKv: false`. */
const STREAMS_PLUGIN: PluginEntry = {
  Enabled: true,
  Runtime: 'deno',
  Port: 4410,
  Entrypoint: 'services/src/main.ts',
  RequiresDb: false,
  RequiresKv: false,
};
/** Auth ships `requiresDb: true`, `requiresKv: true`. */
const AUTH_PLUGIN: PluginEntry = {
  Enabled: true,
  Runtime: 'deno',
  Port: 4400,
  Entrypoint: 'services/src/main.ts',
  RequiresDb: true,
  RequiresKv: true,
};

interface Variant {
  readonly name: string;
  readonly source: () => string;
}

const options = { version: 'test', denoDefaults: MINIMAL_DENO_DEFAULTS };

function background(
  processors: Record<string, BackgroundProcessorEntry>,
  databaseEngine?: DatabaseEntry['Engine'],
): () => string {
  return () => generateRegisterBackground({ ...options, processors, databaseEngine });
}

function plugins(
  entries: Record<string, PluginEntry>,
  databaseEngine?: DatabaseEntry['Engine'],
): () => string {
  return () => generateRegisterPlugins({ ...options, plugins: entries, databaseEngine });
}

const VARIANTS: readonly Variant[] = [
  { name: 'background-empty', source: background({}) },
  { name: 'background-requires-db-false-only', source: background({ custom: MINIMAL_BACKGROUND }) },
  {
    name: 'background-telemetry-false-only',
    source: background({ benchmark: BACKGROUND_NO_TELEMETRY }),
  },
  { name: 'background-kv-only', source: background({ cache: KV_ONLY_BACKGROUND }) },
  { name: 'background-db-only', source: background({ jobs: BACKGROUND_WITH_CONCURRENCY }) },
  { name: 'background-workers', source: background({ workers: WORKERS }) },
  { name: 'background-sagas', source: background({ sagas: SAGAS }) },
  { name: 'background-triggers', source: background({ triggers: TRIGGERS }) },
  {
    name: 'background-first-party',
    source: background({ workers: WORKERS, sagas: SAGAS, triggers: TRIGGERS }),
  },
  {
    name: 'background-mixed',
    source: background({
      workers: WORKERS,
      custom: MINIMAL_BACKGROUND,
      benchmark: BACKGROUND_NO_TELEMETRY,
    }),
  },
  {
    name: 'background-mixed-sqlite',
    source: background({ workers: WORKERS, benchmark: BACKGROUND_NO_TELEMETRY }, 'Sqlite'),
  },
  {
    name: 'background-populated-fixture',
    source: background(POPULATED_CONFIG.BackgroundProcessors),
  },
  { name: 'plugins-empty', source: plugins({}) },
  { name: 'plugins-streams-only', source: plugins({ streams: STREAMS_PLUGIN }) },
  {
    name: 'plugins-auth-and-streams',
    source: plugins({ auth: AUTH_PLUGIN, streams: STREAMS_PLUGIN }),
  },
  {
    name: 'plugins-auth-and-streams-sqlite',
    source: plugins({ auth: AUTH_PLUGIN, streams: STREAMS_PLUGIN }, 'Sqlite'),
  },
  { name: 'plugins-populated-fixture', source: plugins(POPULATED_CONFIG.Plugins) },
];

interface LintDiagnostic {
  readonly filename: string;
  readonly code: string;
  readonly message: string;
}

/** Lints every variant in one `deno lint` process and groups findings per file. */
async function lintVariants(directory: string): Promise<Map<string, string[]>> {
  const lint = await new Deno.Command(Deno.execPath(), {
    args: ['lint', '--no-config', '--json', directory],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const report: { diagnostics: LintDiagnostic[]; errors: unknown[] } = JSON.parse(
    new TextDecoder().decode(lint.stdout),
  );
  assertEquals(report.errors, [], 'deno lint must parse every generated variant');
  const findings = new Map<string, string[]>();
  for (const diagnostic of report.diagnostics) {
    const file = diagnostic.filename.slice(diagnostic.filename.lastIndexOf('/') + 1);
    const messages = findings.get(file) ?? [];
    messages.push(`${diagnostic.code}: ${diagnostic.message}`);
    findings.set(file, messages);
  }
  return findings;
}

Deno.test('register helpers: every populated variant is deno lint-clean', async (t) => {
  const directory = await Deno.makeTempDir({ prefix: 'registration-variants-' });
  try {
    for (const variant of VARIANTS) {
      await Deno.writeTextFile(join(directory, `${variant.name}.mts`), variant.source());
    }
    const findings = await lintVariants(directory);
    for (const variant of VARIANTS) {
      await t.step(variant.name, () => {
        assertEquals(findings.get(`${variant.name}.mts`) ?? [], []);
      });
    }
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
