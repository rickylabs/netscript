interface Args {
  live: boolean;
  promptPath: string | null;
  timeoutMs: number;
  pretty: boolean;
}

const args = parseArgs(Deno.args);
const checks = [
  await runClaude(['--version'], args.timeoutMs),
  await runClaude(['--help'], args.timeoutMs),
  await runClaude(['remote-control', '--help'], args.timeoutMs),
  await runClaude(['agents', '--help'], args.timeoutMs),
];

let liveResult: CommandResult | null = null;
if (args.live) {
  const prompt = args.promptPath ? await Deno.readTextFile(args.promptPath) : smokePrompt();
  liveResult = await runClaude([
    '--bg',
    '--permission-mode',
    'bypassPermissions',
    '--effort',
    'low',
    prompt,
  ], args.timeoutMs);
}

const ok = checks.every((check) => check.code === 0) && (!liveResult || liveResult.code === 0);
const report = {
  gate: 'agentic:smoke-claude-remote',
  ok,
  live: args.live,
  checks,
  liveResult,
};

if (args.pretty) {
  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'FAIL'} claude ${check.args.join(' ')}`);
  }
  if (liveResult) {
    console.log(`${liveResult.ok ? 'OK' : 'FAIL'} claude --bg live smoke`);
    console.log((liveResult.stdout || liveResult.stderr).trim());
  }
} else {
  console.log(JSON.stringify(report));
}

Deno.exit(ok ? 0 : 1);

interface CommandResult {
  args: string[];
  code: number;
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

async function runClaude(args: string[], timeoutMs: number): Promise<CommandResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const output = await new Deno.Command('claude', {
      args,
      stdout: 'piped',
      stderr: 'piped',
      signal: controller.signal,
    }).output();
    const decoder = new TextDecoder();
    return {
      args,
      code: output.code,
      ok: output.code === 0,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
      timedOut: false,
    };
  } catch (error) {
    return {
      args,
      code: 124,
      ok: false,
      stdout: '',
      stderr: String(error),
      timedOut: error instanceof DOMException && error.name === 'AbortError',
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv: string[]): Args {
  let promptPath: string | null = null;
  let timeoutMs = 15_000;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--prompt' && argv[i + 1]) {
      promptPath = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--timeout-ms' && argv[i + 1]) {
      timeoutMs = Number(argv[i + 1]);
      i += 1;
    }
  }
  return {
    live: argv.includes('--live'),
    promptPath,
    timeoutMs,
    pretty: argv.includes('--pretty'),
  };
}

function smokePrompt(): string {
  return [
    'Remote smoke only.',
    'Do not edit files.',
    'Do not run validation.',
    'Reply with exactly CLAUDE_REMOTE_SMOKE_OK and no other prose.',
  ].join(' ');
}
