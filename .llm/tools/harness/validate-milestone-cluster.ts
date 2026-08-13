import { join } from '@std/path';
import { renderMilestoneStatus } from './render-milestone-status.ts';

export const TOPIC_LANES = ['docs', 'internals', 'fixes', 'features'] as const;
const INTAKE_SOURCES = ['targetMilestone', 'unmilestoned', 'backlog', 'laterMilestone'] as const;
const ADMISSION_PREDICATES = [
  'release-critical',
  'dependency-required',
  'high-value-coherent',
] as const;
const DISPOSITIONS = [
  'active',
  'move',
  'close-fixed',
  'close-duplicate',
  'close-superseded',
] as const;
const EDGE_KINDS = ['requires', 'rfc-prerequisite', 'cross-epic-order'] as const;
const LEAF_PHASES = [
  'planned',
  'implementing',
  'gating',
  'evaluating',
  'blocked',
  'ready',
  'merged',
  'moved',
  'closed',
] as const;
const TERMINAL_LEAF_PHASES = new Set(['merged', 'moved', 'closed']);

type JsonRecord = Record<string, unknown>;

export interface MilestoneClusterArtifacts {
  readonly intake: unknown;
  readonly inventory: unknown;
  readonly dag: unknown;
  readonly state: unknown;
  readonly status: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function integers(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => Number.isInteger(entry) && entry > 0)
    : [];
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value as T[number]);
}

function issueNumber(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function duplicateValues<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function requireSharedIdentity(
  errors: string[],
  intake: JsonRecord,
  inventory: JsonRecord,
  dag: JsonRecord,
  state: JsonRecord,
): void {
  const milestones = [intake.milestone, inventory.milestone, dag.milestone, state.milestone];
  if (!milestones.every(nonEmpty) || new Set(milestones).size !== 1) {
    errors.push('all artifacts must name the same non-empty milestone');
  }
  const baselines = [
    intake.baselineMainSha,
    inventory.baselineMainSha,
    dag.baselineMainSha,
    state.baselineMainSha,
  ];
  if (!baselines.every(nonEmpty) || new Set(baselines).size !== 1) {
    errors.push('all artifacts must use the same non-empty baselineMainSha');
  }
}

function validateIntake(errors: string[], intake: JsonRecord): JsonRecord[] {
  if (intake.schemaVersion !== 1) errors.push('intake.schemaVersion must be 1');
  if (!nonEmpty(intake.ownerRatifiedAt)) {
    errors.push('intake.ownerRatifiedAt is required before scope freeze');
  }
  const sources = isRecord(intake.sources) ? intake.sources : {};
  for (const source of ['targetMilestone', 'unmilestoned', 'backlog', 'laterMilestones']) {
    if (sources[source] !== true) errors.push(`intake.sources.${source} must be true`);
  }

  const candidates = records(intake.candidates);
  if (!Array.isArray(intake.candidates) || candidates.length !== intake.candidates.length) {
    errors.push('intake.candidates must contain objects only');
  }
  const numbers = candidates.map((candidate) => candidate.number).filter(issueNumber);
  for (const duplicate of duplicateValues(numbers)) {
    errors.push(`intake candidate #${duplicate} is duplicated`);
  }

  for (const candidate of candidates) {
    const number = issueNumber(candidate.number) ? candidate.number : '?';
    if (!issueNumber(candidate.number)) {
      errors.push('every intake candidate needs a positive issue number');
    }
    if (!oneOf(candidate.source, INTAKE_SOURCES)) {
      errors.push(`intake candidate #${number} has an invalid source`);
    }
    if (!oneOf(candidate.decision, ['include', 'exclude', 'defer'] as const)) {
      errors.push(`intake candidate #${number} needs include, exclude, or defer`);
    }
    if (!nonEmpty(candidate.reason)) errors.push(`intake candidate #${number} needs a reason`);
    if (strings(candidate.evidence).length === 0) {
      errors.push(`intake candidate #${number} needs linked evidence`);
    }
    if (candidate.ownerRatified !== true) {
      errors.push(`intake candidate #${number} is not owner-ratified`);
    }

    const external = candidate.source !== 'targetMilestone';
    if (candidate.decision === 'include' && external) {
      if (!oneOf(candidate.admissionPredicate, ADMISSION_PREDICATES)) {
        errors.push(`included external candidate #${number} lacks an admission predicate`);
      }
      if (candidate.targetMilestone !== intake.milestone || !nonEmpty(candidate.movedAt)) {
        errors.push(
          `included external candidate #${number} must be moved into the target milestone before freeze`,
        );
      }
    }
  }
  return candidates;
}

function validateInventory(errors: string[], inventory: JsonRecord): JsonRecord[] {
  if (inventory.schemaVersion !== 1) errors.push('inventory.schemaVersion must be 1');
  if (!nonEmpty(inventory.ownerRatifiedAt)) {
    errors.push('inventory.ownerRatifiedAt is required before dispatch');
  }
  const issues = records(inventory.issues);
  if (!Array.isArray(inventory.issues) || issues.length !== inventory.issues.length) {
    errors.push('inventory.issues must contain objects only');
  }
  if (inventory.targetIssueCount !== issues.length) {
    errors.push('inventory.targetIssueCount must equal the frozen issue count');
  }
  const numbers = issues.map((issue) => issue.number).filter(issueNumber);
  for (const duplicate of duplicateValues(numbers)) {
    errors.push(`inventory issue #${duplicate} is duplicated`);
  }

  for (const issue of issues) {
    const number = issueNumber(issue.number) ? issue.number : '?';
    if (!issueNumber(issue.number)) {
      errors.push('every inventory entry needs a positive issue number');
    }
    if (!oneOf(issue.disposition, DISPOSITIONS)) {
      errors.push(`inventory issue #${number} has an invalid disposition`);
    }
    if (issue.disposition === 'active') {
      if (!oneOf(issue.lane, TOPIC_LANES)) {
        errors.push(`active inventory issue #${number} needs exactly one topic lane`);
      }
    } else {
      if (issue.lane !== null) {
        errors.push(`non-active inventory issue #${number} must not own a lane`);
      }
      if (!nonEmpty(issue.reason) || strings(issue.evidence).length === 0) {
        errors.push(
          `non-active inventory issue #${number} needs written GitHub reason and evidence`,
        );
      }
    }
  }
  return issues;
}

function validateIntakeInventoryCrossing(
  errors: string[],
  intake: JsonRecord,
  candidates: JsonRecord[],
  inventoryIssues: JsonRecord[],
): void {
  const inventoryNumbers = new Set(
    inventoryIssues.map((issue) => issue.number).filter(issueNumber),
  );
  for (const candidate of candidates) {
    if (
      candidate.decision === 'include' && candidate.source !== 'targetMilestone' &&
      issueNumber(candidate.number) && !inventoryNumbers.has(candidate.number)
    ) {
      errors.push(
        `included external candidate #${candidate.number} is absent from the frozen inventory`,
      );
    }
  }
  if (!nonEmpty(intake.capturedAt)) errors.push('intake.capturedAt is required');
}

function validateDag(
  errors: string[],
  dag: JsonRecord,
  activeIssues: JsonRecord[],
): void {
  if (dag.schemaVersion !== 1) errors.push('dag.schemaVersion must be 1');
  const nodes = records(dag.nodes);
  const edges = records(dag.edges);
  const waves = records(dag.waves);
  const nodeIds = nodes.map((node) => node.id).filter(nonEmpty);
  for (const duplicate of duplicateValues(nodeIds)) {
    errors.push(`DAG node ${duplicate} is duplicated`);
  }
  const nodeSet = new Set(nodeIds);
  const activeNumbers = activeIssues.map((issue) => issue.number).filter(issueNumber);

  for (const number of activeNumbers) {
    const matches = nodes.filter((node) =>
      node.id === `issue:${number}` && node.issueNumber === number
    );
    if (matches.length !== 1) {
      errors.push(`active issue #${number} must appear exactly once in the DAG`);
    }
  }

  const waveByNode = new Map<string, number>();
  for (const wave of waves) {
    if (!Number.isInteger(wave.index) || (wave.index as number) < 0) {
      errors.push('every DAG wave needs a non-negative integer index');
      continue;
    }
    for (const id of strings(wave.nodeIds)) {
      if (!nodeSet.has(id)) errors.push(`DAG wave references missing node ${id}`);
      if (waveByNode.has(id)) errors.push(`DAG node ${id} appears in more than one wave`);
      waveByNode.set(id, wave.index as number);
    }
  }
  for (const id of nodeIds) {
    if (!waveByNode.has(id)) errors.push(`DAG node ${id} is absent from waves`);
  }

  const adjacency = new Map(nodeIds.map((id) => [id, [] as string[]]));
  const indegree = new Map(nodeIds.map((id) => [id, 0]));
  for (const edge of edges) {
    const from = edge.from;
    const to = edge.to;
    if (!oneOf(edge.kind, EDGE_KINDS)) errors.push('DAG edge has an invalid kind');
    if (!nonEmpty(from) || !nodeSet.has(from) || !nonEmpty(to) || !nodeSet.has(to)) {
      errors.push('DAG edge references a missing node');
      continue;
    }
    if (from === to) errors.push(`DAG edge ${from} -> ${to} is self-referential`);
    adjacency.get(from)?.push(to);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
    const fromWave = waveByNode.get(from);
    const toWave = waveByNode.get(to);
    if (fromWave !== undefined && toWave !== undefined && fromWave >= toWave) {
      errors.push(`DAG dependency ${from} -> ${to} must run in an earlier wave`);
    }
  }

  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    visited++;
    for (const next of adjacency.get(id) ?? []) {
      const degree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }
  if (visited !== nodeIds.length) errors.push('DAG contains a cycle');
}

function validateState(
  errors: string[],
  state: JsonRecord,
  activeIssues: JsonRecord[],
): void {
  if (state.schemaVersion !== 1) errors.push('state.schemaVersion must be 1');
  const coordinator = isRecord(state.coordinator) ? state.coordinator : {};
  if (!nonEmpty(coordinator.agentId)) errors.push('state.coordinator.agentId is required');
  if (!nonEmpty(state.currentMainSha)) errors.push('state.currentMainSha is required');
  const limits = isRecord(state.limits) ? state.limits : {};
  const expectedLimits: Record<string, number> = {
    activeImplementationSlicesPerLane: 2,
    activeEvaluatorsPerLane: 1,
    globalExpensiveGates: 1,
    releaseWriters: 1,
  };
  for (const [key, value] of Object.entries(expectedLimits)) {
    if (limits[key] !== value) errors.push(`state.limits.${key} must be ${value}`);
  }

  const lanes = records(state.lanes);
  const laneIds = lanes.map((lane) => lane.id).filter(nonEmpty);
  if (
    lanes.length !== TOPIC_LANES.length ||
    TOPIC_LANES.some((lane) => laneIds.filter((id) => id === lane).length !== 1)
  ) {
    errors.push('state must contain exactly docs, internals, fixes, and features lanes');
  }
  const laneIssues: number[] = [];
  for (const lane of lanes) {
    if (!nonEmpty(lane.orchestratorAgentId)) {
      errors.push(`lane ${String(lane.id)} needs one orchestrator identity`);
    }
    laneIssues.push(...integers(lane.issueNumbers));
  }
  for (const duplicate of duplicateValues(laneIssues)) {
    errors.push(`active issue #${duplicate} is owned by more than one lane`);
  }
  const activeNumbers = activeIssues.map((issue) => issue.number).filter(issueNumber).sort((a, b) =>
    a - b
  );
  const assignedNumbers = [...laneIssues].sort((a, b) => a - b);
  if (JSON.stringify(activeNumbers) !== JSON.stringify(assignedNumbers)) {
    errors.push('lane issue ownership must equal the active frozen inventory');
  }

  for (const watcher of records(state.watchers)) {
    if (!nonEmpty(watcher.agentId) || watcher.mutationAuthority !== false) {
      errors.push('watchers need an identity and mutationAuthority:false');
    }
  }
  const watcherIds = records(state.watchers).map((watcher) => watcher.agentId).filter(nonEmpty);
  for (const duplicate of duplicateValues(watcherIds)) {
    errors.push(`watcher ${duplicate} is duplicated`);
  }

  const leaves = records(state.leaves);
  const leafIds = leaves.map((leaf) => leaf.id).filter(nonEmpty);
  for (const duplicate of duplicateValues(leafIds)) errors.push(`leaf ${duplicate} is duplicated`);
  for (const leaf of leaves) {
    const id = nonEmpty(leaf.id) ? leaf.id : '?';
    if (!oneOf(leaf.lane, TOPIC_LANES)) errors.push(`leaf ${id} has an invalid lane`);
    if (!oneOf(leaf.phase, LEAF_PHASES)) errors.push(`leaf ${id} has an invalid phase`);
    if (leaf.baseBranch !== 'main') errors.push(`leaf ${id} must target main directly`);
    if (!nonEmpty(leaf.headSha)) errors.push(`leaf ${id} needs an immutable headSha`);
    if (
      nonEmpty(leaf.implementerAgentId) && nonEmpty(leaf.evaluatorAgentId) &&
      leaf.implementerAgentId === leaf.evaluatorAgentId
    ) {
      errors.push(`leaf ${id} uses the same implementer and evaluator session`);
    }
    const lane = lanes.find((candidate) => candidate.id === leaf.lane);
    const owned = new Set(integers(lane?.issueNumbers));
    for (const number of integers(leaf.issueNumbers)) {
      if (!owned.has(number)) errors.push(`leaf ${id} claims issue #${number} outside its lane`);
    }
    for (const receipt of records(leaf.receiptRefs)) {
      if (!nonEmpty(receipt.id) || receipt.gitHead !== leaf.headSha) {
        errors.push(`leaf ${id} has a receipt missing its id or pinned to a different head`);
      }
    }
  }

  for (const lane of TOPIC_LANES) {
    const laneLeaves = leaves.filter((leaf) => leaf.lane === lane);
    const implementations = laneLeaves.filter((leaf) =>
      leaf.phase === 'implementing' || leaf.phase === 'gating'
    ).length;
    const evaluations = laneLeaves.filter((leaf) => leaf.phase === 'evaluating').length;
    if (implementations > 2) errors.push(`lane ${lane} exceeds two active implementation slices`);
    if (evaluations > 1) errors.push(`lane ${lane} exceeds one active evaluator`);
  }

  const runningGates = records(state.expensiveGates).filter((gate) => gate.state === 'running');
  if (runningGates.length > 1) errors.push('more than one global expensive gate is running');

  for (const checkpoint of records(state.canaryCheckpoints)) {
    const id = nonEmpty(checkpoint.id) ? checkpoint.id : '?';
    if (!nonEmpty(checkpoint.rationale)) errors.push(`canary checkpoint ${id} needs a rationale`);
    if (!oneOf(checkpoint.state, ['planned', 'publishing', 'complete'] as const)) {
      errors.push(`canary checkpoint ${id} has an invalid state`);
    }
    if (checkpoint.state !== 'planned') {
      if (!nonEmpty(checkpoint.contentSha) || strings(checkpoint.receiptRefs).length === 0) {
        errors.push(`active canary checkpoint ${id} needs content SHA and receipt evidence`);
      }
    }
  }

  const committedIssues = records(state.committedIssues);
  const committedNumbers = committedIssues.map((issue) => issue.number).filter(issueNumber);
  for (const duplicate of duplicateValues(committedNumbers)) {
    errors.push(`committed issue #${duplicate} is duplicated`);
  }
  if (
    JSON.stringify([...committedNumbers].sort((a, b) => a - b)) !== JSON.stringify(activeNumbers)
  ) {
    errors.push('committedIssues must equal the active frozen inventory');
  }
  for (const issue of committedIssues) {
    if (!oneOf(issue.state, ['open', 'closed', 'moved'] as const)) {
      errors.push(`committed issue #${String(issue.number)} has an invalid state`);
    }
    if (
      issue.state === 'moved' && (!nonEmpty(issue.reason) || strings(issue.evidence).length === 0)
    ) {
      errors.push(`moved committed issue #${String(issue.number)} needs reason and evidence`);
    }
  }

  const writers = strings(state.releaseWriters);
  if (writers.length > 1 || duplicateValues(writers).length > 0) {
    errors.push('there may be at most one release writer');
  }
  const captain = isRecord(state.releaseCaptain) ? state.releaseCaptain : {};
  if (!oneOf(captain.state, ['inactive', 'claimed', 'publishing', 'complete'] as const)) {
    errors.push('releaseCaptain.state is invalid');
    return;
  }
  if (captain.state === 'inactive') {
    if (writers.length > 0) errors.push('an inactive release captain cannot have a writer');
    return;
  }

  const terminalIssues = committedIssues.every((issue) =>
    issue.state === 'closed' || issue.state === 'moved'
  );
  const terminalLeaves = leaves.every((leaf) => TERMINAL_LEAF_PHASES.has(String(leaf.phase)));
  const exactEvidence = isRecord(state.exactMainEvidence) ? state.exactMainEvidence : {};
  const exactMainGreen = exactEvidence.sufficiency === 'SUFFICIENT' &&
    nonEmpty(state.currentMainSha) && exactEvidence.gitHead === state.currentMainSha &&
    strings(exactEvidence.receiptRefs).length > 0;
  if (
    !terminalIssues || !terminalLeaves || !exactMainGreen || state.existingReleaseLease !== false
  ) {
    errors.push(
      'release captain was claimed before the release-readiness preconditions were green',
    );
  }
  if (
    !nonEmpty(captain.agentId) || !nonEmpty(captain.leaseId) ||
    captain.contentSha !== state.currentMainSha || writers.length !== 1 ||
    writers[0] !== captain.agentId
  ) {
    errors.push('active release captain must own the single writer lease for current main');
  }
  const forbiddenWriters = new Set([
    ...lanes.map((lane) => lane.orchestratorAgentId).filter(nonEmpty),
    ...watcherIds,
  ]);
  if (nonEmpty(captain.agentId) && forbiddenWriters.has(captain.agentId)) {
    errors.push('topic orchestrators and watchers cannot act as release captain');
  }
  if (captain.state === 'complete' && strings(captain.evidence).length === 0) {
    errors.push('completed release captain needs publication and production-E2E evidence');
  }
}

export async function validateMilestoneCluster(
  artifacts: MilestoneClusterArtifacts,
): Promise<ValidationResult> {
  const errors: string[] = [];
  if (!isRecord(artifacts.intake)) errors.push('milestone-intake.json must be an object');
  if (!isRecord(artifacts.inventory)) errors.push('milestone-inventory.json must be an object');
  if (!isRecord(artifacts.dag)) errors.push('milestone-dependency-dag.json must be an object');
  if (!isRecord(artifacts.state)) errors.push('milestone-cluster-state.json must be an object');
  if (errors.length > 0) return { ok: false, errors };

  const intake = artifacts.intake as JsonRecord;
  const inventory = artifacts.inventory as JsonRecord;
  const dag = artifacts.dag as JsonRecord;
  const state = artifacts.state as JsonRecord;
  requireSharedIdentity(errors, intake, inventory, dag, state);
  const candidates = validateIntake(errors, intake);
  const inventoryIssues = validateInventory(errors, inventory);
  validateIntakeInventoryCrossing(errors, intake, candidates, inventoryIssues);
  const activeIssues = inventoryIssues.filter((issue) => issue.disposition === 'active');
  validateDag(errors, dag, activeIssues);
  validateState(errors, state, activeIssues);

  const rendered = await renderMilestoneStatus(state);
  if (artifacts.status !== rendered) {
    errors.push('milestone-status.md is stale; regenerate it from milestone-cluster-state.json');
  }
  return { ok: errors.length === 0, errors };
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await Deno.readTextFile(path));
}

async function main(): Promise<void> {
  const runDir = Deno.args[0];
  if (!runDir) {
    console.error('usage: validate-milestone-cluster.ts <run-dir>');
    Deno.exit(2);
  }
  const result = await validateMilestoneCluster({
    intake: await readJson(join(runDir, 'milestone-intake.json')),
    inventory: await readJson(join(runDir, 'milestone-inventory.json')),
    dag: await readJson(join(runDir, 'milestone-dependency-dag.json')),
    state: await readJson(join(runDir, 'milestone-cluster-state.json')),
    status: await Deno.readTextFile(join(runDir, 'milestone-status.md')),
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) Deno.exit(1);
}

if (import.meta.main) await main();
