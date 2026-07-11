import {
  DEFAULT_TOPIC,
  type JobDefinition,
  type JobMessage,
  type TaskDefinition,
  type TaskExecutionOptions,
} from '@netscript/plugin-workers-core/runtime';
import { toFileUrl } from '@std/path';
import type { WorkerDispatchContext, WorkerJobResult } from './worker-options.ts';

/** Execute a worker job with the correct runtime strategy. */
export async function executeWorkerJob(
  context: WorkerDispatchContext,
  jobDef: JobDefinition,
  payload: Record<string, unknown> | undefined,
  signal: AbortSignal,
  traceHeaders: Record<string, string>,
  correlationId?: string,
): Promise<WorkerJobResult> {
  const executionType = jobDef.executionType ?? 'deno';
  if (executionType === 'deno') {
    return await executeDenoJob(context, jobDef, payload, traceHeaders, correlationId);
  }
  return await executePolyglotTask(context, jobDef, payload, signal, traceHeaders);
}

async function executeDenoJob(
  context: WorkerDispatchContext,
  jobDef: JobDefinition,
  payload: Record<string, unknown> | undefined,
  traceHeaders: Record<string, string>,
  correlationId?: string,
): Promise<WorkerJobResult> {
  const entrypoint = resolveDenoEntrypoint(context, jobDef);

  console.log(
    `[Worker ${context.workerId}] Executing job '${jobDef.id}' via WorkerPool, entrypoint: ${entrypoint}`,
  );

  const message: JobMessage = {
    jobId: jobDef.id,
    topic: jobDef.topic ?? DEFAULT_TOPIC,
    priority: jobDef.priority ?? 50,
    triggeredBy: 'queue',
    triggeredAt: new Date().toISOString(),
    payload,
    correlationId,
    traceparent: traceHeaders['traceparent'],
    tracestate: traceHeaders['tracestate'],
  };

  const result = await context.workerPool.executeJob(message, {
    ...jobDef,
    entrypoint,
  });
  const resultData = result.data ? result.data as Record<string, unknown> : undefined;

  return {
    success: result.success,
    exitCode: result.success ? 0 : 1,
    result: resultData,
    error: result.success ? undefined : (result as { error: string }).error,
  };
}

function resolveDenoEntrypoint(
  context: WorkerDispatchContext,
  jobDef: JobDefinition,
): string {
  const jobEntrypoint = jobDef.entrypoint ?? './index.ts';
  if (jobEntrypoint.startsWith('/') || jobEntrypoint.match(/^[A-Za-z]:[/\\]/)) {
    return toLocalModuleSpecifier(jobEntrypoint);
  }

  const cwd = Deno.cwd();
  let projectRoot = Deno.env.get('NETSCRIPT_PROJECT_ROOT') ?? cwd;

  if (!Deno.env.get('NETSCRIPT_PROJECT_ROOT')) {
    if (cwd.endsWith('/workers') || cwd.endsWith('\\workers')) {
      projectRoot = cwd.replace(/[/\\]workers$/, '');
    }
  }

  console.log(
    `[Worker ${context.workerId}] Resolving entrypoint for job '${jobDef.id}': source=${jobDef.source}, entrypoint=${jobEntrypoint}, projectRoot=${projectRoot}`,
  );

  if (jobDef.source === 'plugin') {
    const entrypoint = jobEntrypoint.startsWith('./')
      ? `${projectRoot}/${jobEntrypoint.slice(2)}`
      : `${projectRoot}/${jobEntrypoint}`;
    console.log(`[Worker ${context.workerId}] Plugin job resolved to: ${entrypoint}`);
    return toLocalModuleSpecifier(entrypoint);
  }

  let resolvedJobsDir = context.jobsDir;
  if (resolvedJobsDir.startsWith('./')) {
    resolvedJobsDir = `${projectRoot}/${resolvedJobsDir.slice(2)}`;
  } else if (!resolvedJobsDir.startsWith('/') && !resolvedJobsDir.match(/^[A-Za-z]:[/\\]/)) {
    resolvedJobsDir = `${projectRoot}/${resolvedJobsDir}`;
  }

  const entrypoint = jobEntrypoint.startsWith('./')
    ? `${resolvedJobsDir}/${jobEntrypoint.slice(2)}`
    : `${resolvedJobsDir}/${jobEntrypoint}`;
  return toLocalModuleSpecifier(entrypoint);
}

function toLocalModuleSpecifier(pathOrSpecifier: string): string {
  const normalized = pathOrSpecifier.replace(/\\/g, '/');
  if (/^(?:blob|data|file|https?|jsr|npm):/.test(normalized)) {
    return normalized;
  }
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    return toFileUrl(normalized).href;
  }
  return normalized;
}

async function executePolyglotTask(
  context: WorkerDispatchContext,
  jobDef: JobDefinition,
  payload: Record<string, unknown> | undefined,
  signal: AbortSignal,
  traceHeaders: Record<string, string>,
): Promise<WorkerJobResult> {
  const entrypoint = resolveTaskEntrypoint(context, jobDef);
  const taskDef: TaskDefinition = {
    id: `${jobDef.id}-execution` as TaskDefinition['id'],
    name: jobDef.name,
    description: jobDef.description,
    type: (jobDef.executionType ?? 'deno') as TaskDefinition['type'],
    source: jobDef.source as TaskDefinition['source'],
    topic: jobDef.topic ?? DEFAULT_TOPIC,
    entrypoint,
    timeout: jobDef.timeout,
    maxRetries: jobDef.maxRetries,
    retryDelay: jobDef.retryDelay ?? 1000,
    maxConcurrency: jobDef.maxConcurrency ?? 1,
    priority: jobDef.priority,
    timezone: jobDef.timezone ?? 'UTC',
    tags: jobDef.tags,
    args: [],
    permissions: normalizePermissions(jobDef),
    env: {
      JOB_ID: jobDef.id,
      JOB_PAYLOAD: payload ? JSON.stringify(payload) : '{}',
    },
    metadata: jobDef.metadata,
    enabled: jobDef.enabled ?? true,
    persist: true,
  };

  const execOptions: TaskExecutionOptions = {
    timeout: jobDef.timeout,
    signal,
    traceparent: traceHeaders['traceparent'],
    tracestate: traceHeaders['tracestate'],
    env: {
      JOB_ID: jobDef.id,
      JOB_PAYLOAD: payload ? JSON.stringify(payload) : '{}',
      ...(traceHeaders['traceparent'] ? { TRACEPARENT: traceHeaders['traceparent'] } : {}),
      ...(traceHeaders['tracestate'] ? { TRACESTATE: traceHeaders['tracestate'] } : {}),
    },
  };

  const result = await context.taskExecutor.execute(taskDef, execOptions);
  let resultData = result.result ?? undefined;
  if (!result.success) {
    const diagnostics: Record<string, unknown> = { ...resultData };
    if (result.stderr) {
      diagnostics.stderr = result.stderr;
    }
    if (result.stdout) {
      diagnostics.stdout = result.stdout;
    }
    if (Object.keys(diagnostics).length > 0) {
      resultData = diagnostics;
    }
  }

  return {
    success: result.success,
    exitCode: result.exitCode ?? undefined,
    result: resultData,
    error: result.error ?? undefined,
  };
}

function resolveTaskEntrypoint(context: WorkerDispatchContext, jobDef: JobDefinition): string {
  const jobEntrypoint = jobDef.entrypoint ?? './index.ts';
  const tasksDir = Deno.env.get('NETSCRIPT_TASKS_DIR');

  if (tasksDir && jobEntrypoint.startsWith('./')) {
    let filename = jobEntrypoint.slice(2);
    if (filename.startsWith('tasks/')) {
      filename = filename.slice(6);
    }
    const entrypoint = `${tasksDir}/${filename}`;
    const runtimeType = jobDef.executionType ?? 'deno';
    return runtimeType === 'deno' && entrypoint.endsWith('.ts')
      ? entrypoint.replace(/\.ts$/, '.js')
      : entrypoint;
  }

  if (jobEntrypoint.startsWith('./')) {
    return `${context.jobsDir}/${jobEntrypoint.slice(2)}`;
  }
  return jobEntrypoint;
}

function normalizePermissions(jobDef: JobDefinition): TaskDefinition['permissions'] | undefined {
  const permissions = jobDef.permissions;
  return permissions
    ? {
      net: permissions.net ?? false,
      read: permissions.read ?? false,
      write: permissions.write ?? false,
      env: permissions.env ?? false,
      run: permissions.run ?? false,
      ffi: permissions.ffi ?? false,
      import: permissions.import,
    }
    : undefined;
}
