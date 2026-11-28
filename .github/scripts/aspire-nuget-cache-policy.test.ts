import { assert, assertEquals, assertStringIncludes } from '@std/assert';

const ASPIRE_VERSION = '17.0.0';
const ASPIRE_CACHE_SUFFIX = '17.0.0-v1';

const POLICY = {
  action: 'uses: actions/cache@v4',
  nugetPath: 'path: ~/.nuget/packages',
  nugetKey: `key: nuget-aspire-\${{ runner.os }}-${ASPIRE_CACHE_SUFFIX}`,
  cliCacheId: 'id: aspire_cli_cache',
  cliPath: 'path: ~/.dotnet/aspire-cli',
  cliKey: `key: aspire-cli-\${{ runner.os }}-${ASPIRE_CACHE_SUFFIX}`,
  cliInstallGuard: "steps.aspire_cli_cache.outputs.cache-hit != 'true'",
  cliInstall:
    `dotnet tool install Aspire.Cli --tool-path "$HOME/.dotnet/aspire-cli" --version ${ASPIRE_VERSION}`,
  cliPathExport: 'echo "$HOME/.dotnet/aspire-cli" >> "$GITHUB_PATH"',
  preflight: `${ASPIRE_VERSION}|${ASPIRE_VERSION}+*) ;;`,
  denoLocate: 'echo "path=$(deno info --json | jq -r .denoDir)" >> "$GITHUB_OUTPUT"',
  denoPath: 'path: ${{ steps.deno_cache.outputs.path }}',
  denoKey:
    "key: deno-cache-${{ runner.os }}-${{ runner.arch }}-e2e-cli-${{ hashFiles('deno.lock') }}",
} as const;

interface RuntimeJobSpec {
  readonly workflow: string;
  readonly jobId: string;
}

const RUNTIME_JOBS: readonly RuntimeJobSpec[] = [
  { workflow: '.github/workflows/e2e-cli.yml', jobId: 'scaffold-runtime' },
  { workflow: '.github/workflows/e2e-cli.yml', jobId: 'scaffold-runtime-sqlite' },
  { workflow: '.github/workflows/e2e-cli-prod.yml', jobId: 'scaffold-runtime-jsr' },
  { workflow: '.github/workflows/e2e-cli-prod-local.yml', jobId: 'scaffold-runtime-prod-local' },
];

/** Slice out a single top-level job block under `jobs:` and split it into step blocks. */
function extractJobSteps(workflowSource: string, jobId: string): readonly string[] {
  const lines = workflowSource.split(/\r?\n/);
  const jobHeader = `  ${jobId}:`;
  const start = lines.findIndex((line) => line === jobHeader);
  assert(start !== -1, `Job ${jobId} not found`);

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {2}[a-zA-Z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const jobBody = lines.slice(start, end).join('\n');
  const stepsIndex = jobBody.indexOf('\n    steps:\n');
  assert(stepsIndex !== -1, `Job ${jobId} has no steps section`);
  const stepsSection = jobBody.slice(stepsIndex + '\n    steps:\n'.length);
  return stepsSection.split(/\n(?= {6}- )/).map((step) => step.trimEnd());
}

Deno.test('every Aspire runtime job independently caches NuGet, Aspire CLI, and Deno with exact preflight', async () => {
  for (const { workflow, jobId } of RUNTIME_JOBS) {
    const source = await Deno.readTextFile(workflow);
    const steps = extractJobSteps(source, jobId);
    const label = `${workflow}#${jobId}`;

    const nugetCacheStep = steps.find((step) =>
      step.includes(POLICY.action) && step.includes(POLICY.nugetPath)
    );
    assert(nugetCacheStep, `${label}: missing NuGet actions/cache@v4 step`);
    assertStringIncludes(nugetCacheStep, POLICY.nugetKey, `${label}: NuGet cache key mismatch`);

    const cliCacheStep = steps.find((step) =>
      step.includes(POLICY.action) && step.includes(POLICY.cliPath)
    );
    assert(cliCacheStep, `${label}: missing Aspire CLI actions/cache@v4 step`);
    assertStringIncludes(cliCacheStep, POLICY.cliCacheId, `${label}: Aspire CLI cache id mismatch`);
    assertStringIncludes(cliCacheStep, POLICY.cliKey, `${label}: Aspire CLI cache key mismatch`);

    const installStep = steps.find((step) => step.includes(POLICY.cliInstall));
    assert(installStep, `${label}: missing pinned Aspire CLI install step`);
    assertStringIncludes(
      installStep,
      POLICY.cliInstallGuard,
      `${label}: Aspire CLI install must only run on cache miss`,
    );

    const pathStep = steps.find((step) => step.includes(POLICY.cliPathExport));
    assert(pathStep, `${label}: missing Aspire CLI PATH export step`);
    assertEquals(
      pathStep.includes(POLICY.cliInstallGuard),
      false,
      `${label}: PATH export must run unconditionally (even on cache hit)`,
    );

    const preflightStep = steps.find((step) => step.includes('aspire --version'));
    assert(preflightStep, `${label}: missing Aspire CLI preflight step`);
    assertStringIncludes(preflightStep, POLICY.preflight, `${label}: exact preflight mismatch`);

    const denoLocateStep = steps.find((step) => step.includes(POLICY.denoLocate));
    assert(denoLocateStep, `${label}: missing Deno cache locate step`);

    const denoCacheStep = steps.find((step) =>
      step.includes(POLICY.action) && step.includes(POLICY.denoPath)
    );
    assert(denoCacheStep, `${label}: missing Deno actions/cache@v4 step`);
    assertStringIncludes(denoCacheStep, POLICY.denoKey, `${label}: Deno cache key mismatch`);
  }
});

Deno.test('published E2E uses the stable tool install route and retains CLI diagnostics', async () => {
  const source = await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml');
  assertStringIncludes(source, POLICY.cliInstall);
  assertEquals(source.includes('https://aspire.dev/install.sh'), false);
  assertStringIncludes(source, 'aspire doctor --non-interactive --nologo');
  assertStringIncludes(source, '~/.aspire/logs/cli_*.log');
});
