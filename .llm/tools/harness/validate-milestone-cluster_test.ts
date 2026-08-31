import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderMilestoneStatus } from './render-milestone-status.ts';
import {
  type LiveMilestonePr,
  type MilestoneClusterArtifacts,
  type MilestonePrSource,
  milestonePrSourceFromExport,
  parseValidateCliArgs,
  validateMilestoneCluster,
} from './validate-milestone-cluster.ts';

type MutableArtifacts = {
  intake: Record<string, unknown>;
  inventory: Record<string, unknown>;
  dag: Record<string, unknown>;
  state: Record<string, unknown>;
  status: string;
};

function prSource(pullRequests: readonly LiveMilestonePr[]): MilestonePrSource {
  return {
    listOpenMilestonePrs: () =>
      Promise.resolve(pullRequests.filter((pullRequest) => pullRequest.state === 'open')),
    readPrHead: (_repo, prNumber) => {
      const pullRequest = pullRequests.find((candidate) => candidate.number === prNumber);
      if (!pullRequest) return Promise.reject(new Error(`PR #${prNumber} is unavailable`));
      return Promise.resolve(pullRequest);
    },
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

Deno.test('validate CLI accepts the deno task separator and rejects malformed usage', () => {
  assertEquals(parseValidateCliArgs(['--', '/tmp/run']), { runDir: '/tmp/run' });
  assertEquals(parseValidateCliArgs(['/tmp/run', '--github-prs', '/tmp/prs.json']), {
    runDir: '/tmp/run',
    githubPrsPath: '/tmp/prs.json',
  });
  assertStringIncludes(
    parseValidateCliArgs(['/tmp/run', '--github-prs']).error ?? '',
    'requires a path',
  );
  assertStringIncludes(parseValidateCliArgs(['--']).error ?? '', 'missing run directory');
  assertStringIncludes(parseValidateCliArgs(['a', 'b']).error ?? '', 'exactly one');
});

function gateReceipt(gateId: string, head: string): Record<string, unknown> {
  return {
    schemaVersion: 1,
    gateId,
    invocationId: `${gateId}-1`,
    argv: ['deno', 'task', gateId],
    cwd: '/repo',
    gitHead: head,
    actualGitHead: head,
    timeoutMs: 1_000,
    runnerIdentity: 'ci',
    attempt: 1,
    requestHash: `${gateId}-hash`,
    lifecycleId: `ci:${gateId}:1`,
    outcome: 'PASS',
    claimedAt: '2026-08-13T08:00:00.000Z',
    startedAt: '2026-08-13T08:00:00.000Z',
    finishedAt: '2026-08-13T08:00:01.000Z',
    durationMs: 1_000,
    exitCode: 0,
  };
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
    exactMainEvidence: {
      gitHead: headSha,
      surface: 'repository',
      expectedGateIds: [],
      receipts: [],
    },
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

function currentPrSource(artifacts: MilestoneClusterArtifacts): MilestonePrSource {
  const state = artifacts.state as Record<string, unknown>;
  const leaf = (state.leaves as Record<string, unknown>[])[0];
  return prSource([{
    number: leaf.prNumber as number,
    issueNumbers: leaf.issueNumbers as number[],
    lane: leaf.lane as LiveMilestonePr['lane'],
    baseBranch: leaf.baseBranch as string,
    headSha: leaf.headSha as string,
    state: 'open',
    role: 'leaf',
  }]);
}

function validateArtifacts(
  artifacts: MilestoneClusterArtifacts,
  source: MilestonePrSource = currentPrSource(artifacts),
) {
  return validateMilestoneCluster(artifacts, source);
}

async function expectRed(
  mutate: (artifacts: MutableArtifacts) => void | Promise<void>,
  expected: string,
): Promise<void> {
  const artifacts = await validArtifacts();
  await mutate(artifacts);
  const result = await validateArtifacts(artifacts as MilestoneClusterArtifacts);
  assertEquals(result.ok, false);
  assertStringIncludes(result.errors.join('\n'), expected);
}

Deno.test('valid milestone cluster passes the Step 0 and control-plane contract', async () => {
  const artifacts = await validArtifacts();
  const result = await validateArtifacts(artifacts);
  assert(result.ok, result.errors.join('\n'));
  assertEquals(result.errors, []);
  assertEquals(result.findings, []);
});

Deno.test('RED: an allocated leaf with a stale live PR head is a structured finding', async () => {
  const artifacts = await validArtifacts();
  const recordedHead = (artifacts.state.leaves as Record<string, unknown>[])[0].headSha as string;
  const liveHead = 'c'.repeat(40);
  const result = await validateArtifacts(
    artifacts,
    prSource([{
      number: 200,
      issueNumbers: [101],
      lane: 'fixes',
      baseBranch: 'main',
      headSha: liveHead,
      state: 'open',
      role: 'leaf',
    }]),
  );

  assertEquals(result.ok, false);
  assertEquals(result.findings, [{
    kind: 'stale-head',
    issueNumber: 101,
    prNumber: 200,
    lane: 'fixes',
    recordedHead,
    liveHead,
  }]);
});

Deno.test('RED: an open milestone PR absent from cluster leaves is a structured finding', async () => {
  const artifacts = await validArtifacts();
  const recordedHead = (artifacts.state.leaves as Record<string, unknown>[])[0].headSha as string;
  const missingHead = 'd'.repeat(40);
  const result = await validateArtifacts(
    artifacts,
    prSource([
      {
        number: 200,
        issueNumbers: [101],
        lane: 'fixes',
        baseBranch: 'main',
        headSha: recordedHead,
        state: 'open',
        role: 'leaf',
      },
      {
        number: 201,
        issueNumbers: [101],
        lane: 'fixes',
        baseBranch: 'main',
        headSha: missingHead,
        state: 'open',
        role: 'leaf',
      },
    ]),
  );

  assertEquals(result.ok, false);
  assertEquals(result.findings, [{
    kind: 'missing-leaf',
    issueNumber: 101,
    prNumber: 201,
    lane: 'fixes',
    recordedHead: null,
    liveHead: missingHead,
  }]);
});

Deno.test('coordinator artifact PRs are explicitly excluded from missing-leaf findings', async () => {
  const artifacts = await validArtifacts();
  const recordedHead = (artifacts.state.leaves as Record<string, unknown>[])[0].headSha as string;
  const result = await validateArtifacts(
    artifacts,
    prSource([
      {
        number: 200,
        issueNumbers: [101],
        lane: 'fixes',
        baseBranch: 'main',
        headSha: recordedHead,
        state: 'open',
        role: 'leaf',
      },
      {
        number: 201,
        issueNumbers: [],
        lane: null,
        baseBranch: 'main',
        headSha: 'd'.repeat(40),
        state: 'open',
        role: 'coordinator-artifact',
      },
    ]),
  );

  assert(result.ok, result.errors.join('\n'));
  assertEquals(result.findings, []);
});

Deno.test('a merged leaf is excluded from live-head reconciliation', async () => {
  const artifacts = await validArtifacts();
  const leaf = (artifacts.state.leaves as Record<string, unknown>[])[0];
  leaf.phase = 'merged';
  artifacts.status = await renderMilestoneStatus(artifacts.state);
  const result = await validateArtifacts(
    artifacts,
    prSource([{
      number: leaf.prNumber as number,
      issueNumbers: leaf.issueNumbers as number[],
      lane: leaf.lane as LiveMilestonePr['lane'],
      baseBranch: 'main',
      headSha: 'c'.repeat(40),
      state: 'merged',
      role: 'leaf',
    }]),
  );

  assert(result.ok, result.errors.join('\n'));
  assertEquals(result.findings, []);
});

Deno.test('an unavailable PR source fails closed with a structured finding', async () => {
  const artifacts = await validArtifacts();
  const result = await validateMilestoneCluster(artifacts);

  assertEquals(result.ok, false);
  assertEquals(result.errors, []);
  assertEquals(result.findings[0]?.kind, 'source-unavailable');
  assertEquals(result.findings[0]?.issueNumber, null);
  assertEquals(result.findings[0]?.prNumber, null);
  assertStringIncludes(result.findings[0]?.detail ?? '', 'was not provided');
});

Deno.test('the read-only PR export provides both listing and head-reading operations', async () => {
  const pullRequest = {
    number: 200,
    issueNumbers: [101],
    lane: 'fixes',
    baseBranch: 'main',
    headSha: 'b'.repeat(40),
    state: 'open',
    role: 'leaf',
  } as const;
  const source = milestonePrSourceFromExport({
    schemaVersion: 1,
    repo: 'rickylabs/netscript',
    milestone: '0.0.7',
    capturedAt: '2026-08-31T03:00:00.000Z',
    pullRequests: [pullRequest],
  });

  assertEquals(await source.listOpenMilestonePrs('rickylabs/netscript', '0.0.7'), [pullRequest]);
  assertEquals(await source.readPrHead('rickylabs/netscript', 200), pullRequest);
});

Deno.test('RED: missing intake artifact fails closed', async () => {
  const artifacts = await validArtifacts();
  const malformed = { ...artifacts, intake: null };
  const result = await validateMilestoneCluster(malformed, currentPrSource(artifacts));
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
  await expectRed((artifacts) => {
    (artifacts.state.watchers as Record<string, unknown>[])[0].agentId = 'fixes-orch';
  }, 'cannot also be a lane orchestrator');
});

Deno.test('RED: inventory lane must agree with state lane ownership', async () => {
  await expectRed((artifacts) => {
    const issue = (artifacts.inventory.issues as Record<string, unknown>[])[0];
    issue.lane = 'features';
  }, 'disagrees with cluster state');
});

Deno.test('RED: DAG issue nodes require active inventory backing', async () => {
  await expectRed((artifacts) => {
    (artifacts.dag.nodes as Record<string, unknown>[]).push({
      id: 'issue:999',
      kind: 'issue',
      issueNumber: 999,
    });
    (artifacts.dag.waves as Record<string, unknown>[]).push({
      index: 1,
      nodeIds: ['issue:999'],
    });
  }, 'has no active inventory backing');
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

Deno.test('release captain requires recomputed exact-main receipt sufficiency', async () => {
  const artifacts = await validArtifacts();
  const head = artifacts.state.currentMainSha as string;
  (artifacts.state.committedIssues as Record<string, unknown>[])[0].state = 'closed';
  (artifacts.state.leaves as Record<string, unknown>[])[0].phase = 'merged';
  artifacts.state.exactMainEvidence = {
    gitHead: head,
    surface: 'repository',
    expectedGateIds: ['check'],
    receipts: [gateReceipt('check', head)],
  };
  artifacts.state.releaseWriters = ['captain'];
  artifacts.state.releaseCaptain = {
    state: 'claimed',
    agentId: 'captain',
    leaseId: 'lease-1',
    contentSha: head,
    evidence: [],
  };
  artifacts.status = await renderMilestoneStatus(artifacts.state);
  const result = await validateArtifacts(artifacts);
  assert(result.ok, result.errors.join('\n'));

  const forged = clone(artifacts);
  forged.state.exactMainEvidence = {
    gitHead: head,
    sufficiency: 'SUFFICIENT',
    receiptRefs: ['hand-written'],
  };
  forged.status = await renderMilestoneStatus(forged.state);
  const forgedResult = await validateArtifacts(forged);
  assertEquals(forgedResult.ok, false);
  assertStringIncludes(forgedResult.errors.join('\n'), 'expectedGateIds must not be empty');
});

Deno.test('RED: duplicate exact-main receipts cannot claim the release captain', async () => {
  await expectRed(async (artifacts) => {
    const head = artifacts.state.currentMainSha as string;
    (artifacts.state.committedIssues as Record<string, unknown>[])[0].state = 'closed';
    (artifacts.state.leaves as Record<string, unknown>[])[0].phase = 'merged';
    artifacts.state.exactMainEvidence = {
      gitHead: head,
      surface: 'repository',
      expectedGateIds: ['check'],
      receipts: [gateReceipt('check', head), gateReceipt('check', head)],
    };
    artifacts.state.releaseWriters = ['captain'];
    artifacts.state.releaseCaptain = {
      state: 'claimed',
      agentId: 'captain',
      leaseId: 'lease-1',
      contentSha: head,
      evidence: [],
    };
    artifacts.status = await renderMilestoneStatus(artifacts.state);
  }, 'duplicate or contradictory receipts');
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
