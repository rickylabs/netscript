import type {
  OwnedResourceSliceLeafMetadata,
  ResourceSliceCandidateLeaf,
  ResourceSliceLeafClassification,
  ResourceSliceReconcileResult,
  ResourceSliceReportEntry,
  ResourceSliceStagingResult,
  ResourceSliceVariant,
} from './resource-slice-contract.ts';
import { parseOwnedResourceSliceLeaf, sha256ResourceSliceBody } from './resource-slice-contract.ts';

export interface ReconcileResourceSliceInput {
  readonly staging: ResourceSliceStagingResult;
  readonly current: Readonly<Record<string, string | undefined>>;
  readonly dryRun?: boolean;
  readonly force?: boolean;
}

/** Classify current leaf bytes against one fully rendered candidate. */
export async function classifyResourceSliceLeaf(
  current: string | undefined,
  candidate: ResourceSliceCandidateLeaf,
): Promise<ResourceSliceLeafClassification> {
  if (current === undefined) return { kind: 'absent' };
  if (current === candidate.content) return { kind: 'exact' };
  const metadata = parseOwnedResourceSliceLeaf(current);
  if (
    !metadata || metadata.resource !== candidate.resource ||
    metadata.role !== candidate.role
  ) return { kind: 'unowned' };
  const body = current.slice(current.indexOf('\n') + 1);
  return await sha256ResourceSliceBody(body) === metadata.bodySha256
    ? { kind: 'owned', metadata }
    : { kind: 'owned-edited', metadata };
}

/** Fully preflight staged resource files and return an apply plan only when safe. */
export async function reconcileResourceSlice(
  input: ReconcileResourceSliceInput,
): Promise<ResourceSliceReconcileResult> {
  if (!input.staging.ok) {
    return {
      status: 'preflight-failed',
      exitCode: 1,
      phase: input.staging.phase,
      message: input.staging.message,
      report: [],
      skipped: [],
      conflicts: [],
    };
  }

  const candidateFailure = await validateCandidates(input.staging);
  if (candidateFailure) {
    return {
      status: 'preflight-failed',
      exitCode: 1,
      phase: 'candidate-validation',
      message: candidateFailure,
      report: [],
      skipped: [],
      conflicts: [],
    };
  }

  const report: ResourceSliceReportEntry[] = [];
  const writes: Array<Readonly<{ path: string; content: string }>> = [];
  for (const candidate of input.staging.leaves) {
    const current = input.current[candidate.path];
    const classification = await classifyResourceSliceLeaf(
      current,
      candidate,
    );
    const decision = decideLeaf(candidate, current, classification, Boolean(input.force));
    report.push(decision.report);
    if (decision.write) writes.push(decision.write);
  }
  for (const candidate of input.staging.shared) {
    const exact = input.current[candidate.path] === candidate.content;
    report.push({
      path: candidate.path,
      action: exact ? 'skip' : 'write',
      classification: 'shared',
    });
    if (!exact) writes.push({ path: candidate.path, content: candidate.content });
  }

  report.sort((left, right) => comparePath(left.path, right.path));
  writes.sort((left, right) => comparePath(left.path, right.path));
  const skipped = report.filter((entry) => entry.action === 'skip').map((entry) => entry.path);
  const conflicts = report.filter((entry) => entry.action === 'conflict').map((entry) =>
    entry.path
  );
  const common = { report, skipped, conflicts };

  if (input.dryRun) {
    return {
      status: 'dry-run',
      exitCode: conflicts.length ? 1 : 0,
      ...common,
    };
  }
  if (conflicts.length) return { status: 'conflict', exitCode: 1, ...common };
  return { status: 'ready', exitCode: 0, applyPlan: { files: writes }, ...common };
}

function comparePath(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function decideLeaf(
  candidate: ResourceSliceCandidateLeaf,
  current: string | undefined,
  classification: ResourceSliceLeafClassification,
  force: boolean,
): Readonly<{
  report: ResourceSliceReportEntry;
  write?: Readonly<{ path: string; content: string }>;
}> {
  if (classification.kind === 'absent') return writeDecision(candidate, 'absent');
  if (classification.kind === 'exact') {
    return {
      report: { path: candidate.path, action: 'skip', classification: 'exact' },
    };
  }
  if (classification.kind === 'owned') {
    if (
      isCanonicalAdditiveTransition(candidate, current, classification.metadata) || force
    ) {
      return writeDecision(candidate, 'owned');
    }
    return conflictDecision(
      candidate.path,
      'owned',
      `Move or rename the file, or use --force to replace this generator-owned leaf.`,
    );
  }
  const label = classification.kind;
  return conflictDecision(
    candidate.path,
    label,
    `Move or rename the ${label === 'unowned' ? 'unowned' : 'edited generator-owned'} file.`,
  );
}

function writeDecision(
  candidate: ResourceSliceCandidateLeaf,
  classification: 'absent' | 'owned',
): Readonly<{
  report: ResourceSliceReportEntry;
  write: Readonly<{ path: string; content: string }>;
}> {
  return {
    report: { path: candidate.path, action: 'write', classification },
    write: { path: candidate.path, content: candidate.content },
  };
}

function conflictDecision(
  path: string,
  classification: 'owned' | 'owned-edited' | 'unowned',
  remedy: string,
): Readonly<{ report: ResourceSliceReportEntry }> {
  return { report: { path, action: 'conflict', classification, remedy } };
}

function isCanonicalAdditiveTransition(
  candidate: ResourceSliceCandidateLeaf,
  current: string | undefined,
  metadata: OwnedResourceSliceLeafMetadata,
): boolean {
  if (!isSubset(metadata.options, candidate.options)) return false;
  const currentOptions = optionKey(metadata.options);
  return (candidate.previousCanonicalContents ?? []).some((content) => {
    const previous = parseOwnedResourceSliceLeaf(content);
    return content === current && previous?.resource === candidate.resource &&
      previous.role === candidate.role &&
      optionKey(previous.options) === currentOptions;
  });
}

async function validateCandidates(
  staging: Extract<ResourceSliceStagingResult, { ok: true }>,
): Promise<string | undefined> {
  const paths = new Set<string>();
  for (const candidate of staging.leaves) {
    if (paths.has(candidate.path)) return `Duplicate staged path: ${candidate.path}`;
    paths.add(candidate.path);
    const metadata = parseOwnedResourceSliceLeaf(candidate.content);
    const body = candidate.content.slice(candidate.content.indexOf('\n') + 1);
    if (
      !metadata || metadata.resource !== candidate.resource || metadata.role !== candidate.role ||
      optionKey(metadata.options) !== optionKey(candidate.options) ||
      await sha256ResourceSliceBody(body) !== metadata.bodySha256
    ) return `Invalid staged ownership marker: ${candidate.path}`;
  }
  for (const candidate of staging.shared) {
    if (paths.has(candidate.path)) return `Duplicate staged path: ${candidate.path}`;
    paths.add(candidate.path);
  }
  return undefined;
}

function isSubset(
  previous: readonly ResourceSliceVariant[],
  next: readonly ResourceSliceVariant[],
): boolean {
  return previous.every((option) => next.includes(option)) && previous.length < next.length;
}

function optionKey(options: readonly ResourceSliceVariant[]): string {
  return [...options].sort().join(',');
}
