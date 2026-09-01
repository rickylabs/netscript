/** Readable live follower for Codex session rollout JSONL. Strictly read-only. */

import { dirname } from '@std/path';
import { requireValue, UUID, wslHome } from '../lib/agentic-lib.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import {
  type CodexLiveEvent,
  codexLiveEvents,
  deriveCodexLiveSnapshot,
  parseCodexLiveEvent,
  resolveCodexRollout,
} from './codex-rollout-live.ts';

type OutputFormat = 'pretty' | 'json';

interface Options {
  readonly threadId?: string;
  readonly rollout?: string;
  readonly sessionsDir: string;
  readonly sinceMs: number;
  readonly format: OutputFormat;
}

function defaultSessionsDir(): string {
  return `${Deno.env.get('HOME') ?? wslHome()}/.codex/sessions`;
}

export function parseSince(value: string): number {
  const match = value.match(/^(\d+)(ms|s|m|h)$/);
  if (!match) throw new Error(`--since must be a duration such as 30s, 5m, or 1h; got '${value}'`);
  const unit = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as 'ms' | 's' | 'm' | 'h'];
  return Number(match[1]) * unit;
}

function parseArgs(args: string[]): Options | null {
  args = normalizeTaskArguments(args);
  let threadId: string | undefined;
  let rollout: string | undefined;
  let sessionsDir = defaultSessionsDir();
  let sinceMs = 5 * 60_000;
  let format: OutputFormat = 'pretty';
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--thread-id') threadId = requireValue(args, index++, arg);
    else if (arg === '--rollout') rollout = requireValue(args, index++, arg);
    else if (arg === '--sessions-dir') sessionsDir = requireValue(args, index++, arg);
    else if (arg === '--since') sinceMs = parseSince(requireValue(args, index++, arg));
    else if (arg === '--format') {
      const value = requireValue(args, index++, arg);
      if (value !== 'pretty' && value !== 'json') {
        throw new Error('--format must be pretty or json');
      }
      format = value;
    } else if (arg === '--help') {
      console.log([
        'Usage:',
        '  deno task agentic:codex-follow --thread-id <uuid> [--since 5m] [--format pretty|json]',
        '  deno task agentic:codex-follow --rollout <path> [--since 5m] [--format pretty|json]',
        '',
        'Streams reasoning, messages, commands, exit status, file writes, failures, and completion.',
      ].join('\n'));
      return null;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!threadId && !rollout) throw new Error('requires --thread-id or --rollout');
  if (threadId && !new RegExp(`^${UUID}$`).test(threadId)) {
    throw new Error(`--thread-id is not a valid uuid: ${threadId}`);
  }
  return { threadId, rollout, sessionsDir, sinceMs, format };
}

export function renderFollowEvent(event: CodexLiveEvent, format: OutputFormat): string {
  if (format === 'json') return JSON.stringify(event);
  const at = event.timestamp ? new Date(event.timestamp).toISOString().slice(11, 19) : '??:??:??';
  const marker = {
    started: 'START',
    reasoning: 'THINK',
    message: 'SAY',
    'command-start': 'RUN',
    'command-end': 'EXIT',
    'file-write': 'WRITE',
    failure: 'DEAD',
    complete: 'IDLE',
  }[event.kind];
  return `${at} ${marker.padEnd(5)} ${event.summary}`;
}

function eventIsRecent(event: CodexLiveEvent, cutoff: number): boolean {
  if (!event.timestamp) return true;
  const timestamp = new Date(event.timestamp).getTime();
  return !Number.isFinite(timestamp) || timestamp >= cutoff;
}

async function main(): Promise<void> {
  let options: Options | null;
  try {
    options = parseArgs(Deno.args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
    return;
  }
  if (!options) return;
  const rollout = options.rollout ?? await resolveCodexRollout(
    options.sessionsDir,
    options.threadId as string,
  );
  if (!rollout) {
    console.error(`codex-follow: no rollout found for thread ${options.threadId}`);
    Deno.exit(1);
  }
  try {
    if (!(await Deno.stat(rollout)).isFile) throw new Error('not a file');
  } catch {
    console.error(`codex-follow: rollout not found: ${rollout}`);
    Deno.exit(1);
  }

  // Arm before the initial read so an append cannot land between snapshot and watch registration.
  const watcher = Deno.watchFs(dirname(rollout), { recursive: false });
  let content = await Deno.readTextFile(rollout);
  let offset = new TextEncoder().encode(content).length;
  let fragment = '';
  const cutoff = Date.now() - options.sinceMs;
  for (const event of codexLiveEvents(content)) {
    if (eventIsRecent(event, cutoff)) console.log(renderFollowEvent(event, options.format));
  }
  const initial = deriveCodexLiveSnapshot(content, rollout);
  if (initial.state === 'idle' || initial.state === 'dead' || initial.state === 'refused') {
    watcher.close();
    return;
  }
  try {
    for await (const change of watcher) {
      if (!change.paths.some((path) => path.replace(/\\/g, '/') === rollout)) continue;
      const file = await Deno.open(rollout, { read: true });
      try {
        const stat = await file.stat();
        if (stat.size < offset) {
          offset = 0;
          fragment = '';
        }
        await file.seek(offset, Deno.SeekMode.Start);
        const bytes = new Uint8Array(stat.size - offset);
        let read = 0;
        while (read < bytes.length) {
          const count = await file.read(bytes.subarray(read));
          if (count === null) break;
          read += count;
        }
        offset += read;
        content = fragment + new TextDecoder().decode(bytes.subarray(0, read));
        const lines = content.split('\n');
        fragment = lines.pop() ?? '';
        for (const line of lines) {
          const event = parseCodexLiveEvent(line);
          if (!event) continue;
          console.log(renderFollowEvent(event, options.format));
          if (event.kind === 'complete' || event.kind === 'failure') return;
        }
      } finally {
        file.close();
      }
    }
  } finally {
    watcher.close();
  }
}

if (import.meta.main) await main();
