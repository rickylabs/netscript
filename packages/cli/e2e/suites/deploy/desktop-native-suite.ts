import { join, resolve } from '@std/path';
import { defaultRunOptions } from '../../src/create-default-runner.ts';
import { DEPLOY, DEPLOY_TITLE, GATE, GATE_PHASE } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE, REPORT_FORMAT } from '../../src/domain/extension-axes.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import { commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';
import { EXECUTION_PLATFORMS } from '../../src/domain/platform.ts';

/** Build the native desktop deployment acceptance suite contract. */
export function createDesktopNativeDeploySuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const repoRoot = resolve(overrides.repoRoot ?? '.');
  const baseOptions = defaultRunOptions(overrides);
  return Object.freeze({
    id: DEPLOY.DESKTOP_NATIVE,
    title: DEPLOY_TITLE.DESKTOP_NATIVE,
    description:
      'Native desktop package, remote-service, signed-update, and rollback acceptance across supported host platforms.',
    defaultOptions: Object.freeze({
      ...baseOptions,
      ...overrides,
      repoRoot,
      packageSource: overrides.packageSource ?? PACKAGE_SOURCE.LOCAL,
      samples: false,
      format: overrides.format ?? REPORT_FORMAT.NDJSON,
    }),
    gates: Object.freeze([
      createFixturePreflightGate(repoRoot),
      createFixtureContractGate(repoRoot),
      createLinuxNativeGate(repoRoot),
      createUnavailableNativeGate(repoRoot, EXECUTION_PLATFORMS.WINDOWS),
      createUnavailableNativeGate(repoRoot, EXECUTION_PLATFORMS.DARWIN),
    ]),
  });
}

function createUnavailableNativeGate(
  repoRoot: string,
  platform: typeof EXECUTION_PLATFORMS.WINDOWS | typeof EXECUTION_PLATFORMS.DARWIN,
) {
  const gateId = platform === EXECUTION_PLATFORMS.WINDOWS
    ? GATE.DEPLOY_DESKTOP_WINDOWS_NATIVE
    : GATE.DEPLOY_DESKTOP_DARWIN_NATIVE;
  const gate = commandGate(
    gateId,
    `Record the ${platform} native owner-host leg as NOT_RUN`,
    GATE_PHASE.BEHAVIOR,
    () => [
      'deno',
      'run',
      '--allow-env',
      join(
        repoRoot,
        'packages',
        'cli',
        'e2e',
        'src',
        'adapters',
        'native-desktop',
        'unavailable-platform-driver.ts',
      ),
      '--platform',
      platform,
    ],
  );
  return { ...gate, platforms: [platform] } as const;
}

function createLinuxNativeGate(repoRoot: string) {
  const gate = commandGate(
    GATE.DEPLOY_DESKTOP_LINUX_NATIVE,
    'Install and prove Linux native apply and failed-launch rollback',
    GATE_PHASE.BEHAVIOR,
    () => [
      'deno',
      'run',
      '--allow-all',
      join(
        repoRoot,
        'packages',
        'cli',
        'e2e',
        'src',
        'adapters',
        'native-desktop',
        'linux-native-driver.ts',
      ),
      '--repo-root',
      repoRoot,
    ],
  );
  return { ...gate, platforms: [EXECUTION_PLATFORMS.LINUX] } as const;
}

function createFixtureContractGate(repoRoot: string) {
  const fixtureRoot = join(
    repoRoot,
    'packages',
    'cli',
    'e2e',
    'fixtures',
    'desktop-native',
  );
  return commandGate(
    GATE.DEPLOY_DESKTOP_FIXTURE,
    'Prove signed fixture and renderer remote-service contract',
    GATE_PHASE.BEHAVIOR,
    () => ['deno', 'task', 'test'],
    () => fixtureRoot,
  );
}

function createFixturePreflightGate(repoRoot: string) {
  const fixtureManifest = join(
    repoRoot,
    'packages',
    'cli',
    'e2e',
    'fixtures',
    'desktop-native',
    'deno.json',
  );
  return commandGate(
    GATE.DEPLOY_DESKTOP_PREFLIGHT,
    'Verify the native desktop fixture is available',
    GATE_PHASE.PREFLIGHT,
    () => ['deno', 'eval', 'await Deno.stat(Deno.args[0]);', fixtureManifest],
  );
}
