import { WorkerInstrumentation } from './worker-instrumentation.ts';

/** Stub-only contract for task-scoped worker telemetry instrumentation. */
export abstract class TaskInstrumentation extends WorkerInstrumentation {}
