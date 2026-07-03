import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../kernel/ports/process-port.ts';
import { SystemdOsServiceAdapter } from './systemd-os-service.ts';

class RecordingProcessPort implements ProcessPort {
  readonly calls: { command: string; args: readonly string[] }[] = [];
  constructor(private readonly result: ProcessResult = { code: 0, stdout: '', stderr: '' }) {}
  exec(command: string, args: readonly string[]): Promise<ProcessResult> {
    this.calls.push({ command, args });
    return Promise.resolve(this.result);
  }
}

describe('SystemdOsServiceAdapter', () => {
  it('maps Linux service operations to byte-identical systemctl invocations', async () => {
    const process = new RecordingProcessPort();
    const adapter = new SystemdOsServiceAdapter({
      systemctlPath: '/usr/bin/systemctl',
      process,
    });

    await adapter.install({
      serviceName: 'netscript-users.service',
      configPath: '/etc/systemd/system/netscript-users.service',
      force: true,
    });
    await adapter.run('start', 'netscript-users.service');
    await adapter.run('stop', 'netscript-users.service');
    await adapter.run('status', 'netscript-users.service');
    await adapter.run('uninstall', 'netscript-users.service');

    assertEquals(process.calls, [
      { command: '/usr/bin/systemctl', args: ['daemon-reload'] },
      {
        command: '/usr/bin/systemctl',
        args: ['enable', '--force', '/etc/systemd/system/netscript-users.service'],
      },
      { command: '/usr/bin/systemctl', args: ['start', 'netscript-users.service'] },
      { command: '/usr/bin/systemctl', args: ['stop', 'netscript-users.service'] },
      { command: '/usr/bin/systemctl', args: ['status', 'netscript-users.service'] },
      { command: '/usr/bin/systemctl', args: ['disable', 'netscript-users.service'] },
    ]);
  });

  it('fails fast when daemon-reload fails and does not enable', async () => {
    const process = new RecordingProcessPort({ code: 1, stdout: '', stderr: 'reload boom' });
    const adapter = new SystemdOsServiceAdapter({
      systemctlPath: 'systemctl',
      process,
    });

    const result = await adapter.install({
      serviceName: 'netscript-users.service',
      configPath: '/etc/systemd/system/netscript-users.service',
      force: false,
    });

    assertEquals(result.success, false);
    assertEquals(result.message, 'reload boom');
    assertEquals(process.calls.length, 1);
    assertEquals(process.calls[0].args, ['daemon-reload']);
  });

  it('surfaces a structured result on success', async () => {
    const process = new RecordingProcessPort({ code: 0, stdout: 'active', stderr: '' });
    const adapter = new SystemdOsServiceAdapter({ systemctlPath: 'systemctl', process });

    const result = await adapter.run('status', 'netscript-users.service');
    assertEquals(result, { success: true, message: 'active', code: 0 });
  });
});
