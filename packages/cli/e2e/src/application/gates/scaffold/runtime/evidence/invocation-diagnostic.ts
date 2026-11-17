/** Bounded allowlisted evidence from an already-executed owned Aspire invocation. No process calls. */
import { basename, isAbsolute, relative, resolve } from '@std/path';

const MAX_BYTES = 256 << 10;
const CLI_LOG = /^cli_(\d{8}T\d{6})_[a-f0-9]{8,32}\.log$/i;
const APPHOST_LOG = /^cli_\d{8}T\d{9}_detach-child_[a-f0-9]{8,32}\.log$/i;
const KINDS = new Set(['container', 'volume', 'network', 'process', 'project', 'executable']);
const NAMES = new Set([
  'web',
  'api',
  'workers',
  'postgres',
  'redis',
  'garnet',
  'streams',
  'dashboard',
]);
const ERRORS = new Set(['permission_denied', 'not_found', 'in_use', 'timeout', 'cleanup_failed']);
export interface CapturedInvocation {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly process?: 'aspire' | 'database_cli';
  readonly timedOut?: boolean;
  readonly reportedRestart?: { readonly resource: string; readonly exit: number };
  /** Trusted fixture scope, never taken from command output. */
  readonly scopedResources?: readonly string[];
  readonly signalAtSettlement?: {
    readonly abortRequested: boolean;
    readonly deadlineExpired: boolean;
  };
}
export interface DiagnosticRecord {
  readonly resourceKind: string | null;
  readonly resourceName: string | null;
  readonly errorCode: string | null;
  readonly stopState?: 'requested' | 'not_terminal' | 'confirmed';
}
/** Names beyond the fixed vocabulary require an exact server-owned run binding. */
export function diagnosticResourceName(
  name: unknown,
  scoped: readonly string[] = [],
): string | null {
  if (typeof name !== 'string') return null;
  if (NAMES.has(name)) return name;
  return scoped.length <= 16 && scoped.includes(name) && /^[a-z][a-z0-9-]{0,127}$/.test(name)
    ? name
    : null;
}
function recordTime(row: Record<string, unknown> | null): number | null {
  const value = row?.Timestamp ?? row?.timestamp ?? row?.['@t'];
  if (typeof value !== 'string') return null;
  const at = Date.parse(value);
  return Number.isFinite(at) ? at : null;
}

function withinInvocation(at: number | null, invocation: CapturedInvocation): boolean {
  const start = Date.parse(invocation.startedAt ?? ''),
    end = Date.parse(invocation.completedAt ?? '');
  return at !== null && Number.isFinite(at) && Number.isFinite(start) && Number.isFinite(end) &&
    end >= start && at >= start && at <= end;
}

/** Pinned CLI file-log prefix and closed DcpExecutor templates; no free-form message is retained. */
function scopedStopRecord(
  line: string,
  scoped: readonly string[],
  window?: CapturedInvocation,
): DiagnosticRecord | null {
  const prefix =
    /^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}\.\d{3})\] \[[A-Z]{3,5}\] \[(?:AppHost|DcpExecutor|Aspire\.Hosting\.Dcp\.DcpExecutor)\] (.+)$/
      .exec(line);
  if (!prefix) return null;
  const at = Date.parse(prefix[1] + 'T' + prefix[2] + 'Z');
  if (!Number.isFinite(at) || window && !withinInvocation(at, window)) return null;
  const match =
    /^(?:Stopping resource '([^']+)'\.\.\.|Executable '([^']+)' (was stopped\.|is still running; trying again to stop it\.\.\.))$/
      .exec(prefix[3]);
  if (!match) return null;
  const physical = match[1] ?? match[2];
  const candidates = [...NAMES, ...scoped.slice(0, 16)];
  const logical = candidates.find((name) =>
    diagnosticResourceName(name, scoped) !== null &&
    (physical === name ||
      physical.startsWith(name + '-') && /^[a-z0-9]{8}$/.test(physical.slice(name.length + 1)))
  );
  if (!logical) return null;
  return {
    resourceKind: 'executable',
    resourceName: logical,
    errorCode: null,
    stopState: match[1] ? 'requested' : match[3] === 'was stopped.' ? 'confirmed' : 'not_terminal',
  };
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
function records(text: string, scoped: readonly string[] = [], window?: CapturedInvocation) {
  const result: DiagnosticRecord[] = [];
  let ignored = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row: Record<string, unknown> | null = null;
    try {
      row = object(JSON.parse(line));
    } catch { /* Free-form text never crosses this boundary. */ }
    if (!row) {
      const stop = scopedStopRecord(line, scoped, window);
      if (stop && result.length < 16) {
        result.push(stop);
        continue;
      }
    }
    if (window) {
      const at = recordTime(row);
      if (!withinInvocation(at, window)) {
        ignored++;
        continue;
      }
    }
    const properties = object(row?.Properties) ?? row;
    const kind = properties?.resourceKind ?? properties?.ResourceKind;
    const name = properties?.resourceName ?? properties?.ResourceName;
    const error = properties?.errorCode ?? properties?.ErrorCode;
    const value = {
      resourceKind: typeof kind === 'string' && KINDS.has(kind) ? kind : null,
      resourceName: diagnosticResourceName(name, scoped),
      errorCode: typeof error === 'string' && ERRORS.has(error) ? error : null,
    };
    if (Object.values(value).some((v) => v !== null) && result.length < 16) result.push(value);
    else ignored++;
  }
  return { records: result, ignoredLines: ignored };
}
async function sha(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function textEvidence(text: string, scoped: readonly string[] = []) {
  const tail = text.slice(-MAX_BYTES);
  const encoded = new TextEncoder().encode(tail);
  const bytes = encoded.slice(-MAX_BYTES);
  const truncated = tail.length !== text.length || encoded.length !== bytes.length;
  return {
    totalCharacters: text.length,
    readBytes: bytes.length,
    truncated,
    capturedSha256: await sha(bytes),
    ...records(new TextDecoder().decode(bytes), scoped),
  };
}
function logReferences(text: string): string[] {
  const references = new Set<string>();
  for (
    const match of text.slice(-MAX_BYTES).matchAll(
      /(?:[A-Za-z]:[\\/]|\/)[^\s<>"']*cli_[A-Za-z0-9_-]+\.log/g,
    )
  ) {
    references.add(match[0]);
    if (references.size === 3) break;
  }
  return [...references];
}
function inside(path: string, root: string) {
  const delta = relative(root, path);
  return delta !== '' && !delta.startsWith('..') && !isAbsolute(delta);
}
function secondStamp(iso: string | undefined): string | null {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  return new Date(iso).toISOString().slice(0, 19).replaceAll('-', '').replaceAll(':', '');
}

/** The same identity check is used before and after opening a selected log. */
export function ownedDiagnosticFile(input: {
  readonly file: boolean;
  readonly symlink: boolean;
  readonly uid: number | null;
  readonly expectedUid: number;
  readonly path: string;
  readonly actualPath: string;
  readonly root: string;
  readonly actualRoot: string;
}): boolean {
  return input.file && !input.symlink && input.uid === input.expectedUid &&
    input.actualPath === resolve(input.path) && input.actualRoot === resolve(input.root);
}

/** One exact reference is admitted; no directory listing, home scan or raw body persistence. */
export async function selectedInvocationLog(
  path: string,
  root: string,
  invocation: CapturedInvocation,
  uid: number,
  appHost = false,
) {
  const name = basename(path), match = CLI_LOG.exec(name);
  const start = secondStamp(invocation.startedAt), end = secondStamp(invocation.completedAt);
  if (!isAbsolute(path) || !inside(resolve(path), resolve(root))) {
    return { status: 'refused' as const, reason: 'outside_log_scope' as const };
  }
  if (!(appHost ? APPHOST_LOG.test(name) : match !== null)) {
    return { status: 'refused' as const, reason: 'filename_unproven' as const };
  }
  if (!appHost && (!start || !end || match![1] < start || match![1] > end)) {
    return { status: 'refused' as const, reason: 'outside_invocation_window' as const };
  }
  try {
    const before = await Deno.lstat(path);
    if (
      !ownedDiagnosticFile({
        file: before.isFile,
        symlink: before.isSymlink,
        uid: before.uid,
        expectedUid: uid,
        path,
        actualPath: await Deno.realPath(path),
        root,
        actualRoot: await Deno.realPath(root),
      })
    ) return { status: 'refused' as const };
    const file = await Deno.open(path, { read: true });
    try {
      const opened = await file.stat();
      if (opened.ino !== before.ino || opened.dev !== before.dev || opened.uid !== uid) {
        return { status: 'refused' as const };
      }
      const size = Math.min(MAX_BYTES, opened.size), bytes = new Uint8Array(size);
      await file.seek(Math.max(0, opened.size - size), Deno.SeekMode.Start);
      const read = size ? await file.read(bytes) : 0;
      const after = await file.stat();
      if (
        read !== size || after.ino !== before.ino || after.dev !== before.dev ||
        await Deno.realPath(path) !== resolve(path)
      ) return { status: 'unreadable' as const };
      const text = new TextDecoder().decode(bytes);
      return {
        status: 'available' as const,
        totalBytes: opened.size,
        readBytes: size,
        truncated: opened.size > size,
        capturedSha256: await sha(bytes),
        ...records(text, invocation.scopedResources, appHost ? invocation : undefined),
        linkedAppHost: appHost
          ? []
          : logReferences(text).filter((value) => APPHOST_LOG.test(basename(value))).slice(0, 2),
      };
    } finally {
      file.close();
    }
  } catch (error) {
    return {
      status: error instanceof Deno.errors.NotFound ? 'missing' as const : 'unreadable' as const,
    };
  }
}

/** Keep stdout and stderr separately; stderr summaries never erase safe stdout detail. */
export async function invocationDiagnostic(input: {
  readonly invocation: CapturedInvocation;
  readonly logRoot: string;
  readonly uid: number;
  readonly ordinal: number;
  readonly operation: 'stop' | 'restart';
  readonly targetMatches: boolean;
}) {
  const { invocation } = input;
  const candidates = logReferences(invocation.stdout + '\n' + invocation.stderr).filter((path) =>
    CLI_LOG.test(basename(path))
  );
  const log = !input.targetMatches ? { status: 'refused' as const } : candidates.length !== 1
    ? {
      status: candidates.length === 0
        ? 'missing_reference' as const
        : 'ambiguous_reference' as const,
    }
    : await selectedInvocationLog(candidates[0], input.logRoot, invocation, input.uid);
  const linked = 'linkedAppHost' in log ? log.linkedAppHost : [];
  const linkedLog = linked.length === 1
    ? await selectedInvocationLog(linked[0], input.logRoot, invocation, input.uid, true)
    : null;
  // Reference paths are consumed only for exact local reads, never serialized into the artifact.
  const { linkedAppHost: _paths, ...safeLog } = 'linkedAppHost' in log
    ? log
    : { ...log, linkedAppHost: [] };
  const { linkedAppHost: _nested, ...safeLinked } = linkedLog && 'linkedAppHost' in linkedLog
    ? linkedLog
    : { ...linkedLog, linkedAppHost: [] };
  return {
    ordinal: input.ordinal,
    operation: input.operation,
    nativeExit: invocation.process === 'database_cli' ? null : invocation.code,
    executorExit: invocation.process === 'database_cli' ? invocation.code : null,
    timedOut: invocation.timedOut ?? false,
    signalAtSettlement: invocation.signalAtSettlement
      ? {
        abortRequested: invocation.signalAtSettlement.abortRequested,
        deadlineExpired: invocation.signalAtSettlement.deadlineExpired,
      }
      : null,
    process: invocation.process ?? 'aspire',
    reportedRestart: invocation.reportedRestart &&
        diagnosticResourceName(invocation.reportedRestart.resource, invocation.scopedResources) !==
          null &&
        Number.isInteger(invocation.reportedRestart.exit) && invocation.reportedRestart.exit >= 0 &&
        invocation.reportedRestart.exit <= 255
      ? { resource: invocation.reportedRestart.resource, exit: invocation.reportedRestart.exit }
      : null,
    targetMatches: input.targetMatches,
    stdout: await textEvidence(invocation.stdout, invocation.scopedResources),
    stderr: await textEvidence(invocation.stderr, invocation.scopedResources),
    log: safeLog,
    linkedState: linked.length === 0
      ? 'missing_reference'
      : linked.length === 1
      ? 'selected'
      : 'ambiguous_reference',
    linkedLog: linkedLog ? safeLinked : null,
  };
}

/** Evidence retention never changes an already-executed invocation's result. */
export async function withInvocationEvidence<T>(
  run: () => Promise<T>,
  collect: () => Promise<void>,
): Promise<T> {
  try {
    return await run();
  } finally {
    try {
      await collect();
    } catch {
      console.warn('Owned invocation diagnostic unavailable; original outcome preserved.');
    }
  }
}
