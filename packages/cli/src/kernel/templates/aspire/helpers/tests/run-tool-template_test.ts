import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';

const ACTIONABLE_SEED_ERROR = 'Seed cause: required fixture users.json was not found.';
const ANSI_TASK_BANNER =
  '\u001b[0G\u001b[2K\u001b[JTask db:seed:postgres deno task db:seed\u001b[0m';

Deno.test('run-tool persists actionable seed stderr after an ANSI task banner', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-run-tool-ansi-' });
  const runnerPath = join(root, 'run-tool.mts');
  const errorPath = join(root, 'seed.error');
  try {
    const template = await Deno.readTextFile(
      new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
    );
    await Promise.all([
      Deno.writeTextFile(runnerPath, template),
      Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          tasks: {
            'db:seed:postgres': 'deno run --allow-all seed-failure.ts',
          },
        }),
      ),
      Deno.writeTextFile(
        join(root, 'seed-failure.ts'),
        `const detail = ${JSON.stringify(`${ANSI_TASK_BANNER}\n${ACTIONABLE_SEED_ERROR}\n`)};
await Deno.stderr.write(new TextEncoder().encode(detail));
Deno.exit(16);
`,
      ),
    ]);

    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-all', runnerPath, errorPath, 'db:seed:postgres'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(output.stderr);

    assertEquals(output.code, 16);
    assertStringIncludes(stderr, ANSI_TASK_BANNER);
    assertStringIncludes(stderr, ACTIONABLE_SEED_ERROR);
    assertEquals((await Deno.readTextFile(errorPath)).trim(), ACTIONABLE_SEED_ERROR);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('run-tool retains structured identifiers beyond the actionable stderr head', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-run-tool-structured-' });
  const runnerPath = join(root, 'run-tool.mts');
  const errorPath = join(root, 'structured.error');
  try {
    const template = await Deno.readTextFile(
      new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
    );
    const actionableLines = [
      'Error: database seed failed',
      'Invalid prisma.user.findFirst() invocation:',
      ...Array.from({ length: 36 }, (_, index) => `generated context line ${index + 1}`),
      '"code": "P2022",',
      '"meta": { "modelName": "User", "column": "missing_column" }',
    ];
    await Promise.all([
      Deno.writeTextFile(runnerPath, template),
      Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          tasks: {
            'db:seed:structured': 'deno run --allow-all structured-failure.ts',
          },
        }),
      ),
      Deno.writeTextFile(
        join(root, 'structured-failure.ts'),
        `const detail = ${JSON.stringify(`${actionableLines.join('\n')}\n`)};
await Deno.stderr.write(new TextEncoder().encode(detail));
Deno.exit(16);
`,
      ),
    ]);

    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-all', runnerPath, errorPath, 'db:seed:structured'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const persisted = (await Deno.readTextFile(errorPath)).trim();
    const retainedLines = persisted.split('\n');

    assertEquals(output.code, 16);
    assertEquals(retainedLines.length, 32);
    assertEquals(retainedLines[0], 'Error: database seed failed');
    assertStringIncludes(persisted, '"code": "P2022"');
    assertStringIncludes(persisted, '"meta": { "modelName": "User"');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('run-tool bounds persisted actionable stderr by UTF-8 bytes', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-run-tool-byte-cap-' });
  const runnerPath = join(root, 'run-tool.mts');
  const errorPath = join(root, 'byte-cap.error');
  try {
    const template = await Deno.readTextFile(
      new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
    );
    await Promise.all([
      Deno.writeTextFile(runnerPath, template),
      Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          tasks: {
            'db:seed:byte-cap': 'deno run --allow-all byte-cap-failure.ts',
          },
        }),
      ),
      Deno.writeTextFile(
        join(root, 'byte-cap-failure.ts'),
        `await Deno.stderr.write(new TextEncoder().encode('Failure: ${
          '界'.repeat(10_000)
        } code=P2022\\n'));
Deno.exit(16);
`,
      ),
    ]);

    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-all', runnerPath, errorPath, 'db:seed:byte-cap'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const persisted = (await Deno.readTextFile(errorPath)).trim();

    assertEquals(output.code, 16);
    assertEquals(new TextEncoder().encode(persisted).byteLength <= 16 * 1024, true);
    assertStringIncludes(persisted, 'code=P2022');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
