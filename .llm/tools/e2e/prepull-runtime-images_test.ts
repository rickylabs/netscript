import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import {
  IMAGE_PULL_POLICY,
  pullRuntimeImage,
  runtimeTierImages,
} from './prepull-runtime-images.ts';
import * as runtimePulls from './prepull-runtime-images.ts';
import { SCAFFOLD_CACHE_CONTAINER_IMAGES } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-container-images.ts';
import { SCAFFOLD_VERSIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts';
import { join } from '@std/path';
import {
  GARNET_TOOL_PREPARATION_TIMEOUT_MS,
  prepareRuntimeTier,
  type ToolPreparationCommand,
} from './prepull-runtime-images.ts';

for (const tier of ['postgres', 'sqlite']) {
  Deno.test(`${tier} preparation restores the pinned executable tool before any image pull`, async () => {
    const root = await Deno.makeTempDir();
    const report = join(root, 'report', 'images.json');
    let restored = false;
    let restores = 0;
    const expected = await runtimeTierImages(tier, () => Promise.resolve('database-image'));
    try {
      await prepareRuntimeTier(tier, report, {
        toolDirectory: root,
        resolvePostgres: () => Promise.resolve('database-image'),
        async runToolRestore(command) {
          restores++;
          const manifest = join(root, '.config', 'dotnet-tools.json');
          assertEquals(command, {
            command: 'dotnet',
            args: ['tool', 'restore', '--tool-manifest', manifest],
            timeoutMs: GARNET_TOOL_PREPARATION_TIMEOUT_MS,
            stdout: 'inherit',
            stderr: 'inherit',
          });
          assertEquals(GARNET_TOOL_PREPARATION_TIMEOUT_MS, 120_000);
          assertEquals(JSON.parse(await Deno.readTextFile(manifest)), {
            version: 1,
            isRoot: true,
            tools: {
              'garnet-server': {
                version: SCAFFOLD_VERSIONS.GARNET_TOOL,
                commands: ['garnet-server'],
              },
            },
          });
          restored = true;
          return 0;
        },
        pullImage(image) {
          assertEquals(restored, true, 'the executable fallback must be restored before images');
          return Promise.resolve({
            image,
            durationMs: 1,
            attempts: [{ durationMs: 1, exitCode: 0 }],
          });
        },
      });
      assertEquals(restores, 1);
      const measured: { image: string }[] = JSON.parse(await Deno.readTextFile(report));
      assertEquals(measured.map(({ image }) => image), expected);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}

for (const failure of ['exit', 'timeout', 'killed'] as const) {
  Deno.test(`tool ${failure} aborts preparation once without pulling images or hiding the failure`, async () => {
    const root = await Deno.makeTempDir();
    let restores = 0;
    let pulls = 0;
    const runToolRestore = (_command: ToolPreparationCommand): Promise<number> => {
      restores++;
      if (failure === 'timeout') {
        return Promise.reject(new DOMException('tool preparation deadline', 'TimeoutError'));
      }
      return Promise.resolve(failure === 'exit' ? 17 : 137);
    };
    try {
      await assertRejects(
        () =>
          prepareRuntimeTier('sqlite', join(root, 'report.json'), {
            toolDirectory: root,
            runToolRestore,
            pullImage(image) {
              pulls++;
              return Promise.resolve({ image, durationMs: 0, attempts: [] });
            },
          }),
        failure === 'timeout' ? DOMException : Error,
        failure === 'timeout'
          ? 'tool preparation deadline'
          : `exit code ${failure === 'exit' ? 17 : 137}`,
      );
      assertEquals(restores, 1);
      assertEquals(pulls, 0);
      await assertRejects(() => Deno.stat(join(root, 'report.json')), Deno.errors.NotFound);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}

Deno.test('tier images use the scaffold cache owner and query the database SDK only for postgres', async () => {
  let queries = 0;
  const resolve = () => {
    queries++;
    return Promise.resolve('sdk-owned-image:changed-tag');
  };
  const caches = Object.values(SCAFFOLD_CACHE_CONTAINER_IMAGES).map(({ image, tag }) =>
    `${image}:${tag}`
  );
  assertEquals(await runtimeTierImages('sqlite', resolve), caches);
  assertEquals(queries, 0);
  assertEquals(await runtimeTierImages('postgres', resolve), [
    'sdk-owned-image:changed-tag',
    ...caches,
  ]);
  assertEquals(queries, 1);
  await assertRejects(
    () => runtimeTierImages('invalid', resolve),
    Error,
    'Unsupported runtime tier',
  );
});

Deno.test('image preparation retries only failed pulls with bounded timeout and backoff', async () => {
  const waits: number[] = [];
  const timeouts: number[] = [];
  let clock = 0;
  const measurement = await pullRuntimeImage('test-image', (_image, timeout) => {
    timeouts.push(timeout);
    clock += 7;
    return Promise.resolve(timeouts.length === 3 ? 0 : 1);
  }, (ms) => {
    waits.push(ms);
    clock += ms;
    return Promise.resolve();
  }, () => clock);
  assertEquals(timeouts, Array(3).fill(IMAGE_PULL_POLICY.attemptTimeoutMs));
  assertEquals(waits, [5000, 10000]);
  assertEquals(measurement.attempts.map((attempt) => attempt.exitCode), [1, 1, 0]);
  assertEquals(measurement.durationMs, 15021);
});

Deno.test('exhausted pulls retain nonzero failure and stop after three attempts', async () => {
  let pulls = 0;
  const measurement = await pullRuntimeImage('failed-image', () => {
    pulls++;
    return Promise.resolve(7);
  }, () => Promise.resolve());
  assertEquals(pulls, 3);
  assertEquals(measurement.attempts.at(-1)?.exitCode, 7);
  let successfulPulls = 0;
  const success = await pullRuntimeImage('ready-image', () => {
    successfulPulls++;
    return Promise.resolve(0);
  }, () => Promise.reject(new Error('successful pull must not back off')));
  assertEquals(successfulPulls, 1);
  assertEquals(success.attempts.length, 1);
});

Deno.test('both CI tiers prepare images before the unchanged one-pass suite with the established knob', async () => {
  const workflow = await Deno.readTextFile(
    new URL('../../../.github/workflows/e2e-cli.yml', import.meta.url),
  );
  for (
    const [job, tier, suite] of [
      ['scaffold-runtime', 'postgres', 'scaffold.runtime'],
      ['scaffold-runtime-sqlite', 'sqlite', 'scaffold.runtime.sqlite'],
    ]
  ) {
    const start = workflow.indexOf(`  ${job}:`);
    const rest = workflow.slice(start + 3);
    const next = rest.search(/\n {2}[a-z][\w-]+:/);
    const block = workflow.slice(start, next < 0 ? undefined : start + 3 + next);
    assertStringIncludes(block, 'ASPIRE_CLI_START_TIMEOUT: "300"');
    const preparation = block.indexOf(`prepull-runtime-images.ts ${tier}`);
    const run = block.indexOf(`deno task e2e:cli run ${suite} --cleanup --format pretty`);
    assertEquals(preparation >= 0 && run > preparation, true);
    assertStringIncludes(block, '.llm/tmp/e2e-image-pulls.json');
  }
});

Deno.test('scaffold generator reads the shared cache image source rather than a parallel copy', async () => {
  const generator = await Deno.readTextFile(
    new URL(
      '../../../packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts',
      import.meta.url,
    ),
  );
  assertStringIncludes(generator, 'SCAFFOLD_CACHE_CONTAINER_IMAGES[entry.Engine]');
  assertEquals(generator.includes("image: 'ghcr.io/microsoft/garnet'"), false);
});

Deno.test('calibrated pull budget bounds an exhausted timed pull without changing its failure', async () => {
  let clock = 0;
  const measurement = await pullRuntimeImage('stalled-image', (_image, timeoutMs) => {
    clock += timeoutMs;
    return Promise.resolve(137);
  }, (ms) => {
    clock += ms;
    return Promise.resolve();
  }, () => clock);
  assertEquals('IMAGE_PULL_MAX_DURATION_MS' in runtimePulls, true);
  if ('IMAGE_PULL_MAX_DURATION_MS' in runtimePulls) {
    assertEquals(runtimePulls.IMAGE_PULL_MAX_DURATION_MS, 375_000);
    assertEquals(measurement.durationMs, runtimePulls.IMAGE_PULL_MAX_DURATION_MS);
  }
  assertEquals(measurement.attempts.map((attempt) => attempt.exitCode), [137, 137, 137]);
});
