import { z } from 'zod';
import { DEFAULT_TOPIC, TaskSourceSchema, TaskStatusSchema, TaskTypeSchema } from './constants.ts';
import { TaskDefinitionPublicBaseSchema } from './public-schema.ts';

/** Branded worker task identifier. */
export type TaskId<TId extends string = string> = TId & { readonly __brand: 'TaskId' };

type TaskPermissionField = boolean | string[];

type TaskPermissionsInputShape = {
  net: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
  read: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
  write: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
  env: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
  run: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
  ffi: z.ZodOptional<z.ZodBoolean>;
  import: z.ZodOptional<z.ZodArray<z.ZodString>>;
};

const TaskPermissionsInputShapeValue: TaskPermissionsInputShape = {
  net: z.union([z.boolean(), z.array(z.string())]).optional(),
  read: z.union([z.boolean(), z.array(z.string())]).optional(),
  write: z.union([z.boolean(), z.array(z.string())]).optional(),
  env: z.union([z.boolean(), z.array(z.string())]).optional(),
  run: z.union([z.boolean(), z.array(z.string())]).optional(),
  ffi: z.boolean().optional(),
  import: z.array(z.string()).optional(),
};
const TaskPermissionsInputShape: TaskPermissionsInputShape = TaskPermissionsInputShapeValue;

/** Task permissions accepted by Deno task execution. */
export const TaskPermissionsInputSchema: z.ZodObject<typeof TaskPermissionsInputShape> = z.object(
  TaskPermissionsInputShape,
);

type TaskPermissionsShape = {
  net: z.ZodType<TaskPermissionField>;
  read: z.ZodType<TaskPermissionField>;
  write: z.ZodType<TaskPermissionField>;
  env: z.ZodType<TaskPermissionField>;
  run: z.ZodType<TaskPermissionField>;
  ffi: z.ZodType<boolean>;
  import: z.ZodOptional<z.ZodArray<z.ZodString>>;
};

const TaskPermissionsShapeValue: TaskPermissionsShape = {
  net: z.union([z.boolean(), z.array(z.string())]).default(false),
  read: z.union([z.boolean(), z.array(z.string())]).default(false),
  write: z.union([z.boolean(), z.array(z.string())]).default(false),
  env: z.union([z.boolean(), z.array(z.string())]).default(false),
  run: z.union([z.boolean(), z.array(z.string())]).default(false),
  ffi: z.boolean().default(false),
  import: z.array(z.string()).optional(),
};
const TaskPermissionsShape: TaskPermissionsShape = TaskPermissionsShapeValue;

/** Full task permissions with defaults applied. */
export const TaskPermissionsSchema: z.ZodObject<typeof TaskPermissionsShape> = z.object(
  TaskPermissionsShape,
);

/** Partial task permissions input. */
export type TaskPermissionValue = TaskPermissionField;

/** Partial task permissions input. */
export type TaskPermissionsInput = typeof TaskPermissionsInputSchema['_output'];

/** Full task permissions with defaults applied. */
export type TaskPermissions = typeof TaskPermissionsSchema['_output'];

/** Runtime context supplied to a task handler. */
export type TaskContext<TPayload = unknown> = Readonly<{
  id: string;
  payload: TPayload;
  correlationId?: string;
}>;

/** Function that executes a task. */
export type TaskHandler<TPayload = unknown, TResult = unknown> = (
  context: TaskContext<TPayload>,
) => TResult | Promise<TResult>;

type TaskEditableShape = {
  name: z.ZodType<string>;
  description: z.ZodOptional<z.ZodString>;
  type: typeof TaskTypeSchema;
  entrypoint: z.ZodType<string>;
  schedule: z.ZodOptional<z.ZodString>;
  timeout: z.ZodType<number>;
  maxRetries: z.ZodType<number>;
  priority: z.ZodType<number>;
  enabled: z.ZodType<boolean>;
  tags: z.ZodType<string[]>;
  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};

const TaskEditableShapeValue: TaskEditableShape = {
  ...TaskDefinitionPublicBaseSchema.omit({ id: true, topic: true }).shape,
  name: z.string().min(1).describe('Task name'),
  description: z.string().optional().describe('Task description'),
  type: TaskTypeSchema.describe('Execution type'),
  entrypoint: z.string().min(1).describe('Script or executable path'),
  schedule: z.string().optional().describe('Cron schedule'),
  timeout: z.number().int().positive().default(300000).describe('Timeout in ms'),
  maxRetries: z.number().int().nonnegative().default(1).describe('Max retries'),
  priority: z.number().int().min(0).max(100).default(50).describe('Task priority'),
  enabled: z.boolean().default(true).describe('Whether task is enabled'),
  tags: z.array(z.string()).default([]).describe('Task tags'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
};
const TaskEditableShape: TaskEditableShape = TaskEditableShapeValue;

/** User-editable task fields. */
export const TaskEditableSchema: z.ZodObject<typeof TaskEditableShape> = z.object(
  TaskEditableShape,
);

type TaskSystemShape = {
  id: z.ZodType<string>;
  topic: z.ZodType<string>;
  source: z.ZodType<typeof TaskSourceSchema['_output']>;
  sourceUrl: z.ZodOptional<z.ZodString>;
  importMapUrl: z.ZodOptional<z.ZodString>;
  args: z.ZodType<string[]>;
  cwd: z.ZodOptional<z.ZodString>;
  env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  permissions: z.ZodOptional<typeof TaskPermissionsSchema>;
  pluginId: z.ZodOptional<z.ZodString>;
  inlineScript: z.ZodOptional<z.ZodString>;
  timezone: z.ZodType<string>;
  retryDelay: z.ZodType<number>;
  maxConcurrency: z.ZodType<number>;
  persist: z.ZodType<boolean>;
};

const TaskSystemShapeValue: TaskSystemShape = {
  ...TaskDefinitionPublicBaseSchema.pick({ id: true, topic: true }).shape,
  id: z.string().min(1).describe('Task identifier'),
  topic: z.string().default(DEFAULT_TOPIC).describe('Topic identifier'),
  source: TaskSourceSchema.default('local').describe('Task source'),
  sourceUrl: z.string().url().optional().describe('Remote script URL'),
  importMapUrl: z.string().url().optional().describe('Import map URL'),
  args: z.array(z.string()).default([]).describe('Command arguments'),
  cwd: z.string().optional().describe('Working directory'),
  env: z.record(z.string(), z.string()).optional().describe('Environment variables'),
  permissions: TaskPermissionsSchema.optional().describe('Deno permissions'),
  pluginId: z.string().optional().describe('Source plugin ID'),
  inlineScript: z.string().optional().describe('Inline script content'),
  timezone: z.string().default('UTC').describe('Schedule timezone'),
  retryDelay: z.number().int().nonnegative().default(1000).describe('Retry delay in ms'),
  maxConcurrency: z.number().int().nonnegative().default(1).describe('Max concurrent runs'),
  persist: z.boolean().default(true).describe('Persist to database'),
};
const TaskSystemShape: TaskSystemShape = TaskSystemShapeValue;

/** System-managed task fields. */
export const TaskSystemSchema: z.ZodObject<typeof TaskSystemShape> = z.object(TaskSystemShape);

type TaskDefinitionShape = TaskEditableShape & TaskSystemShape;

const TaskDefinitionShapeValue: TaskDefinitionShape = {
  ...TaskEditableSchema.shape,
  ...TaskSystemSchema.shape,
};
const TaskDefinitionShape: TaskDefinitionShape = TaskDefinitionShapeValue;

/** Full task definition schema. */
export const TaskDefinitionSchema: z.ZodObject<typeof TaskDefinitionShape> = z.object(
  TaskDefinitionShape,
);

/** User-editable task fields. */
export type TaskEditable = z.output<typeof TaskEditableSchema>;

/** System-managed task fields. */
export type TaskSystem = z.output<typeof TaskSystemSchema>;

/** Stored task definition. */
export type StoredTaskDefinition = TaskEditable & TaskSystem;

/** Public task definition produced by the task builder. */
export type TaskDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = Readonly<
  Omit<StoredTaskDefinition, 'id' | 'entrypoint'> & {
    id: TaskId<TId>;
    type: z.output<typeof TaskTypeSchema>;
    entrypoint?: string;
    handler?: TaskHandler<TPayload, TResult>;
  }
>;

/** Public task specification consumed by executors and schedulers. */
export type TaskSpec<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = TaskDefinition<TId, TPayload, TResult>;

type TaskResultShape = {
  taskId: z.ZodType<string>;
  status: typeof TaskStatusSchema;
  exitCode: z.ZodType<number | null>;
  stdout: z.ZodType<string>;
  stderr: z.ZodType<string>;
  duration: z.ZodType<number>;
  success: z.ZodType<boolean>;
  error: z.ZodType<string | null>;
  result: z.ZodType<Record<string, unknown> | null>;
  startedAt: z.ZodType<string>;
  completedAt: z.ZodType<string>;
  attempt: z.ZodType<number>;
};

const TaskResultShapeValue: TaskResultShape = {
  taskId: z.string().describe('Task ID'),
  status: TaskStatusSchema.describe('Final status'),
  exitCode: z.number().int().nullable().describe('Exit code'),
  stdout: z.string().describe('Standard output'),
  stderr: z.string().describe('Standard error'),
  duration: z.number().nonnegative().describe('Duration in ms'),
  success: z.boolean().describe('Success flag'),
  error: z.string().nullable().describe('Error message'),
  result: z.record(z.string(), z.unknown()).nullable().describe('Parsed result'),
  startedAt: z.string().datetime().describe('Start timestamp'),
  completedAt: z.string().datetime().describe('Completion timestamp'),
  attempt: z.number().int().nonnegative().default(0).describe('Attempt number'),
};
const TaskResultShape: TaskResultShape = TaskResultShapeValue;

/** Result of a single task execution. */
export const TaskResultSchema: z.ZodObject<typeof TaskResultShape> = z.object(TaskResultShape);

/** Result of a single task execution. */
export type TaskResult = typeof TaskResultSchema['_output'];

type TaskResponseShape =
  & Omit<TaskEditableShape, 'entrypoint'>
  & { entrypoint: z.ZodOptional<z.ZodString> }
  & Pick<TaskSystemShape, 'id' | 'pluginId' | 'source' | 'topic'>;

const TaskResponseShapeValue: TaskResponseShape = {
  ...TaskEditableSchema.shape,
  entrypoint: z.string().optional().describe('Script or executable path'),
  ...TaskSystemSchema.pick({
    id: true,
    topic: true,
    source: true,
    pluginId: true,
  }).shape,
};
const TaskResponseShape: TaskResponseShape = TaskResponseShapeValue;

/** API-safe task response schema. */
export const TaskResponseSchema: z.ZodObject<typeof TaskResponseShape> = z.object(
  TaskResponseShape,
);

/** API-safe task response. */
export type TaskResponse = typeof TaskResponseSchema['_output'];

/** Options for executing a task. */
export type TaskExecutionOptions = Readonly<{
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  args?: readonly string[];
  signal?: AbortSignal;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
  onStdout?: (line: string) => void;
  onStderr?: (line: string) => void;
  onLog?: (entry: {
    message: string;
    severity: 'debug' | 'error' | 'info' | 'warn';
    source: 'stderr' | 'stdout';
    taskId: string;
    timestamp: Date;
  }) => void;
  streamLogs?: boolean;
}>;

type RegisterTaskInputShape = Omit<TaskDefinitionShape, 'id'> & {
  id: z.ZodOptional<z.ZodString>;
};

const RegisterTaskInputShapeValue: RegisterTaskInputShape = {
  ...TaskDefinitionSchema.omit({ id: true }).shape,
  id: z.string().optional(),
};
const RegisterTaskInputShape: RegisterTaskInputShape = RegisterTaskInputShapeValue;

/** Input for registering a task. */
export const RegisterTaskInputSchema: z.ZodObject<typeof RegisterTaskInputShape> = z.object(
  RegisterTaskInputShape,
);

/** Input for registering a task. */
export type RegisterTaskInput = typeof RegisterTaskInputSchema['_input'];

type PythonTaskConfigShape = {
  pythonPath: z.ZodOptional<z.ZodString>;
  venvPath: z.ZodOptional<z.ZodString>;
  requirementsFile: z.ZodOptional<z.ZodString>;
};

const PythonTaskConfigShape: PythonTaskConfigShape = {
  pythonPath: z.string().optional(),
  venvPath: z.string().optional(),
  requirementsFile: z.string().optional(),
};

/** Python-specific task configuration. */
export const PythonTaskConfigSchema: z.ZodObject<typeof PythonTaskConfigShape> = z.object(
  PythonTaskConfigShape,
);

/** Python-specific task configuration. */
export type PythonTaskConfig = typeof PythonTaskConfigSchema['_output'];

type DotNetTaskConfigShape = {
  runtimeVersion: z.ZodOptional<z.ZodString>;
  useDotnetRun: z.ZodType<boolean>;
  runtimeArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
};

const DotNetTaskConfigShape: DotNetTaskConfigShape = {
  runtimeVersion: z.string().optional(),
  useDotnetRun: z.boolean().default(false),
  runtimeArgs: z.array(z.string()).optional(),
};

/** .NET-specific task configuration. */
export const DotNetTaskConfigSchema: z.ZodObject<typeof DotNetTaskConfigShape> = z.object(
  DotNetTaskConfigShape,
);

/** .NET-specific task configuration. */
export type DotNetTaskConfig = typeof DotNetTaskConfigSchema['_output'];

type ShellTaskConfigShape = {
  shell: z.ZodOptional<z.ZodString>;
  loginShell: z.ZodType<boolean>;
};

const ShellTaskConfigShape: ShellTaskConfigShape = {
  shell: z.string().optional(),
  loginShell: z.boolean().default(false),
};

/** Shell-specific task configuration. */
export const ShellTaskConfigSchema: z.ZodObject<typeof ShellTaskConfigShape> = z.object(
  ShellTaskConfigShape,
);

/** Shell-specific task configuration. */
export type ShellTaskConfig = typeof ShellTaskConfigSchema['_output'];

type ExtendedTaskDefinitionShape = TaskDefinitionShape & {
  pythonConfig: z.ZodOptional<typeof PythonTaskConfigSchema>;
  dotnetConfig: z.ZodOptional<typeof DotNetTaskConfigSchema>;
  shellConfig: z.ZodOptional<typeof ShellTaskConfigSchema>;
};

const ExtendedTaskDefinitionShapeValue: ExtendedTaskDefinitionShape = {
  ...TaskDefinitionSchema.shape,
  pythonConfig: PythonTaskConfigSchema.optional(),
  dotnetConfig: DotNetTaskConfigSchema.optional(),
  shellConfig: ShellTaskConfigSchema.optional(),
};
const ExtendedTaskDefinitionShape: ExtendedTaskDefinitionShape = ExtendedTaskDefinitionShapeValue;

/** Task definition with runtime-specific config blocks. */
export const ExtendedTaskDefinitionSchema: z.ZodObject<typeof ExtendedTaskDefinitionShape> = z
  .object(ExtendedTaskDefinitionShape);

/** Task definition with runtime-specific config blocks. */
export type ExtendedTaskDefinition = typeof ExtendedTaskDefinitionSchema['_output'];
