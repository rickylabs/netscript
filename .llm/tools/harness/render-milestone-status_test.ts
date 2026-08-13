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
