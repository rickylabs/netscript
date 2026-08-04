import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { LOOPBACK_HOST } from '../config/endpoints.ts';
import { type ClaudePrintChild, type ClaudePrintSpawn, runClaudePrint } from './claude-print.ts';
import {
  claudePrintOptionsFor,
  openRouterClaudeEnvironment,
  parseOpenRouterRunArguments,
} from './openrouter-run.ts';

const OPAQUE_KEY = 'opaque-openrouter-credential';

/** A parent environment carrying rival credentials and cached-login route state. */
function parentEnvironment(): Record<string, string> {
  return {
    HOME: '/home/test',
    PATH: '/usr/bin',
    OPENROUTER_API_KEY: OPAQUE_KEY,
    OPENAI_API_KEY: 'opaque-rival-openai',
    ANTHROPIC_API_KEY: 'opaque-cached-anthropic',
    ANTHROPIC_BASE_URL: 'https://caller.example/override',
    CLAUDE_CONFIG_DIR: '/home/test/.claude',
  };
}

function unreadableFile(): (path: string) => Promise<string> {
  return () => Promise.reject(new Error('credential file must not be read'));
}

async function writtenPromptFile(): Promise<string> {
  const path = await Deno.makeTempFile({ suffix: '.md' });
  await Deno.writeTextFile(path, 'evaluate this');
  return path;
}

/** Builds a fake child whose status is resolved by the test or by a kill. */
function fakeChild(
  options: { readonly code?: number; readonly stdout?: ReadableStream<Uint8Array> } = {},
): {
  readonly child: ClaudePrintChild;
  readonly signals: Deno.Signal[];
} {
  const signals: Deno.Signal[] = [];
  let settle: (status: Deno.CommandStatus) => void = () => {};
  const status = new Promise<Deno.CommandStatus>((resolve) => {
    settle = resolve;
  });
  const exit = (code: number) =>
    settle({ code, success: code === 0, signal: null } as Deno.CommandStatus);
  if (options.code !== undefined) exit(options.code);
  return {
    child: {
      status,
      ...(options.stdout ? { stdout: options.stdout } : {}),
      kill: (signal) => {
        signals.push(signal ?? 'SIGTERM');
        exit(143);
      },
    },
    signals,
  };
}

Deno.test('OpenRouter launcher parses the full flag surface', () => {
  assertEquals(
    parseOpenRouterRunArguments([
      '--model',
      'open/model',
      '--effort',
      'high',
      '--prompt',
      '/tmp/prompt.md',
      '--resume',
      'session-id',
      '--output',
      '/tmp/result.json',
    ]),
    {
      model: 'open/model',
      effort: 'high',
      prompt: '/tmp/prompt.md',
      resume: 'session-id',
      output: '/tmp/result.json',
    },
  );
});

Deno.test('OpenRouter launcher omits absent optional flags rather than passing undefined', () => {
  assertEquals(
    parseOpenRouterRunArguments(['--model', 'open/model', '--effort', 'xhigh', '--prompt', '/p']),
    { model: 'open/model', effort: 'xhigh', prompt: '/p' },
  );
});

Deno.test('OpenRouter launcher rejects a missing model, prompt, or unknown effort', () => {
  for (
    const args of [
      ['--effort', 'high', '--prompt', '/p'],
      ['--model', 'open/model', '--prompt', '/p'],
      ['--model', 'open/model', '--effort', 'high'],
      ['--model', 'open/model', '--effort', 'turbo', '--prompt', '/p'],
    ]
  ) {
    assertThrows(() => parseOpenRouterRunArguments(args), Error, 'Usage: claude-openrouter');
  }
});

Deno.test('a typo fails loudly instead of silently dropping the requested artifact', () => {
  assertThrows(
    () =>
      parseOpenRouterRunArguments([
        '--model',
        'open/model',
        '--effort',
        'high',
        '--prompt',
        '/p',
        '--ouptut',
        'result.json',
      ]),
    Error,
    'Unknown argument: --ouptut',
  );
});

Deno.test('duplicate and value-less flags are rejected before any request', () => {
  assertThrows(
    () =>
      parseOpenRouterRunArguments([
        '--model',
        'a/b',
        '--model',
        'c/d',
        '--effort',
        'high',
        '--prompt',
        '/p',
      ]),
    Error,
    'Duplicate argument: --model',
  );
  assertThrows(
    () => parseOpenRouterRunArguments(['--model', '--effort', 'high', '--prompt', '/p']),
    Error,
    '--model requires a value',
  );
});

Deno.test('the launcher route always enables the open-evaluator model guard', () => {
  assertEquals(
    claudePrintOptionsFor({ model: 'open/model', effort: 'high', prompt: '/p' })
      .enforceOpenEvaluatorModels,
    true,
  );
  assertEquals(
    claudePrintOptionsFor({ model: 'open/model', effort: 'high', prompt: '/p', resume: 's' })
      .enforceOpenEvaluatorModels,
    true,
  );
});

Deno.test('the child environment binds the credential and clears every rival key', async () => {
  const env = await openRouterClaudeEnvironment(
    parentEnvironment(),
    unreadableFile(),
    '/home/test/worktree',
  );

  assertEquals(env.ANTHROPIC_AUTH_TOKEN, OPAQUE_KEY);
  // Rival provider credentials and the source key are gone, not merely shadowed.
  assertEquals(env.OPENAI_API_KEY, undefined);
  assertEquals(env.OPENROUTER_API_KEY, undefined);
  // Cached native Claude auth is emptied and its config cache is isolated.
  assertEquals(env.ANTHROPIC_API_KEY, '');
  assertEquals(
    env.CLAUDE_CONFIG_DIR,
    '/home/test/.config/netscript-agentic/runtime/claude-openrouter',
  );
  // Unrelated parent entries survive so the child can still run.
  assertEquals(env.PATH, '/usr/bin');
  // The caller's base URL is replaced by the profile's gateway value.
  assert(env.ANTHROPIC_BASE_URL !== 'https://caller.example/override');
});

Deno.test('building the child environment never mutates the parent map', async () => {
  const parent = parentEnvironment();
  const snapshot = { ...parent };
  await openRouterClaudeEnvironment(parent, unreadableFile(), '/home/test/worktree');
  assertEquals(parent, snapshot);
});

Deno.test('the credential file supplies the child auth token when nothing is exported', async () => {
  const read: string[] = [];
  const env = await openRouterClaudeEnvironment(
    { HOME: '/home/test', PATH: '/usr/bin' },
    (path) => {
      read.push(path);
      return Promise.resolve(`# comment\nexport OPENROUTER_API_KEY='${OPAQUE_KEY}'\n`);
    },
    '/home/test/worktree',
  );
  assertEquals(env.ANTHROPIC_AUTH_TOKEN, OPAQUE_KEY);
  assertEquals(read.length, 1);
  assert(read[0].startsWith('/home/test/'));
});

Deno.test('a missing credential fails with an actionable, key-free error', async () => {
  await assertRejects(
    () => openRouterClaudeEnvironment({}, () => Promise.resolve('')),
    Error,
    'HOME is unavailable',
  );
  await assertRejects(
    () =>
      openRouterClaudeEnvironment(
        { HOME: '/home/test' },
        () => Promise.reject(new Error('No such file or directory')),
      ),
    Error,
    'could not be read',
  );
  const error = await assertRejects(
    () => openRouterClaudeEnvironment({ HOME: '/home/test' }, () => Promise.resolve('# empty\n')),
    Error,
    'is missing from',
  );
  assert(!error.message.includes(OPAQUE_KEY));
});

Deno.test('the spawned child receives the isolated environment and never the key in argv', async () => {
  const prompt = await writtenPromptFile();
  let captured: Parameters<ClaudePrintSpawn>[1] | undefined;
  const fake = fakeChild({ code: 0 });
  const code = await runClaudePrint(
    { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: false },
    {
      env: await openRouterClaudeEnvironment(parentEnvironment(), unreadableFile(), '/home/test/w'),
      clearEnv: true,
      spawn: (_executable, options) => {
        captured = options;
        return fake.child;
      },
    },
  );

  assertEquals(code, 0);
  assert(captured);
  assertEquals(captured.clearEnv, true);
  assertEquals(captured.env.ANTHROPIC_AUTH_TOKEN, OPAQUE_KEY);
  assertEquals(captured.env.OPENROUTER_API_KEY, undefined);
  assertEquals(captured.env.OPENAI_API_KEY, undefined);
  assert(!captured.args.some((argument) => argument.includes(OPAQUE_KEY)));
});

Deno.test('an ordinary child exit code is returned unchanged', async () => {
  const prompt = await writtenPromptFile();
  const fake = fakeChild({ code: 37 });
  assertEquals(
    await runClaudePrint(
      { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: false },
      { spawn: () => fake.child },
    ),
    37,
  );
});

Deno.test('the guard base URL overrides a caller-supplied route variable', async () => {
  const prompt = await writtenPromptFile();
  let captured: Parameters<ClaudePrintSpawn>[1] | undefined;
  const fake = fakeChild({ code: 0 });
  await runClaudePrint(
    { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: true },
    {
      env: { ANTHROPIC_BASE_URL: 'https://caller.example/override' },
      spawn: (_executable, options) => {
        captured = options;
        return fake.child;
      },
    },
  );
  assert(captured);
  assertStringIncludes(captured.env.ANTHROPIC_BASE_URL, LOOPBACK_HOST);
});

Deno.test('a denied model terminates the child and exits with the guard code', async () => {
  const prompt = await writtenPromptFile();
  const fake = fakeChild();
  const code = await runClaudePrint(
    { model: 'closed/model', effort: 'high', prompt, enforceOpenEvaluatorModels: true },
    {
      spawn: (_executable, options) => {
        // Stand in for the child's first model-bearing request.
        void fetch(`${options.env.ANTHROPIC_BASE_URL}/v1/messages`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'closed/model' }),
        }).catch(() => undefined);
        return fake.child;
      },
    },
  );
  assertEquals(code, 78);
  assertEquals(fake.signals[0], 'SIGTERM');
});

Deno.test('tee success writes the stream to the file and preserves the exit code', async () => {
  const prompt = await writtenPromptFile();
  const output = await Deno.makeTempFile({ suffix: '.json' });
  const stdout = ReadableStream.from([
    new TextEncoder().encode('{"type":"result"'),
    new TextEncoder().encode(',"ok":true}'),
  ]);
  const fake = fakeChild({ code: 5, stdout });
  const code = await runClaudePrint(
    { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: false },
    { teePath: output, spawn: () => fake.child },
  );
  assertEquals(code, 5);
  assertEquals(await Deno.readTextFile(output), '{"type":"result","ok":true}');
});

Deno.test('an unwritable tee destination fails before the child is ever spawned', async () => {
  const prompt = await writtenPromptFile();
  let spawned = false;
  await assertRejects(() =>
    runClaudePrint(
      { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: false },
      {
        teePath: '/nonexistent-directory/result.json',
        spawn: () => {
          spawned = true;
          return fakeChild({ code: 0 }).child;
        },
      },
    )
  );
  assertEquals(spawned, false);
});

Deno.test('a tee stream failure reaps the child instead of abandoning it', async () => {
  const prompt = await writtenPromptFile();
  const output = await Deno.makeTempFile({ suffix: '.json' });
  const stdout = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(new Error('stream broke mid-turn'));
    },
  });
  const fake = fakeChild({ stdout });
  await assertRejects(
    () =>
      runClaudePrint(
        { model: 'open/model', effort: 'high', prompt, enforceOpenEvaluatorModels: false },
        { teePath: output, spawn: () => fake.child },
      ),
    Error,
    'stream broke mid-turn',
  );
  assertEquals(fake.signals[0], 'SIGTERM');
});
