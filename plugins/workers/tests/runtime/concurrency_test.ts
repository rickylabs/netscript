import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire/public';
import { workersAdapterPlugin } from '../../src/adapter/plugin.ts';
import { WorkersAspireContribution } from '../../src/aspire/mod.ts';
import { resolveWorkersConcurrency } from '../../src/runtime/concurrency.ts';
import scaffoldMetadata from '../../scaffold.plugin.json' with { type: 'json' };

function envOf(values: Record<string, string>): (name: string) => string | undefined {
  return (name) => values[name];
}

function recordWarnings(): { readonly messages: string[]; warn: (message: string) => void } {
  const messages: string[] = [];
  return { messages, warn: (message) => messages.push(message) };
}

/** Every concurrency name and default the plugin publishes, read from its real metadata. */
function emittedConcurrencyMetadata() {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({ projectRoot: '/workspace/app' });
  const contribution = new WorkersAspireContribution();
  contribution.contribute(builder, ctx);
  const background = builder.resources.find((resource) => resource.kind === 'deno-background');
  const aspireName = (background?.metadata?.spec as { concurrencyEnvVar?: string } | undefined)
    ?.concurrencyEnvVar;
  const declaredEnv = contribution.declareEnv(ctx);
  const configParams = workersAdapterPlugin.install?.configParams ?? [];
  const provider = scaffoldMetadata.provider;

  return {
    names: {
      aspireBackground: aspireName,
      aspireDeclaredEnv: Object.keys(declaredEnv).find((key) => key.endsWith('_CONCURRENCY')),
      adapterConfigParam: configParams.find((key) => key.endsWith('_CONCURRENCY')),
      scaffoldProvider: provider.concurrencyEnvVar,
    },
    defaults: {
      aspireDeclaredEnv: aspireName === undefined ? undefined : declaredEnv[aspireName],
      scaffoldProvider: String(provider.defaultConcurrency),
    },
  };
}

Deno.test('workers metadata emits one concurrency name and the runtime reads it', () => {
  const { names, defaults } = emittedConcurrencyMetadata();
  const emitted = names.scaffoldProvider;

  assertEquals(names, {
    aspireBackground: emitted,
    aspireDeclaredEnv: emitted,
    adapterConfigParam: emitted,
    scaffoldProvider: emitted,
  });
  assertEquals(defaults.aspireDeclaredEnv, defaults.scaffoldProvider);

  // The runtime must honour exactly the emitted name, without falling back to an alias.
  const { messages, warn } = recordWarnings();
  const concurrency = resolveWorkersConcurrency({
    readEnv: envOf({ [emitted]: defaults.scaffoldProvider }),
    warn,
  });
  assertEquals(concurrency, Number(defaults.scaffoldProvider));
  assertEquals(messages, []);
});

Deno.test('resolveWorkersConcurrency defaults to 1 when no name is set', () => {
  assertEquals(resolveWorkersConcurrency({ readEnv: envOf({}) }), 1);
  assertEquals(resolveWorkersConcurrency({ readEnv: envOf({ WORKERS_CONCURRENCY: '  ' }) }), 1);
});

Deno.test('resolveWorkersConcurrency prefers the canonical name over the deprecated alias', () => {
  const { messages, warn } = recordWarnings();
  const concurrency = resolveWorkersConcurrency({
    readEnv: envOf({ WORKERS_CONCURRENCY: '4', WORKER_CONCURRENCY: '9' }),
    warn,
  });
  assertEquals(concurrency, 4);
  assertEquals(messages, []);
});

Deno.test('resolveWorkersConcurrency reads the deprecated singular name with a warning', () => {
  const { messages, warn } = recordWarnings();
  const concurrency = resolveWorkersConcurrency({
    readEnv: envOf({ WORKER_CONCURRENCY: '3' }),
    warn,
  });
  assertEquals(concurrency, 3);
  assertEquals(messages.length, 1);
  assertEquals(messages[0].includes('rename it to WORKERS_CONCURRENCY'), true);
});

Deno.test('resolveWorkersConcurrency warns about the deprecated alias once per process', () => {
  const original = console.warn;
  const messages: unknown[] = [];
  console.warn = (...args: unknown[]) => void messages.push(args);
  try {
    const readEnv = envOf({ WORKER_CONCURRENCY: '2' });
    assertEquals(resolveWorkersConcurrency({ readEnv }), 2);
    assertEquals(resolveWorkersConcurrency({ readEnv }), 2);
  } finally {
    console.warn = original;
  }
  assertEquals(messages.length, 1);
});

Deno.test('resolveWorkersConcurrency rejects a value that is not a positive integer', () => {
  for (const raw of ['0', '-1', '2.5', 'two']) {
    assertThrows(
      () => resolveWorkersConcurrency({ readEnv: envOf({ WORKERS_CONCURRENCY: raw }) }),
      Error,
      'WORKERS_CONCURRENCY must be a positive integer',
    );
  }
});
