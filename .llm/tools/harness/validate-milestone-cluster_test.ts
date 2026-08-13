import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderMilestoneStatus } from './render-milestone-status.ts';
import {
  type MilestoneClusterArtifacts,
  validateMilestoneCluster,
} from './validate-milestone-cluster.ts';

type MutableArtifacts = {
  intake: Record<string, unknown>;
  inventory: Record<string, unknown>;
  dag: Record<string, unknown>;
  state: Record<string, unknown>;
  status: string;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function validArtifacts(): Promise<MutableArtifacts> {
  const baselineMainSha = 'a'.repeat(40);
  const headSha = 'b'.repeat(40);
  const intake = {
    schemaVersion: 1,
    repo: 'rickylabs/netscript',
    milestone: '0.0.7',
    capturedAt: '2026-08-13T08:00:00.000Z',
    baselineMainSha,
    ownerRatifiedAt: '2026-08-13T08:05:00.000Z',
    sources: {
      targetMilestone: true,
      unmilestoned: true,
      backlog: true,
      laterMilestones: true,
    },
    candidates: [{
      number: 101,
      title: 'fix a release blocker',
      source: 'unmilestoned',
      currentMilestone: null,
      decision: 'include',
      admissionPredicate: 'release-critical',
      reason: 'blocks the target release',
      evidence: ['https://github.com/rickylabs/netscript/issues/101'],
      ownerRatified: true,
      targetMilestone: '0.0.7',
      movedAt: '2026-08-13T08:04:00.000Z',
    }],
  };
  const inventory = {
    schemaVersion: 1,
    repo: 'rickylabs/netscript',
    milestone: '0.0.7',
    capturedAt: '2026-08-13T08:06:00.000Z',
    baselineMainSha,
    ownerRatifiedAt: '2026-08-13T08:07:00.000Z',
    targetIssueCount: 1,
    issues: [{
      number: 101,
      title: 'fix a release blocker',
      disposition: 'active',
      lane: 'fixes',
      reason: null,
      evidence: [],
      acceptanceTotal: 3,
      acceptanceChecked: 0,
      linkedPRs: [],
      surfaces: ['packages/service'],
    }],
  };
  const dag = {
    schemaVersion: 1,
    milestone: '0.0.7',
    baselineMainSha,
    nodes: [{ id: 'issue:101', kind: 'issue', issueNumber: 101 }],
    edges: [],
    waves: [{ index: 0, nodeIds: ['issue:101'], checkpoint: 'canary', rationale: 'first fix' }],
  };
  const state = {
    schemaVersion: 1,
    milestone: '0.0.7',
    baselineMainSha,
    currentMainSha: headSha,
    coordinator: { agentId: 'coordinator' },
    limits: {
      activeImplementationSlicesPerLane: 2,
      activeEvaluatorsPerLane: 1,
      globalExpensiveGates: 1,
      releaseWriters: 1,
    },
    lanes: [
      { id: 'docs', orchestratorAgentId: 'docs-orch', issueNumbers: [] },
      { id: 'internals', orchestratorAgentId: 'internals-orch', issueNumbers: [] },
      { id: 'fixes', orchestratorAgentId: 'fixes-orch', issueNumbers: [101] },
      { id: 'features', orchestratorAgentId: 'features-orch', issueNumbers: [] },
    ],
    watchers: [{ agentId: 'watcher', mutationAuthority: false }],
    committedIssues: [{ number: 101, state: 'open', reason: null, evidence: [] }],
    leaves: [{
      id: 'fixes-101',
      lane: 'fixes',
      issueNumbers: [101],
      baseBranch: 'main',
      branch: 'fix/101',
      worktree: '/worktrees/101',
      prNumber: 200,
      headSha,
      implementerAgentId: 'impl-101',
      evaluatorAgentId: null,
      phase: 'implementing',
      receiptRefs: [{ id: 'check-101', gitHead: headSha, outcome: 'PASS' }],
      blocker: null,
      lastProgressAt: '2026-08-13T08:10:00.000Z',
    }],
    expensiveGates: [],
    canaryCheckpoints: [],
    exactMainEvidence: { gitHead: headSha, sufficiency: 'INSUFFICIENT', receiptRefs: [] },
    existingReleaseLease: false,
    releaseWriters: [],
    releaseCaptain: {
      state: 'inactive',
      agentId: null,
      leaseId: null,
      contentSha: null,
      evidence: [],
    },
    updatedAt: '2026-08-13T08:10:00.000Z',
  };
  return { intake, inventory, dag, state, status: await renderMilestoneStatus(state) };
}

async function expectRed(
  mutate: (artifacts: MutableArtifacts) => void | Promise<void>,
  expected: string,
): Promise<void> {
  const artifacts = await validArtifacts();
  await mutate(artifacts);
  const result = await validateMilestoneCluster(artifacts as MilestoneClusterArtifacts);
  assertEquals(result.ok, false);
  assertStringIncludes(result.errors.join('\n'), expected);
}

Deno.test('valid milestone cluster passes the Step 0 and control-plane contract', async () => {
  const result = await validateMilestoneCluster(await validArtifacts());
  assert(result.ok, result.errors.join('\n'));
  assertEquals(result.errors, []);
});

Deno.test('RED: missing intake artifact fails closed', async () => {
  const artifacts = await validArtifacts();
  const result = await validateMilestoneCluster({ ...artifacts, intake: null });
  assertEquals(result.ok, false);
  assertStringIncludes(result.errors.join('\n'), 'milestone-intake.json must be an object');
});

Deno.test('RED: included issue needs owner ratification and actual milestone move', async () => {
  await expectRed((artifacts) => {
    const candidate = (artifacts.intake.candidates as Record<string, unknown>[])[0];
    candidate.ownerRatified = false;
    candidate.movedAt = null;
  }, 'not owner-ratified');
  await expectRed((artifacts) => {
    const candidate = (artifacts.intake.candidates as Record<string, unknown>[])[0];
    candidate.movedAt = null;
  }, 'must be moved into the target milestone');
});

Deno.test('RED: stale disposition without GitHub evidence fails', async () => {
  await expectRed((artifacts) => {
    const issue = (artifacts.inventory.issues as Record<string, unknown>[])[0];
    issue.disposition = 'close-fixed';
    issue.lane = null;
    issue.reason = null;
    issue.evidence = [];
  }, 'needs written GitHub reason and evidence');
});

Deno.test('RED: dependency cycles and same-wave dependencies fail', async () => {
  await expectRed((artifacts) => {
    artifacts.dag.nodes = [
      { id: 'issue:101', kind: 'issue', issueNumber: 101 },
      { id: 'rfc:9', kind: 'rfc', issueNumber: 9 },
    ];
    artifacts.dag.edges = [
      { from: 'issue:101', to: 'rfc:9', kind: 'requires' },
      { from: 'rfc:9', to: 'issue:101', kind: 'rfc-prerequisite' },
    ];
    artifacts.dag.waves = [{ index: 0, nodeIds: ['issue:101', 'rfc:9'] }];
  }, 'DAG contains a cycle');
  await expectRed((artifacts) => {
    artifacts.dag.nodes = [
      { id: 'issue:101', kind: 'issue', issueNumber: 101 },
      { id: 'rfc:9', kind: 'rfc', issueNumber: 9 },
    ];
    artifacts.dag.edges = [{ from: 'rfc:9', to: 'issue:101', kind: 'rfc-prerequisite' }];
    artifacts.dag.waves = [{ index: 0, nodeIds: ['issue:101', 'rfc:9'] }];
  }, 'must run in an earlier wave');
});

Deno.test('RED: WIP overflow and mutating watchers fail', async () => {
  await expectRed(async (artifacts) => {
    const leaves = artifacts.state.leaves as Record<string, unknown>[];
    leaves.push(
      { ...clone(leaves[0]), id: 'fixes-102', headSha: 'c'.repeat(40), receiptRefs: [] },
      { ...clone(leaves[0]), id: 'fixes-103', headSha: 'd'.repeat(40), receiptRefs: [] },
    );
    artifacts.status = await renderMilestoneStatus(artifacts.state);
  }, 'exceeds two active implementation slices');
  await expectRed((artifacts) => {
    (artifacts.state.watchers as Record<string, unknown>[])[0].mutationAuthority = true;
  }, 'mutationAuthority:false');
});

Deno.test('RED: release captain cannot claim early or admit two writers', async () => {
  await expectRed((artifacts) => {
    artifacts.state.releaseWriters = ['captain'];
    artifacts.state.releaseCaptain = {
      state: 'claimed',
      agentId: 'captain',
      leaseId: 'lease-1',
      contentSha: artifacts.state.currentMainSha,
      evidence: [],
    };
  }, 'before the release-readiness preconditions');
  await expectRed((artifacts) => {
    artifacts.state.releaseWriters = ['captain-a', 'captain-b'];
  }, 'at most one release writer');
});

Deno.test('RED: generated status and receipt heads are immutable', async () => {
  await expectRed((artifacts) => {
    artifacts.status = `${artifacts.status}\nmanual edit\n`;
  }, 'milestone-status.md is stale');
  await expectRed((artifacts) => {
    const leaf = (artifacts.state.leaves as Record<string, unknown>[])[0];
    (leaf.receiptRefs as Record<string, unknown>[])[0].gitHead = 'f'.repeat(40);
  }, 'pinned to a different head');
});
