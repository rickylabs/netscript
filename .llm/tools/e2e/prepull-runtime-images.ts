import { delay } from 'jsr:@std/async@1/delay';
import { dirname, join } from '@std/path';
import { SCAFFOLD_ASPIRE_INTEGRATIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_CACHE_CONTAINER_IMAGES } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-container-images.ts';
import { SCAFFOLD_VERSIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts';

/** Tool preparation has its own bound; runtime readiness keeps the suite's existing policy. */
export const GARNET_TOOL_PREPARATION_TIMEOUT_MS = 120_000;

/** One visible prerequisite process, injectable without starting any runtime resources. */
export type ToolPreparationCommand = Readonly<{
  command: 'dotnet';
  args: readonly string[];
  timeoutMs: number;
  stdout: 'inherit';
  stderr: 'inherit';
}>;

/** Restore the executable cache fallback before the AppHost's best-effort startup restore. */
export async function restoreRuntimeGarnet(
  directory: string,
  run: (command: ToolPreparationCommand) => Promise<number> = runToolPreparation,
): Promise<void> {
  const manifest = join(directory, '.config', 'dotnet-tools.json');
  await Deno.mkdir(dirname(manifest), { recursive: true });
  await Deno.writeTextFile(
    manifest,
    JSON.stringify(
      {
        version: 1,
        isRoot: true,
        tools: {
          'garnet-server': {
            version: SCAFFOLD_VERSIONS.GARNET_TOOL,
            commands: ['garnet-server'],
          },
        },
      },
      null,
      2,
    ) + '\n',
  );
  const exitCode = await run({
    command: 'dotnet',
    args: ['tool', 'restore', '--tool-manifest', manifest],
    timeoutMs: GARNET_TOOL_PREPARATION_TIMEOUT_MS,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (exitCode !== 0) {
    throw new Error(`Pinned Garnet tool preparation failed with exit code ${exitCode}.`);
  }
}

async function runToolPreparation(command: ToolPreparationCommand): Promise<number> {
  const child = new Deno.Command(command.command, {
    args: [...command.args],
    signal: AbortSignal.timeout(command.timeoutMs),
    stdout: command.stdout,
    stderr: command.stderr,
  }).spawn();
  return (await child.status).code;
}

/** One measured pull attempt; preparation retries never retry an E2E assertion. */
export interface ImagePullAttempt {
  readonly durationMs: number;
  readonly exitCode: number;
}

/** CI preparation evidence, including exhausted attempts on failure. */
export interface ImagePullMeasurement {
  readonly image: string;
  readonly durationMs: number;
  readonly attempts: readonly ImagePullAttempt[];
}

/** Bounded registry preparation policy, separate from all suite gate policies. */
export const IMAGE_PULL_POLICY = {
  maxAttempts: 3,
  attemptTimeoutMs: 120_000,
  backoffMs: [5_000, 10_000],
} as const;

/** Maximum timed pull/backoff budget per image; process-launch overhead is additional. */
export const IMAGE_PULL_MAX_DURATION_MS: number =
  IMAGE_PULL_POLICY.maxAttempts * IMAGE_PULL_POLICY.attemptTimeoutMs +
  IMAGE_PULL_POLICY.backoffMs.reduce((total, ms) => total + ms, 0);

/** Use the scaffold's cache image and the pinned SDK's actual database model. */
export async function runtimeTierImages(
  tier: string,
  resolvePostgres: () => Promise<string> = resolvePostgresImage,
): Promise<readonly string[]> {
  if (tier !== 'postgres' && tier !== 'sqlite') {
    throw new Error(`Unsupported runtime tier: ${tier}`);
  }
  // The default scaffold uses Redis; the existing runtime listener contract expects Garnet.
  // Prepare both from the generator's catalog, including startup during database initialization.
  const caches = Object.values(SCAFFOLD_CACHE_CONTAINER_IMAGES).map(({ image, tag }) =>
    `${image}:${tag}`
  );
  return [
    ...(tier === 'postgres' ? [await resolvePostgres()] : []),
    ...caches,
  ];
}

/** Pull one image with finite attempts and measured backoff, persisting every attempt. */
export async function pullRuntimeImage(
  image: string,
  run: (image: string, timeoutMs: number) => Promise<number> = dockerPull,
  wait: (ms: number) => Promise<void> = delay,
  now: () => number = performance.now.bind(performance),
): Promise<ImagePullMeasurement> {
  const attempts: ImagePullAttempt[] = [];
  const started = now();
  for (let attempt = 0; attempt < IMAGE_PULL_POLICY.maxAttempts; attempt++) {
    const attemptStarted = now();
    const exitCode = await run(image, IMAGE_PULL_POLICY.attemptTimeoutMs);
    attempts.push({ durationMs: Math.round(now() - attemptStarted), exitCode });
    if (exitCode === 0) break;
    if (attempt < IMAGE_PULL_POLICY.backoffMs.length) {
      await wait(IMAGE_PULL_POLICY.backoffMs[attempt]);
    }
  }
  return { image, durationMs: Math.round(now() - started), attempts };
}

async function dockerPull(image: string, timeoutMs: number): Promise<number> {
  const child = new Deno.Command('docker', {
    args: ['pull', image],
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
  try {
    return (await child.status).code;
  } finally {
    clearTimeout(timer);
  }
}

async function resolvePostgresImage(): Promise<string> {
  const integration = SCAFFOLD_ASPIRE_INTEGRATIONS.POSTGRES;
  const directory = '.llm/tmp/e2e-image-model';
  await Deno.mkdir(directory, { recursive: true });
  await Deno.copyFile(
    new URL('./resolve-postgres-image.cs', import.meta.url),
    join(directory, 'Program.cs'),
  );
  await Deno.writeTextFile(
    join(directory, 'ImageModel.csproj'),
    `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType>` +
      `<TargetFramework>net10.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings>` +
      `</PropertyGroup><ItemGroup><PackageReference Include="${integration.PACKAGE_ID}" ` +
      `Version="${integration.VERSION}" /></ItemGroup></Project>`,
  );
  const result = await new Deno.Command('dotnet', {
    args: ['run', '--project', join(directory, 'ImageModel.csproj'), '--verbosity', 'quiet'],
    signal: AbortSignal.timeout(180_000),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(
      `Pinned SDK image inspection failed: ${new TextDecoder().decode(result.stderr)}`,
    );
  }
  // Restore/build may precede the one JSON line. No SDK version or image tag is copied here.
  const json = new TextDecoder().decode(result.stdout).trim().split(/\r?\n/).at(-1) ?? '';
  const model: unknown = JSON.parse(json);
  if (
    typeof model !== 'object' || model === null || !('image' in model) ||
    typeof model.image !== 'string'
  ) {
    throw new Error('Pinned SDK image inspection omitted image');
  }
  return model.image;
}

/** Prepare every runtime prerequisite; failure prevents the unchanged one-pass suite starting. */
export async function prepareRuntimeTier(
  tier: string,
  report = '.llm/tmp/e2e-image-pulls.json',
  options: Readonly<{
    toolDirectory?: string;
    runToolRestore?: (command: ToolPreparationCommand) => Promise<number>;
    resolvePostgres?: () => Promise<string>;
    pullImage?: (image: string) => Promise<ImagePullMeasurement>;
  }> = {},
): Promise<void> {
  const images = await runtimeTierImages(tier, options.resolvePostgres);
  const started = performance.now();
  await restoreRuntimeGarnet(
    options.toolDirectory ?? '.llm/tmp/e2e-garnet-tool',
    options.runToolRestore,
  );
  console.info(`Garnet tool preparation: ${Math.round(performance.now() - started)}ms`);
  const measurements: ImagePullMeasurement[] = [];
  for (const image of images) {
    const measurement = await (options.pullImage ?? pullRuntimeImage)(image);
    measurements.push(measurement);
    await Deno.mkdir(dirname(report), { recursive: true });
    await Deno.writeTextFile(report, `${JSON.stringify(measurements, null, 2)}\n`);
    console.info(
      `Image pull ${image}: ${measurement.durationMs}ms (${measurement.attempts.length} attempts; ` +
        `budget ${IMAGE_PULL_MAX_DURATION_MS}ms)`,
    );
    if (measurement.attempts.at(-1)?.exitCode !== 0) {
      throw new Error(`Image pull exhausted ${IMAGE_PULL_POLICY.maxAttempts} attempts: ${image}`);
    }
  }
}

if (import.meta.main) {
  const [tier, report] = Deno.args;
  await prepareRuntimeTier(tier, report);
}
