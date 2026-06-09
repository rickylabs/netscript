import { DEFAULT_TOPIC, TaskDefinitionSchema } from '../domain/mod.ts';
import type { RegistryKvStore, RegistryOptions } from './registry-options.ts';
import type { RegisterTaskInput, TaskDefinition, TaskSource } from './registry-types.ts';
import { Registry } from './registry.ts';

const TASK_PREFIX = ['workers', 'tasks'] as const;

/** Filters accepted when listing worker tasks. */
export type TaskFilterOptions = Readonly<{
  enabled?: boolean;
  limit?: number;
  pluginId?: string;
  source?: TaskSource;
  type?: string;
}>;

/** KV-backed task registry for runtime composition. */
export class KvTaskRegistry extends Registry<string, TaskDefinition> {
  /** Stable registry identifier. */
  readonly id: string;
  readonly #kv: RegistryKvStore;

  /** Create a KV-backed task registry. */
  constructor(options: RegistryOptions & { kv: RegistryKvStore }) {
    super();
    this.id = options.id ?? 'kv-task-registry';
    this.#kv = options.kv;
  }

  /** Register or replace a task definition by key. */
  async register(key: string, value: TaskDefinition): Promise<void> {
    await this.#kv.set([...TASK_PREFIX, key], value);
  }

  /** Normalize and register a new task definition. */
  async registerTask(input: RegisterTaskInput): Promise<TaskDefinition> {
    const task = normalizeTaskDefinition(input);
    const existing = await this.get(task.id);
    if (existing) {
      throw new Error(`Task with id '${task.id}' already exists`);
    }
    await this.register(task.id, task);
    return task;
  }

  /** Get a task definition by key. */
  async get(key: string): Promise<TaskDefinition | undefined> {
    const entry = await this.#kv.get<TaskDefinition>([...TASK_PREFIX, key]);
    return entry?.value ?? undefined;
  }

  /** List raw registry entries. */
  async entries(): Promise<readonly (readonly [string, TaskDefinition])[]> {
    const result: (readonly [string, TaskDefinition])[] = [];
    for await (const entry of this.#kv.list<TaskDefinition>({ prefix: TASK_PREFIX })) {
      if (entry.value) result.push([String(entry.key.at(-1)), entry.value] as const);
    }
    return result;
  }

  /** List tasks with registry filter options. */
  async list(options: TaskFilterOptions = {}): Promise<readonly TaskDefinition[]> {
    const entries = await this.entries();
    let tasks = entries.map((entry) => entry[1]);
    if (options.enabled !== undefined) {
      tasks = tasks.filter((task) => task.enabled === options.enabled);
    }
    if (options.type) tasks = tasks.filter((task) => task.type === options.type);
    if (options.source) tasks = tasks.filter((task) => task.source === options.source);
    if (options.pluginId) tasks = tasks.filter((task) => task.pluginId === options.pluginId);
    return options.limit ? tasks.slice(0, options.limit) : tasks;
  }

  /** Update an existing task definition. */
  async update(
    taskId: string,
    updates: Partial<Omit<RegisterTaskInput, 'id'>>,
  ): Promise<TaskDefinition> {
    const existing = await this.get(taskId);
    if (!existing) {
      throw new Error(`Task '${taskId}' not found`);
    }
    const updated = normalizeTaskDefinition(
      { ...existing, ...updates, id: taskId } as RegisterTaskInput,
    );
    await this.register(taskId, updated);
    return updated;
  }

  /** Remove a task definition by id. */
  async unregister(taskId: string): Promise<boolean> {
    const existing = await this.get(taskId);
    if (!existing) return false;
    await this.#kv.delete([...TASK_PREFIX, taskId]);
    return true;
  }
}

function normalizeTaskDefinition(input: RegisterTaskInput): TaskDefinition {
  return TaskDefinitionSchema.parse({
    ...input,
    id: input.id ?? crypto.randomUUID(),
    topic: input.topic ?? DEFAULT_TOPIC,
    source: input.source ?? 'local',
    timezone: input.timezone ?? 'UTC',
    timeout: input.timeout ?? 300000,
    maxRetries: input.maxRetries ?? 1,
    retryDelay: input.retryDelay ?? 1000,
    maxConcurrency: input.maxConcurrency ?? 1,
    priority: input.priority ?? 50,
    enabled: input.enabled ?? true,
    persist: input.persist ?? true,
    tags: input.tags ?? [],
    args: input.args ?? [],
  }) as TaskDefinition;
}
