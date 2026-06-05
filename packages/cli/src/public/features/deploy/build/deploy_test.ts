import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import type { ServiceManifestPort } from '../../../ports/service-manifest-port.ts';
import type {
  WindowsServiceCommandResult,
  WindowsServiceInstallRequest,
  WindowsServicePort,
} from '../../../ports/windows-service-port.ts';
import { ServyCliAdapter } from '../../../adapters/servy-cli.ts';
import { buildDeploy } from './build-deploy.ts';
import { installServiceDeploy } from '../install/install-service-deploy.ts';
import { uninstallServiceDeploy } from '../uninstall/uninstall-service-deploy.ts';

describe('public deploy application flows', () => {
  it('builds deployment artifacts from a resolved config', async () => {
    const calls: unknown[] = [];
    const result = await buildDeploy({
      deployDir: '/workspace/.deploy/windows',
      options: {
        parallel: true,
        skipServices: ['debug-api'],
      },
    }, {
      loadConfig: (options) => {
        calls.push(['load', options]);
        return Promise.resolve({ app: { name: 'alpha' } } as never);
      },
      buildWindowsDeployment: (_config, options) => {
        calls.push(['build', options]);
        return Promise.resolve({
          success: true,
          outputDir: options.deployDir,
          compilations: [],
          durationMs: 1,
          errors: [],
        });
      },
    });

    assertEquals(result.outputDir, '/workspace/.deploy/windows');
    assertEquals(calls, [
      ['load', { deployDir: '/workspace/.deploy/windows' }],
      ['build', {
        deployDir: '/workspace/.deploy/windows',
        parallel: true,
        skipServices: ['debug-api'],
        includeTasks: undefined,
        excludeTasks: undefined,
      }],
    ]);
  });

  it('installs manifest services in manifest order', async () => {
    const services = new RecordingWindowsServicePort();

    const result = await installServiceDeploy({
      deployDir: '/deploy',
      force: true,
    }, {
      manifests: manifestPort(['users', 'orders']),
      services,
    });

    assertEquals(result.installed, ['users', 'orders']);
    assertEquals(services.installs.map((entry) => entry.serviceName), [
      'NetScript.users',
      'NetScript.orders',
    ]);
    assertEquals(services.installs.map((entry) => entry.configPath.replaceAll('\\', '/')), [
      '/install/config/users.xml',
      '/install/config/orders.xml',
    ]);
  });

  it('uninstalls manifest services in reverse manifest order', async () => {
    const services = new RecordingWindowsServicePort();

    const result = await uninstallServiceDeploy({
      deployDir: '/deploy',
      stopFirst: true,
    }, {
      manifests: manifestPort(['users', 'orders']),
      services,
    });

    assertEquals(result.uninstalled, ['orders', 'users']);
    assertEquals(services.runs.map((entry) => entry.serviceName), [
      'NetScript.orders',
      'NetScript.orders',
      'NetScript.users',
      'NetScript.users',
    ]);
    assertEquals(services.runs.map((entry) => entry.operation), [
      'stop',
      'uninstall',
      'stop',
      'uninstall',
    ]);
  });

  it('maps Windows service operations to servy-cli invocations', async () => {
    const process = new RecordingProcessPort();
    const adapter = new ServyCliAdapter({
      servyCliPath: 'C:/tools/servy-cli.exe',
      process,
    });

    await adapter.install({
      serviceName: 'NetScript.users',
      configPath: 'C:/app/config/users.xml',
      force: true,
    });
    await adapter.run('start', 'NetScript.users');

    assertEquals(process.calls, [
      {
        command: 'C:/tools/servy-cli.exe',
        args: [
          'install',
          '-n',
          'NetScript.users',
          '-c',
          'C:/app/config/users.xml',
          '-q',
          '--force',
        ],
      },
      {
        command: 'C:/tools/servy-cli.exe',
        args: ['start', '-n', 'NetScript.users', '-q'],
      },
    ]);
  });
});

function manifestPort(serviceNames: readonly string[]): ServiceManifestPort {
  return {
    resolve: () =>
      Promise.resolve({
        installDir: '/install',
        manifestDir: '/install/config',
        manifest: {
          name: 'alpha',
          version: '1.0.0',
          generatedAt: '2026-05-01T00:00:00.000Z',
          services: Object.fromEntries(
            serviceNames.map((name) => [name, { type: 'service' }]),
          ),
          infrastructure: {},
        },
      }),
  };
}

class RecordingWindowsServicePort implements WindowsServicePort {
  readonly installs: WindowsServiceInstallRequest[] = [];
  readonly runs: Array<{ operation: string; serviceName: string }> = [];

  install(request: WindowsServiceInstallRequest): Promise<WindowsServiceCommandResult> {
    this.installs.push(request);
    return Promise.resolve({ success: true, message: 'OK', code: 0 });
  }

  run(operation: 'start' | 'stop' | 'status' | 'uninstall', serviceName: string) {
    this.runs.push({ operation, serviceName });
    return Promise.resolve({ success: true, message: 'OK', code: 0 });
  }
}

class RecordingProcessPort implements ProcessPort {
  readonly calls: Array<{ command: string; args: readonly string[] }> = [];

  exec(command: string, args: readonly string[]): Promise<ProcessResult> {
    this.calls.push({ command, args: [...args] });
    return Promise.resolve({ code: 0, stdout: 'OK', stderr: '' });
  }
}
