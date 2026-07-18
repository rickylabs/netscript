import {
  assertEquals,
  assertThrows,
} from 'jsr:@std/assert@^1';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
} from '@netscript/sdk/auto-update';
import {
  DENO_DESKTOP_TARGETS,
  DesktopPackageError,
  type DesktopPackagePlanRequest,
} from './desktop-package-contract.ts';
import { planDesktopPackages } from './plan-desktop-packages.ts';

const BASE_REQUEST: DesktopPackagePlanRequest = {
  appName: 'storefront',
  version: '1.2.0',
  packageTaskName: 'desktop:package',
  workdir: '/project/apps/storefront',
  outputDir: '/project/.deploy/desktop/packages',
  compression: 'xz',
  hostOperatingSystem: 'darwin',
  currentTarget: { os: 'linux', arch: 'x86_64' },
};

Deno.test('desktop target catalog exhaustively derives SDK OS and architecture pairs', () => {
  const identities = DENO_DESKTOP_TARGETS.map((target) => `${target.os}-${target.arch}`).sort();
  const expected = AUTO_UPDATE_OPERATING_SYSTEMS.flatMap((os) =>
    AUTO_UPDATE_ARCHITECTURES.map((arch) => `${os}-${arch}`)
  ).sort();

  assertEquals(identities, expected);
  assertEquals(DENO_DESKTOP_TARGETS.length, 6);
});

Deno.test('all-targets plans every native format with explicit unique argv', () => {
  const plan = planDesktopPackages({ ...BASE_REQUEST, allTargets: true });

  assertEquals(plan.length, 12);
  assertEquals(new Set(plan.map((item) => item.outputPath)).size, plan.length);
  for (const invocation of plan) {
    assertEquals(invocation.command, 'deno');
    assertEquals(invocation.args.slice(0, 4), [
      'task',
      'desktop:package',
      '--target',
      invocation.target.triple,
    ]);
    assertEquals(invocation.args.includes('--compress=xz'), true);
    assertEquals(invocation.args.at(-2), '-o');
    assertEquals(invocation.args.at(-1), invocation.outputPath);
  }
});

Deno.test('all-targets format filter selects only compatible targets', () => {
  const plan = planDesktopPackages({
    ...BASE_REQUEST,
    allTargets: true,
    formats: ['msi'],
  });

  assertEquals(plan.map((item) => item.target.triple), [
    'x86_64-pc-windows-msvc',
    'aarch64-pc-windows-msvc',
  ]);
});

Deno.test('omitted selector uses the current SDK target and can omit compression', () => {
  const plan = planDesktopPackages({
    ...BASE_REQUEST,
    compression: 'none',
    formats: ['deb'],
  });

  assertEquals(plan.length, 1);
  assertEquals(plan[0].target.triple, 'x86_64-unknown-linux-gnu');
  assertEquals(plan[0].args.includes('--compress=xz'), false);
  assertEquals(plan[0].outputPath.endsWith('.deb'), true);
});

Deno.test('target and all-targets are mutually exclusive', () => {
  const error = assertThrows(
    () =>
      planDesktopPackages({
        ...BASE_REQUEST,
        target: 'x86_64-pc-windows-msvc',
        allTargets: true,
      }),
    DesktopPackageError,
  );
  assertEquals(error.code, 'invalid-input');
});

Deno.test('dmg fails before execution on a non-macOS host', () => {
  const error = assertThrows(
    () =>
      planDesktopPackages({
        ...BASE_REQUEST,
        hostOperatingSystem: 'linux',
        target: 'aarch64-apple-darwin',
        formats: ['dmg'],
      }),
    DesktopPackageError,
  );
  assertEquals(error.code, 'host-format-mismatch');
});

Deno.test('an incompatible explicit target and format is rejected', () => {
  const error = assertThrows(
    () =>
      planDesktopPackages({
        ...BASE_REQUEST,
        target: 'x86_64-pc-windows-msvc',
        formats: ['deb'],
      }),
    DesktopPackageError,
  );
  assertEquals(error.code, 'unsupported-format');
});
