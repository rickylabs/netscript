import type { RunOptions } from '../../../domain/run-context.ts';
import type { PackageSource } from '../../../domain/extension-axes.ts';
import { withRepoRootOption } from './workspace-options.ts';
import { resolve } from '@std/path';

/** Fluent builder for generated-project workspace options. */
export interface WorkspaceBuilder {
  withRepoRoot(path: string): WorkspaceBuilder;
  withCliEntrypoint(path: string): WorkspaceBuilder;
  withSmokeRoot(path: string): WorkspaceBuilder;
  withProjectName(name: string): WorkspaceBuilder;
  withPackageSource(source: PackageSource): WorkspaceBuilder;
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
      const cliEntrypoint = path.startsWith('jsr:') ? path : resolve(options.repoRoot, path);
      options = { ...options, cliEntrypoint };
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
    withPackageSource(source) {
      options = { ...options, packageSource: source };
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
