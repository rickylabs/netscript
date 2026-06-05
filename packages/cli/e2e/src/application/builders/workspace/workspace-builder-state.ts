import type { RunOptions } from '../../../domain/run-context.ts';

/** Workspace builder accumulator. */
export interface WorkspaceBuilderState {
  options: RunOptions;
}
