import { assertEquals } from '@std/assert';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import { AspireAppHostDoctorInspector } from './apphost-doctor-inspector.ts';

Deno.test('AppHost doctor inspector uses ps truth before describe', async () => {
  const process = new RecordingProcess([ok('[]')]);
  const result = await new AspireAppHostDoctorInspector(process).inspect('/workspace');
  assertEquals(result, { status: 'not-running' });
  assertEquals(process.commands.map((command) => command.args[0]), ['ps']);
});

Deno.test('AppHost doctor inspector returns named resource state from the matching AppHost', async () => {
  const process = new RecordingProcess([
    ok(JSON.stringify([{
      appHostPath: '/workspace/aspire/apphost.mts',
      status: 'Running',
    }])),
    ok(JSON.stringify({
      resources: [{ displayName: 'api', state: 'Running', healthStatus: 'Unhealthy' }],
    })),
  ]);
  const result = await new AspireAppHostDoctorInspector(process).inspect('/workspace');
  assertEquals(result, {
    status: 'running',
    resources: [{ name: 'api', state: 'Running', healthStatus: 'Unhealthy' }],
  });
  assertEquals(process.commands.map((command) => command.args[0]), ['ps', 'describe']);
});

function ok(stdout: string): ProcessResult {
  return { code: 0, stdout, stderr: '' };
}

class RecordingProcess implements ProcessPort {
  readonly commands: { command: string; args: readonly string[] }[] = [];
  constructor(private readonly results: readonly ProcessResult[]) {}

  exec(command: string, args: readonly string[]): Promise<ProcessResult> {
    this.commands.push({ command, args });
    const result = this.results[this.commands.length - 1];
    if (!result) throw new Error('No process result configured.');
    return Promise.resolve(result);
  }
}
