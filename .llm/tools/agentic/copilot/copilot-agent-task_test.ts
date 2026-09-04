import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { COPILOT_AGENT_TASK_MODEL_IDS, ROUTING_MODEL_IDS } from '../config/models.ts';
import { AGENT_TASK_STATES, agentTaskExitCode, parseAgentTask } from './agent-task-contract.ts';
import {
  dispatchAgentTask,
  getAgentTask,
  preflightAgentTasks,
  watchAgentTask,
} from './copilot-agent-task.ts';

const options = {
  repo: 'owner/repo',
  prompt: 'use harness\n## SKILL\n- netscript-harness',
  model: COPILOT_AGENT_TASK_MODEL_IDS[0],
  baseRef: 'main',
};
Deno.test('Agent Tasks dry-run is pure and live creation always fails before network', () => {
  assertEquals(dispatchAgentTask(options).body.create_pull_request, true);
  assertEquals(dispatchAgentTask(options).dryRun, true);
  for (const extra of [{ live: true }, { live: true, authorizedBy: 'owner', rationale: 'test' }]) {
    assertThrows(
      () => dispatchAgentTask({ ...options, ...extra }),
      Error,
      'Live Agent Tasks creation is disabled',
    );
  }
  for (
    const extra of [
      { model: 'auto' },
      { model: ROUTING_MODEL_IDS.kimiK3Copilot },
      { baseRef: '' },
      { repo: 'a/b,c/d' },
    ]
  ) assertThrows(() => dispatchAgentTask({ ...options, ...extra }));
});

Deno.test('Agent Tasks parses all eight states and documented sessions/artifacts only', () => {
  for (const state of AGENT_TASK_STATES) {
    const task = parseAgentTask({
      id: 'task-1',
      state,
      prompt: 'never-retain',
      sessions: [{
        id: 'session-1',
        model: COPILOT_AGENT_TASK_MODEL_IDS[0],
        base_ref: 'main',
        head_ref: 'copilot/test',
        prompt: 'never-retain',
      }],
      artifacts: [{ provider: 'github', type: 'pull', data: { id: 42 } }],
    });
    assertEquals(task.state, state);
    assertEquals(task.pullRequests, [42]);
    assertEquals(task.ciApproval, 'human_approval_required');
    assertEquals(task.sessions[0].base_ref, 'main');
    assertEquals(JSON.stringify(task).includes('never-retain'), false);
  }
  assertThrows(() => parseAgentTask({ id: 'task-1', state: 'surprise' }));
  assertThrows(() => parseAgentTask({ id: 'task-1', state: 'completed', sessions: {} }));
});

Deno.test('Agent Tasks read capability is non-billable and bearer never enters output', async () => {
  const dependencies = {
    token: () => Promise.resolve('never-retain'),
    fetch: (_input: RequestInfo | URL, init?: RequestInit) => {
      assertEquals(init?.method, 'GET');
      assertEquals(new Headers(init?.headers).get('authorization'), 'Bearer never-retain');
      return Promise.resolve(Response.json({ tasks: [] }));
    },
  };
  assertEquals(await preflightAgentTasks('owner/repo', dependencies), {
    readCapability: true,
    liveCreation: 'disabled',
  });
  await assertRejects(
    () =>
      getAgentTask('owner/repo', 'task-1', {
        ...dependencies,
        fetch: () => Promise.resolve(Response.json({ id: 'wrong', state: 'completed' })),
      }),
    Error,
    'identity mismatch',
  );
});

Deno.test('Agent Tasks watch exits terminal/human states and bounds idle polling', async () => {
  for (
    const state of ['completed', 'failed', 'timed_out', 'cancelled', 'waiting_for_user'] as const
  ) {
    const result = await watchAgentTask('owner/repo', 'task-1', 1000, {
      token: () => Promise.resolve('opaque'),
      fetch: () => Promise.resolve(Response.json({ id: 'task-1', state })),
    });
    assertEquals(result.code, agentTaskExitCode(state));
  }
  let time = 0;
  let calls = 0;
  const result = await watchAgentTask('owner/repo', 'task-1', 1000, {
    token: () => Promise.resolve('opaque'),
    now: () => time,
    sleep: (ms) => {
      time += ms;
      return Promise.resolve();
    },
    fetch: () => {
      calls++;
      return Promise.resolve(Response.json({ id: 'task-1', state: 'idle' }));
    },
  });
  assertEquals(result.code, 2);
  assertEquals(calls, 1);
  await assertRejects(() => watchAgentTask('owner/repo', 'task-1', 0));
});
