import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { NetScriptConfig } from '@netscript/aspire/config';
import type { ProcessPort, ProcessResult } from '../../../../../../kernel/ports/process-port.ts';
import {
  DesktopPackageError,
} from './desktop-package-contract.ts';
import { packageDesktop } from './package-desktop.ts';

interface RecordedProcess {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
}

class RecordingProcess implements ProcessPort {
  readonly calls: RecordedProcess[] = [];

  constructor(private readonly result: ProcessResult = { code: 0, stdout: '', stderr: '' }) {}

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, cwd: options?.cwd });
    return Promise.resolve(this.result);
  }
}

class ThrowingProcess implements ProcessPort {
  exec(): Promise<ProcessResult> {
    return Promise.reject(new Deno.errors.NotFound('executable not found'));
  }
}

class RecordingFileSystem {
  readonly directories: string[] = [];

  createDir(path: string): Promise<void> {
    this.directories.push(path);
    return Promise.resolve();
  }
}

const fileSystem = new RecordingFileSystem();

function config(
  apps: NetScriptConfig['Apps'],
  version = '2.3.4',
): NetScriptConfig {
  return {
    Name: 'fixture',
    Version: version,
    Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
    Defaults: {
      Deno: {
        Permissions: ['--allow-read'],
        WatchMode: false,
      },
    },
    Services: {},
    Apps: apps,
    Plugins: {},
    BackgroundProcessors: {},
    Databases: {},
    Cache: {},
    Tools: {},
  };
}

function desktopApp(overrides: Partial<NetScriptConfig['Apps'][string]> = {}): NetScriptConfig['Apps'][string] {
  return {
    Enabled: true,
    Runtime: 'deno',
    Type: 'desktop',
    WatchMode: false,
    RequiresKv: false,
    ...overrides,
  };
}

Deno.test('package workflow consumes configured PackageTaskName and app workdir', async () => {
  const process = new RecordingProcess();
  fileSystem.directories.length = 0;
  const result = await packageDesktop(
    {
      projectRoot: '/project',
      app: 'storefront',
      target: 'x86_64-pc-windows-msvc',
      formats: ['msi'],
      compression: 'xz',
    },
    {
      process,
      fileSystem,
      hostOperatingSystem: 'linux',
      currentTarget: { os: 'linux', arch: 'x86_64' },
      loadAppSettings: () =>
        Promise.resolve(config({
          storefront: desktopApp({
            Workdir: 'apps/custom-storefront',
            PackageTaskName: 'release:desktop',
          }),
        })),
    },
  );

  assertEquals(result.appName, 'storefront');
  assertEquals(result.version, '2.3.4');
  assertEquals(fileSystem.directories, ['/project/.deploy/desktop/packages']);
  assertEquals(process.calls, [{
    command: 'deno',
    args: [
      'task',
      'release:desktop',
      '--target',
      'x86_64-pc-windows-msvc',
      '--compress=xz',
      '-o',
      '/project/.deploy/desktop/packages/storefront-2.3.4-windows-x86_64.msi',
    ],
    cwd: '/project/apps/custom-storefront',
  }]);
});

Deno.test('package workflow defaults the #452 hook to desktop:package', async () => {
  const process = new RecordingProcess();
  await packageDesktop(
    {
      projectRoot: '/project',
      target: 'x86_64-unknown-linux-gnu',
      formats: ['appimage'],
      compression: 'none',
    },
    {
      process,
      fileSystem,
      hostOperatingSystem: 'linux',
      currentTarget: { os: 'linux', arch: 'x86_64' },
      loadAppSettings: () => Promise.resolve(config({ storefront: desktopApp() })),
    },
  );

  assertEquals(process.calls[0].args.slice(0, 2), ['task', 'desktop:package']);
  assertEquals(process.calls[0].args.some((arg) => arg.startsWith('--compress')), false);
});

Deno.test('multiple enabled desktop apps require explicit selection', async () => {
  const error = await assertRejects(
    () =>
      packageDesktop(
        {
          projectRoot: '/project',
          target: 'x86_64-unknown-linux-gnu',
          compression: 'xz',
        },
        {
          process: new RecordingProcess(),
          fileSystem,
          hostOperatingSystem: 'linux',
          currentTarget: { os: 'linux', arch: 'x86_64' },
          loadAppSettings: () =>
            Promise.resolve(config({ one: desktopApp(), two: desktopApp() })),
        },
      ),
    DesktopPackageError,
  );
  assertEquals(error.code, 'app-ambiguous');
});

Deno.test('disabled and non-desktop requested apps fail honestly', async (t) => {
  for (const [entry, code] of [
    [desktopApp({ Enabled: false }), 'app-disabled'],
    [desktopApp({ Type: 'app' }), 'app-not-desktop'],
  ] as const) {
    await t.step(code, async () => {
      const error = await assertRejects(
        () =>
          packageDesktop(
            {
              projectRoot: '/project',
              app: 'storefront',
              target: 'x86_64-unknown-linux-gnu',
              compression: 'xz',
            },
            {
              process: new RecordingProcess(),
              fileSystem,
              hostOperatingSystem: 'linux',
              currentTarget: { os: 'linux', arch: 'x86_64' },
              loadAppSettings: () => Promise.resolve(config({ storefront: entry })),
            },
          ),
        DesktopPackageError,
      );
      assertEquals(error.code, code);
    });
  }
});

Deno.test('zstd preflight runs before package invocations', async () => {
  const process = new RecordingProcess({ code: 1, stdout: '', stderr: 'missing' });
  const error = await assertRejects(
    () =>
      packageDesktop(
        {
          projectRoot: '/project',
          target: 'x86_64-unknown-linux-gnu',
          formats: ['deb'],
          compression: 'zstd',
        },
        {
          process,
          fileSystem,
          hostOperatingSystem: 'linux',
          currentTarget: { os: 'linux', arch: 'x86_64' },
          loadAppSettings: () => Promise.resolve(config({ storefront: desktopApp() })),
        },
      ),
    DesktopPackageError,
  );

  assertEquals(error.code, 'tool-unavailable');
  assertEquals(process.calls, [{ command: 'zstd', args: ['--version'], cwd: undefined }]);
});

Deno.test('missing zstd executable is reported as a typed tool error', async () => {
  const error = await assertRejects(
    () =>
      packageDesktop(
        {
          projectRoot: '/project',
          target: 'x86_64-unknown-linux-gnu',
          formats: ['deb'],
          compression: 'zstd',
        },
        {
          process: new ThrowingProcess(),
          fileSystem,
          hostOperatingSystem: 'linux',
          currentTarget: { os: 'linux', arch: 'x86_64' },
          loadAppSettings: () => Promise.resolve(config({ storefront: desktopApp() })),
        },
      ),
    DesktopPackageError,
  );

  assertEquals(error.code, 'tool-unavailable');
});

Deno.test('package process failures identify target and format', async () => {
  const process = new RecordingProcess({ code: 7, stdout: '', stderr: 'compile failed' });
  const error = await assertRejects(
    () =>
      packageDesktop(
        {
          projectRoot: '/project',
          target: 'aarch64-unknown-linux-gnu',
          formats: ['rpm'],
          compression: 'xz',
        },
        {
          process,
          fileSystem,
          hostOperatingSystem: 'linux',
          currentTarget: { os: 'linux', arch: 'x86_64' },
          loadAppSettings: () => Promise.resolve(config({ storefront: desktopApp() })),
        },
      ),
    DesktopPackageError,
  );

  assertEquals(error.code, 'package-failed');
  assertEquals(error.message.includes('aarch64-unknown-linux-gnu/rpm'), true);
});
