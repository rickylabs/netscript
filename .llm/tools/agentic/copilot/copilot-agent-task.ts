/** Dry-run and read-only Agent Tasks CLI. Live creation is intentionally unavailable. */
import { COPILOT_AGENT_TASKS_PATH, GITHUB_API_BASE_URL } from '../config/endpoints.ts';
import { resolveGithubToken } from '../lib/agentic-lib.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import {
  type AgentTask,
  agentTaskExitCode,
  agentTaskRequest,
  parseAgentTask,
} from './agent-task-contract.ts';

export interface AgentTaskDependencies {
  readonly fetch?: typeof fetch;
  readonly token?: () => Promise<string>;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
}

function endpoint(repo: string, taskId?: string): string {
  const parts = repo.split('/');
  if (
    parts.length !== 2 ||
    parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part) || part === '.' || part === '..')
  ) {
    throw new Error('exactly one owner/repository is required');
  }
  if (taskId !== undefined && !/^[a-zA-Z0-9_-]+$/.test(taskId)) throw new Error('invalid task ID');
  return GITHUB_API_BASE_URL +
    COPILOT_AGENT_TASKS_PATH.replace('{owner}', parts[0]).replace('{repo}', parts[1]) +
    (taskId === undefined ? '' : `/${taskId}`);
}

/** Renders the exact proposed create body with zero network or token acquisition. */
export function dispatchAgentTask(options: {
  repo: string;
  prompt: string;
  model: string;
  baseRef: string;
  live?: boolean;
  authorizedBy?: string;
  rationale?: string;
}): {
  dryRun: true;
  url: string;
  body: ReturnType<typeof agentTaskRequest>;
  liveCreation: 'disabled';
} {
  const url = endpoint(options.repo);
  const body = agentTaskRequest(options.prompt, options.model, options.baseRef);
  if (options.live) {
    throw new Error(
      'Live Agent Tasks creation is disabled: Pro+/unknown entitlement is ineligible; future enablement requires validated Business/Enterprise entitlement and owner authorization',
    );
  }
  return { dryRun: true, url, body, liveCreation: 'disabled' };
}

async function read(
  url: string,
  dependencies: AgentTaskDependencies,
  timeoutMs: number,
): Promise<unknown> {
  const signal = AbortSignal.timeout(Math.max(1, timeoutMs));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let token: string;
  try {
    token = await Promise.race([
      (dependencies.token ?? (async () => (await resolveGithubToken()).token))(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Agent Tasks token timeout')), timeoutMs);
      }),
    ]);
  } catch {
    throw new Error('Agent Tasks token unavailable or timed out');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  if (signal.aborted) throw new Error('Agent Tasks read timed out');
  let response: Response;
  try {
    response = await (dependencies.fetch ?? fetch)(url, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
      },
      signal,
      redirect: 'error',
    });
  } catch {
    throw new Error('Agent Tasks read failed');
  }
  if (!response.ok) throw new Error(`Agent Tasks read HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error('invalid Agent Tasks JSON');
  }
}

/** Non-billable read-permission check; it does not establish create entitlement. */
export async function preflightAgentTasks(
  repo: string,
  dependencies: AgentTaskDependencies = {},
): Promise<{ readCapability: true; liveCreation: 'disabled' }> {
  const value = await read(endpoint(repo) + '?per_page=1', dependencies, 15_000);
  if (!value || typeof value !== 'object' || !Array.isArray((value as { tasks?: unknown }).tasks)) {
    throw new Error('invalid Agent Tasks list');
  }
  return { readCapability: true, liveCreation: 'disabled' };
}

/** Fetches one scoped task with a bounded request and redacted normalized output. */
export async function getAgentTask(
  repo: string,
  id: string,
  dependencies: AgentTaskDependencies = {},
  timeoutMs = 15_000,
): Promise<AgentTask> {
  const task = parseAgentTask(await read(endpoint(repo, id), dependencies, timeoutMs));
  if (task.id !== id) throw new Error('Agent Task response identity mismatch');
  return task;
}

/** Stops at terminal/human-action states or the explicit timeout; never cancels/steers. */
export async function watchAgentTask(
  repo: string,
  id: string,
  timeoutMs: number,
  dependencies: AgentTaskDependencies = {},
): Promise<{ code: number; task: AgentTask | null }> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 59 * 60_000) {
    throw new Error('watch timeout must be positive and at most 59 minutes');
  }
  const now = dependencies.now ?? Date.now;
  const sleep = dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + timeoutMs;
  let task: AgentTask | null = null;
  while (now() < deadline) {
    task = await getAgentTask(repo, id, dependencies, Math.min(15_000, deadline - now()));
    const code = agentTaskExitCode(task.state);
    if (code !== null) return { code, task };
    await sleep(Math.min(5_000, Math.max(0, deadline - now())));
  }
  return { code: 2, task };
}

/** Thin CLI parser shared by task aliases; unknown/duplicate flags fail closed. */
export async function agentTaskMain(args: string[]): Promise<number> {
  args = normalizeTaskArguments(args);
  if (args.includes('--help')) {
    await Deno.stdout.write(
      new TextEncoder().encode(
        'copilot-task dispatch --repo owner/name --prompt text --model cloud-model --base-ref branch\ncopilot-task status|watch --repo owner/name --task-id id [--timeout-ms N]\ncopilot-task preflight --repo owner/name\nLive creation is disabled; status/watch are read-only.\n',
      ),
    );
    return 0;
  }
  const command = args.shift();
  const flags = new Map<string, string>();
  const allowed = new Set([
    '--repo',
    '--prompt',
    '--model',
    '--base-ref',
    '--task-id',
    '--timeout-ms',
    '--authorized-by',
    '--rationale',
  ]);
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flags.has(flag)) throw new Error('duplicate flag');
    if (flag === '--live') {
      flags.set(flag, 'true');
      continue;
    }
    if (!allowed.has(flag) || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('unknown flag or missing value');
    }
    flags.set(flag, args[++i]);
  }
  const repo = flags.get('--repo') ?? '';
  let result: unknown;
  let code = 0;
  if (command === 'dispatch') {
    result = dispatchAgentTask({
      repo,
      prompt: flags.get('--prompt') ?? '',
      model: flags.get('--model') ?? '',
      baseRef: flags.get('--base-ref') ?? '',
      live: flags.has('--live'),
      authorizedBy: flags.get('--authorized-by'),
      rationale: flags.get('--rationale'),
    });
  } else if (command === 'status') result = await getAgentTask(repo, flags.get('--task-id') ?? '');
  else if (command === 'preflight') result = await preflightAgentTasks(repo);
  else if (command === 'watch') {
    const watched = await watchAgentTask(
      repo,
      flags.get('--task-id') ?? '',
      Number(flags.get('--timeout-ms') ?? 3300000),
    );
    result = watched;
    code = watched.code;
  } else throw new Error('expected dispatch, status, watch, or preflight');
  await Deno.stdout.write(new TextEncoder().encode(JSON.stringify(result) + '\n'));
  return code;
}

if (import.meta.main) {
  try {
    Deno.exit(await agentTaskMain(Deno.args));
  } catch (error) {
    await Deno.stderr.write(
      new TextEncoder().encode(
        (error instanceof Error ? error.message : 'Agent Tasks failed') + '\n',
      ),
    );
    Deno.exit(2);
  }
}
