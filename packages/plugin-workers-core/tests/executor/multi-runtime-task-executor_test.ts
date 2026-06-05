import { assertEquals } from '@std/assert';
import { TaskRuntimeAdapter } from '../../src/abstracts/mod.ts';
import type { ResolvedTaskExecutionOptions } from '../../src/executor/mod.ts';
import { MultiRuntimeTaskExecutor } from '../../src/executor/mod.ts';
import type { TaskDefinition, TaskResult, TaskType } from '../../src/domain/mod.ts';

Deno.test('MultiRuntimeTaskExecutor dispatches to adapter by task type', async () => {
  const adapter = new FakeRuntimeAdapter('deno');
  const executor = new MultiRuntimeTaskExecutor({
    adapters: new Map([['deno', adapter]]),
  });

  const result = await executor.execute(taskFixture('deno'), { args: ['--from-options'] });

  assertEquals(result.success, true);
  assertEquals(adapter.calls[0].options.args, ['--from-options']);
});

Deno.test('MultiRuntimeTaskExecutor prefers custom adapters over built-ins', async () => {
  const custom = new FakeRuntimeAdapter(null, 'custom-deno');
  const executor = new MultiRuntimeTaskExecutor({
    adapters: new Map([['deno', new FakeRuntimeAdapter('deno', 'builtin-deno')]]),
    customAdapters: { deno: custom },
  });

  const result = await executor.execute(taskFixture('deno'));

  assertEquals(result.result, { adapter: 'custom-deno' });
});

Deno.test('MultiRuntimeTaskExecutor returns failure result for unsupported runtimes', async () => {
  const executor = new MultiRuntimeTaskExecutor({ adapters: new Map() });
  const result = await executor.execute(taskFixture('missing'));

  assertEquals(result.success, false);
  assertEquals(result.status, 'failed');
  assertEquals(result.exitCode, -1);
});

class FakeRuntimeAdapter extends TaskRuntimeAdapter {
  readonly id: string;
  readonly runtime: TaskType | null;
  readonly calls: Array<{ task: TaskDefinition; options: ResolvedTaskExecutionOptions }> = [];

  constructor(runtime: TaskType | null, id = 'fake-runtime-adapter') {
    super();
    this.runtime = runtime;
    this.id = id;
  }

  supports(task: TaskDefinition): boolean {
    return this.runtime === null || task.type === this.runtime;
  }

  execute(task: TaskDefinition, options: ResolvedTaskExecutionOptions): Promise<TaskResult> {
    this.calls.push({ task, options });
    return Promise.resolve({
      taskId: task.id,
      status: 'completed',
      exitCode: 0,
      stdout: '',
      stderr: '',
      duration: 0,
      success: true,
      error: null,
      result: { adapter: this.id },
      startedAt: new Date(0).toISOString(),
      completedAt: new Date(0).toISOString(),
      attempt: 0,
    });
  }
}

function taskFixture(type: string): TaskDefinition {
  return {
    id: 'task.fixture' as TaskDefinition['id'],
    name: 'Fixture Task',
    type: type as TaskDefinition['type'],
    entrypoint: './task.ts',
    topic: 'default',
    source: 'local',
    args: [],
    timeout: 300000,
    maxRetries: 1,
    priority: 50,
    enabled: true,
    tags: [],
    timezone: 'UTC',
    retryDelay: 1000,
    maxConcurrency: 1,
    persist: true,
  };
}
