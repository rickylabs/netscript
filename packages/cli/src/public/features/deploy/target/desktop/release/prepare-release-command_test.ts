import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import type { ProcessPort, ProcessResult } from '../../../../../../kernel/ports/process-port.ts';
import { createPrepareReleaseCommand } from './prepare-release-command.ts';

class BsdiffFixtureProcess implements ProcessPort {
  readonly calls: { command: string; args: readonly string[] }[] = [];

  async exec(command: string, args: readonly string[]): Promise<ProcessResult> {
    this.calls.push({ command, args });
    await Deno.writeFile(args[2], new Uint8Array([4, 5, 6]));
    return { code: 0, stdout: '', stderr: '' };
  }
}

Deno.test('release prepare parser invokes exact bsdiff argv and promotes signed envelope', async () => {
  const root = await Deno.makeTempDir();
  try {
    const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey));
    await Deno.writeTextFile(
      join(root, 'key.pem'),
      `-----BEGIN PRIVATE KEY-----\n${pkcs8.toBase64()}\n-----END PRIVATE KEY-----`,
    );
    await Deno.writeFile(join(root, 'old.so'), new Uint8Array([1]));
    await Deno.writeFile(join(root, 'new.so'), new Uint8Array([2]));
    const process = new BsdiffFixtureProcess();
    const output: string[] = [];
    const command = createPrepareReleaseCommand({
      process,
      resolveProjectRoot: () => Promise.resolve(root),
      print: (message) => output.push(message),
    });

    await command.parse([
      '--target',
      'linux-x86_64',
      '--version',
      '2.0.0',
      '--sequence',
      '4',
      '--current-runtime',
      'new.so',
      '--from',
      '1.0.0=old.so',
      '--private-key-file',
      'key.pem',
    ]);

    assertEquals(process.calls.length, 1);
    assertEquals(process.calls[0].command, 'bsdiff');
    assertEquals(process.calls[0].args.slice(0, 2), [join(root, 'old.so'), join(root, 'new.so')]);
    assertEquals(process.calls[0].args[2].endsWith('.bsdiff'), true);
    const manifest = JSON.parse(
      await Deno.readTextFile(join(root, '.deploy', 'desktop', 'releases', 'stable', 'linux-x86_64', 'latest.json')),
    );
    assertEquals(typeof manifest.signed, 'string');
    assertEquals(typeof manifest.signature, 'string');
    assertEquals(JSON.parse(manifest.signed).sequence, 4);
    assertEquals(output.length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
