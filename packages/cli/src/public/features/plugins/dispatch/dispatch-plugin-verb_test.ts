import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join, resolve } from '@std/path';

import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import {
  createPluginDispatchPort,
  dispatchPluginScaffold,
  dispatchPluginVerb,
  isFrameworkVerb,
  resolvePluginCliSpecifier,
} from './dispatch-plugin-verb.ts';
import type { ValidatedPluginDescriptor } from '../install/jsr-plugin-validator-port.ts';
import { verifyJsrPackageIntegrity } from '../../../infra/jsr/verify-jsr-package-integrity.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../../../kernel/constants/jsr-specifiers.ts';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');

function repoPath(path: string): string {
  return join(REPO_ROOT, path);
}

describe('plugin verb dispatch', () => {
  it('routes framework verbs through deno x and the plugin cli subpath', async () => {
    const processRunner = new RecordingProcess(0);

    const result = await dispatchPluginVerb('install', '@example/plugin-alpha', ['--yes'], {
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(result.stdout, 'plugin output');
    assertEquals(processRunner.commands, [{
      command: 'deno',
      args: ['x', '-A', 'jsr:@example/plugin-alpha/cli', 'install', '--yes'],
      cwd: '/workspace/app',
    }]);
  });

  it('maps non-zero plugin cli exits to remote errors', async () => {
    const processRunner = new RecordingProcess(7, 'failed');

    await assertRejects(
      () =>
        dispatchPluginVerb('doctor', '@example/plugin-alpha', [], {
          projectRoot: '/workspace/app',
          processRunner,
        }),
      RemoteError,
      'Plugin command failed',
    );
  });

  it('returns captured process output through the dispatch port', async () => {
    const processRunner = new RecordingProcess(0, 'plugin warnings', 'plugin diagnostics');
    const port = createPluginDispatchPort(processRunner);

    const result = await port.dispatch({
      verb: 'info',
      pkg: '@example/plugin-alpha',
      args: [],
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(result.stdout, 'plugin diagnostics');
    assertEquals(result.stderr, 'plugin warnings');
  });

  it('identifies framework verbs and resolves jsr cli specifiers', () => {
    assertEquals(isFrameworkVerb('sync'), true);
    assertEquals(isFrameworkVerb('search'), false);
    assertEquals(
      resolvePluginCliSpecifier('@example/plugin-alpha'),
      'jsr:@example/plugin-alpha/cli',
    );
    assertEquals(
      resolvePluginCliSpecifier('jsr:@example/plugin-alpha/cli'),
      'jsr:@example/plugin-alpha/cli',
    );
    assertEquals(
      resolvePluginCliSpecifier('@netscript/plugin-ai'),
      `jsr:@netscript/plugin-ai@${NETSCRIPT_RELEASE_VERSION}/cli`,
    );
    assertEquals(
      resolvePluginCliSpecifier('jsr:@netscript/plugin-ai/cli'),
      `jsr:@netscript/plugin-ai@${NETSCRIPT_RELEASE_VERSION}/cli`,
    );
    assertEquals(
      resolvePluginCliSpecifier('@netscript/plugin-ai@1.2.3'),
      'jsr:@netscript/plugin-ai@1.2.3/cli',
    );
    assertEquals(
      resolvePluginCliSpecifier('jsr:@netscript/plugin-ai@1.2.3/cli'),
      'jsr:@netscript/plugin-ai@1.2.3/cli',
    );
  });

  it('runs an unversioned first-party plugin through the lockstep config and direct JSR target', async () => {
    const processRunner = new RecordingProcess(0);

    await dispatchPluginVerb('doctor', '@netscript/plugin-ai', [], {
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(processRunner.commands, [{
      command: 'deno',
      args: [
        'run',
        '--config',
        '/workspace/app/deno.json',
        '-A',
        `https://jsr.io/@netscript/plugin-ai/${NETSCRIPT_RELEASE_VERSION}/cli.ts`,
        'doctor',
      ],
      cwd: '/workspace/app',
    }]);
  });

  it('runs an explicitly lockstep first-party plugin through the direct JSR target', async () => {
    const processRunner = new RecordingProcess(0);

    await dispatchPluginVerb(
      'sync',
      `jsr:@netscript/plugin-workers@${NETSCRIPT_RELEASE_VERSION}/cli`,
      ['--json'],
      { projectRoot: '/workspace/app', processRunner },
    );

    assertEquals(processRunner.commands, [{
      command: 'deno',
      args: [
        'run',
        '--config',
        '/workspace/app/deno.json',
        '-A',
        `https://jsr.io/@netscript/plugin-workers/${NETSCRIPT_RELEASE_VERSION}/cli.ts`,
        'sync',
        '--json',
      ],
      cwd: '/workspace/app',
    }]);
  });

  it('keeps an explicitly non-lockstep first-party plugin on protected deno x dispatch', async () => {
    const processRunner = new RecordingProcess(0);

    await dispatchPluginVerb('doctor', '@netscript/plugin-ai@1.2.3', [], {
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(processRunner.commands, [{
      command: 'deno',
      args: ['x', '-A', 'jsr:@netscript/plugin-ai@1.2.3/cli', 'doctor'],
      cwd: '/workspace/app',
    }]);
  });
});

describe('plugin scaffold dispatch', () => {
  it('invokes a local fixture scaffolder and runs declared post-scripts', async () => {
    const projectRoot = await Deno.makeTempDir();
    const fixtureRoot = repoPath('packages/cli/tests/fixtures/plugin-scaffolder');
    try {
      const result = await dispatchPluginScaffold({
        descriptor: fixtureDescriptor(),
        source: { kind: 'local-path', path: fixtureRoot },
        projectRoot,
        pluginName: 'fixture',
        dryRun: false,
        permissionFlags: [
          `--allow-read=${projectRoot}`,
          `--allow-write=${projectRoot}`,
        ],
        processRunner: new DenoProcess(),
      });

      assertEquals(result.status, 'applied');
      assertEquals(result.createdFiles, ['plugins/fixture/generated.txt']);
      assertEquals(
        await Deno.readTextFile(join(projectRoot, 'plugins/fixture/generated.txt')),
        'plugin=fixture\n',
      );
      assertEquals(await Deno.readTextFile(join(projectRoot, 'post-script-ran.txt')), 'ok\n');
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('passes dry-run context to the fixture without writing project files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const fixtureRoot = repoPath('packages/cli/tests/fixtures/plugin-scaffolder');
    try {
      const result = await dispatchPluginScaffold({
        descriptor: {
          ...fixtureDescriptor(),
          manifest: { ...fixtureDescriptor().manifest, postScripts: [] },
        },
        source: { kind: 'local-path', path: fixtureRoot },
        projectRoot,
        pluginName: 'fixture',
        dryRun: true,
        permissionFlags: [
          `--allow-read=${projectRoot}`,
          `--allow-write=${projectRoot}`,
        ],
        processRunner: new DenoProcess(),
      });

      assertEquals(result.status, 'planned');
      assertEquals(result.createdFiles, ['plugins/fixture/generated.txt']);
      await assertRejects(
        () => Deno.stat(join(projectRoot, 'plugins/fixture/generated.txt')),
        Deno.errors.NotFound,
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('builds deno run argv with confined flags for third-party JSR scaffolders', async () => {
    const processRunner = new RecordingProcess(
      0,
      '',
      JSON.stringify({
        status: 'applied',
        createdFiles: [],
        modifiedFiles: [],
        databaseMigrationsAdded: false,
      }),
    );

    await dispatchPluginScaffold({
      descriptor: thirdPartyDescriptor(await checksumBytes(new TextEncoder().encode('mod'))),
      source: { kind: 'jsr', specifier: 'jsr:@acme/plugin-fixture@1.0.0' },
      projectRoot: '/workspace/app',
      pluginName: 'fixture',
      dryRun: false,
      permissionFlags: [
        '--allow-read=/workspace/app',
        '--allow-write=/workspace/app/plugins/fixture',
        '--deny-net',
        '--deny-run',
      ],
      processRunner,
      fileFetcher: { fetchFile: () => Promise.resolve(new TextEncoder().encode('mod')) },
    });

    assertEquals(processRunner.commands[0], {
      command: 'deno',
      args: [
        'run',
        '--allow-read=/workspace/app',
        '--allow-write=/workspace/app/plugins/fixture',
        '--deny-net',
        '--deny-run',
        'jsr:@acme/plugin-fixture@1.0.0/scaffold',
        '--context-json',
        '{"workspaceRoot":"/workspace/app","options":{"pluginName":"fixture","mcp":false},"dryRun":false}',
      ],
      cwd: '/workspace/app',
    });
  });

  it('verifies JSR file integrity and reports sha mismatches', async () => {
    const bytes = new TextEncoder().encode('expected');
    const descriptor = thirdPartyDescriptor(await checksumBytes(bytes));

    assertEquals(
      await verifyJsrPackageIntegrity(descriptor, { fetchFile: () => Promise.resolve(bytes) }),
      { ok: true, checkedFiles: ['/mod.ts'] },
    );

    const mismatch = await verifyJsrPackageIntegrity(descriptor, {
      fetchFile: () => Promise.resolve(new TextEncoder().encode('tampered')),
    });

    assertEquals(mismatch.ok, false);
    if (!mismatch.ok) {
      assertEquals(mismatch.path, '/mod.ts');
      assert(mismatch.actual.startsWith('sha256-'));
    }
  });
});

class RecordingProcess implements ProcessPort {
  readonly commands: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd?: string;
  }> = [];

  constructor(
    private readonly code: number,
    private readonly stderr = '',
    private readonly stdout = 'plugin output',
  ) {}

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<ProcessResult> {
    this.commands.push({ command, args, cwd: options?.cwd });
    return Promise.resolve({ code: this.code, stdout: this.stdout, stderr: this.stderr });
  }
}

function fixtureDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: '@acme/plugin-fixture',
      source: 'scoped-name',
      scope: 'acme',
      packageName: 'plugin-fixture',
      packageSpecifier: '@acme/plugin-fixture',
      jsrSpecifier: 'jsr:@acme/plugin-fixture',
    },
    version: '1.0.0',
    manifest: {
      schemaVersion: 1,
      name: '@acme/plugin-fixture',
      version: '1.0.0',
      displayName: 'Fixture Plugin',
      description: 'Fixture plugin.',
      peerDependencies: {},
      capabilities: {
        hasDatabaseMigrations: true,
        hasRoutes: false,
        hasBackgroundWorkers: true,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: { net: [], read: [], write: [] },
      },
      postScripts: [{ export: './post-script' }],
    },
    packageMetadata: { latest: '1.0.0', isYanked: false },
    versionMetadata: { exports: { './scaffold': './scaffold.ts' }, files: {} },
    details: {},
  };
}

function thirdPartyDescriptor(checksum: string): ValidatedPluginDescriptor {
  return {
    ...fixtureDescriptor(),
    versionMetadata: { exports: { './scaffold': './scaffold.ts' }, files: { '/mod.ts': checksum } },
  };
}

async function checksumBytes(bytes: Uint8Array): Promise<string> {
  const input = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(input).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return `sha256-${hex(new Uint8Array(digest))}`;
}

function hex(bytes: Uint8Array): string {
  let output = '';
  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, '0');
  }
  return output;
}
