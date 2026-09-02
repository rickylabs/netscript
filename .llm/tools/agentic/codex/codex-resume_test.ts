import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

const CODEX_RESUME = fromFileUrl(new URL('./codex-resume.ts', import.meta.url));
const TEST_TMP = fromFileUrl(new URL('../../../tmp/', import.meta.url));
const THREAD_ID = '019f4b72-2ea4-7050-917e-6d6918371265';
const ACTIVE_WRITER_REJECTION = 'thread-store conflict: already has an active writer';

interface ResumeResult {
  readonly code: number;
  readonly output: string;
  readonly invocation: string;
}

async function runResumeBehindFakeBash(fakeOutput: string): Promise<ResumeResult> {
  await Deno.mkdir(TEST_TMP, { recursive: true });
  const root = await Deno.makeTempDir({
    dir: TEST_TMP,
    prefix: 'netscript-codex-resume-',
  });
  const fakeBin = join(root, 'bin');
  const fakeBash = join(fakeBin, 'bash');
  const trace = join(root, 'bash-invocation.txt');
  const configuredHome = Deno.env.get('HOME');
  assert(
    configuredHome,
    'HOME must be present so the production sender root can be forbidden',
  );
  const productionSenderRoot = join(
    configuredHome,
    '.config',
    'netscript-agentic',
    'runtime',
    'senders',
  );
  assert(
    !root.startsWith(productionSenderRoot),
    `resume fixture must not use the production sender root: ${root}`,
  );

  try {
    await Deno.mkdir(fakeBin);
    await Deno.writeTextFile(
      fakeBash,
      [
        '#!/bin/sh',
        'printf \'%s\\n\' "$@" > "$NETSCRIPT_CODEX_RESUME_TRACE"',
        'printf \'%s\\n\' "$NETSCRIPT_CODEX_RESUME_FAKE_OUTPUT"',
        'exit 0',
        '',
      ].join('\n'),
    );
    await Deno.chmod(fakeBash, 0o700);

    const currentUser = Deno.env.get('USER') ?? Deno.env.get('LOGNAME');
    assert(currentUser, 'the wrapper fixture requires the current Linux username');
    const originalPath = Deno.env.get('PATH');
    Deno.env.set('PATH', fakeBin);
    let result: Deno.CommandOutput;
    try {
      result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--no-lock',
          '--allow-read',
          '--allow-run',
          '--allow-env',
          CODEX_RESUME,
          '--thread-id',
          THREAD_ID,
          '--message',
          'test-owned fixture; do not deliver',
          '--user',
          currentUser,
        ],
        env: {
          ...Deno.env.toObject(),
          PATH: fakeBin,
          NETSCRIPT_CODEX_RESUME_FAKE_OUTPUT: fakeOutput,
          NETSCRIPT_CODEX_RESUME_TRACE: trace,
        },
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    } finally {
      if (originalPath === undefined) Deno.env.delete('PATH');
      else Deno.env.set('PATH', originalPath);
    }
    const decoder = new TextDecoder();
    const output = `${decoder.decode(result.stdout)}${decoder.decode(result.stderr)}`;
    const invocation = await Deno.readTextFile(trace).catch((error: unknown) => {
      throw new Error(
        `fake bash was not invoked: ${String(error)}; wrapper output: ${output}`,
      );
    });
    assertStringIncludes(invocation, '-lc');
    assertStringIncludes(invocation, `codex exec resume ${THREAD_ID}`);
    return { code: result.code, output, invocation };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('codex resume returns non-zero when the real wrapper receives an active-writer rejection', async () => {
  const result = await runResumeBehindFakeBash(ACTIVE_WRITER_REJECTION);

  assertStringIncludes(result.output, ACTIVE_WRITER_REJECTION);
  assertEquals(result.code, 1);
});

Deno.test('codex resume keeps an accepted child result at exit zero', async () => {
  const result = await runResumeBehindFakeBash('resume accepted');

  assertStringIncludes(result.output, 'resume accepted');
  assertEquals(result.code, 0);
});
