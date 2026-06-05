/** One registered template-sync step. */
export interface TemplateSyncStep {
  /** Stable step name for logs and diagnostics. */
  readonly name: string;
  /** Rebuild derived template outputs for the target workspace. */
  readonly run: (targetPath: string) => Promise<readonly string[]>;
}

/** Request for rebuilding maintainer template outputs. */
export interface SyncTemplatesRequest {
  /** Workspace or fixture root whose derived template outputs should be rebuilt. */
  readonly targetPath: string;
}

/** Result for one completed template-sync step. */
export interface TemplateSyncStepResult {
  /** Step name that ran. */
  readonly name: string;
  /** Files written or refreshed by the step. */
  readonly filesWritten: readonly string[];
}

/** Aggregated maintainer template-sync result. */
export interface SyncTemplatesResult {
  /** Step-by-step results in execution order. */
  readonly steps: readonly TemplateSyncStepResult[];
  /** Total file count across all steps. */
  readonly filesWritten: number;
}

/** Dependencies used by the maintainer template sync flow. */
export interface SyncTemplatesDependencies {
  /** Registered template-sync steps to execute. */
  readonly steps: readonly TemplateSyncStep[];
}

/** Rebuild all registered derived template outputs for a workspace. */
export async function syncTemplates(
  request: SyncTemplatesRequest,
  dependencies: SyncTemplatesDependencies,
): Promise<SyncTemplatesResult> {
  const steps: TemplateSyncStepResult[] = [];

  for (const step of dependencies.steps) {
    const filesWritten = await step.run(request.targetPath);
    steps.push({ name: step.name, filesWritten });
  }

  return {
    steps,
    filesWritten: steps.reduce((total, step) => total + step.filesWritten.length, 0),
  };
}
