import type { RunOptions } from '../../../domain/run-context.ts';
import { withRepoRootOption } from './workspace-options.ts';

/** Fluent builder for generated-project workspace options. */
export interface WorkspaceBuilder {
  withRepoRoot(path: string): WorkspaceBuilder;
  withCliEntrypoint(path: string): WorkspaceBuilder;
  withSmokeRoot(path: string): WorkspaceBuilder;
  withProjectName(name: string): WorkspaceBuilder;
  withCleanup(enabled?: boolean): WorkspaceBuilder;
  buildOptions(): RunOptions;
}

/** Create a workspace builder over an existing options object. */
export function createWorkspaceBuilder(initial: RunOptions): WorkspaceBuilder {
  let options = { ...initial };
  return {
    withRepoRoot(path) {
      options = withRepoRootOption(options, path);
      return this;
    },
    withCliEntrypoint(path) {
      options = { ...options, cliEntrypoint: path };
      return this;
    },
    withSmokeRoot(path) {
      options = { ...options, smokeRoot: path };
      return this;
    },
    withProjectName(name) {
      options = { ...options, projectName: name };
      return this;
    },
    withCleanup(enabled = true) {
      options = { ...options, cleanup: enabled };
      return this;
    },
    buildOptions() {
      return { ...options };
    },
  };
}
