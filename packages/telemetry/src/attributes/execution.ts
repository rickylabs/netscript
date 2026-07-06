/**
 * Deprecated execution attribute aliases used by existing job instrumentation.
 */
export const ExecutionAttributes = {
  EXECUTION_ID: 'execution.id',
  EXECUTION_STARTED_AT: 'execution.started_at',
  EXECUTION_COMPLETED_AT: 'execution.completed_at',
  EXECUTION_DURATION_MS: 'execution.duration_ms',
} as const;

/**
 * Canonical NetScript execution attribute names.
 */
export const NetScriptExecutionAttributes = {
  EXECUTION_ID: 'netscript.execution.id',
  EXECUTION_STARTED_AT: 'netscript.execution.started_at',
  EXECUTION_COMPLETED_AT: 'netscript.execution.completed_at',
  EXECUTION_DURATION_MS: 'netscript.execution.duration_ms',
} as const;

/**
 * Deprecated execution aliases emitted during the beta.5 duplicate-key window.
 */
export const DeprecatedExecutionAttributeAliases: typeof ExecutionAttributes = ExecutionAttributes;
