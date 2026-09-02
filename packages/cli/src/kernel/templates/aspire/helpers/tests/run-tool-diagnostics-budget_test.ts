import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';

const MAX_PERSISTED_DETAIL_BYTES = 16 * 1024;

interface DiagnosticResult {
  readonly message: string;
  readonly actionableStderr: readonly string[];
  readonly actionableStdout: readonly string[];
}

function parseDiagnosticResult(text: string): DiagnosticResult {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected a database command result object.');
  }
  const message = Reflect.get(parsed, 'message');
  const actionableStderr = Reflect.get(parsed, 'actionableStderr');
  const actionableStdout = Reflect.get(parsed, 'actionableStdout');
  if (
    typeof message !== 'string' || !Array.isArray(actionableStderr) ||
    !actionableStderr.every((line) => typeof line === 'string') ||
    !Array.isArray(actionableStdout) ||
    !actionableStdout.every((line) => typeof line === 'string')
  ) {
    throw new Error('Expected bounded database command diagnostic streams.');
  }
  return { message, actionableStderr, actionableStdout };
}

function flattenDiagnosticResult(result: DiagnosticResult): string {
  const diagnostics = [...result.actionableStderr, ...result.actionableStdout];
  const messageIndex = diagnostics.indexOf(result.message);
  return [result.message, ...diagnostics.filter((_, index) => index !== messageIndex)].join(' | ');
}

Deno.test('run-tool shares one persisted byte budget across flooded diagnostic streams', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-run-tool-combined-cap-' });
  const runnerPath = join(root, 'run-tool.mts');
  const errorPath = join(root, 'combined.error');
  const requestPath = join(root, 'seed.request.json');
  const resultPath = join(root, 'seed.result.json');
  try {
    const template = await Deno.readTextFile(
      new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
    );
    const stderrLines = Array.from(
      { length: 32 },
      (_, index) => `stderr ${index + 1}: Failure ${'s'.repeat(1_000)}`,
    );
    const stdoutLines = Array.from(
      { length: 32 },
      (_, index) => `stdout ${index + 1}: Error ${'o'.repeat(1_000)}`,
    );
    await Promise.all([
      Deno.writeTextFile(runnerPath, template),
      Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          tasks: {
            'db:seed:combined-cap': 'deno run --allow-all combined-failure.ts',
          },
        }),
      ),
      Deno.writeTextFile(
        join(root, 'combined-failure.ts'),
        `await Deno.stderr.write(new TextEncoder().encode(${
          JSON.stringify(`${stderrLines.join('\n')}\n`)
        }));
await Deno.stdout.write(new TextEncoder().encode(${JSON.stringify(`${stdoutLines.join('\n')}\n`)}));
Deno.exit(16);
`,
      ),
      Deno.writeTextFile(
        requestPath,
        JSON.stringify({
          NETSCRIPT_PRISMA_OPERATION: 'seed',
          NETSCRIPT_DB_RESULT_FILE: resultPath,
        }),
      ),
    ]);

    const [errorOutput, requestOutput] = await Promise.all([
      new Deno.Command(Deno.execPath(), {
        args: ['run', '--allow-all', runnerPath, errorPath, 'db:seed:combined-cap'],
        cwd: root,
        stdout: 'piped',
        stderr: 'piped',
      }).output(),
      new Deno.Command(Deno.execPath(), {
        args: ['run', '--allow-all', runnerPath, '--request', requestPath, 'combined-cap'],
        cwd: root,
        stdout: 'piped',
        stderr: 'piped',
      }).output(),
    ]);
    const encoder = new TextEncoder();
    const persistedError = await Deno.readTextFile(errorPath);
    const persistedResult = await Deno.readTextFile(resultPath);
    const result = parseDiagnosticResult(persistedResult);
    const flattenedMessage = flattenDiagnosticResult(result);
    const errorBytes = encoder.encode(persistedError).byteLength;
    const resultBytes = encoder.encode(persistedResult).byteLength;
    const flattenedBytes = encoder.encode(flattenedMessage).byteLength;

    assertEquals(errorOutput.code, 16);
    assertEquals(requestOutput.code, 16);
    assertEquals(result.actionableStderr.length, 32);
    assertEquals(result.actionableStdout.length, 32);
    assert(
      errorBytes <= MAX_PERSISTED_DETAIL_BYTES &&
        resultBytes <= MAX_PERSISTED_DETAIL_BYTES &&
        flattenedBytes <= MAX_PERSISTED_DETAIL_BYTES,
      `combined diagnostics exceeded the ${MAX_PERSISTED_DETAIL_BYTES}-byte budget: ` +
        `error=${errorBytes}, result=${resultBytes}, flattened=${flattenedBytes}`,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('run-tool selects failure-shaped diagnostics in observed cross-stream order', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-run-tool-stream-order-' });
  const runnerPath = join(root, 'run-tool.mts');
  const requestPath = join(root, 'seed.request.json');
  const resultPath = join(root, 'seed.result.json');
  const failure = 'Error: the requested operation failed.';
  const laterInformation = 'Error reporting is unavailable in this environment.';
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
            'db:seed:stream-order': 'deno run --allow-all ordered-failure.ts',
          },
        }),
      ),
      Deno.writeTextFile(
        join(root, 'ordered-failure.ts'),
        `await Deno.stdout.write(new TextEncoder().encode(${JSON.stringify(`${failure}\n`)}));
await new Promise((resolve) => setTimeout(resolve, 50));
await Deno.stderr.write(new TextEncoder().encode(${JSON.stringify(`${laterInformation}\n`)}));
Deno.exit(16);
`,
      ),
      Deno.writeTextFile(
        requestPath,
        JSON.stringify({
          NETSCRIPT_PRISMA_OPERATION: 'seed',
          NETSCRIPT_DB_RESULT_FILE: resultPath,
        }),
      ),
    ]);

    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-all', runnerPath, '--request', requestPath, 'stream-order'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const result = parseDiagnosticResult(await Deno.readTextFile(resultPath));

    assertEquals(output.code, 16);
    assertEquals(result.message, failure);
    assertEquals(result.actionableStderr, [laterInformation]);
    assertEquals(result.actionableStdout, [failure]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
