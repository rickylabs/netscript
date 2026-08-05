import { type CodexLiveState, formatAge, truncateLiveText } from './codex-rollout-live.ts';

export interface AgyAgentSnapshot {
  readonly runtime: 'agy';
  readonly conversationId: string;
  readonly worktree: string;
  readonly transcript: string;
  readonly state: CodexLiveState;
  readonly stateLabel: string;
  readonly activityAgeMs: number;
  readonly lastActivityAt: string | null;
  readonly currentStep: string | null;
  readonly issue: string | null;
  readonly lastNonZeroExit: { readonly code: number; readonly step: number | null } | null;
  readonly lastFileWritten: string | null;
}

interface AgyRecord {
  readonly type: string;
  readonly status: string | null;
  readonly createdAt: string | null;
  readonly step: number | null;
  readonly content: string | null;
  readonly thinking: string | null;
  readonly exitCode: number | null;
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function string(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseRecord(line: string): AgyRecord | null {
  try {
    const value = object(JSON.parse(line));
    if (!value || typeof value.type !== 'string') return null;
    return {
      type: value.type,
      status: string(value.status),
      createdAt: string(value.created_at),
      step: typeof value.step_index === 'number' ? value.step_index : null,
      content: string(value.content),
      thinking: string(value.thinking),
      exitCode: typeof value.exit_code === 'number' ? value.exit_code : null,
    };
  } catch {
    return null;
  }
}

function fileFromContent(content: string | null): string | null {
  if (!content) return null;
  return content.match(/file:\/\/(\/[^)\s]+\.[A-Za-z0-9]+)/)?.[1] ??
    content.match(/(?:^|[\s`'"(])(\/[\w./-]+\.[A-Za-z0-9]+)(?:[\s`'"),]|$)/m)?.[1] ?? null;
}

export function deriveAgySnapshot(
  transcript: string,
  conversationId: string,
  worktree: string,
  transcriptPath: string,
  now: Date = new Date(),
  stalledAfterMs: number = 5 * 60_000,
  fallbackMtime?: Date,
): AgyAgentSnapshot {
  const records = transcript.split('\n').map(parseRecord).filter((entry): entry is AgyRecord =>
    entry !== null
  );
  const last = records.at(-1);
  const at = last?.createdAt ? new Date(last.createdAt) : fallbackMtime ?? null;
  const validAt = at && Number.isFinite(at.getTime()) ? at : null;
  const age = validAt ? Math.max(0, now.getTime() - validAt.getTime()) : 0;
  const running = last?.status === 'RUNNING';
  const failed = last?.status === 'FAILED' || last?.status === 'ERROR';
  const state: CodexLiveState = failed
    ? 'dead'
    : !last
    ? 'refused'
    : running && age >= stalledAfterMs
    ? 'stalled'
    : running
    ? 'working'
    : 'idle';
  const dispatch = records.find((entry) => entry.type === 'USER_INPUT')?.content ?? null;
  const issue = dispatch?.match(/#\d+/)?.[0] ?? null;
  const failedCommand = [...records].reverse().find((entry) =>
    entry.type === 'RUN_COMMAND' && entry.exitCode !== null && entry.exitCode !== 0
  );
  const fileRecord = [...records].reverse().find((entry) => entry.type === 'CODE_ACTION');
  const current = last?.thinking ?? last?.content ??
    (last ? `${last.type} ${last.status ?? ''}` : null);
  return {
    runtime: 'agy',
    conversationId,
    worktree,
    transcript: transcriptPath,
    state,
    stateLabel: state === 'stalled' ? `stalled-for-${formatAge(age)}` : state,
    activityAgeMs: age,
    lastActivityAt: validAt?.toISOString() ?? null,
    currentStep: current ? truncateLiveText(current) : null,
    issue,
    lastNonZeroExit: failedCommand
      ? { code: failedCommand.exitCode as number, step: failedCommand.step }
      : null,
    lastFileWritten: fileFromContent(fileRecord?.content ?? null),
  };
}

export function parseAgyConversationIndex(json: string): ReadonlyMap<string, string> {
  const parsed = object(JSON.parse(json));
  const result = new Map<string, string>();
  for (const [worktree, value] of Object.entries(parsed ?? {})) {
    if (typeof value === 'string' && value) result.set(worktree, value);
  }
  return result;
}
