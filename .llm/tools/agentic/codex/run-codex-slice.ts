/** Supervises one daemon-attached Codex thread until its terminal line contract is met. */
import { classifyCodexFailure } from './classify-codex-failure.ts';
import {
  computeBackoff,
  DEFAULT_SLICE_BUDGETS,
  parseDoneContract,
  remainingBudgetDelay,
} from './run-codex-slice-lib.ts';
import { parseThreadInfo, requireValue, UUID } from '../lib/agentic-lib.ts';
import { LocalSenderOwnershipAdapter } from '../runtime/adapters/local-sender-ownership-adapter.ts';

type SliceState = 'running' | 'done' | 'blocked' | 'budget_exhausted' | 'failed';
interface QuotaEvent {
  turn: number;
  kind: 'quota_exhausted' | 'model_capacity';
  resetAt?: string;
  delayMs: number;
}
interface Options {
  threadId?: string;
  worktree?: string;
  sliceDir?: string;
  message?: string;
  launchArgs: string[];
  maxTurns: number;
  maxWallMs: number;
  dryRun: boolean;
}

function usage(): never {
  console.error(
    'Usage: run-codex-slice.ts --worktree <path> --slice-dir <run-dir> (--thread-id <uuid> | --launch-arg <arg>...) [--message <text>] [--max-turns N] [--max-wall-seconds N] [--dry-run]',
  );
  Deno.exit(2);
}
function args(values: string[]): Options {
  const o: Options = {
    launchArgs: [],
    maxTurns: DEFAULT_SLICE_BUDGETS.maxTurns,
    maxWallMs: DEFAULT_SLICE_BUDGETS.maxWallClockMs,
    dryRun: false,
  };
  for (let i = 0; i < values.length; i++) {
    const flag = values[i];
    if (flag === '--thread-id') o.threadId = requireValue(values, i++, flag);
    else if (flag === '--worktree') o.worktree = requireValue(values, i++, flag);
    else if (flag === '--slice-dir') o.sliceDir = requireValue(values, i++, flag);
    else if (flag === '--message') o.message = requireValue(values, i++, flag);
    else if (flag === '--launch-arg') o.launchArgs.push(requireValue(values, i++, flag));
    else if (flag === '--max-turns') o.maxTurns = Number(requireValue(values, i++, flag));
    else if (flag === '--max-wall-seconds') {
      o.maxWallMs = Number(requireValue(values, i++, flag)) * 1000;
    } else if (flag === '--dry-run') o.dryRun = true;
    else usage();
  }
  if (
    !o.worktree || !o.sliceDir || (!o.threadId && !o.launchArgs.length) || o.maxTurns < 1 ||
    o.maxWallMs < 1
  ) usage();
  return o;
}
async function command(argv: string[], cwd?: string): Promise<{ code: number; output: string }> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: argv,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decode = new TextDecoder();
  return {
    code: result.code,
    output: `${decode.decode(result.stdout)}\n${decode.decode(result.stderr)}`.trim(),
  };
}
async function appendTurn(dir: string, line: string): Promise<void> {
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(`${dir}/codex-thread-ids.md`, `${line}\n`, {
    append: true,
    create: true,
  });
}
async function heartbeat(dir: string, status: unknown): Promise<void> {
  const path = `${dir}/codex-slice-status.json`;
  const tmp = `${path}.${crypto.randomUUID()}.tmp`;
  await Deno.writeTextFile(tmp, `${JSON.stringify(status, null, 2)}\n`);
  await Deno.rename(tmp, path);
}
async function main(): Promise<void> {
  const o = args(Deno.args);
  if (o.threadId && !new RegExp(`^${UUID}$`).test(o.threadId)) usage();
  if (o.dryRun) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: 'dry-run',
        threadId: o.threadId ?? 'launch-result',
        turns: 2,
        lastState: 'done',
        quotaEvents: [{ turn: 1, kind: 'model_capacity', delayMs: 0 }],
        writes: false,
      }),
    );
    return;
  }
  let threadId = o.threadId;
  let firstReply = '';
  if (threadId) {
    const registry = new LocalSenderOwnershipAdapter(
      `${Deno.env.get('HOME') ?? ''}/.config/netscript-agentic/runtime/senders`,
    );
    const owner = await registry.read(o.worktree!);
    if (!owner || owner.sessionId !== threadId) {
      throw new Error('attach refused: sender registry does not own this worktree/thread pair');
    }
  } else {
    const launcher = new URL('./launch-codex-slice.ts', import.meta.url).pathname;
    const launched = await command(['run', '-A', launcher, ...o.launchArgs]);
    firstReply = launched.output;
    threadId = parseThreadInfo(firstReply).threadId ?? undefined;
    if (launched.code !== 0 || !threadId) throw new Error(`launch failed: ${firstReply}`);
  }
  const started = Date.now();
  const quotaEvents: QuotaEvent[] = [];
  let state: SliceState = 'running';
  let reason: string | undefined;
  for (let turn = 1; turn <= o.maxTurns; turn++) {
    const elapsed = Date.now() - started;
    if (elapsed >= o.maxWallMs) {
      state = 'budget_exhausted';
      reason = 'max wall-clock reached';
      break;
    }
    const result = turn === 1 && firstReply ? { code: 0, output: firstReply } : await command([
      'run',
      '--allow-read',
      '--allow-run',
      new URL('./codex-resume.ts', import.meta.url).pathname,
      '--thread-id',
      threadId!,
      '--worktree',
      o.worktree!,
      '--message',
      o.message ??
        'Continue the slice. End the final response with exactly DONE or BLOCKED: <reason>.',
    ]);
    const contract = parseDoneContract(result.output);
    if (contract.state === 'done') state = 'done';
    else if (contract.state === 'blocked') {
      state = 'blocked';
      reason = contract.reason;
    } else if (result.code !== 0) {
      const failure = classifyCodexFailure(result.output);
      const requested = computeBackoff(failure, quotaEvents.length, Date.now());
      if (requested === null) {
        state = 'failed';
        reason = result.output;
      } else {
        const delayMs = remainingBudgetDelay(requested, Date.now() - started, o.maxWallMs);
        if (failure.kind !== 'other') {
          quotaEvents.push({
            turn,
            kind: failure.kind,
            resetAt: failure.kind === 'quota_exhausted' ? failure.resetAt : undefined,
            delayMs,
          });
        }
        await appendTurn(
          o.sliceDir!,
          `- ${
            new Date().toISOString()
          } — thread \`${threadId}\`, turn ${turn}, state retry, delay ${delayMs}ms`,
        );
        await heartbeat(o.sliceDir!, { threadId, turns: turn, lastState: 'running', quotaEvents });
        if (!delayMs) {
          state = 'budget_exhausted';
          reason = 'retry exceeds wall-clock budget';
        } else await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    await appendTurn(
      o.sliceDir!,
      `- ${new Date().toISOString()} — thread \`${threadId}\`, turn ${turn}, state ${state}`,
    );
    await heartbeat(o.sliceDir!, { threadId, turns: turn, lastState: state, reason, quotaEvents });
    if (state !== 'running') {
      console.log(JSON.stringify({ threadId, turns: turn, lastState: state, reason, quotaEvents }));
      Deno.exit(state === 'done' ? 0 : state === 'blocked' ? 3 : 1);
    }
  }
  if (state === 'running') {
    state = 'budget_exhausted';
    reason = 'max turns reached';
  }
  const status = { threadId, turns: o.maxTurns, lastState: state, reason, quotaEvents };
  await heartbeat(o.sliceDir!, status);
  console.log(JSON.stringify(status));
  Deno.exit(4);
}
if (import.meta.main) await main();
