import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  parseRenderCliArgs,
  renderMilestoneStatus,
  stateDigest,
} from './render-milestone-status.ts';

Deno.test('render CLI accepts the deno task separator and rejects malformed usage', () => {
  assertEquals(parseRenderCliArgs(['--', '/tmp/run']), {
    runDir: '/tmp/run',
    check: false,
  });
  assertEquals(parseRenderCliArgs(['--check', '--', '/tmp/run']), {
    runDir: '/tmp/run',
    check: true,
  });
  assertStringIncludes(parseRenderCliArgs(['--']).error ?? '', 'missing run directory');
  assertStringIncludes(parseRenderCliArgs(['a', 'b']).error ?? '', 'exactly one');
});

Deno.test('milestone status is deterministic and carries a state digest', async () => {
  const state = {
    updatedAt: '2026-08-13T00:00:00Z',
    milestone: '0.0.7',
    currentMainSha: 'a'.repeat(40),
    lanes: [{ id: 'docs', orchestratorAgentId: 'docs', issueNumbers: [1] }],
    leaves: [],
    expensiveGates: [],
    canaryCheckpoints: [],
    releaseCaptain: { state: 'inactive', agentId: null },
  };
  const reordered = {
    releaseCaptain: state.releaseCaptain,
    canaryCheckpoints: state.canaryCheckpoints,
    expensiveGates: state.expensiveGates,
    leaves: state.leaves,
    lanes: state.lanes,
    currentMainSha: state.currentMainSha,
    milestone: state.milestone,
    updatedAt: state.updatedAt,
  };
  assertEquals(await stateDigest(state), await stateDigest(reordered));
  const rendered = await renderMilestoneStatus(state);
  assertStringIncludes(rendered, `milestone-cluster-state-sha256: ${await stateDigest(state)}`);
  assertStringIncludes(rendered, '| docs | docs | 1 | 0 | 0 |');
});

Deno.test('schema-v2 milestone status renders the legible coordinator report', async () => {
  const head = 'b'.repeat(40);
  const state = {
    schemaVersion: 2,
    updatedAt: '2026-09-02T12:00:00.000Z',
    milestone: '0.0.7',
    currentMainSha: head,
    lanes: [{ id: 'fixes', orchestratorAgentId: 'fixes', issueNumbers: [101] }],
    leaves: [],
    expensiveGates: [],
    canaryCheckpoints: [],
    releaseCaptain: { state: 'inactive', agentId: null },
    reporting: {
      lastReportAt: '2026-09-02T12:00:00.000Z',
      nextReportDueAt: '2026-09-02T13:00:00.000Z',
      lastReportRef: 'worklog.md#status',
      headline: 'Canary 6 is qualifying; one bounded runtime repair remains.',
      currentMainSha: head,
      canary: {
        target: '0.0.7-canary.6',
        state: 'qualifying',
        eta: { window: '2–4 hours', confidence: 'medium', basis: 'Two serial gates remain.' },
        criticalPath: [{
          id: '#1760 cleanup',
          state: 'repairing',
          impact: 'blocks canary',
          nextAction: 'wait, force, and re-probe',
        }],
      },
      progress: {
        mergedPullRequests: [1917, 1915],
        closedIssues: [1905],
        newIssues: [1926],
        queueDeltaExplanation: 'Two merges consumed while one scoped repair entered.',
      },
      scope: {
        openIssueCount: 1,
        ownedIssueCount: 1,
        scheduledIssueCount: 1,
        unscheduledIssueNumbers: [],
        openPullRequestCount: 2,
      },
      mergeQueue: [{
        prNumber: 1895,
        lane: 'features',
        state: 'runtime running',
        nextGate: 'dual-tier result',
        nextAction: 'merge on exact green',
      }],
      blockers: [{
        id: 'B-1',
        category: 'test-harness',
        summary: 'One owned container survived the first stop probe.',
        impact: 'holds S10 only',
        owner: 'aspire',
        nextAction: 'add bounded force cleanup',
        ownerDecisionRequired: false,
      }],
      orchestratorMatrix: [{
        lane: 'fixes',
        state: 'active',
        activeItems: [1926],
        lastConcreteProgressAt: '2026-09-02T11:55:00.000Z',
        blocker: null,
        nextAction: 'push the dependency repair',
      }],
      environment: {
        checkedAt: '2026-09-02T12:00:00.000Z',
        aspireApplications: 0,
        dockerContainers: 0,
        dockerCustomNetworks: 0,
      },
      ownerDecisions: [],
    },
  };

  const rendered = await renderMilestoneStatus(state);
  assertStringIncludes(rendered, '## Canary / release path');
  assertStringIncludes(rendered, 'ETA: 2–4 hours (medium confidence)');
  assertStringIncludes(rendered, '## Next merge queue');
  assertStringIncludes(rendered, '| #1895 | features | runtime running | dual-tier result |');
  assertStringIncludes(rendered, '## Current blockers');
  assertStringIncludes(rendered, '## Orchestrator matrix');
  assertStringIncludes(rendered, '_No owner decision needed._');
});
