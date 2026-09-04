import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';

const HOOK_EVENTS = ['PreToolUse', 'Stop'] as const;
const PROJECT_ROOT_PLACEHOLDER = '${CLAUDE_PROJECT_DIR}';
const HOOK_LOG_ROOT = '.llm/tmp/claude/hooks';
const DECOY_MARKER = 'NETSCRIPT_HOOK_DECOY_REACHED';
const DECOY_EXIT_CODE = 73;
const PROJECT_ROOT = fromFileUrl(new URL('../../../../', import.meta.url));
const RUN_FIXTURE_ROOT = join(PROJECT_ROOT, '.llm/runs');

type HookEvent = (typeof HOOK_EVENTS)[number];

interface CommandHandler {
  type: 'command';
  command: string;
  args?: string[];
}

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function commandHandler(value: unknown, event: HookEvent): CommandHandler {
  assert(isRecord(value), `${event} handler must be an object`);
  assertEquals(value.type, 'command', `${event} handler type`);
  assert(typeof value.command === 'string', `${event} handler command must be a string`);

  let args: string[] | undefined;
  if (value.args !== undefined) {
    assert(Array.isArray(value.args), `${event} handler args must be an array`);
    assert(
      value.args.every((argument) => typeof argument === 'string'),
      `${event} handler args must contain only strings`,
    );
    args = value.args.map((argument) => {
      assert(typeof argument === 'string');
      return argument;
    });
  }

  return {
    type: 'command',
    command: value.command,
    args,
  };
}

async function configuredHandlers(): Promise<Map<HookEvent, CommandHandler>> {
  const settings: unknown = JSON.parse(
    await Deno.readTextFile(join(PROJECT_ROOT, '.claude/settings.json')),
  );
  assert(isRecord(settings), 'settings must be an object');
  assert(isRecord(settings.hooks), 'settings.hooks must be an object');

  const handlers = new Map<HookEvent, CommandHandler>();
  for (const event of HOOK_EVENTS) {
    const matcherGroups = settings.hooks[event];
    assert(Array.isArray(matcherGroups), `${event} must have matcher groups`);
    assertEquals(matcherGroups.length, 1, `${event} matcher group count`);

    const matcherGroup = matcherGroups[0];
    assert(isRecord(matcherGroup), `${event} matcher group must be an object`);
    assert(Array.isArray(matcherGroup.hooks), `${event} hooks must be an array`);
    assertEquals(matcherGroup.hooks.length, 1, `${event} command handler count`);
    handlers.set(event, commandHandler(matcherGroup.hooks[0], event));
  }
  return handlers;
}

const HANDLERS = await configuredHandlers();

function handlerFor(event: HookEvent): CommandHandler {
  const handler = HANDLERS.get(event);
  assert(handler, `missing ${event} command handler`);
  return handler;
}

function substituteProjectRoot(value: string): string {
  return value.replaceAll(PROJECT_ROOT_PLACEHOLDER, PROJECT_ROOT);
}

async function runHandler(
  event: HookEvent,
  cwd: string,
  runId: string,
  fixtureCase: string,
): Promise<CommandResult> {
  const handler = handlerFor(event);
  const payload = JSON.stringify({
    hook_event_name: event,
    fixture_case: fixtureCase,
  });
  const options: Deno.CommandOptions = {
    cwd,
    env: {
      CLAUDE_PROJECT_DIR: PROJECT_ROOT,
      NETSCRIPT_RUN_ID: runId,
      CLAUDE_SESSION_ID: 'issue-1774-fixture',
    },
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  };
  const command = handler.args === undefined
    ? new Deno.Command('bash', {
      ...options,
      args: ['-c', substituteProjectRoot(handler.command)],
    })
    : new Deno.Command(substituteProjectRoot(handler.command), {
      ...options,
      args: handler.args.map(substituteProjectRoot),
    });
  const child = command.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(payload));
  await writer.close();
  const output = await child.output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

function fixtureRunId(event: HookEvent, fixtureCase: string): string {
  return `issue-1774-${event.toLowerCase()}-${fixtureCase}-${crypto.randomUUID()}`;
}

function eventLogPath(runId: string): string {
  return join(PROJECT_ROOT, HOOK_LOG_ROOT, runId, 'events.jsonl');
}

async function removeFixtureLog(runId: string): Promise<void> {
  await Deno.remove(join(PROJECT_ROOT, HOOK_LOG_ROOT, runId), { recursive: true }).catch(
    (error: unknown) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    },
  );
}

async function assertLaunchRootRecord(runId: string, event: HookEvent): Promise<void> {
  const lines = (await Deno.readTextFile(eventLogPath(runId))).trim().split('\n');
  assertEquals(lines.length, 1, `${event} event-log line count`);
  const record: unknown = JSON.parse(lines[0]);
  assert(isRecord(record), `${event} event-log record must be an object`);
  assert(isRecord(record.event), `${event} event payload must be an object`);
  assertEquals(record.event.hook_event_name, event);
}

async function assertConfiguredSuccess(
  event: HookEvent,
  cwd: string,
  fixtureCase: string,
): Promise<void> {
  const runId = fixtureRunId(event, fixtureCase);
  try {
    const result = await runHandler(event, cwd, runId, fixtureCase);
    assertEquals(result.code, 0, `${event} ${fixtureCase}: ${result.stderr}`);
    assertEquals(result.stdout, '', `${event} ${fixtureCase} stdout`);
    assertEquals(result.stderr, '', `${event} ${fixtureCase} stderr`);
    await assertLaunchRootRecord(runId, event);
  } finally {
    await removeFixtureLog(runId);
  }
}

for (const event of HOOK_EVENTS) {
  Deno.test(`${event} configured hook succeeds from the session launch root`, async () => {
    await assertConfiguredSuccess(event, PROJECT_ROOT, 'launch-root');
  });

  Deno.test(`${event} configured hook succeeds from a nested run cwd`, async () => {
    const nestedRunCwd = await Deno.makeTempDir({
      dir: RUN_FIXTURE_ROOT,
      prefix: 'claude-hook-log-test-',
    });
    try {
      await assertConfiguredSuccess(event, nestedRunCwd, 'nested-run-cwd');
    } finally {
      await Deno.remove(nestedRunCwd, { recursive: true });
    }
  });

  Deno.test(`${event} configured hook distinguishes launch root from a cwd decoy`, async () => {
    const runId = fixtureRunId(event, 'temp-decoy');
    const decoyCwd = await Deno.makeTempDir({ prefix: 'netscript-hook-decoy-' });
    assert(
      !decoyCwd.split(/[\\/]+/).includes('worktrees'),
      `decoy must not be created under worktrees: ${decoyCwd}`,
    );
    const decoyLogger = join(
      decoyCwd,
      '.llm/tools/agentic/claude/claude-hook-log.ts',
    );
    try {
      await Deno.mkdir(dirname(decoyLogger), { recursive: true });
      await Deno.writeTextFile(
        decoyLogger,
        `console.error('${DECOY_MARKER}');\nDeno.exit(${DECOY_EXIT_CODE});\n`,
      );

      const handler = handlerFor(event);
      const result = await runHandler(event, decoyCwd, runId, 'temp-decoy');
      if (handler.args === undefined) {
        assertEquals(result.code, DECOY_EXIT_CODE, `${event} RED decoy exit`);
        assertStringIncludes(result.stderr, DECOY_MARKER, `${event} RED decoy marker`);
      } else {
        assertEquals(result.code, 0, `${event} GREEN decoy: ${result.stderr}`);
        assert(!result.stderr.includes(DECOY_MARKER), `${event} GREEN bypasses decoy`);
        await assertLaunchRootRecord(runId, event);
      }
    } finally {
      await removeFixtureLog(runId);
      await Deno.remove(decoyCwd, { recursive: true });
    }
  });

  Deno.test(`${event} configured hook uses the bounded permission contract`, () => {
    const handler = handlerFor(event);
    if (handler.args === undefined) {
      assertStringIncludes(
        handler.command,
        '.llm/tools/agentic/claude/claude-hook-log.ts',
        `${event} current relative logger path`,
      );
      return;
    }
    assertEquals(handler.command, 'deno');
    assertEquals(handler.args, [
      'run',
      '--no-lock',
      '--no-prompt',
      '--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID',
      '--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks',
      '${CLAUDE_PROJECT_DIR}/.llm/tools/agentic/claude/claude-hook-log.ts',
    ]);
  });
}

Deno.test('owned Claude hook files contain no host-specific home path', async () => {
  const forbiddenPaths = [
    ['', 'home', 'agent'].join('/'),
    ['', 'home', 'codex'].join('/'),
  ];
  const ownedFiles = [
    '.claude/settings.json',
    'deno.json',
    '.llm/tools/agentic/claude/claude-hook-log.ts',
    '.llm/tools/agentic/claude/claude-hook-log_test.ts',
    '.llm/tools/agentic/claude/validate-claude-surface.ts',
    '.llm/tools/agentic/README.md',
  ];
  for (const file of ownedFiles) {
    const content = await Deno.readTextFile(join(PROJECT_ROOT, file));
    for (const forbiddenPath of forbiddenPaths) {
      assert(!content.includes(forbiddenPath), `${file} contains a host-specific home path`);
    }
  }
});
