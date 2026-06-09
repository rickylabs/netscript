/** Worker task runtime identifier supported by built-in adapters. */
export type TaskType =
  | 'cmd'
  | 'deno'
  | 'dotnet'
  | 'executable'
  | 'powershell'
  | 'python'
  | 'shell';

/** Task definition shape consumed by executor adapters. */
export type TaskDefinition = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly type: string;
    readonly entrypoint?: string;
    readonly cwd?: string;
    readonly env?: Readonly<Record<string, string>>;
    readonly timeout?: number;
    readonly args?: readonly string[];
    readonly importMapUrl?: string;
    readonly metadata?: RuntimeTaskMetadata;
    readonly permissions?: WorkerTaskPermissions;
  }
>;

/** Permission field accepted by Deno task execution. */
export type WorkerTaskPermissionField = boolean | readonly string[];

/** Permission set accepted by Deno task execution. */
export type WorkerTaskPermissions = Readonly<{
  readonly net: WorkerTaskPermissionField;
  readonly read: WorkerTaskPermissionField;
  readonly write: WorkerTaskPermissionField;
  readonly env: WorkerTaskPermissionField;
  readonly run: WorkerTaskPermissionField;
  readonly ffi: boolean;
  readonly import?: readonly string[];
}>;

/** Runtime-specific task metadata recognized by built-in adapters. */
export type RuntimeTaskMetadata = Readonly<{
  readonly dotnetConfig?: Readonly<{
    readonly runtimeArgs?: readonly string[];
    readonly useDotnetRun?: boolean;
  }>;
  readonly pythonConfig?: Readonly<{
    readonly pythonPath?: string;
    readonly venvPath?: string;
  }>;
  readonly shellConfig?: Readonly<{
    readonly loginShell?: boolean;
    readonly shell?: string;
  }>;
}>;

/** Options supplied to a task execution. */
export type TaskExecutionOptions = Readonly<{
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeout?: number;
  readonly correlationId?: string;
  readonly signal?: AbortSignal;
  readonly streamLogs?: boolean;
  readonly traceparent?: string;
  readonly tracestate?: string;
  readonly onLog?: (entry: TaskLogEntry) => void;
  readonly onStdout?: (line: string) => void;
  readonly onStderr?: (line: string) => void;
}>;

/** Log entry emitted while a task subprocess is running. */
export type TaskLogEntry = Readonly<{
  readonly message: string;
  readonly severity: 'debug' | 'error' | 'info' | 'warn';
  readonly source: 'stderr' | 'stdout';
  readonly taskId: string;
  readonly timestamp: Date;
}>;

/** Execution options resolved by the task orchestrator before adapter dispatch. */
export type ResolvedTaskExecutionOptions =
  & Required<Pick<TaskExecutionOptions, 'args' | 'cwd' | 'env' | 'timeout'>>
  & Readonly<Omit<TaskExecutionOptions, 'args' | 'cwd' | 'env' | 'timeout'>>;

/** Result returned by task execution. */
export type TaskResult = Readonly<{
  readonly taskId: string;
  readonly status: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly duration: number;
  readonly success: boolean;
  readonly error: string | null;
  readonly result: Record<string, unknown> | null;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly attempt: number;
}>;

/** Task adapter contract consumed by the multi-runtime executor. */
export type TaskRuntimeAdapterLike = Readonly<{
  readonly id: string;
  readonly runtime: TaskType | null;
  supports(task: TaskDefinition): boolean;
  execute(task: TaskDefinition, options: ResolvedTaskExecutionOptions): Promise<TaskResult>;
}>;

/** Span shape accepted by executor instrumentation hooks. */
export type TaskInstrumentationSpan = {
  setAttribute(name: string, value: unknown): void;
  setAttributes(attributes: Readonly<Record<string, unknown>>): void;
  addEvent(name: string, attributes?: Readonly<Record<string, unknown>>): void;
};

/** Executor instrumentation hook shape. */
export type TaskInstrumentationLike = Readonly<{
  applyTo(
    span: TaskInstrumentationSpan,
    context: Readonly<{
      correlationId?: string;
      status: string;
      taskId: string;
    }>,
  ): void;
}>;
