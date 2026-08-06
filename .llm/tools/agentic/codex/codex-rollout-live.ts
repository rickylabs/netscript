import { basename } from '@std/path';

export type CodexLiveState = 'working' | 'idle' | 'stalled' | 'dead' | 'refused';
export type CodexLiveEventKind =
  | 'started'
  | 'reasoning'
  | 'message'
  | 'command-start'
  | 'command-end'
  | 'file-write'
  | 'failure'
  | 'complete';

export interface CodexLiveEvent {
  readonly timestamp: string | null;
  readonly kind: CodexLiveEventKind;
  readonly summary: string;
  readonly files?: readonly string[];
}

export interface CodexSessionIdentity {
  readonly threadId: string;
  readonly model: string | null;
  readonly effort: string | null;
  readonly cwd: string | null;
}

export interface CodexLiveSnapshot extends CodexSessionIdentity {
  readonly state: CodexLiveState;
  readonly stateLabel: string;
  readonly activityAgeMs: number;
  readonly lastActivityAt: string | null;
  readonly lastReasoning: string | null;
  readonly lastActivity: string | null;
  readonly lastFileWritten: string | null;
  readonly failure: string | null;
}

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const REFUSAL =
  /\brefus(?:e|ed|ing|al)\b|\bcannot (?:help|comply|continue|proceed)\b|\bunable to (?:start|continue|proceed)\b/i;
const MAX_SUMMARY = 240;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function truncateLiveText(value: string, max: number = MAX_SUMMARY): string {
  const oneLine = value.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
}

function commandSummary(payload: Record<string, unknown>): string {
  const name = text(payload.name) ?? 'tool';
  const input = text(payload.arguments) ?? text(payload.input);
  return input ? `${name} ${truncateLiveText(input, 160)}` : name;
}

function commandResultSummary(payload: Record<string, unknown>): string {
  const output = text(payload.output) ?? '';
  const code = output.match(/"(?:exit_code|code)"\s*:\s*(-?\d+)/)?.[1] ??
    output.match(/(?:exit code|exited with code)\s*[:=]?\s*(-?\d+)/i)?.[1];
  return code ? `command finished (exit ${code})` : 'command finished';
}

/** Reduce one trusted JSONL record to the readable live event vocabulary. */
export function parseCodexLiveEvent(line: string): CodexLiveEvent | null {
  let root: Record<string, unknown>;
  try {
    const parsed = record(JSON.parse(line));
    if (!parsed) return null;
    root = parsed;
  } catch {
    return null;
  }
  const payload = record(root.payload) ?? {};
  const type = text(payload.type) ?? text(root.type);
  const timestamp = text(root.timestamp);
  if (!type) return null;

  if (type === 'task_started') return { timestamp, kind: 'started', summary: 'turn started' };
  if (type === 'agent_reasoning') {
    const value = text(payload.text);
    return value ? { timestamp, kind: 'reasoning', summary: truncateLiveText(value) } : null;
  }
  if (type === 'agent_message') {
    const value = text(payload.message);
    return value ? { timestamp, kind: 'message', summary: truncateLiveText(value) } : null;
  }
  if (type === 'function_call' || type === 'custom_tool_call') {
    return { timestamp, kind: 'command-start', summary: commandSummary(payload) };
  }
  if (type === 'function_call_output' || type === 'custom_tool_call_output') {
    return { timestamp, kind: 'command-end', summary: commandResultSummary(payload) };
  }
  if (type === 'patch_apply_end') {
    const changes = record(payload.changes);
    const files = changes ? Object.keys(changes) : [];
    return {
      timestamp,
      kind: 'file-write',
      summary: files.length
        ? `wrote ${files.map((file) => basename(file)).join(', ')}`
        : 'file patch completed',
      files,
    };
  }
  if (type === 'error' || type === 'turn_aborted') {
    const value = text(payload.message) ?? text(payload.reason) ?? text(root.message) ??
      text(root.reason) ?? type;
    return { timestamp, kind: 'failure', summary: truncateLiveText(value) };
  }
  if (type === 'task_complete') {
    return { timestamp, kind: 'complete', summary: 'turn complete' };
  }
  return null;
}

export function parseCodexSessionIdentity(
  jsonl: string,
  rolloutPath: string,
): CodexSessionIdentity {
  let threadId = rolloutPath.match(new RegExp(`(${UUID})\\.jsonl$`))?.[1] ?? 'unknown';
  let model: string | null = null;
  let effort: string | null = null;
  let cwd: string | null = null;
  for (const line of jsonl.split('\n')) {
    try {
      const root = record(JSON.parse(line));
      if (!root) continue;
      const payload = record(root.payload);
      if (!payload) continue;
      if (root.type === 'session_meta') {
        threadId = text(payload.id) ?? text(payload.session_id) ?? threadId;
        cwd = text(payload.cwd) ?? cwd;
      } else if (root.type === 'turn_context') {
        model = text(payload.model) ?? model;
        effort = text(payload.effort) ?? effort;
        cwd = text(payload.cwd) ?? cwd;
      }
    } catch {
      // A bounded tail may begin with one truncated record.
    }
  }
  return { threadId, model, effort, cwd };
}

export function codexLiveEvents(jsonl: string): CodexLiveEvent[] {
  return jsonl.split('\n').map(parseCodexLiveEvent).filter((event): event is CodexLiveEvent =>
    event !== null
  );
}

export function deriveCodexLiveSnapshot(
  jsonl: string,
  rolloutPath: string,
  now: Date = new Date(),
  stalledAfterMs: number = 5 * 60_000,
  fallbackMtime?: Date,
): CodexLiveSnapshot {
  const identity = parseCodexSessionIdentity(jsonl, rolloutPath);
  const events = codexLiveEvents(jsonl);
  let productive = false;
  let failure: string | null = null;
  let refusedMessage = false;
  let complete = false;
  let lastReasoning: string | null = null;
  let lastFileWritten: string | null = null;
  for (const event of events) {
    if (event.kind === 'started') {
      productive = false;
      failure = null;
      refusedMessage = false;
      complete = false;
      continue;
    }
    if (event.kind === 'reasoning') {
      productive = true;
      lastReasoning = event.summary;
    } else if (event.kind === 'command-start' || event.kind === 'file-write') {
      productive = true;
    } else if (event.kind === 'message') {
      refusedMessage = !productive && REFUSAL.test(event.summary);
    } else if (event.kind === 'failure') {
      failure = event.summary;
    } else if (event.kind === 'complete') {
      complete = true;
    }
    if (event.files?.length) lastFileWritten = event.files.at(-1) ?? lastFileWritten;
  }

  const last = events.at(-1);
  const activityAt = last?.timestamp ? new Date(last.timestamp) : fallbackMtime ?? null;
  const validActivityAt = activityAt && Number.isFinite(activityAt.getTime()) ? activityAt : null;
  const activityAgeMs = validActivityAt
    ? Math.max(0, now.getTime() - validActivityAt.getTime())
    : 0;
  let state: CodexLiveState;
  if (failure) state = productive ? 'dead' : 'refused';
  else if (complete && refusedMessage) state = 'refused';
  else if (complete) state = 'idle';
  else state = activityAgeMs >= stalledAfterMs ? 'stalled' : 'working';
  const stateLabel = state === 'stalled' ? `stalled-for-${formatAge(activityAgeMs)}` : state;
  return {
    ...identity,
    state,
    stateLabel,
    activityAgeMs,
    lastActivityAt: validActivityAt?.toISOString() ?? null,
    lastReasoning,
    lastActivity: last?.summary ?? null,
    lastFileWritten,
    failure,
  };
}

export function formatAge(ageMs: number): string {
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s`;
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m`;
  return `${Math.floor(ageMs / 3_600_000)}h`;
}

/** Recursively find the newest rollout file for a thread id under sessionsDir. */
export async function resolveCodexRollout(
  sessionsDir: string,
  threadId: string,
): Promise<string | null> {
  const suffix = `-${threadId}.jsonl`;
  let best: { path: string; mtime: number } | null = null;
  async function walk(dir: string): Promise<void> {
    let entries: Deno.DirEntry[];
    try {
      entries = [...Deno.readDirSync(dir)];
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory) await walk(full);
      else if (entry.isFile && entry.name.startsWith('rollout-') && entry.name.endsWith(suffix)) {
        try {
          const mtime = (await Deno.stat(full)).mtime?.getTime() ?? 0;
          if (!best || mtime > best.mtime) best = { path: full, mtime };
        } catch {
          // The session inventory may race with retention.
        }
      }
    }
  }
  await walk(sessionsDir);
  return best ? (best as { path: string }).path : null;
}

export async function readCodexRolloutTail(path: string, maxBytes = 65_536): Promise<string> {
  const file = await Deno.open(path, { read: true });
  try {
    const { size } = await file.stat();
    const start = Math.max(0, size - maxBytes);
    if (start) await file.seek(start, Deno.SeekMode.Start);
    const bytes = new Uint8Array(size - start);
    let position = 0;
    while (position < bytes.length) {
      const count = await file.read(bytes.subarray(position));
      if (count === null) break;
      position += count;
    }
    return new TextDecoder().decode(bytes.subarray(0, position));
  } finally {
    file.close();
  }
}
