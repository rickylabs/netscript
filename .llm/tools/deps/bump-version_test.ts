import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

async function run(command: string, args: string[], cwd: string) {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

Deno.test('bump-version wrapper preserves native dry-run output', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'netscript-bump-version-' });
  try {
    await Deno.writeTextFile(`${temp}/deno.json`, '{"version":"1.2.3","publish":false}\n');
    const native = await run('deno', ['bump-version', 'patch', '--dry-run'], temp);
    const wrapped = await run(
      'deno',
      [
        'run',
        '--allow-read',
        '--allow-run',
        '--allow-env',
        `${Deno.cwd()}/.llm/tools/deps/bump-version.ts`,
        '--cwd',
        temp,
        '--json',
        'patch',
        '--dry-run',
      ],
      Deno.cwd(),
    );
    const result = JSON.parse(wrapped.stdout) as {
      exitCode: number;
      stdout: string;
      stderr: string;
    };
    assertEquals(wrapped.code, native.code);
    assertEquals(result.exitCode, native.code);
    assertEquals(result.stdout, native.stdout);
    assertEquals(result.stderr, native.stderr);
    assertStringIncludes(result.stdout, '1.2.3 -> 1.2.4');
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});
