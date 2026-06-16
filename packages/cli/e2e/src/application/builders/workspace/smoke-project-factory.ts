import { join } from '@std/path';
import type { RunOptions } from '../../../domain/run-context.ts';
import type { SmokeProject } from '../../../domain/smoke-project.ts';

/** Resolve generated project paths once for a suite run. */
export function createSmokeProject(options: RunOptions): SmokeProject {
  const projectRoot = join(options.smokeRoot, options.projectName);
  return {
    repoRoot: options.repoRoot,
    cliEntrypoint: options.cliEntrypoint,
    smokeRoot: options.smokeRoot,
    projectName: options.projectName,
    projectRoot,
    appHost: join(projectRoot, 'aspire', 'apphost.mts'),
  };
}
