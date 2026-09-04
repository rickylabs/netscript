/** Preview Agent Tasks contract, distinct from OpenCode connector model capabilities. */
import { COPILOT_AGENT_TASK_MODEL_IDS } from '../config/models.ts';

export const AGENT_TASK_STATES = [
  'queued',
  'in_progress',
  'completed',
  'failed',
  'idle',
  'waiting_for_user',
  'timed_out',
  'cancelled',
] as const;
export type AgentTaskState = typeof AGENT_TASK_STATES[number];
export interface AgentTaskRequest {
  readonly prompt: string;
  readonly model: typeof COPILOT_AGENT_TASK_MODEL_IDS[number];
  readonly base_ref: string;
  readonly create_pull_request: true;
}
export interface AgentTask {
  readonly id: string;
  readonly state: AgentTaskState;
  readonly sessions: readonly {
    id: string;
    model: string | null;
    base_ref: string | null;
    head_ref: string | null;
  }[];
  readonly pullRequests: readonly number[];
  readonly ciApproval: 'human_approval_required';
}

/** Refuses absent/auto/connector models and implicit base refs before any network. */
export function agentTaskRequest(prompt: string, model: string, baseRef: string): AgentTaskRequest {
  if (
    !prompt.trim() || !baseRef.trim() || /\s|\.\.|[~^:?*\[\\]/.test(baseRef) ||
    !COPILOT_AGENT_TASK_MODEL_IDS.includes(model as typeof COPILOT_AGENT_TASK_MODEL_IDS[number])
  ) {
    throw new Error(
      'Agent Task requires prompt, explicit supported cloud model, and safe base_ref',
    );
  }
  return {
    prompt,
    model: model as AgentTaskRequest['model'],
    base_ref: baseRef,
    create_pull_request: true,
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('invalid Agent Task shape');
  }
  return value as Record<string, unknown>;
}
function textOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error('invalid Agent Task field');
  return value;
}

/** Normalizes only documented task/session/artifact fields, dropping prompt and arbitrary bodies. */
export function parseAgentTask(value: unknown): AgentTask {
  const task = record(value);
  if (
    typeof task.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(task.id) ||
    !AGENT_TASK_STATES.includes(task.state as AgentTaskState)
  ) throw new Error('invalid Agent Task identity/state');
  if (task.sessions !== undefined && !Array.isArray(task.sessions)) {
    throw new Error('invalid sessions');
  }
  if (task.artifacts !== undefined && !Array.isArray(task.artifacts)) {
    throw new Error('invalid artifacts');
  }
  const sessions = (task.sessions as unknown[] ?? []).map((entry) => {
    const session = record(entry);
    if (typeof session.id !== 'string') throw new Error('invalid session identity');
    return {
      id: session.id,
      model: textOrNull(session.model),
      base_ref: textOrNull(session.base_ref),
      head_ref: textOrNull(session.head_ref),
    };
  });
  const pullRequests = (task.artifacts as unknown[] ?? []).flatMap((entry) => {
    const artifact = record(entry);
    if (artifact.provider !== 'github' || artifact.type !== 'pull') return [];
    const id = record(artifact.data).id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error('invalid PR artifact');
    }
    return [id];
  });
  return {
    id: task.id,
    state: task.state as AgentTaskState,
    sessions,
    pullRequests,
    ciApproval: 'human_approval_required',
  };
}

/** Terminal/human-action exit codes; null means bounded watching may continue. */
export function agentTaskExitCode(state: AgentTaskState): number | null {
  if (state === 'completed') return 0;
  if (state === 'waiting_for_user') return 12;
  if (state === 'failed') return 10;
  if (state === 'timed_out' || state === 'cancelled') return 13;
  return null;
}
