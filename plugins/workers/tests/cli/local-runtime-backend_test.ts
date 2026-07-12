import { assertEquals, assertStringIncludes } from '@std/assert';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import type {
  TaskDefinition,
  TaskExecutionOptions,
  TaskResult,
} from '@netscript/plugin-workers-core/executor';
import {
  AddTaskCommand,
  ExecutionsCommand,
  ListJobsCommand,
  RemoveJobCommand,
  RunTaskCommand,
  ShowJobCommand,
  TriggerJobCommand,
  UpdateJobCommand,
} from '../../src/cli/commands.ts';
import { LocalWorkersRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';
import type {
  WorkersRuntimeApiClient,
  WorkersRuntimeRequest,
} from '../../src/cli/adapters/runtime-api-client.ts';

Deno.test('workers runtime verbs call durable routes with filters and payloads', async () => {
  const runtime = new RecordingRuntimeClient();
  const backend = new LocalWorkersRuntimeBackend({ files: new MemoryProjectFiles(), runtime });

  const executions = await backend.handle(new ExecutionsCommand().definition, {
    command: 'executions',
    flags: { limit: 7, status: 'failed', json: true },
  });
  const trigger = await backend.handle(new TriggerJobCommand().definition, {
    command: 'trigger',
    values: ['reserve-inventory'],
    flags: { payload: '{"orderId":"ord-1"}' },
  });

  assertEquals(executions.code, 0);
  assertEquals(trigger.code, 0);
  assertEquals(runtime.requests, [
    { path: 'executions', request: { query: { limit: 7, status: 'failed' } } },
    {
      path: 'jobs/reserve-inventory/trigger',
      request: { method: 'POST', body: { payload: { orderId: 'ord-1' } } },
    },
  ]);
});

Deno.test('run-task forwards argv env timeout and streams executor output', async () => {
  const files = new MemoryProjectFiles();
  const executor = new RecordingTaskExecutor();
  const output: string[] = [];
  const backend = new LocalWorkersRuntimeBackend({
    files,
    taskExecutor: executor,
    output: (line, stream) => output.push(`${stream}:${line}`),
  });

  const added = await backend.handle(new AddTaskCommand().definition, {
    command: 'add-task',
    values: ['score-batch'],
    flags: { runtime: 'python', entrypoint: 'scripts/score.py' },
  });
  const run = await backend.handle(new RunTaskCommand().definition, {
    command: 'run-task',
    values: ['score-batch'],
    flags: {
      args: '["--threshold","0.8"]',
      env: '{"MODEL_PATH":"models/scorer.pkl"}',
      timeout: 12_000,
    },
  });

  assertEquals(added.code, 0);
  assertEquals(run.code, 0);
  assertEquals(executor.task, {
    id: 'score-batch',
    type: 'python',
    entrypoint: 'scripts/score.py',
    timeout: undefined,
  });
  assertEquals(executor.options?.args, ['--threshold', '0.8']);
  assertEquals(executor.options?.env, { MODEL_PATH: 'models/scorer.pkl' });
  assertEquals(executor.options?.timeout, 12_000);
  assertEquals(output, ['stdout:scoring', 'stderr:warning']);
  assertStringIncludes(files.contents.get('scripts/score.py') ?? '', 'sys.argv[1:]');
  assertEquals(
    files.contents.has('.netscript/generated/plugin-workers/job-registry.ts'),
    true,
  );
});

Deno.test('worker metadata filters, updates, shows, and removes with registry regeneration', async () => {
  const files = new MemoryProjectFiles(
    new Map([
      [
        'workers/jobs/import-products.ts',
        '// netscript-workers-resource: {"kind":"job","id":"import-products","enabled":true,"entrypoint":"workers/jobs/import-products.ts","topic":"erp"}\nexport default () => {};\n',
      ],
      [
        'workers/jobs/disabled.ts',
        '// netscript-workers-resource: {"kind":"job","id":"disabled","enabled":false,"entrypoint":"workers/jobs/disabled.ts","topic":"erp"}\nexport default () => {};\n',
      ],
    ]),
  );
  const backend = new LocalWorkersRuntimeBackend({ files });

  const listed = await backend.handle(new ListJobsCommand().definition, {
    command: 'list-jobs',
    flags: { topic: 'erp', 'enabled-only': true, json: true },
  });
  assertEquals((listed.data as { jobs: unknown[] }).jobs.length, 1);

  const updated = await backend.handle(new UpdateJobCommand().definition, {
    command: 'update-job',
    values: ['import-products'],
    flags: { topic: 'catalog', tags: 'erp,nightly', enabled: false },
  });
  assertEquals(updated.code, 0);
  const shown = await backend.handle(new ShowJobCommand().definition, {
    command: 'show-job',
    values: ['import-products'],
  });
  assertEquals((shown.data as { job: unknown }).job, {
    kind: 'job',
    id: 'import-products',
    enabled: false,
    entrypoint: 'workers/jobs/import-products.ts',
    topic: 'catalog',
    tags: ['erp', 'nightly'],
  });

  const removed = await backend.handle(new RemoveJobCommand().definition, {
    command: 'remove-job',
    values: ['import-products'],
  });
  assertEquals(removed.code, 0);
  assertEquals(files.contents.has('workers/jobs/import-products.ts'), false);
  assertEquals(
    files.contents.has('.netscript/generated/plugin-workers/job-registry.ts'),
    true,
  );
});

class RecordingRuntimeClient implements WorkersRuntimeApiClient {
  readonly requests: Array<{ path: string; request: WorkersRuntimeRequest }> = [];

  request(path: string, request: WorkersRuntimeRequest = {}): Promise<unknown> {
    this.requests.push({ path, request });
    return Promise.resolve({ ok: true });
  }
}

class RecordingTaskExecutor {
  task?: TaskDefinition;
  options?: TaskExecutionOptions;

  // deno-lint-ignore require-await
  async execute(task: TaskDefinition, options: TaskExecutionOptions = {}): Promise<TaskResult> {
    this.task = task;
    this.options = options;
    options.onStdout?.('scoring');
    options.onStderr?.('warning');
    return {
      taskId: task.id,
      status: 'completed',
      exitCode: 0,
      stdout: 'scoring',
      stderr: 'warning',
      duration: 5,
      success: true,
      error: null,
      result: { scored: true },
      startedAt: '2026-07-12T00:00:00.000Z',
      completedAt: '2026-07-12T00:00:00.005Z',
      attempt: 1,
    };
  }
}

class MemoryProjectFiles implements ProjectFiles {
  readonly projectRoot = '/project';
  readonly contents: Map<string, string>;

  constructor(contents: Map<string, string> = new Map()) {
    this.contents = contents;
  }

  resolve(path: string): string {
    return `${this.projectRoot}/${path}`;
  }

  writeTextFile(path: string, content: string): Promise<void> {
    this.contents.set(path, content);
    return Promise.resolve();
  }

  readTextFile(path: string): Promise<string | undefined> {
    return Promise.resolve(this.contents.get(path));
  }

  removeFile(path: string): Promise<boolean> {
    return Promise.resolve(this.contents.delete(path));
  }

  listFiles(
    path: string,
    extensions: readonly string[] = [],
  ): Promise<readonly ProjectFileEntry[]> {
    const prefix = path ? `${path}/` : '';
    const entries = [...this.contents.entries()]
      .filter(([candidate]) => candidate.startsWith(prefix))
      .filter(([candidate]) =>
        !extensions.length || extensions.some((ext) => candidate.endsWith(ext))
      )
      .map(([relativePath, content]) => ({
        path: this.resolve(relativePath),
        relativePath,
        size: content.length,
      }));
    return Promise.resolve(entries);
  }

  toImportUrl(path: string): string {
    return `file://${this.resolve(path)}`;
  }

  relative(path: string): string {
    return path.replace(`${this.projectRoot}/`, '');
  }
}
